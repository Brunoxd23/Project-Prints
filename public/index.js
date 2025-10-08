// Entry point: import and initialize modules
import { goHome, voltarParaHome, ensurePastasVisible } from "./modules/spa.js";
import { renderCursos, renderSubcursos } from "./modules/cards.js";
import { runScript, showPrints } from "./modules/scripts.js";
import { showToast, zoomImg } from "./modules/utils.js";
import { createSemesterView } from "./modules/semesterView.js";
import { getCurrentSemester } from "./modules/semester.js";

// Função para salvar estado atual
function saveCurrentState(state) {
  localStorage.setItem('printsAppState', JSON.stringify(state));
}

// Tornar função global para uso em outros módulos
window.saveCurrentState = saveCurrentState;

// Funções para spinner de carregamento
function showLoadingSpinner(message = 'Carregando...') {
  // Remover spinner existente se houver
  hideLoadingSpinner();
  
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.id = 'loading-spinner';
  spinner.innerHTML = `
    <div class="spinner"></div>
    <div class="spinner-text">${message}</div>
  `;
  
  document.body.appendChild(spinner);
  
  // Garantir que o spinner seja visível por pelo menos 800ms
  setTimeout(() => {
    const currentSpinner = document.getElementById('loading-spinner');
    if (currentSpinner) {
      currentSpinner.classList.add('minimum-duration');
    }
  }, 100);
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    // Se o spinner tem classe minimum-duration, aguardar um pouco mais
    if (spinner.classList.contains('minimum-duration')) {
      setTimeout(() => {
        const currentSpinner = document.getElementById('loading-spinner');
        if (currentSpinner) {
          currentSpinner.remove();
        }
      }, 700); // Total de 800ms mínimo
    } else {
      spinner.remove();
    }
  }
}

// Tornar funções globais
window.showLoadingSpinner = showLoadingSpinner;
window.hideLoadingSpinner = hideLoadingSpinner;

// Função para restaurar estado
function restoreState() {
  const savedState = localStorage.getItem('printsAppState');
  if (savedState) {
    try {
      return JSON.parse(savedState);
    } catch (e) {
      console.error('Erro ao restaurar estado:', e);
    }
  }
  return null;
}

// Elementos principais
const homeView = document.getElementById("home-view");
const cardsContainer = document.getElementById("cards-container");
const cursosContainer = document.getElementById("cursos-hibrida-container");
const folderView = document.getElementById("folder-view");
const folderTitle = document.getElementById("folder-title");
const folderList = document.getElementById("folder-list");
const folderOutput = document.getElementById("folder-output");
const runScriptBtn = document.getElementById("run-script-btn");

