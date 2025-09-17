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

  header.appendChild(btnVoltar);
  header.appendChild(title);
  view.appendChild(header);

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
    if (semesters.length === 0) {
      const currentSemester = getCurrentSemester();
      await createNextSemester(curso.pasta);
      semesters.push(currentSemester);
    }

    renderSemesters(curso, semesters, grid);
  } catch (error) {
    console.error("Erro ao carregar semestres:", error);
    showToast("Erro ao carregar semestres", "error");
  }
}

function renderSemesters(curso, semesters, grid) {
  grid.innerHTML = "";

  // Título da seção
  const sectionTitle = document.createElement("h3");
  sectionTitle.textContent = "Semestres Disponíveis";
  sectionTitle.className = "semester-section-title";
  grid.appendChild(sectionTitle);

  // Se não houver semestres, mostrar mensagem
  if (!semesters || semesters.length === 0) {
    const noData = document.createElement("div");
    noData.className = "no-data";
    noData.textContent =
      "Nenhum semestre disponível. Execute um script para gerar prints.";
    grid.appendChild(noData);
    return;
  }

  semesters.forEach((semester) => {
    const card = document.createElement("div");
    card.className = "semester-card";

    const title = document.createElement("h3");
    title.textContent = `Semestre ${semester}`;

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
          card.appendChild(infoText);

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

    const actions = document.createElement("div");
    actions.className = "semester-actions";

    // Botão Ver Prints
    const btnVerPrints = document.createElement("button");
    btnVerPrints.className = "update-prints-btn";
    btnVerPrints.textContent = "Ver Prints";
    btnVerPrints.onclick = () => {
      window.abrirViewCurso(curso, semester);
    };

    // Botão Atualizar Prints (apenas para semestre atual)
    if (semester === getCurrentSemester()) {
      const btnAtualizar = document.createElement("button");
      btnAtualizar.className = "update-prints-btn";
      btnAtualizar.textContent = "Atualizar Prints";
      btnAtualizar.onclick = async () => {
        btnAtualizar.disabled = true;
        btnAtualizar.innerHTML = '<span class="spinner"></span> Atualizando...';

        try {
          await fetch(`/update-prints/${curso.pasta}/${semester}`, {
            method: "POST",
          });
          showToast("Prints atualizados com sucesso!");
          btnAtualizar.textContent = "Atualizar Prints";
          btnAtualizar.disabled = false;
        } catch (error) {
          console.error("Erro ao atualizar prints:", error);
          showToast("Erro ao atualizar prints", "error");
          btnAtualizar.textContent = "Atualizar Prints";
          btnAtualizar.disabled = false;
        }
      };
      actions.appendChild(btnAtualizar);
    }

    actions.appendChild(btnVerPrints);
    card.appendChild(title);
    card.appendChild(actions);
    grid.appendChild(card);
  });
}
