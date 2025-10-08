// Funcionalidade de Pesquisa para Cursos e Prints

class SearchManager {
  constructor() {
    console.log('🔍 SearchManager inicializado');
    this.initCoursesSearch();
    this.initPrintsSearch();
    this.initSubcursosSearch();
  }

  // Inicializar pesquisa de cursos
  initCoursesSearch() {
    console.log('🔍 Inicializando pesquisa de cursos...');
    
    const searchContainer = document.getElementById('search-courses-container');
    const searchInput = document.getElementById('search-courses-input');
    const clearBtn = document.getElementById('clear-search-courses');
    const resultsInfo = document.getElementById('search-results-info');

    console.log('Elementos encontrados:', {
      searchContainer: !!searchContainer,
      searchInput: !!searchInput,
      clearBtn: !!clearBtn,
      resultsInfo: !!resultsInfo
    });

    if (!searchInput) {
      console.log('❌ Campo de pesquisa não encontrado');
      return;
    }

    // Mostrar barra de pesquisa quando cursos são carregados
    const checkForCourses = () => {
      const cursosContainer = document.getElementById('cursos-hibrida-container');
      console.log('Verificando cursos:', cursosContainer?.children.length);
      
      if (cursosContainer && cursosContainer.children.length > 0) {
        console.log('✅ Mostrando barra de pesquisa de cursos');
        searchContainer.style.display = 'block';
        searchContainer.classList.add('show');
      }
    };

    // Verificar imediatamente
    checkForCourses();

    // Verificar periodicamente
    const interval = setInterval(() => {
      checkForCourses();
      if (searchContainer.style.display === 'block') {
        clearInterval(interval);
      }
    }, 1000);

    // Observer como backup
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          checkForCourses();
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Event listeners
    searchInput.addEventListener('input', (e) => {
      this.searchCourses(e.target.value, resultsInfo);
      clearBtn.style.display = e.target.value ? 'flex' : 'none';
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.clearCoursesSearch(resultsInfo);
      clearBtn.style.display = 'none';
    });

    // Atalho de teclado
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        this.clearCoursesSearch(resultsInfo);
        clearBtn.style.display = 'none';
      }
    });
  }

  // Inicializar pesquisa de prints
  initPrintsSearch() {
    // Esta função será chamada quando a visualização de semestre for criada
    window.initPrintsSearch = () => {
      console.log('🔍 Inicializando pesquisa de prints...');
      
      const searchContainer = document.getElementById('search-prints-container');
      const searchInput = document.getElementById('search-prints-input');
      const clearBtn = document.getElementById('clear-search-prints');
      const resultsInfo = document.getElementById('search-prints-results-info');

      console.log('Elementos de prints encontrados:', {
        searchContainer: !!searchContainer,
        searchInput: !!searchInput,
        clearBtn: !!clearBtn,
        resultsInfo: !!resultsInfo
      });

      if (!searchInput) {
        console.log('❌ Campo de pesquisa de prints não encontrado');
        return;
      }

      // Mostrar barra de pesquisa quando prints são carregados
      const checkForPrints = () => {
        const printsGrid = document.querySelector('.prints-grid');
        console.log('Verificando prints:', printsGrid?.children.length);
        
        if (printsGrid && printsGrid.children.length > 0) {
          console.log('✅ Mostrando barra de pesquisa de prints');
          searchContainer.style.display = 'block';
          searchContainer.classList.add('show');
        }
      };

      // Verificar imediatamente
      checkForPrints();

      // Verificar periodicamente
      const interval = setInterval(() => {
        checkForPrints();
        if (searchContainer.style.display === 'block') {
          clearInterval(interval);
        }
      }, 1000);

      // Observer como backup
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            checkForPrints();
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Event listeners
      searchInput.addEventListener('input', (e) => {
        this.searchPrints(e.target.value, resultsInfo);
        clearBtn.style.display = e.target.value ? 'flex' : 'none';
      });

      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        this.clearPrintsSearch(resultsInfo);
        clearBtn.style.display = 'none';
      });

      // Atalho de teclado
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          this.clearPrintsSearch(resultsInfo);
          clearBtn.style.display = 'none';
        }
      });
    };
  }

  // Pesquisar cursos
  searchCourses(query, resultsInfo) {
    console.log('🔍 Pesquisando cursos:', query);
    
    const cursosContainer = document.getElementById('cursos-hibrida-container');
    if (!cursosContainer) {
      console.log('❌ Container de cursos não encontrado');
      return;
    }

    // Procurar por cards em diferentes estruturas possíveis
    let cards = cursosContainer.querySelectorAll('.curso-card');
    console.log('📋 Cards diretos encontrados:', cards.length);
    
    // Se não encontrar cards diretos, procurar dentro do wrapper
    if (cards.length === 0) {
      const wrapper = cursosContainer.querySelector('div[style*="flex-direction: column"]');
      console.log('Wrapper encontrado:', !!wrapper);
      if (wrapper) {
        cards = wrapper.querySelectorAll('.curso-card');
        console.log('📋 Cards encontrados no wrapper:', cards.length);
      }
    }
    
    // Se ainda não encontrar, procurar no grid
    if (cards.length === 0) {
      const grid = cursosContainer.querySelector('.cursos-grid');
      console.log('Grid encontrado:', !!grid);
      if (grid) {
        cards = grid.querySelectorAll('.curso-card');
        console.log('📋 Cards encontrados no grid:', cards.length);
      }
    }
    
    // Se ainda não encontrar, procurar por qualquer div com classe curso-card
    if (cards.length === 0) {
      cards = document.querySelectorAll('.curso-card');
      console.log('📋 Cards encontrados globalmente:', cards.length);
    }
    
    console.log('📋 Total de cards encontrados:', cards.length);
    
    const searchTerm = query.toLowerCase().trim();
    let visibleCount = 0;

    cards.forEach((card, index) => {
      // Procurar título em diferentes estruturas
      let title = '';
      let description = '';
      
      // Tentar diferentes seletores para o título
      const titleElement = card.querySelector('.curso-titulo') || 
                          card.querySelector('h2') || 
                          card.querySelector('h3') ||
                          card.querySelector('.card-title h3');
      
      if (titleElement) {
        title = titleElement.textContent.toLowerCase();
      }
      
      // Tentar diferentes seletores para a descrição
      const descElement = card.querySelector('.curso-descricao') || 
                         card.querySelector('.card-content div');
      
      if (descElement) {
        description = descElement.textContent.toLowerCase();
      }
      
      console.log(`Card ${index}:`, { 
        title: title.substring(0, 50) + '...', 
        description: description.substring(0, 30) + '...', 
        searchTerm 
      });
      
      const isMatch = title.includes(searchTerm) || description.includes(searchTerm);
      
      if (isMatch) {
        card.classList.remove('filtered-out');
        card.style.display = 'flex';
        visibleCount++;
        console.log(`✅ Card ${index} visível`);
      } else {
        card.classList.add('filtered-out');
        card.style.display = 'none';
        console.log(`❌ Card ${index} oculto`);
      }
    });

    // Mostrar informações dos resultados
    if (searchTerm) {
      if (resultsInfo) {
        resultsInfo.style.display = 'block';
        resultsInfo.textContent = `${visibleCount} curso(s) encontrado(s)`;
      }
      console.log(`📊 ${visibleCount} cursos encontrados`);
    } else {
      if (resultsInfo) {
        resultsInfo.style.display = 'none';
      }
    }
  }

  // Pesquisar prints
  searchPrints(query, resultsInfo) {
    console.log('🔍 Pesquisando prints:', query);
    
    const printsGrid = document.querySelector('.prints-grid');
    if (!printsGrid) {
      console.log('❌ Grid de prints não encontrado');
      return;
    }

    const printItems = printsGrid.querySelectorAll('.print-item');
    console.log('📋 Print items encontrados:', printItems.length);
    
    const searchTerm = query.toLowerCase().trim();
    let visibleCount = 0;

    printItems.forEach((item, index) => {
      // Procurar título em diferentes estruturas
      let title = '';
      let filename = '';
      
      // Tentar diferentes seletores para o título
      const titleElement = item.querySelector('.print-title');
      if (titleElement) {
        title = titleElement.textContent.toLowerCase();
      }
      
      // Tentar obter nome do arquivo da imagem
      const imgElement = item.querySelector('.print-img');
      if (imgElement) {
        const src = imgElement.src || '';
        filename = src.split('/').pop().toLowerCase().replace('.png', '');
      }
      
      console.log(`Print ${index}:`, { 
        title: title.substring(0, 50) + '...', 
        filename: filename.substring(0, 30) + '...', 
        searchTerm 
      });
      
      const isMatch = title.includes(searchTerm) || filename.includes(searchTerm);
      
      if (isMatch) {
        item.classList.remove('filtered-out');
        item.style.display = 'flex';
        visibleCount++;
        console.log(`✅ Print ${index} visível`);
      } else {
        item.classList.add('filtered-out');
        item.style.display = 'none';
        console.log(`❌ Print ${index} oculto`);
      }
    });

    // Mostrar informações dos resultados
    if (searchTerm) {
      if (resultsInfo) {
        resultsInfo.style.display = 'block';
        resultsInfo.textContent = `${visibleCount} print(s) encontrado(s)`;
      }
      console.log(`📊 ${visibleCount} prints encontrados`);
    } else {
      if (resultsInfo) {
        resultsInfo.style.display = 'none';
      }
    }
  }

  // Limpar pesquisa de cursos
  clearCoursesSearch(resultsInfo) {
    console.log('🧹 Limpando pesquisa de cursos');
    
    const cursosContainer = document.getElementById('cursos-hibrida-container');
    if (!cursosContainer) return;

    // Procurar por cards em diferentes estruturas possíveis
    let cards = cursosContainer.querySelectorAll('.curso-card');
    
    // Se não encontrar cards diretos, procurar dentro do wrapper
    if (cards.length === 0) {
      const wrapper = cursosContainer.querySelector('div[style*="flex-direction: column"]');
      if (wrapper) {
        cards = wrapper.querySelectorAll('.curso-card');
      }
    }
    
    // Se ainda não encontrar, procurar no grid
    if (cards.length === 0) {
      const grid = cursosContainer.querySelector('.cursos-grid');
      if (grid) {
        cards = grid.querySelectorAll('.curso-card');
      }
    }

    cards.forEach(card => {
      card.classList.remove('filtered-out');
      card.style.display = 'flex';
      this.removeHighlight(card);
    });

    if (resultsInfo) {
      resultsInfo.style.display = 'none';
    }
    
    console.log('✅ Pesquisa limpa');
  }

  // Limpar pesquisa de prints
  clearPrintsSearch(resultsInfo) {
    console.log('🧹 Limpando pesquisa de prints');
    
    const printsGrid = document.querySelector('.prints-grid');
    if (!printsGrid) return;

    const printItems = printsGrid.querySelectorAll('.print-item');
    printItems.forEach(item => {
      item.classList.remove('filtered-out');
      item.style.display = 'flex';
      this.removeHighlight(item);
    });

    if (resultsInfo) {
      resultsInfo.style.display = 'none';
    }
    
    console.log('✅ Pesquisa de prints limpa');
  }

  // Destacar texto encontrado
  highlightText(element, searchTerm) {
    if (!searchTerm) return;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      
      if (regex.test(text)) {
        const highlightedText = text.replace(regex, '<span class="search-highlight">$1</span>');
        const wrapper = document.createElement('span');
        wrapper.innerHTML = highlightedText;
        textNode.parentNode.replaceChild(wrapper, textNode);
      }
    });
  }

  // Remover destaque
  removeHighlight(element) {
    const highlights = element.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM carregado, inicializando SearchManager...');
  try {
    new SearchManager();
    console.log('✅ SearchManager criado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar SearchManager:', error);
  }
});

// Função global para inicializar pesquisa de prints (chamada pelo semesterView.js)
window.initPrintsSearch = () => {
  console.log('🔍 Inicializando pesquisa de prints...');
  // Esta função será definida pelo SearchManager
};