// Array global de cursos (ordenado alfabeticamente)
window.cursosHibrida = [
  {
    nome: "Bases da Saúde Integrativa e Bem-Estar",
    descricao: "Especialização Híbrida",
    img: "./images/Bases_da_Saude.webp",
    subcursos: [
      {
        nome: "Unidade Paulista | Mensal",
        rota: "/api/run-script-bases-integrativa-mensal",
        pasta: "BSI_Mensal",
      },
    ],
  },
  {
    nome: "Cuidados Paliativos",
    descricao: "Pós com opções de Prática Estendida",
    img: "./images/cuidados_paliativos.webp",
    subcursos: [
      {
        nome: "Unidade Paulista | Quinzenal Prática Estendida",
        rota: "/run-script-cuidados-quinzenal-pratica",
        pasta: "CP_Pratica_Estendida",
      },
      {
        nome: "Unidade Paulista | Quinzenal",
        rota: "/run-script-cuidados-quinzenal",
        pasta: "CP_Quinzenal",
      },
      {
        nome: "Unidade Paulista | Semanal",
        rota: "/run-script-cuidados-semanal",
        pasta: "CP_Semanal",
      },
      {
        nome: "Unidade Rio de Janeiro | Mensal",
        rota: "/run-script-cuidados-rj-mensal",
        pasta: "CP_RJ_Mensal",
      },
      {
        nome: "Unidade Goiânia | Mensal",
        rota: "/run-script-cuidados-go-mensal",
        pasta: "CP_GO_Mensal",
      },
    ],
  },
  {
    nome: "Dependência Química",
    descricao: "Especialização Híbrida",
    img: "./images/dependencia_quimica.webp",
    subcursos: [
      {
        nome: "Unidade Centro de Ensino e Pesquisa | Mensal",
        rota: "/api/run-script-dependencia-quimica",
        pasta: "DQ_Mensal",
      },
    ],
  },
  {
    nome: "Gestão de Infraestrutura e Facilities em Saúde",
    descricao: "Especialização Híbrida",
    img: "./images/Gestão_Infra.webp",
    subcursos: [
      {
        nome: "Unidade Paulista II | Mensal",
        rota: "/api/run-script-infraestrutura-mensal",
        pasta: "GIF_Mensal",
      },
    ],
  },
  {
    nome: "Psiquiatria Multiprofissional",
    descricao: "Especialização Híbrida",
    img: "./images/Psiquiatria_multi.webp",
    subcursos: [
      {
        nome: "Unidade Paulista | Mensal",
        rota: "/api/run-script-psiquiatria-mensal",
        pasta: "PM_Mensal",
      },
    ],
  },
  {
    nome: "Sustentabilidade: Liderança e Inovação em ESG",
    descricao: "Especialização Híbrida",
    img: "./images/Sustentabilidade.webp",
    subcursos: [
      {
        nome: "Unidade Paulista II | Quinzenal",
        rota: "/api/run-script-sustentabilidade-quinzenal",
        pasta: "SLI_Quinzenal",
      },
    ],
  },
];

// Inicialização SPA
window.goHome = () =>
  goHome(homeView, folderView, folderList, folderOutput, runScriptBtn);
window.voltarParaHome = () =>
  voltarParaHome(cursosContainer, cardsContainer, folderView);
window.zoomImg = zoomImg;

// Renderiza cursos ao clicar no card principal
const cardHibrida = document.getElementById("card-hibrida");
if (cardHibrida) {
  cardHibrida.onclick = function () {
    // Salvar estado atual
    saveCurrentState({
      view: 'cursos'
    });
    
    cardsContainer.style.display = "none";
    cursosContainer.style.display = "flex";
    renderCursos(window.cursosHibrida, cursosContainer, cardsContainer);
  };
}

// Adiciona zeros à esquerda nos nomes dos prints
function addLeadingZerosToPrints(prints) {
  return prints.map((img) => {
    const parts = img.split("/");
    const filename = parts.pop();
    const updatedFilename = filename.replace(/^(\d)_/, "0$1_");
    return [...parts, updatedFilename].join("/");
  });
}

