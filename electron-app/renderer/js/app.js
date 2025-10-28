// Aplicação principal do Electron - Prints Einstein
console.log('🚀 Aplicação Electron iniciada');

// Lista de cursos disponíveis
const cursos = [
  { nome: "Dependência Química", pasta: "DQ_Mensal" },
  { nome: "Bases da Saúde Integrativa", pasta: "BSI_Mensal" },
  { nome: "Cuidados Paliativos - Mensal", pasta: "CP_Mensal" },
  { nome: "Cuidados Paliativos - Quinzenal", pasta: "CP_Quinzenal" },
  { nome: "Cuidados Paliativos - Prática Estendida", pasta: "CP_Pratica_Estendida" },
  { nome: "Psiquiatria Multiprofissional", pasta: "PM_Mensal" },
  { nome: "Infraestrutura e Facilities", pasta: "GIF_Mensal" },
  { nome: "Sustentabilidade e Inovação", pasta: "SLI_Quinzenal" }
];

// Elementos DOM
let coursesContainer, searchInput, clearSearchBtn, loadingElement;
let semesterModal, confirmModal, updateModal, toast;
let serverStatusIndicator, serverStatusText;
let currentAction = null;
let currentCurso = null;
let currentUpdateContext = null;

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  console.log('📋 DOM carregado, inicializando aplicação...');
  initializeElements();
  renderCursos(cursos);
  setupEventListeners();
  checkServerStatus();
  console.log('✅ Aplicação inicializada com sucesso');
});

// Inicializar elementos DOM
function initializeElements() {
  coursesContainer = document.getElementById("courses-container");
  searchInput = document.getElementById("search-input");
  clearSearchBtn = document.getElementById("clear-search");
  loadingElement = document.getElementById("loading");
  semesterModal = document.getElementById("semester-modal");
  confirmModal = document.getElementById("confirm-modal");
  updateModal = document.getElementById("update-selection-modal");
  toast = document.getElementById("toast");
  serverStatusIndicator = document.getElementById("server-status-indicator");
  serverStatusText = document.getElementById("server-status-text");
  
  if (!coursesContainer) {
    console.error('❌ Elemento courses-container não encontrado');
    return;
  }
  
  console.log('✅ Elementos DOM inicializados');
}

// Renderizar cursos
function renderCursos(cursosList) {
  if (!coursesContainer) return;
  
  coursesContainer.innerHTML = "";
  cursosList.forEach((curso) => {
    const card = createCursoCard(curso);
    coursesContainer.appendChild(card);
  });
  console.log(`📚 ${cursosList.length} cursos renderizados`);
}

// Criar card de curso
function createCursoCard(curso) {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h2");
  title.textContent = curso.nome;

  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "buttons-container";

  const gerarBtn = document.createElement("button");
  gerarBtn.className = "btn btn-primary";
  gerarBtn.innerHTML = '<i class="fas fa-camera"></i> Gerar Prints';
  gerarBtn.onclick = () => handleGerarPrints(curso);

  const atualizarBtn = document.createElement("button");
  atualizarBtn.className = "btn btn-secondary";
  atualizarBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar Prints';
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
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", clearSearch);
  }

  // Botão Home
  const homeButton = document.getElementById("home-button");
  if (homeButton) {
    homeButton.addEventListener("click", () => {
      renderCursos(cursos);
    });
  }

  // Modais
  setupModalListeners();
  console.log('🎯 Event listeners configurados');
}

function setupModalListeners() {
  // Modal de Semestre
  const cancelSemester = document.getElementById("cancel-semester");
  const confirmSemester = document.getElementById("confirm-semester");
  
  if (cancelSemester) {
    cancelSemester.addEventListener("click", () => {
      closeSemesterModal();
    });
  }

  if (confirmSemester) {
    confirmSemester.addEventListener("click", () => {
      const semesterInput = document.getElementById("semester-input");
      if (semesterInput && validateSemester(semesterInput.value)) {
        window.electron.store.set("currentSemester", semesterInput.value);
        closeSemesterModal();
        proceedWithAction();
      } else {
        showToast("Formato de semestre inválido. Use AAAA-N (ex: 2025-5)", "error");
      }
    });
  }

  // Modal de Atualização
  const cancelUpdate = document.getElementById("cancel-update-selection");
  const confirmUpdate = document.getElementById("confirm-update-selection");
  const toggleAll = document.getElementById("toggle-all-updates");
  
  if (cancelUpdate) {
    cancelUpdate.addEventListener("click", () => {
      closeUpdateModal();
    });
  }

  if (confirmUpdate) {
    confirmUpdate.addEventListener("click", () => {
      confirmUpdateSelection();
    });
  }

  if (toggleAll) {
    toggleAll.addEventListener("click", () => {
      toggleAllUpdates();
    });
  }

  // Adicionar listener para Enter no input de semestre
  const semesterInput = document.getElementById("semester-input");
  if (semesterInput) {
    semesterInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const confirmSemester = document.getElementById("confirm-semester");
        if (confirmSemester) {
          confirmSemester.click();
        }
      }
    });
  }
}

