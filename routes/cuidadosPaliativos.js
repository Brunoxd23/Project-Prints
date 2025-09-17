const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const router = express.Router();

// 1. Unidade Paulista | Quinzenal Prática Estendida
router.post("/run-script-cuidados-quinzenal-pratica", async (req, res) => {
  try {
    const url =
      "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10690&cidade=sp";
    // Importar funções de manipulação de semestre
    const semesterUtils = require("../utils/semester");

    // Get current semester (2025-2)
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 0-11 to 1-12
    const semester = month <= 6 ? "1" : "2";
    let semesterFolder = `${year}-${semester}`;

    // Função auxiliar para verificar se existe pasta para um determinado semestre e se tem prints
    const checkSemesterHasPrints = (folder) => {
      if (fs.existsSync(folder)) {
        const files = fs.readdirSync(folder).filter((f) => f.endsWith(".png"));
        return files.length > 0;
      }
      return false;
    };

    // Buscar próximo semestre disponível (que não tenha prints)
    let basePath = path.join(__dirname, "../public");
    let coursePrefix = "Pratica_Estendida_";
    let foundEmptyFolder = false;
    let currentFolder = path.join(basePath, `${coursePrefix}${semesterFolder}`);

    // Se a pasta atual não existir ou estiver vazia, use-a
    if (!checkSemesterHasPrints(currentFolder)) {
      console.log(
        `Usando pasta do semestre atual ${semesterFolder.replace(
          "-",
          "/"
        )}, pois não existe ou não contém prints ainda`
      );
      foundEmptyFolder = true;
    }
    // Se a pasta atual tiver prints, procure próximas pastas vazias
    else {
      // Tente até 6 semestres futuros (3 anos)
      let tempSemester = semesterFolder;
      console.log(
        `Pasta do semestre ${semesterFolder.replace(
          "-",
          "/"
        )} já tem prints. Buscando próximo semestre disponível...`
      );

      for (let i = 0; i < 6 && !foundEmptyFolder; i++) {
        // Avança para o próximo semestre
        tempSemester = semesterUtils.getNextSemester(tempSemester);
        let tempFolder = path.join(basePath, `${coursePrefix}${tempSemester}`);

        // Verifica se o próximo semestre já tem prints
        if (!checkSemesterHasPrints(tempFolder)) {
          semesterFolder = tempSemester;
          console.log(
            `Semestre disponível encontrado: ${semesterFolder.replace(
              "-",
              "/"
            )}`
          );
          foundEmptyFolder = true;
        } else {
          console.log(
            `Pasta do semestre ${tempSemester.replace(
              "-",
              "/"
            )} já tem prints. Verificando próximo...`
          );
        }
      }

      // Se não encontrar pasta vazia em 6 tentativas, usa o próximo semestre e avisa
      if (!foundEmptyFolder) {
        semesterFolder = semesterUtils.getNextSemester(tempSemester);
        console.log(
          `Nenhuma pasta vazia encontrada nos próximos semestres. Usando o próximo semestre: ${semesterFolder.replace(
            "-",
            "/"
          )}`
        );
      }
    }

    const outputFolder = path.join(
      __dirname,
      "../public",
      `Pratica_Estendida_${semesterFolder}`
    );
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.setViewport({ width: 1280, height: 800 });
    // Remove pop-up de cookies
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
    const files = fs
      .readdirSync(outputFolder)
      .filter((f) => f.endsWith(".png"))
      .map((f) => `/Pratica_Estendida_${semesterFolder}/${f}`);
    return res.json(files);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 2. Unidade Paulista | Quinzenal
router.post("/run-script-cuidados-quinzenal", async (req, res) => {
  try {
    const url =
      "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10691&cidade=sp";
    // Importar funções de manipulação de semestre
    const semesterUtils = require("../utils/semester");

    // Get current semester (2025-2)
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 0-11 to 1-12
    const semester = month <= 6 ? "1" : "2";
    let semesterFolder = `${year}-${semester}`;

    // Função auxiliar para verificar se existe pasta para um determinado semestre e se tem prints
    const checkSemesterHasPrints = (folder) => {
      if (fs.existsSync(folder)) {
        const files = fs.readdirSync(folder).filter((f) => f.endsWith(".png"));
        return files.length > 0;
      }
      return false;
    };

    // Buscar próximo semestre disponível (que não tenha prints)
    let basePath = path.join(__dirname, "../public");
    let coursePrefix = "Paliativos_Quinzenal_";
    let foundEmptyFolder = false;
    let currentFolder = path.join(basePath, `${coursePrefix}${semesterFolder}`);

    // Se a pasta atual não existir ou estiver vazia, use-a
    if (!checkSemesterHasPrints(currentFolder)) {
      console.log(
        `Usando pasta do semestre atual ${semesterFolder.replace(
          "-",
          "/"
        )}, pois não existe ou não contém prints ainda`
      );
      foundEmptyFolder = true;
    }
    // Se a pasta atual tiver prints, procure próximas pastas vazias
    else {
      // Tente até 6 semestres futuros (3 anos)
      let tempSemester = semesterFolder;
      console.log(
        `Pasta do semestre ${semesterFolder.replace(
          "-",
          "/"
        )} já tem prints. Buscando próximo semestre disponível...`
      );

      for (let i = 0; i < 6 && !foundEmptyFolder; i++) {
        // Avança para o próximo semestre
        tempSemester = semesterUtils.getNextSemester(tempSemester);
        let tempFolder = path.join(basePath, `${coursePrefix}${tempSemester}`);

        // Verifica se o próximo semestre já tem prints
        if (!checkSemesterHasPrints(tempFolder)) {
          semesterFolder = tempSemester;
          console.log(
            `Semestre disponível encontrado: ${semesterFolder.replace(
              "-",
              "/"
            )}`
          );
          foundEmptyFolder = true;
        } else {
          console.log(
            `Pasta do semestre ${tempSemester.replace(
              "-",
              "/"
            )} já tem prints. Verificando próximo...`
          );
        }
      }

      // Se não encontrar pasta vazia em 6 tentativas, usa o próximo semestre e avisa
      if (!foundEmptyFolder) {
        semesterFolder = semesterUtils.getNextSemester(tempSemester);
        console.log(
          `Nenhuma pasta vazia encontrada nos próximos semestres. Usando o próximo semestre: ${semesterFolder.replace(
            "-",
            "/"
          )}`
        );
      }
    }

    const outputFolder = path.join(
      __dirname,
      "../public",
      `Paliativos_Quinzenal_${semesterFolder}`
    );
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.setViewport({ width: 1280, height: 800 });
    // Remove pop-up de cookies
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
    const files = fs
      .readdirSync(outputFolder)
      .filter((f) => f.endsWith(".png"))
      .map((f) => `/Paliativos_Quinzenal_${semesterFolder}/${f}`);
    return res.json(files);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 3. Unidade Paulista | Semanal
router.post("/run-script-cuidados-semanal", async (req, res) => {
  try {
    const url =
      "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10693&cidade=sp";
    // Importar funções de manipulação de semestre
    const semesterUtils = require("../utils/semester");

    // Get current semester (2025-2)
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 0-11 to 1-12
    const semester = month <= 6 ? "1" : "2";
    let semesterFolder = `${year}-${semester}`;

    // Função auxiliar para verificar se existe pasta para um determinado semestre e se tem prints
    const checkSemesterHasPrints = (folder) => {
      if (fs.existsSync(folder)) {
        const files = fs.readdirSync(folder).filter((f) => f.endsWith(".png"));
        return files.length > 0;
      }
      return false;
    };

    // Buscar próximo semestre disponível (que não tenha prints)
    let basePath = path.join(__dirname, "../public");
    let coursePrefix = "Paliativos_Semanal_";
    let foundEmptyFolder = false;
    let currentFolder = path.join(basePath, `${coursePrefix}${semesterFolder}`);

    // Se a pasta atual não existir ou estiver vazia, use-a
    if (!checkSemesterHasPrints(currentFolder)) {
      console.log(
        `Usando pasta do semestre atual ${semesterFolder.replace(
          "-",
          "/"
        )}, pois não existe ou não contém prints ainda`
      );
      foundEmptyFolder = true;
    }
    // Se a pasta atual tiver prints, procure próximas pastas vazias
    else {
      // Tente até 6 semestres futuros (3 anos)
      let tempSemester = semesterFolder;
      console.log(
        `Pasta do semestre ${semesterFolder.replace(
          "-",
          "/"
        )} já tem prints. Buscando próximo semestre disponível...`
      );

      for (let i = 0; i < 6 && !foundEmptyFolder; i++) {
        // Avança para o próximo semestre
        tempSemester = semesterUtils.getNextSemester(tempSemester);
        let tempFolder = path.join(basePath, `${coursePrefix}${tempSemester}`);

        // Verifica se o próximo semestre já tem prints
        if (!checkSemesterHasPrints(tempFolder)) {
          semesterFolder = tempSemester;
          console.log(
            `Semestre disponível encontrado: ${semesterFolder.replace(
              "-",
              "/"
            )}`
          );
          foundEmptyFolder = true;
        } else {
          console.log(
            `Pasta do semestre ${tempSemester.replace(
              "-",
              "/"
            )} já tem prints. Verificando próximo...`
          );
        }
      }

      // Se não encontrar pasta vazia em 6 tentativas, usa o próximo semestre e avisa
      if (!foundEmptyFolder) {
        semesterFolder = semesterUtils.getNextSemester(tempSemester);
        console.log(
          `Nenhuma pasta vazia encontrada nos próximos semestres. Usando o próximo semestre: ${semesterFolder.replace(
            "-",
            "/"
          )}`
        );
      }
    }

    const outputFolder = path.join(
      __dirname,
      "../public",
      `Paliativos_Semanal_${semesterFolder}`
    );
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.setViewport({ width: 1280, height: 800 });
    // Remove pop-up de cookies
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
    const files = fs
      .readdirSync(outputFolder)
      .filter((f) => f.endsWith(".png"))
      .map((f) => `/Paliativos_Semanal_${semesterFolder}/${f}`);
    return res.json(files);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
