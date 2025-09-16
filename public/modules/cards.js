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
    card.onclick = function () {
      // Se o curso tem subcursos, renderiza os cards de subcursos
      if (curso.subcursos && curso.subcursos.length > 0) {
        renderSubcursos(curso, cursosContainer);
      } else {
        window.abrirViewCurso(curso);
      }
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
    grid.appendChild(card);
  });
  wrapper.appendChild(grid);
  cursosContainer.appendChild(wrapper);
}