// Handlers principais
async function handleGerarPrints(curso) {
  console.log(`🎯 Iniciando geração de prints para: ${curso.nome}`);
  currentAction = "gerar";
  currentCurso = curso;
  showSemesterModal();
}

async function handleAtualizarPrints(curso) {
  console.log(`🔄 Iniciando atualização de prints para: ${curso.nome}`);
  currentAction = "atualizar";
  currentCurso = curso;
  showSemesterModal();
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
  console.log(`📸 Executando geração: ${currentCurso.nome}, semestre: ${semester}`);

  try {
    const result = await window.electron.ipcRenderer.invoke("gerar-prints", {
      curso: currentCurso.nome,
      pasta: currentCurso.pasta,
      semestre: semester,
    });
    
    if (result.success) {
      showToast(result.message, "success");
    } else {
      showToast(result.message, "error");
    }
  } catch (error) {
    console.error('❌ Erro na geração:', error);
    showToast(`Erro ao gerar prints: ${error.message}`, "error");
  } finally {
    showLoading(false);
  }
}

// Funcionalidade de Atualização
function showUpdateModal() {
  if (!updateModal) {
    console.error('❌ Modal de atualização não encontrado');
    return;
  }
  
  console.log(`📋 Abrindo modal de atualização para: ${currentCurso.nome}`);
  currentUpdateContext = {
    curso: currentCurso.nome,
    semestre: window.electron.store.get("currentSemester")
  };
  
  // Resetar checkboxes
  const checkboxes = updateModal.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
  
  // Marcar "Local e Horário" e "Valor do Curso" por padrão
  const localHorario = document.getElementById('update-local-horario');
  const valorCurso = document.getElementById('update-valor-curso');
  if (localHorario) localHorario.checked = true;
  if (valorCurso) valorCurso.checked = true;
  
  updateModal.style.display = "flex";
  console.log('✅ Modal de atualização aberto');
}

function closeUpdateModal() {
  if (updateModal) {
    updateModal.style.display = "none";
    currentUpdateContext = null;
    console.log('🔒 Modal de atualização fechado');
  }
}

function toggleAllUpdates() {
  const checkboxes = updateModal.querySelectorAll('input[type="checkbox"]:not(#toggle-all-updates)');
  const toggleAllCheckbox = document.getElementById('toggle-all-updates');
  const shouldCheck = toggleAllCheckbox.checked;
  
  checkboxes.forEach(cb => cb.checked = shouldCheck);
  console.log(`🔄 Todos os updates ${shouldCheck ? 'selecionados' : 'desmarcados'}`);
}

async function confirmUpdateSelection() {
  if (!currentUpdateContext) {
    showError('Erro: Contexto de atualização não encontrado');
    return;
  }
  
  console.log(`🎯 Confirmando seleção de atualização para: ${currentUpdateContext.curso}`);
  
  // Coletar dados dos checkboxes
  const updateData = {
    sobreCurso: document.getElementById('update-sobre-curso')?.checked || false,
    modalidadeEnsino: document.getElementById('update-modalidade-ensino')?.checked || false,
    selecionarTurma: document.getElementById('update-selecionar-turma')?.checked || false,
    programaMetodologia: document.getElementById('update-programa-metodologia')?.checked || false,
    objetivosQualificacoes: document.getElementById('update-objetivos-qualificacoes')?.checked || false,
    corpoDocente: document.getElementById('update-corpo-docente')?.checked || false,
    cronogramaAulas: document.getElementById('update-cronograma-aulas')?.checked || false,
    localHorario: document.getElementById('update-local-horario')?.checked || false,
    valorCurso: document.getElementById('update-valor-curso')?.checked || false,
    perfilAluno: document.getElementById('update-perfil-aluno')?.checked || false,
    processoSeletivo: document.getElementById('update-processo-seletivo')?.checked || false,
    perguntasFrequentes: document.getElementById('update-perguntas-frequentes')?.checked || false
  };

  // Salvar dados antes de fechar o modal
  const { curso, semestre } = currentUpdateContext;

  // Validar se pelo menos uma opção foi selecionada
  const hasSelection = Object.values(updateData).some(value => value === true);
  if (!hasSelection) {
    showError('Selecione pelo menos uma opção para atualizar');
    return;
  }

  closeUpdateModal();

  await executeUpdatePrints(curso, semestre, updateData);
}