// Abre a view de prints do curso selecionado
window.abrirViewCurso = function (curso, semester) {
  const folderView = document.getElementById("folder-view");
  const folderTitle = document.getElementById("folder-title");
  const folderOutput = document.getElementById("folder-output");

  // Salvar estado atual
  saveCurrentState({
    view: 'prints',
    curso: curso.nome,
    pasta: curso.pasta,
    semester: semester || getCurrentSemester()
  });

  // Esconder todas as outras views
  document.getElementById("cursos-hibrida-container").style.display = "none";
  document.getElementById("cards-container").style.display = "none";

  // Remover quaisquer visualizações de semestre que existam
  const semesterViews = document.querySelectorAll(".semester-view");
  semesterViews.forEach((view) => {
    document.body.removeChild(view);
  });

  folderView.style.display = "flex";

  // Se não tiver semestre, usar o semestre atual
  const semesterStr = semester || getCurrentSemester();
  
  // Formatar nome da pasta conforme padrão do servidor (pasta_semestre)
  let pastaCompleta;

  pastaCompleta = `${curso.pasta}_${semesterStr}`;
  folderOutput.innerHTML = "<span>Carregando prints...</span>";
  showLoadingSpinner('Carregando prints...');

  // Buscar prints da pasta
  console.log("Buscando prints em:", pastaCompleta);
  fetch(`/listar-prints?pasta=${encodeURIComponent(pastaCompleta)}`)
    .then((res) => res.json())
    .then((prints) => {
      hideLoadingSpinner();
      
      let html = "";
      if (!Array.isArray(prints) || prints.length === 0) {
        html += "<span>Nenhum print encontrado nesta pasta.</span>";
        folderOutput.innerHTML = html;
        return;
      }

      // Adiciona zeros à esquerda nos nomes dos prints
      prints = addLeadingZerosToPrints(prints);

      // Ordena os prints para garantir a sequência correta (ordem numérica)
      prints.sort((a, b) => {
        const getNumber = (name) => {
          const match = name.match(/(\d+)/);
          if (!match) return 0;
          const num = parseInt(match[1], 10);
          // Adiciona zeros à esquerda para garantir ordenação correta
          return num.toString().padStart(2, "0");
        };
        return getNumber(a).localeCompare(getNumber(b));
      });

      html += `<div class='prints-grid'>`;
      html += prints
        .map(
          (img) => `
        <div class='print-item'>
          <div class="print-title">${img
            .split("/")
            .pop()
            .replace(".png", "")
            .replace(/_/g, " ")}</div>
          <img src="${img}" class="print-img" onclick="zoomImg('${img}')" style="cursor:zoom-in;" />
          <a href="${img}" download class="download-link" title="Download">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0072ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span class="download-text">Download</span>
          </a>
        </div>
      `
        )
        .join("");
      html += `</div>`;

      // Sempre retornar para a tela de subcursos
      const voltar = document.createElement("button");
      voltar.className = "back-btn back-btn-inside";
      voltar.innerHTML = "&larr; Voltar para Semestres";
      voltar.onclick = function () {
        // Mostrar spinner ao voltar para semestres
        if (typeof window.showLoadingSpinner === 'function') {
          window.showLoadingSpinner('Voltando para semestres...');
        }
        
        // Aguardar um pouco para mostrar o spinner
        setTimeout(() => {
          // Ocultar a visualização de prints
          document.getElementById("folder-view").style.display = "none";

          // Limpar a área de visualização
          folderOutput.innerHTML = "";

          // Esconder barra de pesquisa de prints
          const printsSearchContainer = document.getElementById('search-prints-container');
          if (printsSearchContainer) {
            printsSearchContainer.style.display = 'none';
          }

          // Mostrar barra de pesquisa de cursos
          const coursesSearchContainer = document.getElementById('search-courses-container');
          if (coursesSearchContainer) {
            coursesSearchContainer.style.display = 'block';
          }

          // Recriar a visualização de semestres
          createSemesterView(curso);
          
          // Esconder spinner após renderizar
          if (typeof window.hideLoadingSpinner === 'function') {
            window.hideLoadingSpinner();
          }
        }, 300); // Aguardar 300ms para mostrar o spinner
      };

      // Criar header com botão e título alinhados
      const header = document.createElement("div");
      header.className = "prints-header";
      
      const title = document.createElement("h2");
      title.className = "prints-title";
      title.textContent = `${curso.nome} (${semesterStr})`;

      // Criar barra de pesquisa para prints
      const searchContainer = document.createElement("div");
      searchContainer.className = "search-container";
      searchContainer.id = "search-prints-container";
      searchContainer.style.display = "block";

      const searchBox = document.createElement("div");
      searchBox.className = "search-box";

      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.id = "search-prints-input";
      searchInput.placeholder = "🔍 Pesquisar prints...";
      searchInput.className = "search-input";

      const clearSearchBtn = document.createElement("button");
      clearSearchBtn.id = "clear-search-prints";
      clearSearchBtn.className = "clear-search-btn";
      clearSearchBtn.innerHTML = "&times;";
      clearSearchBtn.style.display = "none";

      const searchResultsInfo = document.createElement("div");
      searchResultsInfo.id = "search-prints-results-info";
      searchResultsInfo.className = "search-results-info";
      searchResultsInfo.style.display = "none";

      searchBox.appendChild(searchInput);
      searchBox.appendChild(clearSearchBtn);
      searchContainer.appendChild(searchBox);
      searchContainer.appendChild(searchResultsInfo);

      header.appendChild(voltar);
      header.appendChild(title);
      header.appendChild(searchContainer);

      folderOutput.innerHTML = "";
      folderOutput.appendChild(header);
      const htmlContainer = document.createElement("div");
      htmlContainer.innerHTML = html;
      folderOutput.appendChild(htmlContainer);

      // Esconder barra de pesquisa de cursos quando estiver vendo prints
      const coursesSearchContainer = document.getElementById('search-courses-container');
      if (coursesSearchContainer) {
        coursesSearchContainer.style.display = 'none';
      }

      // Inicializar pesquisa de prints após carregar os prints
      setTimeout(() => {
        if (typeof window.initPrintsSearch === 'function') {
          console.log('🔍 Inicializando pesquisa de prints após carregamento...');
          window.initPrintsSearch();
        }
      }, 500);
    })
    .catch((err) => {
      hideLoadingSpinner();
      folderOutput.innerHTML = "<span>Erro ao carregar prints.</span>";
      console.error("Erro:", err);
    });
};

