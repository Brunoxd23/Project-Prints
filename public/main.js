// SPA navigation logic
const homeView = document.getElementById("home-view");
const cardsContainer = document.getElementById("cards-container");
const cursosContainer = document.getElementById("cursos-hibrida-container");
const folderView = document.getElementById("folder-view");
const folderTitle = document.getElementById("folder-title");
const folderList = document.getElementById("folder-list");
const folderOutput = document.getElementById("folder-output");
const runScriptBtn = document.getElementById("run-script-btn");

let currentCurso = null; // 'cuidados_paliativos'

function goHome() {
  homeView.style.display = "flex";
  folderView.style.display = "none";
  folderList.innerHTML = "";
  folderOutput.innerHTML = "";
  runScriptBtn.onclick = null;
}

function openFolderView(local) {
  currentCurso = local;
  homeView.style.display = "none";
  folderView.style.display = "flex";
  folderTitle.textContent = "Cuidados Paliativos";
  runScriptBtn.style.display = "block";
  runScriptBtn.textContent = "Executar Script";
  runScriptBtn.onclick = () => runScript(local);
  folderOutput.innerHTML = "";
  loadPastas(local);
}

async function loadPastas(local) {
  folderList.innerHTML = "<span>Carregando...</span>";
  try {
    const res = await fetch("/listar-pastas");
    const pastas = await res.json();
    const prefix = "Cuidados_Paliativos_";
    const filtered = pastas.filter((p) => p.startsWith(prefix));
    if (filtered.length === 0) {
      folderList.innerHTML = "<span>Nenhuma pasta encontrada.</span>";
      return;
    }
    folderList.innerHTML = "";
    filtered.forEach((pasta) => {
      const btn = document.createElement("button");
      btn.textContent = pasta;
      btn.onclick = () => selectPasta(pasta);
      folderList.appendChild(btn);
    });
  } catch (e) {
    folderList.innerHTML = "<span>Erro ao carregar pastas.</span>";
  }
}

function selectPasta(pasta) {
  // Esconde lista de pastas e mostra prints da pasta selecionada
  folderList.style.display = "none";
  // Troca label para 'Prints:'
  const folderLabel = document.getElementById("folder-label");
  if (folderLabel) folderLabel.textContent = "Prints:";
  runScriptBtn.style.display = "none";
  showPrints(pasta);
}

async function showPrints(pasta) {
  folderOutput.innerHTML = "<span>Carregando prints...</span>";
  try {
    const res = await fetch(
      `/listar-prints?pasta=${encodeURIComponent(pasta)}`
    );
    const prints = await res.json();
    let html = "";
    if (!Array.isArray(prints) || prints.length === 0) {
      html += "<span>Nenhum print encontrado.</span>";
      folderOutput.innerHTML =
        `<button class=\"back-btn back-btn-inside\" onclick=\"backToPastas()\">&larr; Voltar às pastas</button><br>` +
        html;
      return;
    }
    html += `<div class='prints-grid'>`;
    html += prints
      .map(
        (img) => `
      <div class='print-item'>
        <img src="${img}" class="print-img" onclick="zoomImg('${img}')" style="cursor:zoom-in;" />
        <br />
        <a href="${img}" download class="download-link" title="Download">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0072ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span class="download-text">Download</span>
        </a>
      </div>
    `
      )
      .join("");
    html += `</div>`;
    folderOutput.innerHTML =
      `<button class=\"back-btn back-btn-inside\" onclick=\"backToPastas()\">&larr; Voltar às pastas</button><br>` +
      html;
    // Toast notification logic
    function showToast(msg) {
      const toast = document.getElementById("toast");
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 3000);
    }
  } catch (e) {
    folderOutput.innerHTML = "<span>Erro ao carregar prints.</span>";
  }
}

function backToPastas() {
  // Oculta prints
  folderView.style.display = "none";
  // Oculta cards da Especialização Híbrida
  document.getElementById("cards-container").style.display = "none";
  // Exibe os cards dos cursos
  const container = document.getElementById("cursos-hibrida-container");
  container.style.display = "block";
  // Só renderiza se não houver grid
  if (!container.querySelector(".cursos-grid")) {
    window.showCursosHibrida();
  }
}

// Corrige navegação: ao clicar Voltar nos cursos, volta para tela inicial
window.voltarParaHome = function () {
  document.getElementById("cursos-hibrida-container").style.display = "none";
  document.getElementById("cards-container").style.display = "flex";
  folderView.style.display = "none";
};

// Garante que ao voltar para a view de pastas, a lista sempre aparece
function ensurePastasVisible() {
  folderList.style.display = "flex";
  folderOutput.innerHTML = "";
  // Troca label de volta para 'Pastas:'
  const folderLabel = document.getElementById("folder-label");
  if (folderLabel) folderLabel.textContent = "Pastas:";
}

// Garante que ao abrir a view de pastas, a lista sempre aparece
goHome = function () {
  homeView.style.display = "flex";
  folderView.style.display = "none";
  folderList.innerHTML = "";
  folderOutput.innerHTML = "";
  runScriptBtn.onclick = null;
  ensurePastasVisible();
};

// Zoom modal logic (reutiliza o existente)
window.zoomImg = function (img) {
  const modal = document.getElementById("zoom-modal");
  const zoomImg = document.getElementById("zoom-img");
  zoomImg.src = img;
  modal.style.display = "flex";
};
document.getElementById("zoom-close").onclick = function () {
  document.getElementById("zoom-modal").style.display = "none";
};

// Script execution logic
async function runScript(local) {
  runScriptBtn.disabled = true;
  runScriptBtn.innerHTML = '<span class="spinner"></span> Executando...';
  folderOutput.innerHTML = "";
  try {
    const endpoint = "/run-script-cuidados";
    const res = await fetch(endpoint, { method: "POST" });
    if (!res.ok) throw new Error("Erro ao executar script");
    const prints = await res.json();
    folderOutput.innerHTML = "<span>Prints gerados com sucesso!</span>";
    loadPastas(local); // Atualiza lista de pastas
  } catch (e) {
    folderOutput.innerHTML = "<span>Erro ao executar script.</span>";
  } finally {
    runScriptBtn.disabled = false;
    runScriptBtn.textContent = "Executar Script";
  }
}

// Cursos da Especialização Híbrida
const cursosHibrida = [
  {
    nome: "Cuidados Paliativos",
    descricao: "Pós com opção de prática estendida",
    pasta: "Cuidados_Paliativos",
    img: "./images/cuidados_paliativos.webp",
  },
  {
    nome: "Dependência Química",
    descricao: "Especialização Híbrida",
    pasta: "Dependencia_Quimica",
    img: "./images/dependencia_quimica.webp",
  },
  {
    nome: "Sustentabilidade: Liderança e Inovação em ESG",
    descricao: "Especialização Híbrida",
    pasta: "Sustentabilidade_ESG",
    img: "./images/Sustentabilidade.webp",
  },
  {
    nome: "Gestão de Infraestrutura e Facilities em Saúde",
    descricao: "Especialização Híbrida",
    pasta: "Gestao_Infraestrutura",
    img: "./images/Gestão_Infra.webp",
  },
  {
    nome: "Psiquiatria Multiprofissional",
    descricao: "Especialização Híbrida",
    pasta: "Psiquiatria_Multiprofissional",
    img: "./images/Psiquiatria_multi.webp",
  },
  {
    nome: "Bases da Saúde Integrativa e Bem-Estar",
    descricao: "Especialização Híbrida",
    pasta: "Saude_Integrativa_Bem_Estar",
    img: "./images/Bases_da_Saude.webp",
  },
];

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
};
