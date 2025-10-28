import {
  getCurrentSemester,
  listSemesters,
  checkSemester,
  createNextSemester,
} from "./semester.js";
import { showToast } from "./utils.js";

export function createSemesterView(curso) {
  console.log('🔍 DEBUG - createSemesterView chamado com curso:', curso);
  console.log('🔍 DEBUG - curso.pasta:', curso.pasta);
  console.log('🔍 DEBUG - curso.nome:', curso.nome);
  
  // Salvar estado atual - encontrar o curso principal
  if (typeof window.saveCurrentState === 'function') {
    // Encontrar o curso principal que contém este subcurso
    let cursoPrincipal = null;
    if (window.cursosHibrida) {
      cursoPrincipal = window.cursosHibrida.find(c => 
        c.subcursos && c.subcursos.some(s => s.pasta === curso.pasta)
      );
    }
    
    console.log('🔍 DEBUG - cursoPrincipal encontrado:', cursoPrincipal);
    
    window.saveCurrentState({
      view: 'semesters',
      curso: cursoPrincipal ? cursoPrincipal.nome : curso.nome, // Usar nome do curso principal
      pasta: curso.pasta
    });
  }
  
  const view = document.createElement("div");
  view.className = "semester-view";

  // Adicionar o header principal do site (igual ao do index.html)
  const mainHeader = document.createElement("header");
  mainHeader.className = "logo-header";
  mainHeader.style = `
    background: linear-gradient(90deg, #0072ff 0%, #00c6ff 100%);
    padding: 0px 3px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    width: 100%;
    position: relative;
    z-index: 1100;
  `;

  const logoHeaderInner = document.createElement("div");
  logoHeaderInner.className = "logo-header-inner";
  logoHeaderInner.style = "display: flex; align-items: center; gap: 18px";

  const logoIcon = document.createElement("span");
  logoIcon.className = "logo-icon";
  logoIcon.style = `
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    width: 200px;
    height: 48px;
  `;

  const logoImg = document.createElement("img");
  logoImg.src = "./images/Canvas_Einstein_Color_Horizontal.png";
  logoImg.alt = "Logo Einstein";
  logoImg.style = "width: 100%; height: auto; filter: brightness(0) invert(1)";

  const logoTitle = document.createElement("span");
  logoTitle.className = "logo-title";
  logoTitle.id = "header-title-semester";
  logoTitle.style = `
    color: #ffffff !important;
    font-size: 1.5rem;
    font-weight: 900;
  `;
  logoTitle.textContent = "Prints Pós-graduação";

  logoIcon.appendChild(logoImg);
  logoHeaderInner.appendChild(logoIcon);
  logoHeaderInner.appendChild(logoTitle);
  mainHeader.appendChild(logoHeaderInner);
  view.appendChild(mainHeader);

  // Header secundário com título e botão voltar
  const header = document.createElement("div");
  header.className = "semester-header";

  const btnVoltar = document.createElement("button");
  btnVoltar.className = "back-btn";
  btnVoltar.innerHTML = "&larr; Voltar para Subcursos";
  btnVoltar.onclick = () => {
    // Mostrar spinner ao voltar para subcursos
    if (typeof window.showLoadingSpinner === "function") {
      window.showLoadingSpinner("Voltando para subcursos...");
    }
    
    // Atualizar estado para subcursos antes de voltar
    if (typeof window.saveCurrentState === 'function') {
      // Encontrar o curso principal que contém este subcurso
      let cursoPrincipal = null;
      if (window.cursosHibrida) {
        cursoPrincipal = window.cursosHibrida.find(c => 
          c.subcursos && c.subcursos.some(s => s.pasta === curso.pasta)
        );
      }
      
      window.saveCurrentState({
        view: 'subcursos',
        curso: cursoPrincipal ? cursoPrincipal.nome : curso.nome // Usar nome do curso principal
      });
    }

    // Aguardar um pouco para mostrar o spinner
    setTimeout(() => {
      console.log('🔄 Voltando para subcursos...');
      
      // Remover a visualização de semestres
      document.body.removeChild(view);

      // Encontrar o curso principal que contém este subcurso
      let cursoPrincipal = null;
      if (window.cursosHibrida) {
        cursoPrincipal = window.cursosHibrida.find(c => 
          c.subcursos && c.subcursos.some(s => s.pasta === curso.pasta)
        );
      }

      console.log('🔍 Curso principal encontrado:', cursoPrincipal ? cursoPrincipal.nome : 'Não encontrado');

      if (cursoPrincipal) {
        // Esconder outras views se estiverem visíveis
        document.getElementById("folder-view").style.display = "none";
        document.getElementById("cards-container").style.display = "none";
        
        // Exibir a lista de cursos primeiro
        document.getElementById("cursos-hibrida-container").style.display = "flex";
        
        // Renderizar os cursos primeiro, depois os subcursos
        if (typeof window.renderCursos === 'function') {
          console.log('✅ Renderizando cursos...');
          window.renderCursos(window.cursosHibrida, document.getElementById("cursos-hibrida-container"), document.getElementById("cards-container"));
          
          // Aguardar renderização e então mostrar subcursos
          setTimeout(() => {
            if (typeof window.renderSubcursos === 'function') {
              console.log('✅ Renderizando subcursos para:', cursoPrincipal.nome);
              window.renderSubcursos(cursoPrincipal, document.getElementById("cursos-hibrida-container"));
            }
          }, 100);
        }
      } else {
        console.log('❌ Curso principal não encontrado, usando fallback');
        // Fallback: apenas mostrar cursos
        document.getElementById("cursos-hibrida-container").style.display = "flex";
        document.getElementById("folder-view").style.display = "none";
      }

      // Esconder spinner após renderizar
      if (typeof window.hideLoadingSpinner === "function") {
        window.hideLoadingSpinner();
      }
    }, 300); // Aguardar 300ms para mostrar o spinner
  };

  const title = document.createElement("h2");
  title.className = "semester-title";
  title.textContent = `${curso.nome}`;

  // Adicionar um header com título personalizado
  const subHeader = document.createElement("div");
  subHeader.className = "semester-sub-header";
  subHeader.style = "margin-top: 0; padding-top: 0;";

  header.appendChild(btnVoltar);
  header.appendChild(title);
  view.appendChild(header);
  view.appendChild(subHeader);

  // Grid de semestres
  const grid = document.createElement("div");
  grid.className = "semester-grid";

  // Carrega e renderiza semestres
  loadSemesters(curso, grid);

  view.appendChild(grid);
  document.body.appendChild(view);

  // Adicionar efeitos de hover ao título do header
  const headerTitle = document.getElementById("header-title-semester");
  if (headerTitle) {
    headerTitle.addEventListener("mouseenter", () => {
      headerTitle.style.color = "#fff";
    });
    headerTitle.addEventListener("mouseleave", () => {
      headerTitle.style.color = "#fff"; // Mantém branco por padrão
    });
  }

  // A pesquisa de prints será inicializada quando os prints forem carregados
}

