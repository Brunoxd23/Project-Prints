(function () {
  const $ = (sel) => document.querySelector(sel);

  async function getBasePath() {
    try {
      const r = await fetch("/api/config/base-path");
      const j = await r.json();
      return j.basePath;
    } catch (e) {
      return null;
    }
  }

  async function refreshBaseTag() {
    const base = await getBasePath();
    $("#basePathTag").textContent = `Pasta base: ${base || "não definido"}`;
  }

  function currentSemester() {
    const ano = $("#ano").value.trim();
    const sem = $("#semestre").value.trim();
    if (!ano || !sem) return null;
    return `${ano}-${sem}`;
  }

  function showToast(msg, type = "success") {
    const cont = $("#toastContainer");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    cont.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => cont.removeChild(el), 200);
    }, 3500);
  }

  function showSpinner(visible, text = "Processando…") {
    const inline = $("#inlineSpinner");
    const txt = $("#spinnerText");
    const bar = $("#globalProgress");
    const barTxt = $("#progressText");
    const statusRow = $("#statusRow");
    const statusText = $("#statusText");
    if (txt) txt.textContent = text;
    if (barTxt) barTxt.textContent = visible ? text : "";
    inline.style.display = visible ? "flex" : "none";
    bar.style.display = visible ? "block" : "none";
    if (statusText) statusText.textContent = text;
    if (statusRow) statusRow.style.display = visible ? "flex" : "none";
  }

  async function gerar() {
    const endpoint = $("#curso").value;
    const sem = currentSemester();
    if (!sem) {
      showToast("Informe ano e semestre.", "error");
      return;
    }
    showSpinner(true, "Gerando prints… isto pode levar alguns minutos");
    $("#btnGerar").disabled = true;
    try {
      const res = await fetch(`/api${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semester: sem }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao gerar prints");
      }
      showToast(`OK! Prints gerados em ${sem}.`, "success");
    } catch (e) {
      showToast("Erro: " + e.message, "error");
    }
    $("#btnGerar").disabled = false;
    showSpinner(false);
  }

  function showResult(html) {
    const card = $("#resultadoCard");
    card.innerHTML = `<div>${html}</div>`;
    $("#resultado").style.display = "block";
  }

  async function openAtualizar() {
    const dlg = $("#dlgAtualizar");
    await carregarSemestres();
    dlg.showModal();
  }

  async function carregarSemestres() {
    const pasta = $("#pastaSelect").value;
    const sel = $("#semesterSelect");
    sel.innerHTML = "<option>Carregando…</option>";
    try {
      const r = await fetch(`/listar-semestres/${encodeURIComponent(pasta)}`);
      const j = await r.json();
      const arr = j.semesters || [];
      if (!arr.length) {
        sel.innerHTML = '<option value="">Nenhum semestre encontrado</option>';
      } else {
        sel.innerHTML = arr
          .map((s) => `<option value="${s}">${s}</option>`)
          .join("");
      }
    } catch (e) {
      sel.innerHTML = '<option value="">Erro ao listar</option>';
    }
  }

  async function confirmarAtualizacao() {
    const pasta = $("#pastaSelect").value;
    const sem = $("#semesterSelect").value;
    const body = {
      sobreCurso: $("#chkSobre").checked,
      modalidadeEnsino: $("#chkModalidade").checked,
      selecionarTurma: $("#chkTurma").checked,
      programaMetodologia: $("#chkPrograma").checked,
      objetivosQualificacoes: $("#chkObjetivos").checked,
      corpoDocente: $("#chkCorpo").checked,
      cronogramaAulas: $("#chkCronograma").checked,
      localHorario: $("#chkLocal").checked,
      valorCurso: $("#chkValor").checked,
      perfilAluno: $("#chkPerfil").checked,
      processoSeletivo: $("#chkProcesso").checked,
      perguntasFrequentes: $("#chkFAQ").checked,
    };

    if (!sem) {
      showResult("Escolha um semestre.");
      return;
    }

    const alguma = Object.values(body).some(Boolean);
    if (!alguma) {
      showResult("Selecione pelo menos uma seção para atualizar.");
      return;
    }

    $("#dlgAtualizar").close();
    showSpinner(true, "Atualizando prints selecionados…");
    $("#btnConfirmAtualizar").disabled = true;

    try {
      const res = await fetch(
        `/update-all-prints/${encodeURIComponent(pasta)}/${encodeURIComponent(
          sem
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao atualizar prints");
      }
      showToast(
        `Atualização concluída (${data.updatedFiles?.length || 0} arquivos).`,
        "success"
      );
    } catch (e) {
      showToast("Erro: " + e.message, "error");
    }
    $("#btnConfirmAtualizar").disabled = false;
    showSpinner(false);
  }

  async function changeBase() {
    if (window.api && window.api.selectFolder) {
      const r = await window.api.selectFolder();
      await refreshBaseTag();
      showResult(
        "Pasta alterada. Reinicie o aplicativo para refletir alterações no preview de imagens."
      );
    } else {
      const base = prompt("Cole o caminho da pasta base:");
      if (base) {
        const res = await fetch("/api/config/base-path", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ basePath: base }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showResult(
            "Erro ao alterar pasta: " +
              (data && data.error
                ? data.error
                : "Verifique permissões de escrita nesse local.")
          );
          return;
        }
        await refreshBaseTag();
        showResult(
          "Pasta alterada. Reinicie o aplicativo para refletir alterações."
        );
      }
    }
  }

  // Events
  $("#btnGerar").addEventListener("click", gerar);
  $("#btnAtualizar").addEventListener("click", openAtualizar);
  $("#pastaSelect").addEventListener("change", carregarSemestres);
  $("#btnConfirmAtualizar").addEventListener("click", confirmarAtualizacao);
  $("#btnCloseDlg").addEventListener("click", () => $("#dlgAtualizar").close());
  $("#btnChangeBase").addEventListener("click", changeBase);

  // Defaults
  const d = new Date();
  $("#ano").value = d.getFullYear();
  $("#semestre").value = d.getMonth() >= 5 ? 2 : 1;
  refreshBaseTag();
})();