// Função para atualizar prints do semestre
window.updateSemesterPrints = function (curso) {
  // Obter semestre atual
  const currentSemester = getCurrentSemester();
  // Executar o script correspondente
  fetch(curso.rota, { method: "POST" })
    .then((res) => {
      if (!res.ok) throw new Error("Erro ao atualizar prints");
      showToast("Prints atualizados com sucesso!");
      // Recarregar a visualização
      setTimeout(() => {
        createSemesterView(curso);
      }, 1500);
    })
    .catch((err) => {
      console.error("Erro:", err);
      showToast("Erro ao atualizar prints", "error");
    });
};

// Função para restaurar estado após carregamento
function restoreAppState() {
  showLoadingSpinner('Restaurando página...');
  
  const savedState = restoreState();
  if (savedState) {
    console.log('🔄 Restaurando estado:', savedState);
    
    if (savedState.view === 'cursos') {
      // Restaurar para página de cursos
      cardsContainer.style.display = "none";
      cursosContainer.style.display = "flex";
      renderCursos(window.cursosHibrida, cursosContainer, cardsContainer);
      hideLoadingSpinner();
    } else if (savedState.view === 'subcursos' && savedState.curso) {
      // Restaurar para página de subcursos
      const curso = window.cursosHibrida.find(c => c.nome === savedState.curso);
      if (curso) {
        cardsContainer.style.display = "none";
        cursosContainer.style.display = "flex";
        renderCursos(window.cursosHibrida, cursosContainer, cardsContainer);
        // Aguardar renderização e então mostrar subcursos
        setTimeout(() => {
          renderSubcursos(curso, cursosContainer);
          hideLoadingSpinner();
        }, 100);
      } else {
        hideLoadingSpinner();
      }
    } else if (savedState.view === 'prints' && savedState.curso) {
      // Restaurar para página de prints específica
      const curso = window.cursosHibrida.find(c => c.nome === savedState.curso);
      if (curso) {
        // Encontrar o subcurso correto
        let subcurso = null;
        if (curso.subcursos) {
          subcurso = curso.subcursos.find(s => s.pasta === savedState.pasta);
        }
        
        if (subcurso) {
          window.abrirViewCurso(subcurso, savedState.semester);
        } else {
          // Se não encontrar subcurso, usar o curso principal
          window.abrirViewCurso(curso, savedState.semester);
        }
        // O spinner será escondido pela função abrirViewCurso
      } else {
        hideLoadingSpinner();
      }
    } else {
      hideLoadingSpinner();
    }
  } else {
    // Estado padrão: mostrar home
    hideLoadingSpinner();
    window.goHome();
  }
}

// Inicializa aplicação restaurando estado ou indo para home
restoreAppState();
