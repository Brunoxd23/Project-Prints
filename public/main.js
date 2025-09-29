// Funções migradas para spa.js, cards.js, scripts.js, utils.js
// Inicialização e importação agora em index.js

// Função para mostrar toast
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => (toast.className = "toast"), 3000);
}

window.abrirViewCurso = async function (curso) {
  document.getElementById("cursos-hibrida-container").style.display = "none";
  document.getElementById("cards-container").style.display = "none";
  const folderView = document.getElementById("folder-view");
  const folderTitle = document.getElementById("folder-title");
  const folderOutput = document.getElementById("folder-output");

  // Armazena a pasta atual para uso posterior
  window.currentPasta = curso.pasta;

  folderView.style.display = "flex";
  folderTitle.textContent = curso.nome;

  // Remove qualquer botão existente
  const oldBtn = document.querySelector(".run-script-btn");
  if (oldBtn) {
    oldBtn.remove();
  }

  // Cria um novo botão
  const newBtn = document.createElement("button");
  newBtn.className = "run-script-btn";
  newBtn.textContent = "Executar Script";

  // Adiciona o evento de clique com validação
  newBtn.onclick = async function (e) {
    e.preventDefault();

    const confirmModal = document.getElementById("confirmModal");
    if (!confirmModal) {
      console.error("Modal não encontrado");
      return;
    }

    confirmModal.classList.add("active");

    const confirmed = await new Promise((resolve) => {
      const confirmButton = document.getElementById("confirmButton");
      const cancelButton = document.getElementById("cancelButton");

      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        confirmModal.classList.remove("active");
        confirmButton.removeEventListener("click", handleConfirm);
        cancelButton.removeEventListener("click", handleCancel);
      };

      confirmButton.addEventListener("click", handleConfirm);
      cancelButton.addEventListener("click", handleCancel);
    });

    if (!confirmed) {
      showToast("Operação cancelada", "info");
      return;
    }

    newBtn.disabled = true;
    newBtn.textContent = "Processando...";
    showToast("Criando novo semestre...", "info");

    try {
      const response = await fetch("/run-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pasta: curso.pasta }),
      });

      if (!response.ok) {
        throw new Error("Erro ao executar o script");
      }

      showToast("Semestre criado com sucesso!", "success");
      newBtn.textContent = "Concluído";
      newBtn.style.backgroundColor = "#4CAF50";

      setTimeout(() => {
        newBtn.disabled = false;
        newBtn.textContent = "Executar Script";
        newBtn.style.backgroundColor = "";
      }, 2000);
    } catch (error) {
      console.error(error);
      showToast("Erro ao criar semestre: " + error.message, "error");
      newBtn.disabled = false;
      newBtn.textContent = "Tentar Novamente";
      newBtn.style.backgroundColor = "#f44336";
    }
  };

  // Adiciona o novo botão ao DOM
  folderView.querySelector(".card").appendChild(newBtn);
  folderOutput.innerHTML = "";
  loadPastas(curso.pasta);
};
ndex.js;

