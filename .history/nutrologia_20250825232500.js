const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  const url =
    "https://ensino.einstein.br/pos_nutrologia_p1258/p?sku=9758&cidade=sp";
  const outputFolder = path.join(__dirname, "Nutrologia");
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.setViewport({ width: 1280, height: 800 });

  // Aceita os cookies
  await page.waitForSelector("button", { timeout: 5000 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const aceitar = btns.find((btn) =>
      btn.textContent.trim().includes("Entendi e Fechar")
    );
    if (aceitar) aceitar.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Rola até o grupo de botões
  await page.evaluate(() => {
    const btn = document.querySelector("button");
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Lista de abas
  const abas = [
    "",
    "curso",
    "Programa e Metodologia",
    "Objetivos e Qualificações",
    "Corpo Docente",
    "Cronograma de Aulas",
    "Local e Horário",
    "Valor do Curso",
    "Perfil do Aluno",
    "Processo Seletivo",
    "Perguntas frequentes (FAQ)",
  ];

  for (let i = 0; i < abas.length; i++) {
    const aba = abas[i];
    if (i === 0) {
      // Primeira aba: não clica, só espera o carregamento inicial
      await page.waitForSelector(".turma-wrapper-content", {
        visible: true,
        timeout: 10000,
      });
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      // Demais abas: clica e espera atualizar
      await page.evaluate((text) => {
        const btns = Array.from(document.querySelectorAll("button"));
        const target = btns.find((btn) =>
          btn.textContent.trim().includes(text)
        );
        if (target) target.click();
      }, aba);

      await page.waitForSelector(".turma-wrapper-content", {
        visible: true,
        timeout: 10000,
      });
      await new Promise((r) => setTimeout(r, 2000));
    }

      // Print do conteúdo da div principal
      const filename = aba.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_");
      let content;
      if (aba === "curso") {
        content = await page.$(".sobre-wrapper");
      } else {
        content = await page.$(".turma-wrapper-content");
      }
      if (content) {
        await content.screenshot({
          path: path.join(outputFolder, `${filename}.png`),
        });
        console.log(`✅ Print tirado: ${filename}.png`);
      } else {
        await page.screenshot({
          path: path.join(outputFolder, `${filename}_full.png`),
        });
        console.log(`⚠️ Print tirado da página inteira: ${filename}_full.png`);
      }
  }

  await browser.close();
})();
