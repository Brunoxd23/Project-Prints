// Funções migradas para spa.js, cards.js, scripts.js, utils.js
// Inicialização e importação agora em index.js

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
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Executando...';
        // Chama rota específica
        try {
          const res = await fetch(sub.rota, { method: "POST" });
          if (!res.ok) throw new Error("Erro ao executar script");
          btn.textContent = "Sucesso!";
          btn.style.background = "#00c6ff";
          btn.style.color = "#fff";
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
