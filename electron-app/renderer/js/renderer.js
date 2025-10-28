// Lista de cursos
const cursos = [
  "Bases Integrativa",
  "Cuidados Paliativos",
  "Dependência Química",
  "Infraestrutura e Facilities",
  "Psiquiatria Multiprofissional",
  "Sustentabilidade e Inovação",
];

// Elementos DOM
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const coursesContainer = document.getElementById("courses-container");
const loadingElement = document.getElementById("loading");
const semesterModal = document.getElementById("semester-modal");
const confirmModal = document.getElementById("confirm-modal");
const updateModal = document.getElementById("update-modal");
const toast = document.getElementById("toast");

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  renderCursos(cursos);
  setupEventListeners();
});

// Renderização dos cursos
function renderCursos(cursosList) {
  coursesContainer.innerHTML = "";
  cursosList.forEach((curso) => {
    const card = createCursoCard(curso);
    coursesContainer.appendChild(card);
  });
}

function createCursoCard(curso) {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h2");
  title.textContent = curso;

  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "buttons-container";

  const gerarBtn = document.createElement("button");
  gerarBtn.className = "btn btn-primary";
  gerarBtn.textContent = "Gerar Prints";
  gerarBtn.onclick = () => handleGerarPrints(curso);

  const atualizarBtn = document.createElement("button");
  atualizarBtn.className = "btn btn-secondary";
  atualizarBtn.textContent = "Atualizar Prints";
  atualizarBtn.onclick = () => handleAtualizarPrints(curso);

  buttonsContainer.appendChild(gerarBtn);
  buttonsContainer.appendChild(atualizarBtn);

  card.appendChild(title);
  card.appendChild(buttonsContainer);

  return card;
}

// Event Listeners
function setupEventListeners() {
  // Pesquisa
  searchInput.addEventListener("input", handleSearch);
  clearSearchBtn.addEventListener("click", clearSearch);

  // Botão Home
  document.getElementById("home-button").addEventListener("click", () => {
    renderCursos(cursos);
  });

  // Modais
  setupModalListeners();
}

function setupModalListeners() {
  // Modal de Semestre
  document.getElementById("cancel-semester").addEventListener("click", () => {
    closeSemesterModal();
  });

  document.getElementById("confirm-semester").addEventListener("click", () => {
    const semesterInput = document.getElementById("semester-input");
    if (validateSemester(semesterInput.value)) {
      window.electron.store.set("currentSemester", semesterInput.value);
      closeSemesterModal();
      proceedWithAction();
    } else {
      showToast(
        "Formato de semestre inválido. Use AAAA-S (ex: 2025-1)",
        "error"
      );
    }
  });

  // Modal de Atualização
  document.getElementById("cancel-update").addEventListener("click", () => {
    closeUpdateModal();
  });

  document.getElementById("confirm-update").addEventListener("click", () => {
    const selectedPrints = getSelectedPrints();
    if (selectedPrints.length > 0) {
      closeUpdateModal();
      executarAtualizacao(selectedPrints);
    } else {
      showToast("Selecione pelo menos um print para atualizar", "error");
    }
  });
}

// Handlers
let currentAction = null;
let currentCurso = null;

async function handleGerarPrints(curso) {
  currentAction = "gerar";
  currentCurso = curso;
  showConfirmModal(`Deseja gerar os prints para o curso de ${curso}?`);
}

async function handleAtualizarPrints(curso) {
  currentAction = "atualizar";
  currentCurso = curso;
  showUpdateModal();
}

function proceedWithAction() {
  if (currentAction === "gerar") {
    executarGeracao();
  } else if (currentAction === "atualizar") {
    showUpdateModal();
  }
}

// Execução das ações
async function executarGeracao() {
  const semester = window.electron.store.get("currentSemester");
  showLoading(true);

  try {
    await window.electron.ipcRenderer.invoke("gerar-prints", {
      curso: currentCurso,
      semestre: semester,
    });
    showToast("Prints gerados com sucesso!", "success");
  } catch (error) {
    showToast(`Erro ao gerar prints: ${error.message}`, "error");
  } finally {
    showLoading(false);
  }
}

async function executarAtualizacao(prints) {
  const semester = window.electron.store.get("currentSemester");
  showLoading(true);

  try {
    await window.electron.ipcRenderer.invoke("atualizar-prints", {
      curso: currentCurso,
      semestre: semester,
      prints: prints,
    });
    showToast("Prints atualizados com sucesso!", "success");
  } catch (error) {
    showToast(`Erro ao atualizar prints: ${error.message}`, "error");
  } finally {
    showLoading(false);
  }
}

// Utilitários
function handleSearch() {
  const searchTerm = searchInput.value.toLowerCase();
  clearSearchBtn.style.display = searchTerm ? "block" : "none";

  const filteredCursos = cursos.filter((curso) =>
    curso.toLowerCase().includes(searchTerm)
  );

  renderCursos(filteredCursos);
}

function clearSearch() {
  searchInput.value = "";
  clearSearchBtn.style.display = "none";
  renderCursos(cursos);
}

function validateSemester(semester) {
  return /^\d{4}-[1-2]$/.test(semester);
}

function getSelectedPrints() {
  const prints = [];
  document
    .querySelectorAll('.print-option input[type="checkbox"]:checked')
    .forEach((checkbox) => {
      prints.push(checkbox.id.replace("print-", ""));
    });
  return prints;
}

// UI Helpers
function showLoading(show) {
  loadingElement.style.display = show ? "flex" : "none";
}

function showToast(message, type) {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

function showSemesterModal() {
  semesterModal.style.display = "flex";
  document.getElementById("semester-input").focus();
}

function closeSemesterModal() {
  semesterModal.style.display = "none";
  document.getElementById("semester-input").value = "";
}

function showConfirmModal(message) {
  document.getElementById("confirm-message").textContent = message;
  confirmModal.style.display = "flex";
}

function closeConfirmModal() {
  confirmModal.style.display = "none";
}

function showUpdateModal() {
  updateModal.style.display = "flex";
}

function closeUpdateModal() {
  updateModal.style.display = "none";
}
