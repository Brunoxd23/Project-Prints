const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  const url =
    "https://ensino.einstein.br/pos_neuropsicologia_p0451/p?sku=10499&cidade=sp";
  const outputFolder = path.join(__dirname, "Neuro_Sp");
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }); // 60 segundos
  await page.setViewport({ width: 1280, height: 800 });

  // Remove pop-up de cookies antes dos prints
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
  } catch (e) {
    // Se não aparecer, segue normalmente
  }

  // Rola até o grupo de botões
  await page.evaluate(() => {
    const btn = document.querySelector("button");
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Lista de abas
  const abas = ["", "curso", "curso", "Valor do Curso", "Valor do Curso"];

  for (let i = 0; i < abas.length; i++) {
    const aba = abas[i];
    if (i === 0) {
      // Primeira aba: apenas fecha o pop-up, não tira print nem espera conteúdo
      continue;
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

      // Tenta fechar o pop-up de cookies antes de cada print
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

      // Print do conteúdo da div principal
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
        console.log(`✅ Print tirado: ${filename}.png`);
      } else {
        await page.screenshot({
          path: path.join(outputFolder, `${filename}_full.png`),
        });
        console.log(`⚠️ Print tirado da página inteira: ${filename}_full.png`);
      }
    }
  }

  await browser.close();
})();
