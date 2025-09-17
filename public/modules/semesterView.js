import {
  getCurrentSemester,
  listSemesters,
  checkSemester,
  createNextSemester,
} from "./semester.js";
import { showToast } from "./utils.js";

export function createSemesterView(curso) {
  const view = document.createElement("div");
  view.className = "semester-view";

  // Header com título e botão voltar
  const header = document.createElement("div");
  header.className = "semester-header";

  const btnVoltar = document.createElement("button");
  btnVoltar.className = "back-btn";
  btnVoltar.innerHTML = "&larr; Voltar para Subcursos";
  btnVoltar.onclick = () => {
    // Remover a visualização de semestres
    document.body.removeChild(view);

    // Exibir a lista de subcursos
    document.getElementById("cursos-hibrida-container").style.display = "flex";

    // Esconder outras views se estiverem visíveis
    document.getElementById("folder-view").style.display = "none";
  };

  const title = document.createElement("h2");
  title.className = "semester-title";
  title.textContent = `Prints: ${curso.nome}`;

  // Adicionar um header com título personalizado
  const subHeader = document.createElement("div");
  subHeader.className = "semester-sub-header";

  const sectionTitle = document.createElement("h3");
  sectionTitle.textContent = "Semestres Disponíveis";
  sectionTitle.className = "semester-section-title";
  subHeader.appendChild(sectionTitle);

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
}

async function loadSemesters(curso, grid) {
  try {
    const semesters = await listSemesters(curso.pasta);
    // Não criar mais semestres automaticamente, apenas mostrar os existentes

    renderSemesters(curso, semesters, grid);
  } catch (error) {
    console.error("Erro ao carregar semestres:", error);
    showToast("Erro ao carregar semestres", "error");
  }
}

function renderSemesters(curso, semesters, grid) {
  grid.innerHTML = "";

  // Se não houver semestres, mostrar mensagem com botão
  if (!semesters || semesters.length === 0) {
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
    btnAtualizar.onclick = async () => {
      btnAtualizar.disabled = true;
      btnAtualizar.innerHTML = '<span class="spinner"></span> Atualizando...';

      try {
        await fetch(`/update-prints/${curso.pasta}/${semester}`, {
          method: "POST",
        });
        showToast("Prints atualizados com sucesso!");
        btnAtualizar.textContent = "Atualizar";
        btnAtualizar.disabled = false;
      } catch (error) {
        console.error("Erro ao atualizar prints:", error);
        showToast("Erro ao atualizar prints", "error");
        btnAtualizar.textContent = "Atualizar";
        btnAtualizar.disabled = false;
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
