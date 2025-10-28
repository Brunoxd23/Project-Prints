// Função para mostrar toast
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

// Função para mostrar modal
function showConfirmModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const confirmBtn = document.getElementById("confirmButton");
    const cancelBtn = document.getElementById("cancelButton");

    modal.classList.add("active");

    confirmBtn.onclick = () => {
      modal.classList.remove("active");
      resolve(true);
    };

    cancelBtn.onclick = () => {
      modal.classList.remove("active");
      resolve(false);
    };
  });
}

// Função para executar o script com confirmação
async function runScriptWithConfirmation(pasta) {
  try {
    const confirmed = await showConfirmModal();

    if (!confirmed) {
      showToast("Operação cancelada", "info");
      return;
    }

    showToast("Iniciando criação do semestre...", "info");
    const button = document.querySelector(".run-script-btn");
    button.disabled = true;
    button.innerHTML = "Processando...";

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
    button.innerHTML = "Concluído";
    button.style.backgroundColor = "#4CAF50";

    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = "Executar Script";
      button.style.backgroundColor = "";
    }, 2000);
  } catch (error) {
    showToast("Erro ao criar semestre: " + error.message, "error");
    const button = document.querySelector(".run-script-btn");
    button.disabled = false;
    button.innerHTML = "Tentar Novamente";
    button.style.backgroundColor = "#f44336";
  }
}
