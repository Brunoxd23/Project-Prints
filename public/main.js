// SPA navigation logic
const homeView = document.getElementById("home-view");
const folderView = document.getElementById("folder-view");
const folderTitle = document.getElementById("folder-title");
const folderList = document.getElementById("folder-list");
const folderOutput = document.getElementById("folder-output");
const runScriptBtn = document.getElementById("run-script-btn");

let currentLocal = null; // 'rj' ou 'sp'

function goHome() {
  homeView.style.display = "flex";
  folderView.style.display = "none";
  folderList.innerHTML = "";
  folderOutput.innerHTML = "";
  runScriptBtn.onclick = null;
}

function openFolderView(local) {
  currentLocal = local;
  homeView.style.display = "none";
  folderView.style.display = "flex";
  folderTitle.textContent = local === "rj" ? "Neuro RJ" : "Neuro SP";
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
    const prefix = local === "rj" ? "Neuro_Rj_" : "Neuro_Sp_";
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
      folderOutput.innerHTML = html;
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
    folderOutput.innerHTML = html;
  } catch (e) {
    folderOutput.innerHTML = "<span>Erro ao carregar prints.</span>";
  }
}

function backToPastas() {
  folderOutput.innerHTML = "";
  folderList.style.display = "flex";
  // Troca label de volta para 'Pastas:'
  const folderLabel = document.getElementById("folder-label");
  if (folderLabel) folderLabel.textContent = "Pastas:";
}

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
  runScriptBtn.textContent = "Executando...";
  folderOutput.innerHTML = "";
  try {
    const endpoint = local === "rj" ? "/run-script-rj" : "/run-script-sp";
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

// Inicialização: mostra home
goHome();
