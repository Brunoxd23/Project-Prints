const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const router = express.Router();

// Helper function to capture screenshots of all required sections with expanded text and modalities
async function captureExpandedTextAndModalities(page, outputFolder) {
  // Função para lidar com banners de cookies
  const hideCookieBanners = async (page) => {
    try {
      const cookieSelectors = [
        "#inicia_cookies",
        "button[ng-click='inicia_cookies']",
        ".cookies-banner button",
        "#cookies-banner button",
      ];

      for (const selector of cookieSelectors) {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          console.log(`✅ Cookie banner fechado usando seletor: ${selector}`);
          await new Promise((r) => setTimeout(r, 2000));
          return;
        }
      }

      console.log("Nenhum banner de cookies encontrado");
    } catch (error) {
      console.log("Banner de cookies não encontrado ou já fechado");
    }
  };

  // List of all sections we need to capture
  const sections = [
    {
      internal: "Sobre o Curso",
      display: "Sobre o Curso",
      selector: ".sobre-section",
    },
    {
      internal: "Modalidade de Ensino",
      display: "Modalidade de Ensino",
      selector: ".modal-container",
      action: async (page) => {
        try {
          console.log("Iniciando captura da modalidade de ensino...");

          await hideCookieBanners(page);
          await page.waitForTimeout(5000);

          await page.waitForSelector(".modalidades-wrapper", {
            visible: true,
            timeout: 10000,
          });

          await page.evaluate(() => {
            const wrapper = document.querySelector(".modalidades-wrapper");
            if (wrapper) {
              wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });

          console.log("Procurando botão da modalidade...");
          await page.waitForTimeout(2000);

          try {
            await page.click(".modalidade-card-mobile .modalidade-front");
          } catch (e) {
            console.log("Tentativa 1 falhou, tentando método alternativo...");

            await page.evaluate(() => {
              const buttons = Array.from(
                document.querySelectorAll(
                  ".modalidade-card-mobile .modalidade-front"
                )
              );
              const button = buttons.find((b) =>
                b.textContent.includes("HÍBRIDO")
              );
              if (button) button.click();
            });
          }

          console.log("Esperando modal aparecer...");
          await page.waitForTimeout(3000);

          await page.waitForFunction(
            () => {
              const modal = document.querySelector(".modal-container");
              if (!modal) return false;
              const style = window.getComputedStyle(modal);
              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                style.opacity !== "0"
              );
            },
            { timeout: 15000 }
          );

          console.log("Modal de modalidade aberto e pronto para captura");
          await page.waitForTimeout(5000);

          const modal = await page.$(".modal-container");
          if (modal) {
            const fileIndex =
              sections.indexOf(
                sections.find((s) => s.internal === "Modalidade de Ensino")
              ) + 1;
            const paddedIndex = fileIndex < 10 ? `0${fileIndex}` : fileIndex;
            const filename = `${paddedIndex}_Modalidade_de_Ensino.png`;
            await modal.screenshot({ path: path.join(outputFolder, filename) });
            console.log(`✅ Screenshot saved: ${filename}`);
          } else {
            throw new Error("Modal não encontrado para captura");
          }
        } catch (error) {
          console.log("Erro ao abrir modal de modalidades:", error.message);
          throw error;
        }
      },
    },
    {
      internal: "Selecionar uma Turma",
      display: "Selecionar uma Turma",
      selector: ".seletor-container.turma-selecionada",
      action: async (page) => {
        await page.waitForSelector(".seletor-container.turma-selecionada");
        await new Promise((r) => setTimeout(r, 1000));
      },
    },
    {
      internal: "Programa e Metodologia",
      display: "Programa e Metodologia",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Objetivos e Qualificações",
      display: "Objetivos e Qualificacoes",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Corpo Docente",
      display: "Corpo Docente",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Cronograma de Aulas",
      display: "Cronograma de Aulas",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Local e Horário",
      display: "Local e Horario",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Valor do Curso",
      display: "Valor do Curso",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Perfil do Aluno",
      display: "Perfil do Aluno",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Processo Seletivo",
      display: "Processo Seletivo",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Perguntas frequentes (FAQ)",
      display: "Perguntas frequentes FAQ",
      selector: ".turma-wrapper-content",
    },
  ];

  const screenshots = [];
  for (const section of sections) {
    console.log(`📸 Capturando seção: ${section.internal}`);
    await new Promise((r) => setTimeout(r, 1000));

    try {
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
        }, section.internal),
      ]);

      await page.waitForSelector(section.selector, {
        visible: true,
        timeout: 10000,
      });
      await new Promise((r) => setTimeout(r, 1000));

      if (section.action) {
        await section.action(page);
      }

      await hideCookieBanners(page);

      const content = await page.$(section.selector);

      if (content) {
        const index = sections.indexOf(section) + 1;
        const paddedIndex = index < 10 ? `0${index}` : index;
        const filename =
          `${paddedIndex}_${section.display}`
            .replace(/[^\w\s]/gi, "")
            .replace(/\s+/g, "_")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/_+/g, "_")
            .replace(/_$/, "") + ".png";

        await content.screenshot({ path: path.join(outputFolder, filename) });
        console.log(`✅ Screenshot saved: ${filename}`);

        screenshots.push({
          section: section,
          filename: filename,
          index: sections.indexOf(section),
        });
      } else {
        console.error(`❌ Content not found for section: ${section.internal}`);
      }
    } catch (error) {
      console.error(
        `❌ Error capturing section ${section.internal}:`,
        error.message
      );
    }
  }

  screenshots.sort((a, b) => a.index - b.index);
  const finalScreenshots = [];

  screenshots.forEach((screenshot, index) => {
    const fileIndex = index + 1;
    const paddedIndex = fileIndex < 10 ? `0${fileIndex}` : fileIndex;

    const orderedFilename =
      `${paddedIndex}_${screenshot.section.display}`
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "_")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/_+/g, "_")
        .replace(/_$/, "") + ".png";

    const oldPath = path.join(outputFolder, screenshot.filename);
    const newPath = path.join(outputFolder, orderedFilename);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      finalScreenshots.push(orderedFilename);
      console.log(`✅ Renamed to: ${orderedFilename}`);
    } else {
      console.error(`❌ File not found for renaming: ${oldPath}`);
    }
  });

  return finalScreenshots;
}

