// Função para mostrar o modal de semestre
function showSemesterModal() {
  const modal = document.getElementById("semester-modal");
  const input = document.getElementById("semester-input");
  modal.style.display = "flex";
  input.value = ""; // Limpa o input
  input.focus();
}

// Função para esconder o modal de semestre
function hideSemesterModal() {
  const modal = document.getElementById("semester-modal");
  modal.style.display = "none";
}

// Função para validar o formato do semestre (AAAA-S)
function validateSemester(semester) {
  const regex = /^\d{4}-[1-2]$/;
  return regex.test(semester);
}

// Inicialização dos eventos
document.addEventListener("DOMContentLoaded", () => {
  // Elementos do Modal de Semestre
  const semesterModal = document.getElementById("semester-modal");
  const semesterInput = document.getElementById("semester-input");
  const confirmSemester = document.getElementById("confirm-semester");
  const cancelSemester = document.getElementById("cancel-semester");

  // Botões de geração de prints para cada curso
  const courseButtons = document.querySelectorAll(
    '[data-action="gerar-prints"]'
  );
  courseButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const curso = e.target.dataset.curso;
      showSemesterModal();

      // Armazena o curso selecionado para uso posterior
      semesterModal.dataset.selectedCourse = curso;
    });
  });

  // Evento de confirmação do semestre
  confirmSemester.addEventListener("click", async () => {
    const semester = semesterInput.value.trim();
    const selectedCourse = semesterModal.dataset.selectedCourse;

    if (!validateSemester(semester)) {
      alert("Formato inválido. Use o formato AAAA-S (exemplo: 2025-1)");
      return;
    }

    hideSemesterModal();

    try {
      // Inicia o processo de geração de prints
      await window.electron.ipcRenderer.invoke("gerar-prints", {
        curso: selectedCourse,
        semester: semester,
      });
    } catch (error) {
      console.error("Erro ao gerar prints:", error);
      alert("Erro ao gerar prints. Por favor, tente novamente.");
    }
  });

  // Evento de cancelamento
  cancelSemester.addEventListener("click", hideSemesterModal);

  // Permitir confirmação ao pressionar Enter
  semesterInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      confirmSemester.click();
    }
  });

  // Fechar modal se clicar fora
  semesterModal.addEventListener("click", (e) => {
    if (e.target === semesterModal) {
      hideSemesterModal();
    }
  });
});

// Ouvintes para eventos de progresso e conclusão
window.electron.ipcRenderer.on("print-progress", (progress) => {
  // Aqui você pode implementar uma barra de progresso se desejar
  console.log(`Progresso: ${progress}%`);
});

window.electron.ipcRenderer.on("print-complete", () => {
  alert("Prints gerados com sucesso!");
});