// Função para mostrar toast
function showToast(message, type = "info") {
  // Cria container de toast se não existir
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-in-out forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Função para mostrar modal de confirmação
function showConfirmationModal(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "confirmation-modal";

    modal.innerHTML = `
      <h3 class="modal-title">${title}</h3>
      <p>${message}</p>
      <div class="modal-buttons">
        <button class="modal-btn confirm">Sim</button>
        <button class="modal-btn cancel">Não</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    const confirmBtn = modal.querySelector(".confirm");
    const cancelBtn = modal.querySelector(".cancel");

    confirmBtn.onclick = () => {
      overlay.remove();
      modal.remove();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      overlay.remove();
      modal.remove();
      resolve(false);
    };
  });
}

window.showCursosHibrida = function () {
  document.getElementById("cards-container").style.display = "none";
  const container = document.getElementById("cursos-hibrida-container");
  container.innerHTML = "";
  container.style.display = "block";
  // Botão Voltar
  const voltarBtn = document.createElement("button");
  voltarBtn.className = "back-btn";
  voltarBtn.innerHTML = "&larr; Voltar";
  voltarBtn.style.marginBottom = "12px";
  voltarBtn.style.marginLeft = "4px";
  voltarBtn.onclick = window.voltarParaHome;
  container.appendChild(voltarBtn);
  // Grid de cards dos cursos
  const grid = document.createElement("div");
  grid.className = "cursos-grid";
  cursosHibrida.forEach((curso) => {
    const card = document.createElement("div");
    card.className = "curso-card";
    card.onclick = function () {
      abrirViewCurso(curso);
    };
    card.innerHTML = `
      <img src="${curso.img}" alt="${curso.nome}" class="curso-img" />
      <h2 class="curso-titulo">${curso.nome}</h2>
    `;
    grid.appendChild(card);
  });
  container.appendChild(grid);
};

// Abre a view de prints do curso selecionado
window.abrirViewCurso = function (curso) {
  document.getElementById("cursos-hibrida-container").style.display = "none";
  document.getElementById("cards-container").style.display = "none";
  folderView.style.display = "flex";
  folderTitle.textContent = curso.nome;
  runScriptBtn.style.display = "block";
  runScriptBtn.textContent = "Executar Script";
  runScriptBtn.onclick = () => runScript(curso.pasta);
  folderOutput.innerHTML = "";
  loadPastas(curso.pasta);
};

// Inicialização: mostra home
// Inicialização: mostra home
homeView.style.display = "flex";
cardsContainer.style.display = "flex";
cursosContainer.style.display = "none";
folderView.style.display = "none";

// Fluxo: Card Especialização → Cursos → Prints
document.getElementById("card-hibrida").onclick = function () {
  cardsContainer.style.display = "none";
  cursosContainer.style.display = "flex";
  renderCursos();
};

function renderCursos() {
  cursosContainer.innerHTML = "";
  // Wrapper para botão e grid
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.width = "100%";
  // Botão Voltar para Especialização (remove qualquer existente antes de adicionar)
  const oldBtn = cursosContainer.querySelector(".back-btn");
  if (oldBtn) oldBtn.remove();
  const btnVoltar = document.createElement("button");
  btnVoltar.className = "back-btn";
  btnVoltar.innerHTML = "&larr; Voltar";
  btnVoltar.style.marginBottom = "32px";
  btnVoltar.onclick = function () {
    cursosContainer.style.display = "none";
    cardsContainer.style.display = "flex";
  };
  wrapper.appendChild(btnVoltar);
  // Grid dos cursos
  const grid = document.createElement("div");
  grid.className = "cursos-grid";
  cursosHibrida.forEach((curso) => {
    const card = document.createElement("div");
    card.className = "curso-card";
    card.onclick = function () {
      abrirViewCurso(curso);
    };
    card.innerHTML = `
      <img src="${curso.img}" alt="${curso.nome}" class="curso-img" />
      <h2 class="curso-titulo">${curso.nome}</h2>
      <div class="curso-descricao">${curso.descricao}</div>
    `;
    grid.appendChild(card);
  });
  wrapper.appendChild(grid);
  cursosContainer.appendChild(wrapper);
}

window.abrirViewCurso = function (curso) {
  cursosContainer.style.display = "none";
  folderView.style.display = "none";
  // Remove subcursos antigos se existirem
  const oldWrapper = document.getElementById("subcursos-wrapper");
  if (oldWrapper) oldWrapper.remove();
  // Se for Cuidados Paliativos, mostra subcursos
  if (curso.nome !== "Cuidados Paliativos" && curso.subcursos) {
    // SPA: mostra cards dos subcursos
    const subcursosContainer = document.createElement("div");
    subcursosContainer.className = "subcursos-grid";
    subcursosContainer.style.display = "flex";
    subcursosContainer.style.flexDirection = "row";
    subcursosContainer.style.justifyContent = "center";
    subcursosContainer.style.gap = "32px";
    subcursosContainer.style.marginTop = "32px";
    // Botão Voltar
    const btnVoltar = document.createElement("button");
    btnVoltar.className = "back-btn";
    btnVoltar.innerHTML = "&larr; Voltar";
    btnVoltar.style.marginBottom = "32px";
    btnVoltar.onclick = function () {
      const wrapper = document.getElementById("subcursos-wrapper");
      if (wrapper) wrapper.remove();
      cursosContainer.style.display = "flex";
      renderCursos();
    };
    // Wrapper para título e cards
    const wrapper = document.createElement("div");
    wrapper.id = "subcursos-wrapper";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.appendChild(btnVoltar);
    const titulo = document.createElement("h2");
    titulo.textContent = curso.nome;
    wrapper.appendChild(titulo);
    // Cards dos subcursos
    curso.subcursos.forEach((sub) => {
      const card = document.createElement("div");
      card.className = "curso-card";
      card.style.width = "340px";
      card.style.height = "220px";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.justifyContent = "center";
      card.style.alignItems = "center";
      card.style.cursor = "pointer";
      card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      card.style.background = "#fff";
      card.style.borderRadius = "16px";
      card.style.padding = "18px";
      card.innerHTML = `<h3 style='margin-bottom:12px;'>${sub.nome}</h3>`;
      // Botão para executar script
      const btn = document.createElement("button");
      btn.className = "run-script-btn";
      btn.textContent = "Executar Script";
      btn.onclick = async function (e) {
        e.stopPropagation();

        // Criar e mostrar modal de confirmação
        const confirmResult = await showConfirmationModal(
          `Deseja criar um novo semestre para ${sub.nome}?`,
          "Esta ação irá gerar novos prints para o curso."
        );

        if (!confirmResult) {
          showToast("Operação cancelada", "info");
          return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Executando...';

        try {
          showToast("Iniciando criação do semestre...", "info");
          const res = await fetch(sub.rota, { method: "POST" });

          if (!res.ok) throw new Error("Erro ao executar script");

          btn.textContent = "Sucesso!";
          btn.style.background = "#00c6ff";
          btn.style.color = "#fff";
          showToast("Semestre criado com sucesso!", "success");

          setTimeout(() => {
            btn.textContent = "Executar Script";
            btn.style.background = "";
            btn.style.color = "";
            btn.disabled = false;
          }, 2500);
        } catch (err) {
          btn.textContent = "Erro";
          btn.style.background = "#ff4d4f";
          btn.style.color = "#fff";
          setTimeout(() => {
            btn.textContent = "Executar Script";
            btn.style.background = "";
            btn.style.color = "";
            btn.disabled = false;
          }, 2500);
        }
      };
      card.appendChild(btn);
      subcursosContainer.appendChild(card);
    });
    wrapper.appendChild(subcursosContainer);
    document.body.appendChild(wrapper);
  } else {
    // Fluxo normal para outros cursos
    folderView.style.display = "flex";
    folderTitle.textContent = curso.nome;
    runScriptBtn.style.display = "block";
    runScriptBtn.textContent = "Executar Script";
    runScriptBtn.onclick = () => runScript(curso.pasta);
    folderOutput.innerHTML = "";
    loadPastas(curso.pasta);
    // Botão Voltar para cursos
    const btnVoltar = folderView.querySelector(".back-btn");
    if (btnVoltar) {
      btnVoltar.onclick = function () {
        folderView.style.display = "none";
        cursosContainer.style.display = "flex";
        renderCursos();
      };
    }
  }
};
