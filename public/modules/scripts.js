export async function runScript(
  endpoint,
  runScriptBtn,
  folderOutput,
  local,
  loadPastas
) {
  runScriptBtn.disabled = true;
  runScriptBtn.innerHTML = '<span class="spinner"></span> Executando...';
  folderOutput.innerHTML = "";
  try {
    const res = await fetch(endpoint, { method: "POST" });
    if (!res.ok) throw new Error("Erro ao executar script");
    const prints = await res.json();
    folderOutput.innerHTML = "<span>Prints gerados com sucesso!</span>";
    loadPastas(local);
  } catch (e) {
    folderOutput.innerHTML = "<span>Erro ao executar script.</span>";
  } finally {
    runScriptBtn.disabled = false;
    runScriptBtn.textContent = "Executar Script";
  }
}

export async function showPrints(pasta, folderOutput) {
  folderOutput.innerHTML = "<span>Carregando prints...</span>";
  try {
    const res = await fetch(
      `/listar-prints?pasta=${encodeURIComponent(pasta)}`
    );
    let prints = await res.json();
    let html = "";
    if (!Array.isArray(prints) || prints.length === 0) {
      html += "<span>Nenhum print encontrado.</span>";
      folderOutput.innerHTML =
        `<button class=\"back-btn back-btn-inside\" onclick=\"backToPastas()\">&larr; Voltar às pastas</button><br>` +
        html;
      return;
    }
    // Adiciona zeros à esquerda nos nomes dos prints
    prints = prints.map((img) => {
      const parts = img.split("/");
      const filename = parts.pop();
      const updatedFilename = filename.replace(/^(\d)_/, "0$1_");
      return [...parts, updatedFilename].join("/");
    });
    // Ordena os prints para garantir a sequência correta (ordem numérica com suporte a decimais)
    prints.sort((a, b) => {
      const getSortKey = (name) => {
        // Extrai o nome do arquivo da URL
        const filename = name.split('/').pop();
        
        // Procura por padrões como "04.1_", "12.11_", etc.
        const decimalMatch = filename.match(/^(\d+)\.(\d+)_/);
        if (decimalMatch) {
          const mainNum = parseInt(decimalMatch[1], 10);
          const subNum = parseInt(decimalMatch[2], 10);
          // Retorna uma string ordenável: mainNum com 2 dígitos + subNum com 2 dígitos
          return `${mainNum.toString().padStart(2, "0")}.${subNum.toString().padStart(2, "0")}`;
        }
        
        // Fallback para números simples como "01_", "02_", etc.
        const simpleMatch = filename.match(/^(\d+)_/);
        if (simpleMatch) {
          const num = parseInt(simpleMatch[1], 10);
          return `${num.toString().padStart(2, "0")}.00`;
        }
        
        // Se não encontrar padrão numérico, retorna 0
        return "00.00";
      };
      
      return getSortKey(a).localeCompare(getSortKey(b));
    });
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
  } catch (e) {
    folderOutput.innerHTML = "<span>Erro ao carregar prints.</span>";
  }
}
