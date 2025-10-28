// Funcionalidade de Pesquisa para Subcursos

// Função para pesquisar subcursos
function searchSubcursos(query, resultsInfo) {
  const subcursosGrid = document.querySelector('.subcursos-grid');
  if (!subcursosGrid) {
    return;
  }

  const subcursoCards = subcursosGrid.querySelectorAll('.curso-card');
  
  const searchTerm = query.toLowerCase().trim();
  let visibleCount = 0;
  let visibleCards = [];
  let hiddenCards = [];

  subcursoCards.forEach((card, index) => {
    // Procurar título em diferentes estruturas
    let title = '';
    
    // Tentar diferentes seletores para o título
    const titleElement = card.querySelector('.card-title h3') || 
                        card.querySelector('h3') || 
                        card.querySelector('.card-title') ||
                        card.querySelector('div[class*="title"]');
    
    if (titleElement) {
      title = titleElement.textContent.toLowerCase();
    } else {
      // Se não encontrar por seletores, procurar por qualquer texto dentro do card
      title = card.textContent.toLowerCase();
    }
    
    const isMatch = title.includes(searchTerm);
    
    if (isMatch) {
      visibleCards.push(card);
      visibleCount++;
    } else {
      hiddenCards.push(card);
    }
  });

  // Primeiro, ocultar todos os cards que não fazem match
  hiddenCards.forEach(card => {
    card.classList.add('filtered-out');
    card.style.display = 'none';
    card.style.visibility = 'hidden';
    card.style.opacity = '0';
  });

  // Depois, mostrar os cards que fazem match na ordem correta
  visibleCards.forEach((card) => {
    card.classList.remove('filtered-out');
    card.style.display = 'flex';
    card.style.visibility = 'visible';
    card.style.opacity = '1';
    
    // Mover o card para o topo do grid
    subcursosGrid.insertBefore(card, subcursosGrid.firstChild);
  });

  // Mostrar informações dos resultados
  if (searchTerm) {
    if (resultsInfo) {
      resultsInfo.style.display = 'block';
      resultsInfo.textContent = `${visibleCount} subcurso(s) encontrado(s)`;
    }
  } else {
    if (resultsInfo) {
      resultsInfo.style.display = 'none';
    }
  }
}

// Função para limpar pesquisa de subcursos
function clearSubcursosSearch(resultsInfo) {
  const subcursosGrid = document.querySelector('.subcursos-grid');
  if (!subcursosGrid) return;

  const subcursoCards = subcursosGrid.querySelectorAll('.curso-card');
  
  // Restaurar todos os cards
  subcursoCards.forEach(card => {
    card.classList.remove('filtered-out');
    card.style.display = 'flex';
    card.style.visibility = 'visible';
    card.style.opacity = '1';
  });
  
  if (resultsInfo) {
    resultsInfo.style.display = 'none';
  }
}

// Função para inicializar pesquisa de subcursos
function initSubcursosSearch() {
  // Verificar periodicamente se a barra de pesquisa de subcursos foi criada
  const checkForSubcursosSearch = () => {
    const searchInput = document.getElementById('search-subcursos-input');
    const clearBtn = document.getElementById('clear-search-subcursos');
    const resultsInfo = document.getElementById('search-subcursos-results-info');

    if (searchInput) {
      
      // Event listeners
      searchInput.addEventListener('input', (e) => {
        searchSubcursos(e.target.value, resultsInfo);
        clearBtn.style.display = e.target.value ? 'flex' : 'none';
      });

      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSubcursosSearch(resultsInfo);
        clearBtn.style.display = 'none';
      });

      // Atalho de teclado
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          clearSubcursosSearch(resultsInfo);
          clearBtn.style.display = 'none';
        }
      });
      
      return true; // Encontrou e configurou
    }
    return false; // Não encontrou ainda
  };

  // Verificar imediatamente
  if (checkForSubcursosSearch()) {
    return;
  }

  // Verificar periodicamente
  const interval = setInterval(() => {
    if (checkForSubcursosSearch()) {
      clearInterval(interval);
    }
  }, 1000);

  // Observer como backup
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        if (checkForSubcursosSearch()) {
          observer.disconnect();
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Função global para inicializar pesquisa de subcursos (pode ser chamada manualmente)
window.initSubcursosSearchGlobal = () => {
  initSubcursosSearch();
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  initSubcursosSearch();
});
