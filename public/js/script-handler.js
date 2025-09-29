// Função para executar o script com validação
async function runScript(pasta) {
  try {
    // Mostra a modal de confirmação
    const result = await showConfirmModal();

    if (!result) {
      showToast("Operação cancelada", "info");
      return;
    }

    showToast("Criando novo semestre...", "info");

    const button = document.getElementById("run-script-btn");
    button.disabled = true;
    button.textContent = "Processando...";

    const response = await fetch("/run-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pasta }),
    });

    if (!response.ok) {
      throw new Error("Erro ao executar o script");
    }

    showToast("Semestre criado com sucesso!", "success");
    button.textContent = "Concluído";
    button.style.backgroundColor = "#4CAF50";

    setTimeout(() => {
      button.disabled = false;
      button.textContent = "Executar Script";
      button.style.backgroundColor = "";
    }, 2000);
  } catch (error) {
    showToast("Erro ao criar semestre: " + error.message, "error");
    const button = document.getElementById("run-script-btn");
    button.disabled = false;
    button.textContent = "Tentar Novamente";
    button.style.backgroundColor = "#f44336";
  }
}

// Função para mostrar o modal de confirmação
function showConfirmModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const confirmButton = document.getElementById("confirmButton");
    const cancelButton = document.getElementById("cancelButton");

    function closeModal() {
      modal.classList.remove("active");
      document.removeEventListener("keydown", handleKeyPress);
    }

    function handleKeyPress(e) {
      if (e.key === "Escape") {
        closeModal();
        resolve(false);
      }
    }

    modal.classList.add("active");
    document.addEventListener("keydown", handleKeyPress);

    confirmButton.onclick = () => {
      closeModal();
      resolve(true);
    };

    cancelButton.onclick = () => {
      closeModal();
      resolve(false);
    };

    // Fechar modal se clicar fora
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeModal();
        resolve(false);
      }
    };
  });
}

// Função para mostrar toast
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

// Exporta a função para uso global
window.runScript = runScript;
