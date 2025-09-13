async function fetchPastas() {
  const res = await fetch("/listar-pastas");
  const pastas = await res.json();
  const rj = pastas
    .filter((p) => p.startsWith("Neuro_Rj_"))
    .sort()
    .reverse();
  const sp = pastas
    .filter((p) => p.startsWith("Neuro_Sp_"))
    .sort()
    .reverse();
  fillList("list-rj", rj, "rj");
  fillList("list-sp", sp, "sp");
}
function fillList(id, options, tipo) {
  const list = document.getElementById(id);
  list.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.style.textAlign = "left";
    btn.style.background = "#f0f8ff";
    btn.style.color = "#0072ff";
    btn.style.fontWeight = "bold";
    btn.style.fontSize = "15px";
    btn.style.border = "1px solid #b3e0ff";
    btn.style.borderRadius = "6px";
    btn.style.padding = "6px 12px";
    btn.style.cursor = "pointer";
    btn.onmouseover = () => (btn.style.background = "#e6f2ff");
    btn.onmouseout = () => (btn.style.background = "#f0f8ff");
    btn.onclick = () => showPrints(tipo, opt, id);
    list.appendChild(btn);
  });
}
function showPrints(tipo, pasta, listId) {
  document.getElementById(listId).style.display = "none";
  loadPrints(tipo, pasta, listId);
}
async function loadPrints(tipo, pasta, listId) {
  const output = document.getElementById("output-" + tipo);
  output.innerHTML = '<span class="spinner"></span> Carregando prints...';
  const res = await fetch(`/listar-prints?pasta=${encodeURIComponent(pasta)}`);
  const prints = await res.json();
  output.innerHTML = "";
  const btnVoltar = document.createElement("button");
  btnVoltar.textContent = "Voltar para pastas";
  btnVoltar.style.marginBottom = "18px";
  btnVoltar.onclick = () => {
    output.innerHTML = "";
    document.getElementById(listId).style.display = "flex";
  };
  output.appendChild(btnVoltar);
  if (Array.isArray(prints) && prints.length) {
    prints.forEach((file) => {
      const div = document.createElement("div");
      div.style.position = "relative";
      div.style.display = "inline-block";
      div.style.margin = "10px";
      const img = document.createElement("img");
      img.src = file;
      img.className = "print-img";
      img.style.cursor = "zoom-in";
      img.onclick = () => openZoom(file);
      const a = document.createElement("a");
      a.href = file;
      a.download = file.split("/").pop();
      a.textContent = "⬇️";
      a.style.position = "absolute";
      a.style.top = "8px";
      a.style.right = "8px";
      a.style.background = "#fff";
      a.style.borderRadius = "50%";
      a.style.padding = "4px 7px";
      a.style.textDecoration = "none";
      a.style.fontSize = "18px";
      a.title = "Download";
      div.appendChild(img);
      div.appendChild(a);
      output.appendChild(div);
    });
  } else {
    output.innerHTML += "Nenhum print encontrado.";
  }
}
function openZoom(src) {
  document.getElementById("zoom-img").src = src;
  document.getElementById("zoom-modal").style.display = "flex";
}
function closeZoom() {
  document.getElementById("zoom-modal").style.display = "none";
  document.getElementById("zoom-img").src = "";
}
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("zoom-close").onclick = closeZoom;
  document.getElementById("zoom-modal").onclick = function (e) {
    if (e.target === this) closeZoom();
  };
});
function showToast(msg) {
  let toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.position = "fixed";
  toast.style.bottom = "40px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#0072ff";
  toast.style.color = "#fff";
  toast.style.padding = "16px 32px";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "18px";
  toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  toast.style.zIndex = 2000;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
async function runScript(tipo) {
  let endpoint = tipo === "rj" ? "/run-script-rj" : "/run-script-sp";
  let outputId = "output-" + tipo;
  document.getElementById(
    outputId
  ).innerHTML = `<span class="spinner"></span> Executando...`;
  await fetch(endpoint, { method: "POST" });
  await fetchPastas();
  document.getElementById(outputId).innerHTML = "";
  showToast("Prints tirados com sucesso!");
}
window.onload = fetchPastas;
