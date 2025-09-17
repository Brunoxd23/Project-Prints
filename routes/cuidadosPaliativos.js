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
    // Get current semester (2025-2)
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 0-11 to 1-12
    const semester = month <= 6 ? "1" : "2";
    let semesterFolder = `${year}-${semester}`;

    // Verificar se já existe a pasta do semestre atual
    const currentSemesterFolder = path.join(
      __dirname,
      "../public",
      `Pratica_Estendida_${semesterFolder}`
    );

    // Se a pasta do semestre atual já existir, criar a pasta do próximo semestre
    if (fs.existsSync(currentSemesterFolder)) {
      if (semester === "1") {
        semesterFolder = `${year}-2`;
      } else {
        semesterFolder = `${parseInt(year) + 1}-1`;
      }
      console.log(
        `Pasta do semestre atual já existe. Criando pasta para o semestre ${semesterFolder}`
      );
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
    // Get current semester (2025-2)
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 0-11 to 1-12
    const semester = month <= 6 ? "1" : "2";
    let semesterFolder = `${year}-${semester}`;

    // Verificar se já existe a pasta do semestre atual
    const currentSemesterFolder = path.join(
      __dirname,
      "../public",
      `Paliativos_Quinzenal_${semesterFolder}`
    );

    // Se a pasta do semestre atual já existir, criar a pasta do próximo semestre
    if (fs.existsSync(currentSemesterFolder)) {
      if (semester === "1") {
        semesterFolder = `${year}-2`;
      } else {
        semesterFolder = `${parseInt(year) + 1}-1`;
      }
      console.log(
        `Pasta do semestre atual já existe. Criando pasta para o semestre ${semesterFolder}`
      );
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
    // Get current semester (2025-2)
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 0-11 to 1-12
    const semester = month <= 6 ? "1" : "2";
    let semesterFolder = `${year}-${semester}`;

    // Verificar se já existe a pasta do semestre atual
    const currentSemesterFolder = path.join(
      __dirname,
      "../public",
      `Paliativos_Semanal_${semesterFolder}`
    );

    // Se a pasta do semestre atual já existir, criar a pasta do próximo semestre
    if (fs.existsSync(currentSemesterFolder)) {
      if (semester === "1") {
        semesterFolder = `${year}-2`;
      } else {
        semesterFolder = `${parseInt(year) + 1}-1`;
      }
      console.log(
        `Pasta do semestre atual já existe. Criando pasta para o semestre ${semesterFolder}`
      );
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
