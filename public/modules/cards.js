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
    // Mostrar spinner ao voltar para home
    if (typeof window.showLoadingSpinner === 'function') {
      window.showLoadingSpinner('Voltando para home...');
    }
    
    // Aguardar um pouco para mostrar o spinner
    setTimeout(() => {
      // Limpar estado ao voltar para home
      if (typeof window.saveCurrentState === 'function') {
        localStorage.removeItem('printsAppState');
      }
      
      cursosContainer.style.display = "none";
      cardsContainer.style.display = "flex";
      
      // Esconder barra de pesquisa de prints se estiver visível
      const printsSearchContainer = document.getElementById('search-prints-container');
      if (printsSearchContainer) {
        printsSearchContainer.style.display = 'none';
      }
      
      // Esconder barra de pesquisa de subcursos se estiver visível
      const subcursosSearchContainer = document.getElementById('search-subcursos-container');
      if (subcursosSearchContainer) {
        subcursosSearchContainer.style.display = 'none';
      }
      
      // Esconder barra de pesquisa de cursos ao voltar para home
      const coursesSearchContainer = document.getElementById('search-courses-container');
      if (coursesSearchContainer) {
        coursesSearchContainer.style.display = 'none';
      }
      
      // Esconder spinner após renderizar
      if (typeof window.hideLoadingSpinner === 'function') {
        window.hideLoadingSpinner();
      }
    }, 300); // Aguardar 300ms para mostrar o spinner
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
        // Salvar estado atual
        if (typeof window.saveCurrentState === 'function') {
          window.saveCurrentState({
            view: 'subcursos',
            curso: curso.nome
          });
        }
        
        // Esconder barra de pesquisa de cursos quando entrar nos subcursos
        const coursesSearchContainer = document.getElementById('search-courses-container');
        if (coursesSearchContainer) {
          coursesSearchContainer.style.display = 'none';
        }
        
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

export function renderSubcursos(curso, cursosContainer) {
  cursosContainer.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.id = "subcursos-wrapper";

  // Criar barra de pesquisa para subcursos
  const searchContainer = document.createElement("div");
  searchContainer.className = "search-container";
  searchContainer.id = "search-subcursos-container";
  searchContainer.style.display = "block";

  const searchBox = document.createElement("div");
  searchBox.className = "search-box";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "search-subcursos-input";
  searchInput.placeholder = "🔍 Pesquisar subcursos...";
  searchInput.className = "search-input";

  const clearSearchBtn = document.createElement("button");
  clearSearchBtn.id = "clear-search-subcursos";
  clearSearchBtn.className = "clear-search-btn";
  clearSearchBtn.innerHTML = "&times;";
  clearSearchBtn.style.display = "none";

  const searchResultsInfo = document.createElement("div");
  searchResultsInfo.id = "search-subcursos-results-info";
  searchResultsInfo.className = "search-results-info";
  searchResultsInfo.style.display = "none";

  searchBox.appendChild(searchInput);
  searchBox.appendChild(clearSearchBtn);
  searchContainer.appendChild(searchBox);
  searchContainer.appendChild(searchResultsInfo);

  wrapper.appendChild(searchContainer);
  // Botão Voltar
  const btnVoltar = document.createElement("button");
  btnVoltar.className = "back-btn";
  btnVoltar.innerHTML = "&larr; Voltar";
  btnVoltar.style.marginBottom = "32px";
  btnVoltar.onclick = function () {
    // Mostrar spinner ao voltar
    if (typeof window.showLoadingSpinner === 'function') {
      window.showLoadingSpinner('Voltando para cursos...');
    }
    
    // Atualizar estado para cursos antes de recarregar
    if (typeof window.saveCurrentState === 'function') {
      window.saveCurrentState({ view: 'cursos' });
    }
    
    // Aguardar um pouco para mostrar o spinner e depois recarregar a página
    setTimeout(() => {
      // Recarregar a página completamente para garantir que tudo funcione
      window.location.reload();
    }, 800); // Aguardar 800ms para mostrar o spinner
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
  curso.subcursos.forEach((sub, index) => {
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
  
  // Adicionar setinha indicativa de scroll
  addScrollIndicator();
}

// Função para adicionar setinha indicativa de scroll
function addScrollIndicator() {
  // Remover setinha existente se houver
  const existingIndicator = document.querySelector('.scroll-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // Criar elemento da setinha
  const indicator = document.createElement('div');
  indicator.className = 'scroll-indicator';
  
  const arrow = document.createElement('div');
  arrow.className = 'arrow';
  
  // Criar SVG da seta para baixo
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.innerHTML = '<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>';
  
  arrow.appendChild(svg);
  indicator.appendChild(arrow);
  
  // Adicionar ao body
  document.body.appendChild(indicator);
  
  // Mostrar setinha após um pequeno delay
  setTimeout(() => {
    indicator.classList.add('show');
  }, 500);
  
  // Esconder setinha quando o usuário rolar
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    indicator.classList.remove('show');
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // Verificar se ainda há conteúdo abaixo
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Se não estiver no final da página, mostrar setinha novamente
      if (scrollTop + windowHeight < documentHeight - 100) {
        indicator.classList.add('show');
      }
    }, 1000);
  });
  
  // Esconder setinha quando clicar nela
  indicator.addEventListener('click', () => {
    indicator.classList.remove('show');
    // Scroll suave para baixo
    window.scrollBy({
      top: window.innerHeight * 0.8,
      behavior: 'smooth'
    });
  });
  
  // Tornar clicável
  indicator.style.pointerEvents = 'auto';
  indicator.style.cursor = 'pointer';
  
  // Forçar animação para funcionar
  setTimeout(() => {
    arrow.style.animation = 'none';
    arrow.offsetHeight; // Trigger reflow
    arrow.style.animation = 'bounceArrow 1.5s ease-in-out infinite';
  }, 100);
}