// Rota para Dependência Química
router.post("/run-script-dependencia-quimica", async (req, res) => {
  try {
    const url =
      "https://ensino.einstein.br/pos_dependencia_quimica_p5174/p?sku=10697&cidade=sp";
    const semesterUtils = require("../utils/semester");

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const semester = month <= 6 ? "1" : "2";
    let semesterFolder = `${year}-${semester}`;

    const checkSemesterHasPrints = (folder) => {
      if (fs.existsSync(folder)) {
        const files = fs.readdirSync(folder).filter((f) => f.endsWith(".png"));
        return files.length > 0;
      }
      return false;
    };

    let basePath = path.join(__dirname, "../public");
    let coursePrefix = "Dependencia_Quimica_";
    let foundEmptyFolder = false;
    let currentFolder = path.join(basePath, `${coursePrefix}${semesterFolder}`);

    if (!checkSemesterHasPrints(currentFolder)) {
      console.log(
        `Usando pasta do semestre atual ${semesterFolder.replace(
          "-",
          "/"
        )}, pois não existe ou não contém prints ainda`
      );
      foundEmptyFolder = true;
    } else {
      let tempSemester = semesterFolder;
      console.log(
        `Pasta do semestre ${semesterFolder.replace(
          "-",
          "/"
        )} já tem prints. Buscando próximo semestre disponível...`
      );

      for (let i = 0; i < 6 && !foundEmptyFolder; i++) {
        tempSemester = semesterUtils.getNextSemester(tempSemester);
        let tempFolder = path.join(basePath, `${coursePrefix}${tempSemester}`);

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
      `${coursePrefix}${semesterFolder}`
    );
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.setViewport({ width: 1280, height: 800 });

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

    const cookieBannerSelector = ".mensagem_cookies";
    const cookieButtonSelector = "button[ng-click='inicia_cookies']";

    if (await page.$(cookieBannerSelector)) {
      console.log("🔧 Handling cookie consent banner...");
      try {
        await page.click(cookieButtonSelector);
        await page.waitForSelector(cookieBannerSelector, {
          hidden: true,
          timeout: 5000,
        });
        console.log("✅ Cookie consent banner closed.");
      } catch (error) {
        console.error(
          "❌ Failed to handle cookie consent banner:",
          error.message
        );
      }
    } else {
      console.log("ℹ️ No cookie consent banner detected.");
    }

    await page.evaluate(() => {
      const btn = document.querySelector("button");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const screenshotFiles = await captureExpandedTextAndModalities(
      page,
      outputFolder
    );

    await browser.close();

    const files = screenshotFiles.map(
      (filename) => `/${coursePrefix}${semesterFolder}/${filename}`
    );

    return res.json(files);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
