// Entry point: import and initialize modules
import { goHome, voltarParaHome, ensurePastasVisible } from "./modules/spa.js";
import { renderCursos } from "./modules/cards.js";
import { runScript, showPrints } from "./modules/scripts.js";
import { showToast, zoomImg } from "./modules/utils.js";
import { createSemesterView } from "./modules/semesterView.js";
import { getCurrentSemester } from "./modules/semester.js";

// Elementos principais
const homeView = document.getElementById("home-view");
const cardsContainer = document.getElementById("cards-container");
const cursosContainer = document.getElementById("cursos-hibrida-container");
const folderView = document.getElementById("folder-view");
const folderTitle = document.getElementById("folder-title");
const folderList = document.getElementById("folder-list");
const folderOutput = document.getElementById("folder-output");
const runScriptBtn = document.getElementById("run-script-btn");

// Array global de cursos
window.cursosHibrida = [
  {
    nome: "Cuidados Paliativos",
    descricao: "Pós com opções de Prática Estendida",
    img: "./images/cuidados_paliativos.webp",
    subcursos: [
      {
        nome: "Unidade Paulista | Quinzenal Prática Estendida",
        rota: "/run-script-cuidados-quinzenal-pratica",
        pasta: "Pratica_Estendida",
      },
      {
        nome: "Unidade Paulista | Quinzenal",
        rota: "/run-script-cuidados-quinzenal",
        pasta: "Paliativos_Quinzenal",
      },
      {
        nome: "Unidade Paulista | Semanal",
        rota: "/run-script-cuidados-semanal",
        pasta: "Paliativos_Semanal",
      },
      {
        nome: "Unidade Rio de Janeiro | Mensal",
        rota: "/run-script-cuidados-rj-mensal",
        pasta: "Paliativos_RJ_Mensal",
      },
      {
        nome: "Unidade Goiânia | Mensal",
        rota: "/run-script-cuidados-go-mensal",
        pasta: "Paliativos_GO_Mensal",
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
        pasta: "Dependencia_Quimica",
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
        pasta: "Sustentabilidade_Quinzenal",
      },
    ],
  },
  {
    nome: "Gestão de Infraestrutura e Facilities em Saúde",
    descricao: "Especialização Híbrida",
    pasta: "Gestao_Infraestrutura",
    img: "./images/Gestão_Infra.webp",
  },
  {
    nome: "Psiquiatria Multiprofissional",
    descricao: "Especialização Híbrida",
    pasta: "Psiquiatria_Multiprofissional",
    img: "./images/Psiquiatria_multi.webp",
  },
  {
    nome: "Bases da Saúde Integrativa e Bem-Estar",
    descricao: "Especialização Híbrida",
    pasta: "Saude_Integrativa_Bem_Estar",
    img: "./images/Bases_da_Saude.webp",
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

  // Buscar prints da pasta
  console.log("Buscando prints em:", pastaCompleta);
  fetch(`/listar-prints?pasta=${encodeURIComponent(pastaCompleta)}`)
    .then((res) => res.json())
    .then((prints) => {
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
        // Ocultar a visualização de prints
        document.getElementById("folder-view").style.display = "none";

        // Limpar a área de visualização
        folderOutput.innerHTML = "";

        // Recriar a visualização de semestres
        createSemesterView(curso);
      };

      // Criar header com botão e título alinhados
      const header = document.createElement("div");
      header.className = "prints-header";
      
      const title = document.createElement("h2");
      title.className = "prints-title";
      title.textContent = `${curso.nome} (${semesterStr})`;

      header.appendChild(voltar);
      header.appendChild(title);

      folderOutput.innerHTML = "";
      folderOutput.appendChild(header);
      const htmlContainer = document.createElement("div");
      htmlContainer.innerHTML = html;
      folderOutput.appendChild(htmlContainer);
    })
    .catch((err) => {
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

// Inicializa home
window.goHome();
