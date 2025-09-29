import { getCurrentSemester } from "./semester.js";
import { createSemesterView } from "./semesterView.js";

// Função para mostrar modal de confirmação
function showConfirmModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const confirmBtn = document.getElementById("confirmButton");
    const cancelBtn = document.getElementById("cancelButton");

    // Atualizar texto do modal para ser mais específico
    const modalMessage = document.querySelector(".modal-message");
    modalMessage.textContent = "Deseja criar um novo semestre com prints?";

    modal.classList.add("active");

    const handleConfirm = () => {
      modal.classList.remove("active");
      resolve(true);
    };

    const handleCancel = () => {
      modal.classList.remove("active");
      resolve(false);
    };

    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick = handleCancel;

    // Fechar modal ao clicar fora dele
    modal.onclick = (e) => {
      if (e.target === modal) handleCancel();
    };

    // Fechar modal com ESC
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        handleCancel();
        document.removeEventListener("keydown", handleEsc);
      }
    };
    document.addEventListener("keydown", handleEsc);
  });
}

export function renderCursos(cursosHibrida, cursosContainer, cardsContainer) {
  cursosContainer.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.width = "100%";

  const btnVoltar = document.createElement("button");
  btnVoltar.className = "back-btn";
  btnVoltar.innerHTML = "&larr; Voltar";
  btnVoltar.style.marginBottom = "32px";
  btnVoltar.onclick = function () {
    cursosContainer.style.display = "none";
    cardsContainer.style.display = "flex";
  };
  wrapper.appendChild(btnVoltar);

  const grid = document.createElement("div");
  grid.className = "cursos-grid";

  cursosHibrida.forEach((curso) => {
    const card = document.createElement("div");
    card.className = "curso-card";

    // Criar conteúdo do card
    const cardContent = document.createElement("div");
    cardContent.className = "card-content";
    cardContent.innerHTML = `
      <img src="${curso.img}" alt="${curso.nome}" class="curso-img" />
      <h2 class="curso-titulo">${curso.nome}</h2>
      <div class="curso-descricao">${curso.descricao}</div>
    `;

    card.appendChild(cardContent);

    // Adicionar evento de clique
    cardContent.onclick = function () {
      // Se o curso tem subcursos, renderiza os cards de subcursos
      if (curso.subcursos && curso.subcursos.length > 0) {
        renderSubcursos(curso, cursosContainer);
      } else {
        window.abrirViewCurso(curso);
      }
    };
    grid.appendChild(card);
  });
  wrapper.appendChild(grid);
  cursosContainer.appendChild(wrapper);
}

function renderSubcursos(curso, cursosContainer) {
  cursosContainer.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.id = "subcursos-wrapper";
  // Botão Voltar
  const btnVoltar = document.createElement("button");
  btnVoltar.className = "back-btn";
  btnVoltar.innerHTML = "&larr; Voltar";
  btnVoltar.style.marginBottom = "32px";
  btnVoltar.onclick = function () {
    renderCursos(
      window.cursosHibrida,
      cursosContainer,
      document.getElementById("cards-container")
    );
  };
  wrapper.appendChild(btnVoltar);
  // Título
  const titulo = document.createElement("h2");
  titulo.textContent = curso.nome;
  wrapper.appendChild(titulo);
  // Grid de subcursos
  const grid = document.createElement("div");
  grid.className = "subcursos-grid";
  grid.style.display = "flex";
  grid.style.flexDirection = "row";
  grid.style.justifyContent = "center";
  grid.style.gap = "32px";
  grid.style.marginTop = "32px";
  curso.subcursos.forEach((sub) => {
    const card = document.createElement("div");
    card.className = "curso-card";
    // Removendo estilos inline para usar CSS

    const titleDiv = document.createElement("div");
    titleDiv.className = "card-title";
    titleDiv.innerHTML = `<h3>${sub.nome}</h3>`;
    card.appendChild(titleDiv);

    // Botão Ver Prints no canto superior
    const btnVerPrints = document.createElement("button");
    btnVerPrints.className = "ver-prints-btn";
    btnVerPrints.textContent = "Ver Prints";
    btnVerPrints.onclick = (e) => {
      e.stopPropagation();
      // Abrir visualização de semestres
      createSemesterView(sub);
    };
    card.appendChild(btnVerPrints);

    // Botão para executar script
    const btn = document.createElement("button");
    btn.className = "run-script-btn";
    btn.textContent = "Executar Script";
    card.appendChild(btn);

    btn.onclick = async function (e) {
      e.stopPropagation();
      
      // Mostrar modal de confirmação
      const confirmed = await showConfirmModal();
      
      if (!confirmed) {
        // Usuário cancelou, mostrar toast informativo
        const toast = document.getElementById("toast");
        toast.textContent = "Operação cancelada";
        toast.className = "toast info show";
        setTimeout(() => (toast.className = "toast"), 3000);
        return;
      }
      
      // Usuário confirmou, executar script
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Executando...';
      
      try {
        const res = await fetch(sub.rota, { method: "POST" });
        if (!res.ok) throw new Error("Erro ao executar script");
        
        btn.textContent = "Sucesso!";
        btn.style.background = "#00c6ff";
        btn.style.color = "#fff";
        
        // Mostrar toast de sucesso
        const toast = document.getElementById("toast");
        toast.textContent = "Semestre criado com sucesso!";
        toast.className = "toast success show";
        setTimeout(() => (toast.className = "toast"), 3000);
        
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
        
        // Mostrar toast de erro
        const toast = document.getElementById("toast");
        toast.textContent = "Erro ao executar script";
        toast.className = "toast error show";
        setTimeout(() => (toast.className = "toast"), 3000);
        
        setTimeout(() => {
          btn.textContent = "Executar Script";
          btn.style.background = "";
          btn.style.color = "";
          btn.disabled = false;
        }, 2500);
      }
    };
    card.appendChild(btn);
    grid.appendChild(card);
  });
  wrapper.appendChild(grid);
  cursosContainer.appendChild(wrapper);
}
