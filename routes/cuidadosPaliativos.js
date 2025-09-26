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
      // Tenta diferentes seletores possíveis para o botão de cookies
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

          // Primeiro, verifica se há cookies e remove
          await hideCookieBanners(page);

          console.log("Esperando página carregar completamente...");
          await page.waitForTimeout(5000);

          // Espera a seção de modalidades estar presente
          await page.waitForSelector(".modalidades-wrapper", {
            visible: true,
            timeout: 10000,
          });

          // Scroll para garantir visibilidade
          await page.evaluate(() => {
            const wrapper = document.querySelector(".modalidades-wrapper");
            if (wrapper) {
              wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });

          console.log("Procurando botão da modalidade...");

          // Espera garantir que a animação do scroll terminou
          await page.waitForTimeout(2000);

          // Tenta localizar e clicar no botão de várias maneiras
          try {
            // Primeira tentativa: clique direto
            await page.click(".modalidade-card-mobile .modalidade-front");
          } catch (e) {
            console.log("Tentativa 1 falhou, tentando método alternativo...");

            // Segunda tentativa: usando JavaScript
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

          // Espera inicial após o clique
          await page.waitForTimeout(3000);

          // Espera o modal aparecer
          await page.waitForFunction(
            () => {
              const modal = document.querySelector(".modal-container");
              if (!modal) return false;

              // Verifica visibilidade real
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

          // Tempo extra para animações
          await page.waitForTimeout(5000);

          // Captura o screenshot do modal
          const modal = await page.$(".modal-container");
          if (modal) {
            const filename = "2_Modalidade_de_Ensino.png";
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
        await new Promise((r) => setTimeout(r, 1000)); // Espera para garantir que o conteúdo esteja carregado
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

  // Objeto para armazenar informações sobre as capturas de tela
  const screenshots = []; // For each section
  for (const section of sections) {
    console.log(`📸 Capturando seção: ${section.internal}`);
    await new Promise((r) => setTimeout(r, 1000)); // Aguarda entre cada seção

    try {
      // Clica no botão da seção
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

      // Espera o conteúdo aparecer
      await page.waitForSelector(section.selector, {
        visible: true,
        timeout: 10000,
      });
      await new Promise((r) => setTimeout(r, 1000));

      if (section.action) {
        await section.action(page);
      }

      // Esconde banners de cookies antes de cada screenshot
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

  // Ordena as capturas de tela com base no índice da seção (a ordem original do array sections)
  screenshots.sort((a, b) => a.index - b.index);

  // Renomeia os arquivos para garantir a sequência correta
  const finalScreenshots = [];
  screenshots.forEach((screenshot, index) => {
    // Calcula o número principal e decimal
    const mainNumber = Math.floor(index / 10) + 1;
    const subNumber = index % 10;
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

  // Retorna apenas os nomes dos arquivos ordenados
  return finalScreenshots;
}

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

    // Handle cookie consent banner
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

    // Scroll to the button group
    await page.evaluate(() => {
      const btn = document.querySelector("button");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Use the helper function to capture all required sections with expanded text
    const screenshotFiles = await captureExpandedTextAndModalities(
      page,
      outputFolder
    );

    // Ensure correct content is captured for each section
    const sections = [
      {
        internal: "Sobre o Curso",
        display: "Sobre o Curso",
        selector: ".sobre-section",
      },
      {
        internal: "Modalidade de Ensino",
        display: "Modalidade de Ensino",
        selector: ".modalidade-front",
        action: async (page) => {
          await page.click(".modalidade-front");
          await page.waitForSelector(".modalidade-front-modal", {
            visible: true,
          });
        },
      },
      {
        internal: "Selecionar uma Turma",
        display: "Selecionar uma Turma",
        selector: ".seletor-container.turma-selecionada",
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

    screenshotFiles.forEach((screenshot, index) => {
      const orderedFilename =
        `${index + 1}_${sections[index].display}`
          .replace(/[^\\w\s]/gi, "")
          .replace(/\s+/g, "_")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/_+/g, "_")
          .replace(/_$/, "") + ".png";

      const oldPath = path.join(outputFolder, screenshot.filename);
      const newPath = path.join(outputFolder, orderedFilename);

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        screenshot.filename = orderedFilename;
      } else {
        console.error(`❌ File not found for renaming: ${oldPath}`);
      }
    });

    await browser.close();

    // Map the ordered screenshot filenames to their full paths
    const files = screenshotFiles.map(
      (filename) => `/Pratica_Estendida_${semesterFolder}/${filename}`
    );

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

    // Handle cookie consent banner
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

    // Scroll to the button group
    await page.evaluate(() => {
      const btn = document.querySelector("button");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Use the helper function to capture all required sections with expanded text
    const screenshotFiles = await captureExpandedTextAndModalities(
      page,
      outputFolder
    );

    // Ensure correct content is captured for each section
    const sections = [
      {
        internal: "Sobre o Curso",
        display: "Sobre o Curso",
        selector: ".sobre-section",
      },
      {
        internal: "Modalidade de Ensino",
        display: "Modalidade de Ensino",
        selector: ".modalidade-front",
        action: async (page) => {
          await page.click(".modalidade-front");
          await page.waitForSelector(".modalidade-front-modal", {
            visible: true,
          });
        },
      },
      {
        internal: "Selecionar uma Turma",
        display: "Selecionar uma Turma",
        selector: ".seletor-container.turma-selecionada",
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

    screenshotFiles.forEach((screenshot, index) => {
      const orderedFilename =
        `${index + 1}_${sections[index].display}`
          .replace(/[^\\w\s]/gi, "")
          .replace(/\s+/g, "_")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/_+/g, "_")
          .replace(/_$/, "") + ".png";

      const oldPath = path.join(outputFolder, screenshot.filename);
      const newPath = path.join(outputFolder, orderedFilename);

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        screenshot.filename = orderedFilename;
      } else {
        console.error(`❌ File not found for renaming: ${oldPath}`);
      }
    });

    await browser.close();

    // Map the ordered screenshot filenames to their full paths
    const files = screenshotFiles.map(
      (filename) => `/Paliativos_Quinzenal_${semesterFolder}/${filename}`
    );

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

    // Handle cookie consent banner
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

    // Scroll to the button group
    await page.evaluate(() => {
      const btn = document.querySelector("button");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Use the helper function to capture all required sections with expanded text
    const screenshotFiles = await captureExpandedTextAndModalities(
      page,
      outputFolder
    );

    // Ensure correct content is captured for each section
    const sections = [
      {
        internal: "Sobre o Curso",
        display: "Sobre o Curso",
        selector: ".sobre-section",
      },
      {
        internal: "Modalidade de Ensino",
        display: "Modalidade de Ensino",
        selector: ".modalidade-front",
        action: async (page) => {
          await page.click(".modalidade-front");
          await page.waitForSelector(".modalidade-front-modal", {
            visible: true,
          });
        },
      },
      {
        internal: "Selecionar uma Turma",
        display: "Selecionar uma Turma",
        selector: ".seletor-container.turma-selecionada",
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

    screenshotFiles.forEach((screenshot, index) => {
      const orderedFilename =
        `${index + 1}_${sections[index].display}`
          .replace(/[^\\w\s]/gi, "")
          .replace(/\s+/g, "_")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/_+/g, "_")
          .replace(/_$/, "") + ".png";

      const oldPath = path.join(outputFolder, screenshot.filename);
      const newPath = path.join(outputFolder, orderedFilename);

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        screenshot.filename = orderedFilename;
      } else {
        console.error(`❌ File not found for renaming: ${oldPath}`);
      }
    });

    await browser.close();

    // Map the ordered screenshot filenames to their full paths
    const files = screenshotFiles.map(
      (filename) => `/Paliativos_Semanal_${semesterFolder}/${filename}`
    );

    return res.json(files);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
