// Função para gerenciar a execução do script com confirmação
async function handleScriptExecution(pasta) {
  try {
    const confirmModal = document.getElementById("confirmModal");
    const confirmed = await new Promise((resolve) => {
      confirmModal.classList.add("active");

      const handleConfirm = () => {
        confirmModal.classList.remove("active");
        resolve(true);
      };

      const handleCancel = () => {
        confirmModal.classList.remove("active");
        resolve(false);
      };

      document.getElementById("confirmButton").onclick = handleConfirm;
      document.getElementById("cancelButton").onclick = handleCancel;

      confirmModal.onclick = (e) => {
        if (e.target === confirmModal) handleCancel();
      };
    });

    if (!confirmed) {
      const toast = document.getElementById("toast");
      toast.textContent = "Operação cancelada";
      toast.className = "toast info show";
      setTimeout(() => (toast.className = "toast"), 3000);
      return;
    }

    const runScriptBtn = document.getElementById("run-script-btn");
    const toast = document.getElementById("toast");

    toast.textContent = "Criando novo semestre...";
    toast.className = "toast info show";

    runScriptBtn.disabled = true;
    runScriptBtn.textContent = "Processando...";

    const response = await fetch("/run-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pasta }),
    });

    if (!response.ok) throw new Error("Erro ao executar o script");

    toast.textContent = "Semestre criado com sucesso!";
    toast.className = "toast success show";
    runScriptBtn.textContent = "Concluído";
    runScriptBtn.style.backgroundColor = "#4CAF50";

    setTimeout(() => {
      runScriptBtn.disabled = false;
      runScriptBtn.textContent = "Executar Script";
      runScriptBtn.style.backgroundColor = "";
      toast.className = "toast";
    }, 2000);
  } catch (error) {
    const toast = document.getElementById("toast");
    const runScriptBtn = document.getElementById("run-script-btn");

    toast.textContent = "Erro ao criar semestre: " + error.message;
    toast.className = "toast error show";

    runScriptBtn.disabled = false;
    runScriptBtn.textContent = "Tentar Novamente";
    runScriptBtn.style.backgroundColor = "#f44336";

    setTimeout(() => (toast.className = "toast"), 3000);
  }
}
