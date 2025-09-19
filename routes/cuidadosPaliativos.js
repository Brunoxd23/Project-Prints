const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const router = express.Router();

// Helper function to capture screenshots of all required sections with expanded text and modalities
async function captureExpandedTextAndModalities(page, outputFolder) {
  // List of all sections we need to capture
  const sections = [
    { internal: "Programa e Metodologia", display: "Programa e Metodologia" },
    {
      internal: "Objetivos e Qualificações",
      display: "Objetivos e Qualificacoes",
    },
    { internal: "Corpo Docente", display: "Corpo Docente" },
    { internal: "Cronograma de Aulas", display: "Cronograma de Aulas" },
    { internal: "Local e Horário", display: "Local e Horario" },
    { internal: "Valor do Curso", display: "Valor do Curso" },
    { internal: "Perfil do Aluno", display: "Perfil do Aluno" },
    { internal: "Processo Seletivo", display: "Processo Seletivo" },
    {
      internal: "Perguntas frequentes (FAQ)",
      display: "Perguntas frequentes FAQ",
    },
  ];

  // Objeto para armazenar informações sobre as capturas de tela
  const screenshots = []; // For each section
  for (const section of sections) {
    console.log(`📸 Capturando seção: ${section.internal}`);

    try {
      // Click on the section button
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

      // Wait for content to load
      await page
        .waitForSelector(".turma-wrapper-content", {
          visible: true,
          timeout: 10000,
        })
        .catch(() => {
          console.log(
            `⚠️ Não foi possível encontrar o conteúdo para ${section.internal}, tentando continuar...`
          );
        });
      await new Promise((r) => setTimeout(r, 1000));

      // Try to close cookie notice if it appears
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

      // Check for and click any "... mais" buttons to expand text
      await page.evaluate(() => {
        const maisButtons = Array.from(
          document.querySelectorAll("button")
        ).filter((btn) => btn.textContent.trim().includes("mais"));

        console.log(
          `Encontrados ${maisButtons.length} botões "mais" para expandir`
        );
        for (const btn of maisButtons) {
          btn.click();
        }
      });

      // Wait a moment for text expansion
      await new Promise((r) => setTimeout(r, 1000));

      // Check for and expand modality sections
      await page.evaluate(() => {
        const modalidadesHeaders = Array.from(
          document.querySelectorAll("h3, h4, h5, div")
        ).filter(
          (el) =>
            el.textContent.trim().includes("Modalidade") ||
            el.textContent.trim().includes("modalidade")
        );

        console.log(
          `Encontradas ${modalidadesHeaders.length} seções de modalidade para expandir`
        );
        for (const header of modalidadesHeaders) {
          if (
            header.nextElementSibling &&
            header.nextElementSibling.tagName.toLowerCase() === "div" &&
            header.nextElementSibling.style.display === "none"
          ) {
            header.click();
          }
        }
      });

      // Wait a moment for modality expansion
      await new Promise((r) => setTimeout(r, 1000));

      // Create screenshot filename from section name
      const sectionNumber = sections.indexOf(section) + 1;
      const filename =
        `${sectionNumber}_${section.display}`
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "_")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/_+/g, "_")
          .replace(/_$/, "") + ".png";

      if (!filename || filename === ".png") {
        console.error(
          `❌ Invalid filename generated for section: ${section.display}`
        );
        continue; // Skip this section if filename is invalid
      }

      // Take screenshot of appropriate content
      let content;
      if (section.internal === "curso") {
        content = await page.$(".sobre-section");
      } else {
        content = await page.$(".turma-wrapper-content");
      }

      if (content) {
        await content.screenshot({
          path: path.join(outputFolder, filename),
        });
        console.log(`✅ Screenshot saved: ${filename}`);
        screenshots.push({
          section: section,
          filename: filename,
          index: sections.indexOf(section), // Armazena o índice da seção para ordenação posterior
        });
      } else {
        const fullFilename =
          section.internal.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_") +
          "_full.png";
        await page.screenshot({
          path: path.join(outputFolder, fullFilename),
        });
        console.log(`⚠️ Full page screenshot saved: ${fullFilename}`);
        screenshots.push({
          section: section,
          filename: fullFilename,
          index: sections.indexOf(section), // Armazena o índice da seção para ordenação posterior
        });
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
    const orderedFilename =
      `${index + 1}_${screenshot.section.display}`
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
      { internal: "Programa e Metodologia", display: "Programa e Metodologia" },
      {
        internal: "Objetivos e Qualificações",
        display: "Objetivos e Qualificacoes",
      },
      { internal: "Corpo Docente", display: "Corpo Docente" },
      { internal: "Cronograma de Aulas", display: "Cronograma de Aulas" },
      { internal: "Local e Horário", display: "Local e Horario" },
      { internal: "Valor do Curso", display: "Valor do Curso" },
      { internal: "Perfil do Aluno", display: "Perfil do Aluno" },
      { internal: "Processo Seletivo", display: "Processo Seletivo" },
      {
        internal: "Perguntas frequentes (FAQ)",
        display: "Perguntas frequentes FAQ",
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
      { internal: "Programa e Metodologia", display: "Programa e Metodologia" },
      {
        internal: "Objetivos e Qualificações",
        display: "Objetivos e Qualificacoes",
      },
      { internal: "Corpo Docente", display: "Corpo Docente" },
      { internal: "Cronograma de Aulas", display: "Cronograma de Aulas" },
      { internal: "Local e Horário", display: "Local e Horario" },
      { internal: "Valor do Curso", display: "Valor do Curso" },
      { internal: "Perfil do Aluno", display: "Perfil do Aluno" },
      { internal: "Processo Seletivo", display: "Processo Seletivo" },
      {
        internal: "Perguntas frequentes (FAQ)",
        display: "Perguntas frequentes FAQ",
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
      { internal: "Programa e Metodologia", display: "Programa e Metodologia" },
      {
        internal: "Objetivos e Qualificações",
        display: "Objetivos e Qualificacoes",
      },
      { internal: "Corpo Docente", display: "Corpo Docente" },
      { internal: "Cronograma de Aulas", display: "Cronograma de Aulas" },
      { internal: "Local e Horário", display: "Local e Horario" },
      { internal: "Valor do Curso", display: "Valor do Curso" },
      { internal: "Perfil do Aluno", display: "Perfil do Aluno" },
      { internal: "Processo Seletivo", display: "Processo Seletivo" },
      {
        internal: "Perguntas frequentes (FAQ)",
        display: "Perguntas frequentes FAQ",
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
