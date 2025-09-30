// Modal de Seleção de Prints para Atualizar
let currentUpdateContext = null;

// Função para abrir o modal de seleção
function showUpdateSelectionModal(curso, semester) {
  console.log('showUpdateSelectionModal chamada com:', curso, semester);
  currentUpdateContext = { curso, semester };
  
  const modal = document.getElementById('update-selection-modal');
  console.log('Modal encontrado:', modal);
  
  if (!modal) {
    console.error('Modal update-selection-modal não encontrado!');
    return;
  }
  
  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  modal.style.opacity = '1';
  modal.classList.add('show');
  console.log('Modal display:', modal.style.display);
  console.log('Modal classes:', modal.className);
  console.log('Modal visibility:', modal.style.visibility);
  console.log('Modal opacity:', modal.style.opacity);
  
  // Resetar checkboxes para ambos selecionados por padrão
  document.getElementById('update-local-horario').checked = true;
  document.getElementById('update-valor-curso').checked = true;
  
  // Focar no modal
  modal.focus();
  
  // Debug adicional
  setTimeout(() => {
    console.log('Modal após 100ms:');
    console.log('- Display:', modal.style.display);
    console.log('- Visibility:', modal.style.visibility);
    console.log('- Opacity:', modal.style.opacity);
    console.log('- Classes:', modal.className);
    console.log('- Computed display:', window.getComputedStyle(modal).display);
  }, 100);
}

// Função para fechar o modal de seleção
function closeUpdateSelectionModal() {
  const modal = document.getElementById('update-selection-modal');
  modal.style.display = 'none';
  modal.classList.remove('show');
  currentUpdateContext = null;
}

// Função para confirmar a seleção e executar a atualização
async function confirmUpdateSelection() {
  console.log('confirmUpdateSelection chamada');
  console.log('currentUpdateContext:', currentUpdateContext);
  
  if (!currentUpdateContext) {
    console.error('Contexto de atualização não encontrado');
    showToast('Erro: Contexto de atualização não encontrado', 'error');
    return;
  }
  
  const localHorarioChecked = document.getElementById('update-local-horario').checked;
  const valorCursoChecked = document.getElementById('update-valor-curso').checked;
  
  console.log('Opções selecionadas:', { localHorarioChecked, valorCursoChecked });
  
  // Validar se pelo menos uma opção foi selecionada
  if (!localHorarioChecked && !valorCursoChecked) {
    showToast('Selecione pelo menos uma opção para atualizar', 'error');
    return;
  }
  
  // Armazenar o contexto antes de fechar o modal
  const context = { ...currentUpdateContext };
  console.log('Contexto armazenado:', context);
  
  // Fechar o modal
  closeUpdateSelectionModal();
  
  // Preparar dados para envio
  const updateData = {
    localHorario: localHorarioChecked,
    valorCurso: valorCursoChecked
  };
  
  console.log('Dados de atualização:', updateData);
  
  // Executar a atualização usando o contexto armazenado
  await executeUpdatePrints(context.curso, context.semester, updateData);
}

// Função para executar a atualização dos prints selecionados
async function executeUpdatePrints(curso, semester, updateData) {
  console.log('executeUpdatePrints chamada com:', { curso, semester, updateData });
  console.log('Procurando botão com seletor:', `[data-curso="${curso.pasta}"][data-semester="${semester}"].update-prints-btn`);
  
  // Debug: listar todos os botões com classe update-prints-btn
  const allButtons = document.querySelectorAll('.update-prints-btn');
  console.log('Todos os botões update-prints-btn encontrados:', allButtons);
  allButtons.forEach((btn, index) => {
    console.log(`Botão ${index}:`, {
      dataCurso: btn.getAttribute('data-curso'),
      dataSemester: btn.getAttribute('data-semester'),
      className: btn.className,
      textContent: btn.textContent
    });
  });
  
  const btnAtualizar = document.querySelector(`[data-curso="${curso.pasta}"][data-semester="${semester}"].update-prints-btn`);
  console.log('Botão encontrado:', btnAtualizar);
  
  if (!btnAtualizar) {
    console.error('Botão de atualizar não encontrado');
    showToast('Erro: Botão de atualizar não encontrado', 'error');
    return;
  }
  
  // Desabilitar botão e mostrar loading
  btnAtualizar.disabled = true;
  btnAtualizar.innerHTML = '<span class="spinner"></span> Atualizando...';
  
  try {
    console.log(`Fazendo requisição para: /update-prints/${curso.pasta}/${semester}`);
    console.log('Dados enviados:', updateData);
    
    // Fazer requisição para o backend com os dados de seleção
    const response = await fetch(`/update-prints/${curso.pasta}/${semester}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    console.log('Resposta recebida:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Resultado da atualização:', result);
    
    // Mostrar mensagem de sucesso com os arquivos atualizados
    const updatedFiles = result.updatedFiles || [];
    if (updatedFiles.length > 0) {
      showToast(`Prints atualizados com sucesso! Arquivos: ${updatedFiles.join(', ')}`);
    } else {
      showToast('Atualização concluída, mas nenhum arquivo foi criado');
    }
    
    // Restaurar botão
    btnAtualizar.textContent = "Atualizar";
    btnAtualizar.disabled = false;

    // Recarregar a visualização após 2 segundos para mostrar os novos arquivos
    setTimeout(() => {
      window.abrirViewCurso(curso, semester);
    }, 2000);

  } catch (error) {
    console.error("Erro ao atualizar prints:", error);
    showToast(`Erro ao atualizar prints: ${error.message}`, "error");
    
    // Restaurar botão
    btnAtualizar.textContent = "Atualizar";
    btnAtualizar.disabled = false;
  }
}

// Fechar modal ao clicar fora dele
document.addEventListener('click', function(event) {
  const modal = document.getElementById('update-selection-modal');
  if (event.target === modal) {
    closeUpdateSelectionModal();
  }
});

// Fechar modal com tecla ESC
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('update-selection-modal');
    if (modal.style.display === 'flex') {
      closeUpdateSelectionModal();
    }
  }
});

// Exportar funções para uso global
window.showUpdateSelectionModal = showUpdateSelectionModal;
window.closeUpdateSelectionModal = closeUpdateSelectionModal;
window.confirmUpdateSelection = confirmUpdateSelection;

// Debug: verificar se as funções estão disponíveis
console.log('Funções do modal carregadas:');
console.log('- showUpdateSelectionModal:', typeof window.showUpdateSelectionModal);
console.log('- closeUpdateSelectionModal:', typeof window.closeUpdateSelectionModal);
console.log('- confirmUpdateSelection:', typeof window.confirmUpdateSelection);
