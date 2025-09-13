const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

// Endpoint para listar prints de uma pasta específica
app.get("/listar-prints", (req, res) => {
  const pasta = req.query.pasta;
  if (!pasta) return res.status(400).json({ error: "Pasta não informada" });
  const pastaPath = path.join(__dirname, "public", pasta);
  if (!fs.existsSync(pastaPath) || !fs.statSync(pastaPath).isDirectory()) {
    return res.status(404).json({ error: "Pasta não encontrada" });
  }
  const prints = fs
    .readdirSync(pastaPath)
    .filter((f) => f.endsWith(".png"))
    .map((f) => `/${pasta}/${f}`);
  res.json(prints);
});
// Endpoint para listar todas as pastas de prints disponíveis
app.get("/listar-pastas", (req, res) => {
  const publicDir = path.join(__dirname, "public");
  const pastas = fs
    .readdirSync(publicDir)
    .filter((f) => fs.statSync(path.join(publicDir, f)).isDirectory())
    .filter((f) => f.startsWith("Neuro_Rj_") || f.startsWith("Neuro_Sp_"));
  res.json(pastas);
});

// =========================
//      ROTA NEURO RJ
// =========================

// Endpoint para rodar o script e gerar prints do Neuro RJ
app.post("/run-script-rj", async (req, res) => {
  try {
    // URL da página do curso Neuro RJ
    const url =
      "https://ensino.einstein.br/pos_neuropsicologia_p0451/p?sku=10001&cidade=rj";
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    // Pasta de saída com data (dentro de public)
    const outputFolder = path.join(__dirname, "public", `Neuro_Rj_${dateStr}`);
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.setViewport({ width: 1280, height: 800 });

    // Remove pop-up de cookies antes dos prints (caso apareça)
    try {
      await page.waitForSelector("button", { timeout: 60000 });
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const aceitar = btns.find((btn) =>
          btn.textContent.trim().includes("Entendi e Fechar")
        );
        if (aceitar) aceitar.click();
      });
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {}

    await page.evaluate(() => {
      const btn = document.querySelector("button");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Abas a serem navegadas para tirar prints
    const abas = ["", "curso", "curso", "Valor do Curso", "Valor do Curso"];
    for (let i = 0; i < abas.length; i++) {
      const aba = abas[i];
      if (i === 0) continue;
      const [navigation] = await Promise.all([
        page
          .waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })
          .catch(() => null),
        page.evaluate((text) => {
          const btns = Array.from(document.querySelectorAll("button"));
          const target = btns.find((btn) =>
            btn.textContent.trim().includes(text)
          );
          if (target) target.click();
        }, aba),
      ]);
      await page.waitForSelector(".turma-wrapper-content", {
        visible: true,
        timeout: 10000,
      });
      await new Promise((r) => setTimeout(r, 2000));
      try {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const aceitar = btns.find((btn) =>
            btn.textContent.trim().includes("Entendi e Fechar")
          );
          if (aceitar) aceitar.click();
        });
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {}
      const filename = aba.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_");
      let content;
      if (aba === "curso") {
        content = await page.$(".sobre-section");
      } else {
        content = await page.$(".turma-wrapper-content");
      }
      if (content) {
        await content.screenshot({
          path: path.join(outputFolder, `${filename}.png`),
        });
      } else {
        await page.screenshot({
          path: path.join(outputFolder, `${filename}_full.png`),
        });
      }
    }
    await browser.close();
    // Busca os prints gerados na pasta do dia
    const files = fs
      .readdirSync(outputFolder)
      .filter((f) => f.endsWith(".png"))
      .map((f) => `/Neuro_Rj_${dateStr}/${f}`);
    return res.json(files);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// =========================
//      ROTA NEURO SP
// =========================

// Endpoint para rodar o script e gerar prints do Neuro SP
app.post("/run-script-sp", async (req, res) => {
  try {
    // URL da página do curso Neuro SP
    const url =
      "https://ensino.einstein.br/pos_neuropsicologia_p0451/p?sku=10757&cidade=sp";
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    // Pasta de saída com data (dentro de public)
    const outputFolder = path.join(__dirname, "public", `Neuro_Sp_${dateStr}`);
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.setViewport({ width: 1280, height: 800 });

    // Remove pop-up de cookies antes dos prints (caso apareça)
    try {
      await page.waitForSelector("button", { timeout: 60000 });
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const aceitar = btns.find((btn) =>
          btn.textContent.trim().includes("Entendi e Fechar")
        );
        if (aceitar) aceitar.click();
      });
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {}

    await page.evaluate(() => {
      const btn = document.querySelector("button");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Abas a serem navegadas para tirar prints
    const abas = ["", "curso", "curso", "Valor do Curso", "Valor do Curso"];
    for (let i = 0; i < abas.length; i++) {
      const aba = abas[i];
      if (i === 0) continue;
      const [navigation] = await Promise.all([
        page
          .waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })
          .catch(() => null),
        page.evaluate((text) => {
          // Clica duas vezes para garantir visibilidade
          const btns = Array.from(document.querySelectorAll("button"));
          const target = btns.find((btn) =>
            btn.textContent.trim().includes(text)
          );
          if (target) {
            target.click();
            setTimeout(() => target.click(), 300); // reforço
          }
        }, aba),
      ]);
      let content = null;
      let selectorFound = false;
      try {
        await page.waitForSelector(".turma-wrapper-content", {
          visible: true,
          timeout: 10000,
        });
        selectorFound = true;
      } catch (e) {
        selectorFound = false;
      }
      await new Promise((r) => setTimeout(r, 2000));
      try {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("button"));
          const aceitar = btns.find((btn) =>
            btn.textContent.trim().includes("Entendi e Fechar")
          );
          if (aceitar) aceitar.click();
        });
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {}
      const filename = aba.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_");
      if (aba === "curso") {
        content = await page.$(".sobre-section");
      } else if (aba === "Valor do Curso") {
        // Para SP, usar sempre .turma-wrapper-content
        content = await page.$(".turma-wrapper-content");
      } else if (selectorFound) {
        content = await page.$(".turma-wrapper-content");
      } else {
        content = null;
      }
      if (content) {
        await content.screenshot({
          path: path.join(outputFolder, `${filename}.png`),
        });
      } else {
        await page.screenshot({
          path: path.join(outputFolder, `${filename}_full.png`),
        });
      }
    }
    await browser.close();
    // Busca os prints gerados na pasta do dia
    const files = fs
      .readdirSync(outputFolder)
      .filter((f) => f.endsWith(".png"))
      .map((f) => `/Neuro_Sp_${dateStr}/${f}`);
    return res.json(files);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint não encontrado" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