async function executeUpdatePrints(curso, semestre, updateData) {
  showLoading(true);
  console.log(`🔄 Iniciando atualização: ${curso}, semestre: ${semestre}`);
  console.log('Dados de atualização:', updateData);

  try {
    const result = await window.electron.ipcRenderer.invoke("update-prints", {
      curso: curso,
      semestre: semestre,
      updateData: updateData
    });
    
    if (result.success) {
      showToast(result.message, "success");
      console.log(`✅ Atualização concluída: ${result.files?.length || 0} arquivos`);
    } else {
      showToast(result.message, "error");
      console.error('❌ Falha na atualização:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro na atualização:', error);
    showToast(`Erro ao atualizar prints: ${error.message}`, "error");
  } finally {
    showLoading(false);
  }
}

// Utilitários
function handleSearch() {
  if (!searchInput) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  if (clearSearchBtn) {
    clearSearchBtn.style.display = searchTerm ? "block" : "none";
  }

  const filteredCursos = cursos.filter((curso) =>
    curso.nome.toLowerCase().includes(searchTerm)
  );

  renderCursos(filteredCursos);
  console.log(`🔍 Pesquisa: "${searchTerm}" - ${filteredCursos.length} resultados`);
}

function clearSearch() {
  if (searchInput) {
    searchInput.value = "";
  }
  if (clearSearchBtn) {
    clearSearchBtn.style.display = "none";
  }
  renderCursos(cursos);
  console.log('🧹 Pesquisa limpa');
}

function validateSemester(semester) {
  const isValid = /^\d{4}-\d+$/.test(semester);
  console.log(`✅ Validação semestre "${semester}": ${isValid}`);
  return isValid;
}

// UI Helpers
function showLoading(show) {
  if (loadingElement) {
    loadingElement.style.display = show ? "flex" : "none";
  }
  console.log(`⏳ Loading: ${show ? 'mostrado' : 'ocultado'}`);
}

function showToast(message, type) {
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.className = "toast";
  }, 5000);
  
  console.log(`📢 Toast ${type}: ${message}`);
}

function showError(message) {
  showToast(message, "error");
}

function showSemesterModal() {
  if (semesterModal) {
    semesterModal.style.display = "flex";
    const semesterInput = document.getElementById("semester-input");
    if (semesterInput) {
      semesterInput.focus();
    }
    console.log('📅 Modal de semestre aberto');
  }
}

function closeSemesterModal() {
  if (semesterModal) {
    semesterModal.style.display = "none";
    const semesterInput = document.getElementById("semester-input");
    if (semesterInput) {
      semesterInput.value = "";
    }
    console.log('🔒 Modal de semestre fechado');
  }
}

// Verificação do status do servidor
async function checkServerStatus() {
  if (!serverStatusIndicator || !serverStatusText) return;
  
  try {
    // Tentar fazer uma requisição simples para verificar se o servidor está online
    const response = await fetch('http://localhost:3000/', { 
      method: 'HEAD',
      timeout: 5000 
    }).catch(() => null);
    
    if (response && response.ok) {
      updateServerStatus(true, 'Servidor Principal Online');
    } else {
      // Tentar servidor interno
      const internalResponse = await fetch('http://localhost:3001/', { 
        method: 'HEAD',
        timeout: 5000 
      }).catch(() => null);
      
      if (internalResponse) {
        updateServerStatus(true, 'Servidor Interno Online');
      } else {
        updateServerStatus(false, 'Servidor Offline');
      }
    }
  } catch (error) {
    updateServerStatus(false, 'Servidor Offline');
  }
  
  // Verificar status a cada 30 segundos
  setTimeout(checkServerStatus, 30000);
}

function updateServerStatus(isOnline, statusText) {
  if (!serverStatusIndicator || !serverStatusText) return;
  
  if (isOnline) {
    serverStatusIndicator.classList.remove('offline');
    serverStatusText.textContent = statusText;
  } else {
    serverStatusIndicator.classList.add('offline');
    serverStatusText.textContent = statusText;
  }
  
  console.log(`🌐 Status do servidor: ${statusText}`);
}

// Exportar funções para debug global
window.appDebug = {
  cursos,
  currentAction,
  currentCurso,
  currentUpdateContext,
  renderCursos,
  showUpdateModal,
  executeUpdatePrints,
  checkServerStatus,
  updateServerStatus
};

console.log('🎯 Aplicação carregada e pronta para uso');