async function loadSemesters(curso, grid) {
  try {
    console.log('🔍 DEBUG - loadSemesters chamado com curso:', curso);
    console.log('🔍 DEBUG - curso.pasta:', curso.pasta);
    
    const semesters = await listSemesters(curso.pasta);
    console.log('🔍 DEBUG - semesters retornados:', semesters);
    
    // Não criar mais semestres automaticamente, apenas mostrar os existentes
    renderSemesters(curso, semesters, grid);
  } catch (error) {
    console.error("Erro ao carregar semestres:", error);
    showToast("Erro ao carregar semestres", "error");
  }
}

function renderSemesters(curso, semesters, grid) {
  console.log('🔍 DEBUG - renderSemesters chamado com:', { curso, semesters, grid });
  grid.innerHTML = "";

  // Se não houver semestres, mostrar mensagem com botão
  if (!semesters || semesters.length === 0) {
    console.log('❌ DEBUG - Nenhum semestre encontrado, mostrando mensagem');
    const noDataContainer = document.createElement("div");
    noDataContainer.className = "no-data-container";

    const noData = document.createElement("div");
    noData.className = "no-data";
    noData.textContent = "Nenhum semestre disponível.";
    noDataContainer.appendChild(noData);

    const instruction = document.createElement("p");
    instruction.textContent =
      "Execute o script para gerar prints do semestre atual.";
    instruction.className = "no-data-instruction";
    noDataContainer.appendChild(instruction);

    grid.appendChild(noDataContainer);
    return;
  }

  console.log('✅ DEBUG - Semestres encontrados, renderizando:', semesters);

  semesters.forEach((semester, index) => {
    const card = document.createElement("div");
    card.className = "semester-card";
    card.style.animationDelay = `${index * 0.1}s`;

    const title = document.createElement("h3");
    title.textContent = `Semestre ${semester}`;
    card.appendChild(title);

    // Container para informações sobre número de prints
    const infoContainer = document.createElement("div");
    infoContainer.className = "semester-info-container";
    card.appendChild(infoContainer);

    // Container para os botões
    const actions = document.createElement("div");
    actions.className = "semester-actions";
    card.appendChild(actions);

    // Adiciona informação sobre número de prints
    const checkPrints = async () => {
      try {
        // Formatar nome da pasta conforme padrão do servidor (pasta_semestre)
        const pastaCompleta = `${curso.pasta}_${semester}`;
        const response = await fetch(
          `/listar-prints?pasta=${encodeURIComponent(pastaCompleta)}`
        );
        const prints = await response.json();

        if (Array.isArray(prints)) {
          const infoText = document.createElement("p");
          infoText.className = "semester-info";
          infoText.textContent = `${prints.length} prints disponíveis`;
          infoContainer.appendChild(infoText);

          // Se não houver prints, adicionar classe para indicar
          if (prints.length === 0) {
            card.classList.add("empty-semester");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar prints:", error);
      }
    };

    checkPrints();

    // Botão Atualizar Prints (para todos os semestres)
    const btnAtualizar = document.createElement("button");
    btnAtualizar.className = "update-prints-btn";
    btnAtualizar.textContent = "Atualizar";
    btnAtualizar.setAttribute("data-curso", curso.pasta);
    btnAtualizar.setAttribute("data-semester", semester);
    btnAtualizar.onclick = () => {
      console.log("Botão Atualizar clicado!", curso, semester);
      console.log(
        "Função showUpdateSelectionModal disponível:",
        typeof window.showUpdateSelectionModal
      );

      if (typeof window.showUpdateSelectionModal === "function") {
        // Abrir modal de seleção em vez de executar diretamente
        window.showUpdateSelectionModal(curso, semester);
      } else {
        console.error("Função showUpdateSelectionModal não está disponível!");
        showToast("Erro: Modal de seleção não carregado", "error");
      }
    };

    // Botão Ver Prints
    const btnVerPrints = document.createElement("button");
    btnVerPrints.className = "update-prints-btn ver-prints-btn";
    btnVerPrints.textContent = "Ver";
    btnVerPrints.style.marginLeft = "10px"; // Garantir espaçamento à esquerda
    btnVerPrints.onclick = () => {
      window.abrirViewCurso(curso, semester);
    };

    // Adicionando os botões lado a lado
    actions.appendChild(btnAtualizar);
    actions.appendChild(btnVerPrints);

    grid.appendChild(card);
  });
}
