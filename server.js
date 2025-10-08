const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 3000;

// Importa rotas
const semestersRouter = require("./routes/semesters");
const dependenciaQuimicaRouter = require("./routes/dependenciaQuimica");
const sustentabilidadeInovacaoRouter = require("./routes/sustentabilidadeInovacao");
const infraestruturaFacilitiesRouter = require("./routes/infraestruturaFacilities");
const psiquiatriaMultiprofissionalRouter = require("./routes/psiquiatriaMultiprofissional");
const basesIntegrativaRouter = require("./routes/basesIntegrativa");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // Adicionar middleware para parsing de JSON

// Servir arquivos da pasta de rede
app.use('/prints', express.static(path.join("C:", "Users", "drt62324", "Documents", "Pós Graduação")));

// Rotas de gerenciamento de semestres
app.use("/api/semesters", semestersRouter);

// Rotas para os cursos
app.use("/api", dependenciaQuimicaRouter);
app.use("/api", sustentabilidadeInovacaoRouter);
app.use("/api", infraestruturaFacilitiesRouter);
app.use("/api", psiquiatriaMultiprofissionalRouter);
app.use("/api", basesIntegrativaRouter);

// Endpoint para listar semestres disponíveis para um curso específico
app.get("/listar-semestres/:pasta", (req, res) => {
  const { pasta } = req.params;
  const publicDir = path.join("C:", "Users", "drt62324", "Documents", "Pós Graduação");

  try {
    // Lista todos os diretórios na pasta de rede
    const allDirs = fs
      .readdirSync(publicDir)
      .filter((f) => fs.statSync(path.join(publicDir, f)).isDirectory());

    // Filtra apenas os diretórios que começam com o nome da pasta e têm o padrão de semestre
    const semesterDirs = allDirs
      .filter((dir) => dir.startsWith(`${pasta}_`))
      .map((dir) => {
        // Extrai o semestre (YYYY-S) do nome da pasta
        const match = dir.match(new RegExp(`${pasta}_(\\d{4}-[12])$`));
        return match ? match[1] : null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Ordena por ano (decrescente) e depois por semestre (decrescente)
        const [yearA, semA] = a.split("-").map(Number);
        const [yearB, semB] = b.split("-").map(Number);
        return yearB - yearA || semB - semA;
      });

    res.json({ semesters: semesterDirs });
  } catch (error) {
    console.error("Erro ao listar semestres:", error);
    res.status(500).json({ error: "Erro ao listar semestres" });
  }
});

// Endpoint para listar prints de uma pasta específica
app.get("/listar-prints", (req, res) => {
  const pasta = req.query.pasta;
  if (!pasta) return res.status(400).json({ error: "Pasta não informada" });
  const pastaPath = path.join("C:", "Users", "drt62324", "Documents", "Pós Graduação", pasta);
  if (!fs.existsSync(pastaPath) || !fs.statSync(pastaPath).isDirectory()) {
    return res.status(404).json({ error: "Pasta não encontrada" });
  }
  const prints = fs
    .readdirSync(pastaPath)
    .filter((f) => f.endsWith(".png"))
    .map((f) => `/prints/${pasta}/${f}`);
  res.json(prints);
});
// Endpoint para listar todas as pastas de prints disponíveis
app.get("/listar-pastas", (req, res) => {
  const publicDir = path.join("C:", "Users", "drt62324", "Documents", "Pós Graduação");
  const pastas = fs
    .readdirSync(publicDir)
    .filter((f) => fs.statSync(path.join(publicDir, f)).isDirectory())
    .filter(
      (f) =>
        f.startsWith("Pratica_Estendida_") ||
        f.startsWith("Paliativos_Quinzenal_") ||
        f.startsWith("Paliativos_Semanal_") ||
        f.startsWith("Paliativos_RJ_Mensal_") ||
        f.startsWith("Paliativos_GO_Mensal_") ||
        f.startsWith("Dependencia_Quimica_") ||
        f.startsWith("Sustentabilidade_Quinzenal_") ||
        f.startsWith("Infraestrutura_Mensal_") ||
        f.startsWith("Psiquiatria_Mensal_") ||
        f.startsWith("Bases_Integrativa_Mensal_") ||
        f.startsWith("Gestao_Infraestrutura_") ||
        f.startsWith("Psiquiatria_Multiprofissional_") ||
        f.startsWith("Saude_Integrativa_Bem_Estar_")
    );
  res.json(pastas);
});

// =========================
//   ROTAS CUIDADOS PALIATIVOS
// =========================

// 1. Unidade Paulista | Quinzenal Prática Estendida

// Importa rotas de Cuidados Paliativos
const cuidadosPaliativosRoutes = require("./routes/cuidadosPaliativos");
app.use(cuidadosPaliativosRoutes);

// =========================
//   ROTA DE ATUALIZAÇÃO DE PRINTS
// =========================

// Rota para atualizar prints específicos (08 e 09) de um semestre
app.post("/update-prints/:pasta/:semester", async (req, res) => {
  const { pasta, semester } = req.params;
  const { localHorario = true, valorCurso = true } = req.body; // Valores padrão se não especificados
  const folderName = `${pasta}_${semester}`;
  const outputFolder = path.join("C:", "Users", "drt62324", "Documents", "Pós Graduação", folderName);
  
  console.log(`Iniciando atualização de prints para ${pasta}/${semester}`);
  console.log(`Opções selecionadas: Local e Horário: ${localHorario}, Valor do Curso: ${valorCurso}`);
  
  // Verificar se a pasta existe
  if (!fs.existsSync(outputFolder)) {
    return res.status(404).json({ error: "Pasta do semestre não encontrada" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Determinar URL base baseada na pasta do curso com parâmetros corretos
    let baseUrl;
    if (pasta.includes("CP_Quinzenal")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10691&cidade=sp";
    } else if (pasta.includes("CP_Pratica_Estendida")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10690&cidade=sp";
    } else if (pasta.includes("CP_Semanal")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10693&cidade=sp";
    } else if (pasta.includes("CP_RJ")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10923&cidade=rj";
    } else if (pasta.includes("CP_GO")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10939&cidade=go";
    } else if (pasta.includes("SLI_Quinzenal")) {
      baseUrl = "https://ensino.einstein.br/pos_gt_sustentabilidade_lider_inovacao_esg_p14832/p?sku=10905&cidade=sp";
    } else if (pasta.includes("DQ_Mensal")) {
      baseUrl = "https://ensino.einstein.br/pos_dependencia_quimica_p5174/p?sku=10697&cidade=sp";
    } else if (pasta.includes("GIF_Mensal")) {
      baseUrl = "https://ensino.einstein.br/pos_gt_infraestrutura_facilities_saude_p14827/p?sku=10906&cidade=sp";
    } else if (pasta.includes("PM_Mensal")) {
      baseUrl = "https://ensino.einstein.br/pos_psiquiatria_multiprofissional_p4542/p?sku=10771&cidade=sp";
    } else if (pasta.includes("BSI_Mensal")) {
      baseUrl = "https://ensino.einstein.br/pos_bases_saude_integrativa_bem_estar_p0078/p?sku=10685&cidade=sp";
    } else {
      // URL padrão para outros cursos
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10691&cidade=sp";
    }

    // Função para esconder banners de cookies
    const hideCookieBanners = async (page) => {
      try {
        const cookieSelectors = [
          "#inicia_cookies",
          "button[ng-click='inicia_cookies']",
          ".cookies-banner button",
          "#cookies-banner button",
          ".mensagem_cookies button",
          "button[contains(text(), 'Aceitar')]",
          "button[contains(text(), 'Entendi')]",
          "button[contains(text(), 'Fechar')]"
        ];

        for (const selector of cookieSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              console.log(`✅ Cookie banner fechado usando seletor: ${selector}`);
              await new Promise((r) => setTimeout(r, 2000));
              return;
            }
          } catch (e) {
            continue;
          }
        }
        console.log("ℹ️ Nenhum banner de cookies encontrado");
      } catch (error) {
        console.log("ℹ️ Banner de cookies não encontrado ou já fechado");
      }
    };

    console.log(`Navegando para: ${baseUrl}`);
    try {
      await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 60000 });
      console.log("✅ Navegação concluída com sucesso");
    } catch (navError) {
      console.error("❌ Erro na navegação:", navError.message);
      throw navError;
    }
    
    await hideCookieBanners(page);
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("✅ Cookies tratados e página estabilizada");

    // Primeiro, selecionar uma turma (necessário para acessar as seções)
    console.log("Selecionando uma turma...");
    try {
      await page.waitForSelector(".seletor-container.turma-selecionada", {
        visible: true,
        timeout: 10000,
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("✅ Turma selecionada");
    } catch (error) {
      console.log("⚠️ Erro ao selecionar turma:", error.message);
      // Tentar continuar mesmo sem selecionar turma
    }

    // Função para encontrar o próximo número sequencial
    const getNextSequentialNumber = (baseNumber, outputFolder) => {
      try {
        const files = fs.readdirSync(outputFolder);
        const pattern = new RegExp(`^${baseNumber}\\.(\\d+)\\s-\\sAtualizado`);
        let maxNumber = 0;
        
        files.forEach(file => {
          const match = file.match(pattern);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        });
        
        return maxNumber + 1;
      } catch (error) {
        console.log(`Erro ao ler pasta ${outputFolder}:`, error.message);
        return 1; // Retorna 1 se houver erro
      }
    };

    // Gerar data atual
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-'); // Formato DD-MM-YYYY

    // Capturar Local e Horário (08) - apenas se selecionado
    if (localHorario) {
      console.log("Capturando Local e Horário...");
      try {
      // Usar a mesma lógica do arquivo cuidadosPaliativos.js
      const [navigation] = await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => null),
        page.evaluate((text) => {
          const btns = Array.from(document.querySelectorAll("button"));
          const target = btns.find((btn) => btn.textContent.trim().includes(text));
          if (target) {
            console.log(`Clicando no botão: ${text}`);
            target.click();
          } else {
            console.log(`Botão não encontrado: ${text}`);
          }
        }, "Local e Horário"),
      ]);
      
      // Aguarda o conteúdo aparecer com timeout maior
      try {
        await page.waitForSelector(".turma-wrapper-content", {
          visible: true,
          timeout: 15000,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("✅ Conteúdo Local e Horário carregado");
      } catch (selectorError) {
        console.log("⚠️ Seletor .turma-wrapper-content não encontrado para Local e Horário:", selectorError.message);
        // Tentar continuar mesmo sem o seletor
      }
      
      const nextNumber08 = getNextSequentialNumber('08', outputFolder);
      const localHorarioFilename = `08.${nextNumber08} - Atualizado ${dateStr} - Local e Horario.png`;
      
      // Captura apenas o conteúdo da seção
      const content = await page.$(".turma-wrapper-content");
      if (content) {
        try {
          await content.screenshot({ path: path.join(outputFolder, localHorarioFilename) });
          console.log(`✅ Local e Horário capturado: ${localHorarioFilename}`);
        } catch (screenshotError) {
          console.error(`❌ Erro ao salvar screenshot Local e Horário:`, screenshotError.message);
          // Tentar capturar a página inteira como fallback
          try {
            await page.screenshot({ path: path.join(outputFolder, localHorarioFilename), fullPage: true });
            console.log(`✅ Local e Horário capturado (fallback): ${localHorarioFilename}`);
          } catch (fallbackError) {
            console.error(`❌ Erro no fallback Local e Horário:`, fallbackError.message);
          }
        }
      } else {
        console.error(`❌ Content not found for section: Local e Horário`);
        // Tentar capturar a página inteira como fallback
        try {
          await page.screenshot({ path: path.join(outputFolder, localHorarioFilename), fullPage: true });
          console.log(`✅ Local e Horário capturado (fallback): ${localHorarioFilename}`);
        } catch (fallbackError) {
          console.error(`❌ Erro no fallback Local e Horário:`, fallbackError.message);
        }
      }
      } catch (error) {
        console.log("❌ Erro ao capturar Local e Horário:", error.message);
      }
    } else {
      console.log("⏭️ Pulando captura de Local e Horário (não selecionado)");
    }

    // Capturar Valor do Curso (09) - apenas se selecionado
    if (valorCurso) {
    console.log("Capturando Valor do Curso...");
    try {
      // Usar a mesma lógica do arquivo cuidadosPaliativos.js
      const [navigation] = await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => null),
        page.evaluate((text) => {
          const btns = Array.from(document.querySelectorAll("button"));
          const target = btns.find((btn) => btn.textContent.trim().includes(text));
          if (target) {
            console.log(`Clicando no botão: ${text}`);
            target.click();
          } else {
            console.log(`Botão não encontrado: ${text}`);
          }
        }, "Valor do Curso"),
      ]);
      
      // Aguarda o conteúdo aparecer com timeout maior
      try {
        await page.waitForSelector(".turma-wrapper-content", {
          visible: true,
          timeout: 15000,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("✅ Conteúdo Valor do Curso carregado");
      } catch (selectorError) {
        console.log("⚠️ Seletor .turma-wrapper-content não encontrado para Valor do Curso:", selectorError.message);
        // Tentar continuar mesmo sem o seletor
      }
      
      const nextNumber09 = getNextSequentialNumber('09', outputFolder);
      const valorCursoFilename = `09.${nextNumber09} - Atualizado ${dateStr} - Valor do Curso.png`;
      
      // Captura apenas o conteúdo da seção
      const content = await page.$(".turma-wrapper-content");
      if (content) {
        try {
          await content.screenshot({ path: path.join(outputFolder, valorCursoFilename) });
          console.log(`✅ Valor do Curso capturado: ${valorCursoFilename}`);
        } catch (screenshotError) {
          console.error(`❌ Erro ao salvar screenshot Valor do Curso:`, screenshotError.message);
          // Tentar capturar a página inteira como fallback
          try {
            await page.screenshot({ path: path.join(outputFolder, valorCursoFilename), fullPage: true });
            console.log(`✅ Valor do Curso capturado (fallback): ${valorCursoFilename}`);
          } catch (fallbackError) {
            console.error(`❌ Erro no fallback Valor do Curso:`, fallbackError.message);
          }
        }
      } else {
        console.error(`❌ Content not found for section: Valor do Curso`);
        // Tentar capturar a página inteira como fallback
        try {
          await page.screenshot({ path: path.join(outputFolder, valorCursoFilename), fullPage: true });
          console.log(`✅ Valor do Curso capturado (fallback): ${valorCursoFilename}`);
        } catch (fallbackError) {
          console.error(`❌ Erro no fallback Valor do Curso:`, fallbackError.message);
        }
      }
    } catch (error) {
      console.log("❌ Erro ao capturar Valor do Curso:", error.message);
    }
    } else {
      console.log("⏭️ Pulando captura de Valor do Curso (não selecionado)");
    }

    // Verificar se os arquivos foram criados antes de retornar
    const updatedFiles = [];
    
    if (localHorario) {
      const localHorarioFile = `08.${getNextSequentialNumber('08', outputFolder) - 1} - Atualizado ${dateStr} - Local e Horario.png`;
      if (fs.existsSync(path.join(outputFolder, localHorarioFile))) {
        updatedFiles.push(localHorarioFile);
        console.log(`✅ Arquivo Local e Horário encontrado`);
      } else {
        console.log(`❌ Arquivo Local e Horário não encontrado`);
      }
    }
    
    if (valorCurso) {
      const valorCursoFile = `09.${getNextSequentialNumber('09', outputFolder) - 1} - Atualizado ${dateStr} - Valor do Curso.png`;
      if (fs.existsSync(path.join(outputFolder, valorCursoFile))) {
        updatedFiles.push(valorCursoFile);
        console.log(`✅ Arquivo Valor do Curso encontrado`);
      } else {
        console.log(`❌ Arquivo Valor do Curso não encontrado`);
      }
    }

    console.log(`Retornando resposta com ${updatedFiles.length} arquivos atualizados`);
    res.json({ 
      success: true, 
      message: "Prints atualizados com sucesso!",
      updatedFiles: updatedFiles
    });

  } catch (error) {
    console.error("Erro ao atualizar prints:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Erro interno do servidor", 
      details: error.message 
    });
  } finally {
    try {
      if (browser) {
        console.log("Fechando browser...");
        await browser.close();
        console.log("✅ Browser fechado com sucesso");
      }
    } catch (closeError) {
      console.log("Erro ao fechar browser:", closeError.message);
    }
  }
});

// Nova rota para atualizar todos os prints disponíveis
app.post("/update-all-prints/:pasta/:semester", async (req, res) => {
  const { pasta, semester } = req.params;
  const { 
    sobreCurso = false,
    modalidadeEnsino = false,
    selecionarTurma = false,
    programaMetodologia = false,
    objetivosQualificacoes = false,
    corpoDocente = false,
    cronogramaAulas = false,
    localHorario = false,
    valorCurso = false,
    perfilAluno = false,
    processoSeletivo = false,
    perguntasFrequentes = false
  } = req.body;
  
  const folderName = `${pasta}_${semester}`;
  const outputFolder = path.join("C:", "Users", "drt62324", "Documents", "Pós Graduação", folderName);
  
  console.log(`Iniciando atualização completa de prints para ${pasta}/${semester}`);
  console.log(`Opções selecionadas:`, req.body);
  
  // Verificar se a pasta existe
  if (!fs.existsSync(outputFolder)) {
    return res.status(404).json({ error: "Pasta do semestre não encontrada" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Determinar URL base baseada na pasta do curso
    let baseUrl;
    if (pasta.includes("CP_Quinzenal")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10691&cidade=sp";
    } else if (pasta.includes("CP_Pratica_Estendida")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10690&cidade=sp";
    } else if (pasta.includes("CP_Semanal")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10693&cidade=sp";
    } else if (pasta.includes("CP_RJ")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10923&cidade=rj";
    } else if (pasta.includes("CP_GO")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10939&cidade=go";
    } else if (pasta.includes("SLI_Quinzenal")) {
      baseUrl = "https://ensino.einstein.br/pos_gt_sustentabilidade_lider_inovacao_esg_p14832/p?sku=10905&cidade=sp";
    } else if (pasta.includes("DQ_Mensal")) {
      baseUrl = "https://ensino.einstein.br/pos_dependencia_quimica_p5174/p?sku=10697&cidade=sp";
    } else if (pasta.includes("GIF_Mensal")) {
      baseUrl = "https://ensino.einstein.br/pos_gt_infraestrutura_facilities_saude_p14827/p?sku=10906&cidade=sp";
    } else if (pasta.includes("PM_Mensal")) {
      baseUrl = "https://ensino.einstein.br/pos_psiquiatria_multiprofissional_p4542/p?sku=10771&cidade=sp";
    } else if (pasta.includes("BSI_Mensal")) {
      baseUrl = "https://ensino.einstein.br/pos_bases_saude_integrativa_bem_estar_p0078/p?sku=10685&cidade=sp";
    } else {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10691&cidade=sp";
    }

    // Função para esconder banners de cookies
    const hideCookieBanners = async (page) => {
      try {
        const cookieSelectors = [
          "#inicia_cookies",
          "button[ng-click='inicia_cookies']",
          ".cookies-banner button",
          "#cookies-banner button",
          ".mensagem_cookies button",
          "button[contains(text(), 'Aceitar')]",
          "button[contains(text(), 'Entendi')]",
          "button[contains(text(), 'Fechar')]"
        ];

        for (const selector of cookieSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              console.log(`✅ Cookie banner fechado usando seletor: ${selector}`);
              await new Promise((r) => setTimeout(r, 2000));
              return;
            }
          } catch (e) {
            continue;
          }
        }
        console.log("ℹ️ Nenhum banner de cookies encontrado");
      } catch (error) {
        console.log("ℹ️ Banner de cookies não encontrado ou já fechado");
      }
    };

    console.log(`Navegando para: ${baseUrl}`);
    try {
      await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 60000 });
      console.log("✅ Navegação concluída com sucesso");
    } catch (navError) {
      console.error("❌ Erro na navegação:", navError.message);
      throw navError;
    }
    
    await hideCookieBanners(page);
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("✅ Cookies tratados e página estabilizada");

    // Selecionar uma turma
    console.log("Selecionando uma turma...");
    try {
      await page.waitForSelector(".seletor-container.turma-selecionada", {
        visible: true,
        timeout: 10000,
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("✅ Turma selecionada");
    } catch (error) {
      console.log("⚠️ Erro ao selecionar turma:", error.message);
    }

    // Função para encontrar o próximo número sequencial
    const getNextSequentialNumber = (baseNumber, outputFolder) => {
      try {
        const files = fs.readdirSync(outputFolder);
        const pattern = new RegExp(`^${baseNumber}\\.(\\d+)\\s-\\sAtualizado`);
        let maxNumber = 0;
        
        files.forEach(file => {
          const match = file.match(pattern);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        });
        
        return maxNumber + 1;
      } catch (error) {
        console.log(`Erro ao ler pasta ${outputFolder}:`, error.message);
        return 1;
      }
    };

    // Gerar data atual
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');

    // Função genérica para capturar prints
    const capturePrint = async (sectionName, sectionNumber, isSelected) => {
      if (!isSelected) {
        console.log(`⏭️ Pulando captura de ${sectionName} (não selecionado)`);
        return null;
      }

      console.log(`Capturando ${sectionName}...`);
      try {
        // Aguardar entre cada seção
        await new Promise((r) => setTimeout(r, 1000));

        // Verificar se a página ainda está conectada
        if (page.isClosed()) {
          console.error(`❌ Página foi fechada durante captura de ${sectionName}`);
          return null;
        }

        // Determinar o seletor correto baseado na seção
        const getSelector = (section) => {
          if (section === 'Sobre o Curso') {
            return '.sobre-section';
          } else if (section === 'Selecionar uma Turma') {
            return '.seletor-container.turma-selecionada';
          } else if (section === 'Modalidade de Ensino') {
            return '.modalidade-front';
          } else if (section === 'Programa e Metodologia') {
            // Seletor específico para capturar todo o conteúdo de Programa e Metodologia
            return '.turma-wrapper-content, .programa-metodologia-content, .content-wrapper';
          } else if (section === 'Objetivos e Qualificações') {
            // Seletor específico para incluir o título da seção
            return '.turma-wrapper-content, .objetivos-content, .content-wrapper';
          } else {
            return '.turma-wrapper-content';
          }
        };

        const selector = getSelector(sectionName);
        console.log(`🎯 Usando seletor: ${selector} para ${sectionName}`);

        // Para "Sobre o Curso", não precisa clicar em botão - é conteúdo estático
        if (sectionName === 'Sobre o Curso') {
          console.log(`ℹ️ ${sectionName} é conteúdo estático, não precisa clicar em botão`);
        } else if (sectionName === 'Modalidade de Ensino') {
          console.log(`🎯 Executando ação específica para ${sectionName}...`);
          
          // Usar a mesma lógica simples das outras seções que funcionam
          try {
            console.log("Clicando no botão Modalidade de Ensino...");
            
            // Clica no botão da seção (igual às outras seções que funcionam)
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
                  if (target) {
                    console.log(`Clicando no botão: ${text}`);
                    target.click();
                  } else {
                    console.log(`Botão não encontrado: ${text}`);
                  }
                }, sectionName),
              ]);
            } catch (navError) {
              console.log(`⚠️ Erro de navegação para ${sectionName}, continuando...`);
            }

            // Aguardar um pouco para o conteúdo carregar
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Tentar clicar no botão HÍBRIDO se aparecer
            try {
              await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll(".modalidade-front"));
                const hibridoButton = buttons.find((btn) =>
                  btn.textContent.includes("HÍBRIDO")
                );
                if (hibridoButton) {
                  console.log("Botão HÍBRIDO encontrado, clicando...");
                  hibridoButton.click();
                } else {
                  console.log("Botão HÍBRIDO não encontrado");
                }
              });
              
              // Aguardar modal aparecer
              await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (e) {
              console.log("Erro ao clicar no botão HÍBRIDO:", e.message);
            }

            // Usar a mesma lógica de captura das outras seções
            const nextNumber = getNextSequentialNumber(sectionNumber, outputFolder);
            const filename = `${sectionNumber}.${nextNumber} - Atualizado ${dateStr} - ${sectionName}.png`;

            // Tentar capturar o modal se estiver visível
            try {
              const modalElement = await page.$('.modal-container');
              if (modalElement) {
                await modalElement.screenshot({ path: path.join(outputFolder, filename) });
                console.log(`✅ ${sectionName} capturado (modal): ${filename}`);
                return filename;
              }
            } catch (modalError) {
              console.log("Erro ao capturar modal:", modalError.message);
            }

            // Fallback: capturar tela inteira (igual às outras seções)
            try {
              await page.screenshot({ path: path.join(outputFolder, filename), fullPage: true });
              console.log(`✅ ${sectionName} capturado (fallback): ${filename}`);
              return filename;
            } catch (fallbackError) {
              console.error(`❌ Erro no fallback ${sectionName}:`, fallbackError.message);
              return null;
            }
            
          } catch (error) {
            console.log(`❌ Erro ao capturar ${sectionName}:`, error.message);
            return null;
          }
        } else if (sectionName === 'Programa e Metodologia') {
          console.log(`🎯 Executando ação específica para ${sectionName}...`);
          
          // IMPORTANTE: Fechar qualquer modal aberto antes de navegar para outras seções
          try {
            console.log(`🔒 Fechando modais abertos antes de ${sectionName}...`);
            await page.evaluate(() => {
              const modalCloseSelectors = [
                '.modal-close',
                '.modal .close',
                '.modal-header .close',
                '[data-dismiss="modal"]',
                '.modal-backdrop',
                '.modal-container .close'
              ];
              
              for (const selector of modalCloseSelectors) {
                const closeBtn = document.querySelector(selector);
                if (closeBtn) {
                  console.log(`Fechando modal com seletor: ${selector}`);
                  closeBtn.click();
                  return true;
                }
              }
              
              const modal = document.querySelector('.modal-container, .modal');
              if (modal) {
                console.log('Clicando fora do modal para fechar');
                modal.style.display = 'none';
                return true;
              }
              
              return false;
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(`✅ Modais fechados antes de ${sectionName}`);
          } catch (closeError) {
            console.log(`⚠️ Erro ao fechar modais:`, closeError.message);
          }
          
          // Clicar no botão Programa e Metodologia
          try {
            console.log(`🎯 Procurando e clicando no botão: ${sectionName}`);
            await new Promise((r) => setTimeout(r, 1000));
            
            const buttonClicked = await page.evaluate((text) => {
              const strategies = [
                () => {
                  const btns = Array.from(document.querySelectorAll("button"));
                  return btns.find((btn) => btn.textContent.trim() === text);
                },
                () => {
                  const btns = Array.from(document.querySelectorAll("button"));
                  return btns.find((btn) => btn.textContent.trim().includes(text));
                },
                () => {
                  const btns = Array.from(document.querySelectorAll("button"));
                  const keywords = text.split(' ').filter(word => word.length > 2);
                  return btns.find((btn) => 
                    keywords.some(keyword => btn.textContent.trim().includes(keyword))
                  );
                }
              ];
              
              for (let i = 0; i < strategies.length; i++) {
                const button = strategies[i]();
                if (button) {
                  console.log(`Botão encontrado com estratégia ${i + 1}: ${text}`);
                  button.click();
                  return true;
                }
              }
              
              console.log(`Botão não encontrado: ${text}`);
              return false;
            }, sectionName);
            
            if (buttonClicked) {
              console.log(`✅ Botão ${sectionName} clicado com sucesso`);
              
              try {
                await page.waitForNavigation({ 
                  waitUntil: "networkidle2", 
                  timeout: 20000 
                });
                console.log(`✅ Navegação para ${sectionName} concluída`);
              } catch (navError) {
                console.log(`⚠️ Navegação não detectada para ${sectionName}, aguardando conteúdo...`);
                await new Promise((r) => setTimeout(r, 3000));
              }
            }
          } catch (navError) {
            console.log(`⚠️ Erro ao clicar no botão ${sectionName}:`, navError.message);
          }
          
          // Aguardar conteúdo carregar e expandir seções se necessário
          try {
            console.log(`🔄 Aguardando conteúdo de ${sectionName} carregar...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Tentar expandir seções colapsáveis (como "Disciplinas")
            await page.evaluate(() => {
              const expandableSelectors = [
                '.disciplinas',
                '.collapsible',
                '.expandable',
                '[data-toggle="collapse"]',
                '.accordion-toggle'
              ];
              
              for (const selector of expandableSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.toLowerCase().includes('disciplina')) {
                  console.log(`Expandindo seção: ${selector}`);
                  element.click();
                  return true;
                }
              }
              
              // Tentar clicar em elementos que contenham "Disciplinas"
              const allElements = Array.from(document.querySelectorAll('*'));
              const disciplinaElement = allElements.find(el => 
                el.textContent.trim().toLowerCase().includes('disciplinas') && 
                el.tagName !== 'SCRIPT' && 
                el.tagName !== 'STYLE'
              );
              
              if (disciplinaElement) {
                console.log('Clicando em elemento que contém "Disciplinas"');
                disciplinaElement.click();
                return true;
              }
              
              return false;
            });
            
            // Aguardar expansão
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(`✅ Conteúdo de ${sectionName} preparado`);
          } catch (expandError) {
            console.log(`⚠️ Erro ao expandir conteúdo:`, expandError.message);
          }
          
        } else {
          console.log(`🔄 Clicando no botão para ${sectionName}...`);
          
          // IMPORTANTE: Fechar qualquer modal aberto antes de navegar para outras seções
          try {
            console.log(`🔒 Fechando modais abertos antes de ${sectionName}...`);
            await page.evaluate(() => {
              // Tentar fechar modais comuns
              const modalCloseSelectors = [
                '.modal-close',
                '.modal .close',
                '.modal-header .close',
                '[data-dismiss="modal"]',
                '.modal-backdrop',
                '.modal-container .close'
              ];
              
              for (const selector of modalCloseSelectors) {
                const closeBtn = document.querySelector(selector);
                if (closeBtn) {
                  console.log(`Fechando modal com seletor: ${selector}`);
                  closeBtn.click();
                  return true;
                }
              }
              
              // Se não encontrar botão de fechar, tentar clicar fora do modal
              const modal = document.querySelector('.modal-container, .modal');
              if (modal) {
                console.log('Clicando fora do modal para fechar');
                modal.style.display = 'none';
                return true;
              }
              
              return false;
            });
            
            // Aguardar modal fechar
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(`✅ Modais fechados antes de ${sectionName}`);
          } catch (closeError) {
            console.log(`⚠️ Erro ao fechar modais:`, closeError.message);
          }
          
          // Clica no botão da seção com lógica mais robusta e aguarda navegação
          try {
            console.log(`🎯 Procurando e clicando no botão: ${sectionName}`);
            
            // Primeiro, aguardar um pouco para garantir que a página está estável
            await new Promise((r) => setTimeout(r, 1000));
            
            const buttonClicked = await page.evaluate((text) => {
              // Tentar múltiplas estratégias para encontrar o botão
              const strategies = [
                // Estratégia 1: Busca exata
                () => {
                  const btns = Array.from(document.querySelectorAll("button"));
                  return btns.find((btn) => btn.textContent.trim() === text);
                },
                // Estratégia 2: Busca parcial
                () => {
                  const btns = Array.from(document.querySelectorAll("button"));
                  return btns.find((btn) => btn.textContent.trim().includes(text));
                },
                // Estratégia 3: Busca por palavras-chave
                () => {
                  const btns = Array.from(document.querySelectorAll("button"));
                  const keywords = text.split(' ').filter(word => word.length > 2);
                  return btns.find((btn) => 
                    keywords.some(keyword => btn.textContent.trim().includes(keyword))
                  );
                }
              ];
              
              for (let i = 0; i < strategies.length; i++) {
                const button = strategies[i]();
                if (button) {
                  console.log(`Botão encontrado com estratégia ${i + 1}: ${text}`);
                  button.click();
                  return true;
                }
              }
              
              console.log(`Botão não encontrado: ${text}`);
              return false;
            }, sectionName);
            
            if (buttonClicked) {
              console.log(`✅ Botão ${sectionName} clicado com sucesso`);
              
              // Aguardar navegação e carregamento do conteúdo
              try {
                await page.waitForNavigation({ 
                  waitUntil: "networkidle2", 
                  timeout: 20000 
                });
                console.log(`✅ Navegação para ${sectionName} concluída`);
              } catch (navError) {
                console.log(`⚠️ Navegação não detectada para ${sectionName}, aguardando conteúdo...`);
                await new Promise((r) => setTimeout(r, 3000));
              }
            } else {
              console.log(`❌ Não foi possível clicar no botão ${sectionName}`);
            }
          } catch (navError) {
            console.log(`⚠️ Erro ao clicar no botão ${sectionName}:`, navError.message);
          }
        }

        // Para "Programa e Metodologia", usar EXATAMENTE a mesma lógica do sistema original
        if (sectionName === 'Programa e Metodologia') {
          console.log(`📸 Capturando seção: ${sectionName}`);
          
          // Aguardar entre cada seção (igual ao original)
          await new Promise((r) => setTimeout(r, 1000));

          const nextNumber = getNextSequentialNumber(sectionNumber, outputFolder);
          const filename = `${sectionNumber}.${nextNumber} - Atualizado ${dateStr} - ${sectionName}.png`;

          try {
            // Verifica se a página ainda está conectada (igual ao original)
            if (page.isClosed()) {
              console.error(`❌ Página foi fechada durante captura de ${sectionName}`);
              return null;
            }

            // Clica no botão da seção com tratamento de erro melhorado (igual ao original)
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
                }, sectionName),
              ]);
            } catch (navError) {
              console.log(`⚠️ Erro de navegação para ${sectionName}, continuando...`);
            }

            // Espera o conteúdo aparecer com timeout maior (igual ao original)
            try {
              await page.waitForSelector('.turma-wrapper-content', {
                visible: true,
                timeout: 15000,
              });
              await new Promise((r) => setTimeout(r, 1000));
            } catch (selectorError) {
              console.log(`⚠️ Seletor .turma-wrapper-content não encontrado para ${sectionName}`);
              return null;
            }

            // Esconde banners de cookies antes de cada screenshot (igual ao original)
            await hideCookieBanners(page);

            // Captura usando elemento específico (igual ao original)
            const content = await page.$('.turma-wrapper-content');
            if (content) {
              try {
                await content.screenshot({ path: path.join(outputFolder, filename) });
                console.log(`✅ Screenshot saved: ${filename}`);
                return filename;
              } catch (screenshotError) {
                console.error(`❌ Erro ao salvar screenshot para ${sectionName}: ${screenshotError.message}`);
                return null;
              }
            } else {
              console.error(`❌ Content not found for section: ${sectionName}`);
              return null;
            }
          } catch (error) {
            console.error(`❌ Error capturing section ${sectionName}:`, error.message);
            return null;
          }
        }

        // Para "Objetivos e Qualificações", usar estratégia de recarregamento da página
        if (sectionName === 'Objetivos e Qualificações') {
          console.log(`📸 Capturando seção: ${sectionName}`);
          
          const nextNumber = getNextSequentialNumber(sectionNumber, outputFolder);
          const filename = `${sectionNumber}.${nextNumber} - Atualizado ${dateStr} - ${sectionName}.png`;

          try {
            // Verifica se a página ainda está conectada
            if (page.isClosed()) {
              console.error(`❌ Página foi fechada durante captura de ${sectionName}`);
              return null;
            }

            // ESTRATÉGIA RADICAL: Recarregar a página para garantir estado limpo
            console.log(`🔄 Recarregando página para garantir estado limpo...`);
            await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log(`✅ Página recarregada`);

            // Esconder banners de cookies após recarregamento
            await hideCookieBanners(page);

            // Clicar no botão da seção (igual ao sistema original)
            console.log(`🎯 Clicando no botão ${sectionName}...`);
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
                }, sectionName),
              ]);
            } catch (navError) {
              console.log(`⚠️ Erro de navegação para ${sectionName}, continuando...`);
            }

            // Aguardar carregamento do conteúdo
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Espera o conteúdo aparecer
            try {
              await page.waitForSelector('.turma-wrapper-content', {
                visible: true,
                timeout: 15000,
              });
              await new Promise((r) => setTimeout(r, 2000));
            } catch (selectorError) {
              console.log(`⚠️ Seletor .turma-wrapper-content não encontrado para ${sectionName}`);
              return null;
            }

            // Esconde banners de cookies antes de cada screenshot
            await hideCookieBanners(page);

            // Captura usando elemento específico (igual ao original)
            const content = await page.$('.turma-wrapper-content');
            if (content) {
              try {
                await content.screenshot({ path: path.join(outputFolder, filename) });
                console.log(`✅ Screenshot saved: ${filename}`);
                return filename;
              } catch (screenshotError) {
                console.error(`❌ Erro ao salvar screenshot para ${sectionName}: ${screenshotError.message}`);
                return null;
              }
            } else {
              console.error(`❌ Content not found for section: ${sectionName}`);
              return null;
            }
          } catch (error) {
            console.error(`❌ Error capturing section ${sectionName}:`, error.message);
            return null;
          }
        }

        // Para "Modalidade de Ensino", já foi capturado acima, não precisa continuar
        if (sectionName === 'Modalidade de Ensino') {
          console.log(`ℹ️ ${sectionName} já foi capturado acima, finalizando...`);
          return null;
        }

        // Espera o conteúdo correto aparecer com verificação específica
        let contentLoaded = false;
        const maxAttempts = 5;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            console.log(`🔄 Tentativa ${attempt}/${maxAttempts} para carregar ${sectionName}...`);
            
            // Aguardar um pouco antes de tentar novamente
            if (attempt > 1) {
              await new Promise((r) => setTimeout(r, 3000));
            }
            
            await page.waitForSelector(selector, {
              visible: true,
              timeout: 15000,
            });
            
            // Verificar se o conteúdo correto foi carregado baseado na seção
            const isCorrectContent = await page.evaluate((sel, section) => {
              const element = document.querySelector(sel);
              if (!element) return false;
              
              const text = element.textContent.toLowerCase();
              console.log(`Verificando conteúdo para ${section}:`, text.substring(0, 100));
              
              // Palavras-chave específicas para cada seção
              const keywords = {
                'Sobre o Curso': ['sobre', 'curso', 'especialização', 'objetivo'],
                'Modalidade de Ensino': ['modalidade', 'híbrido', 'presencial', 'online'],
                'Selecionar uma Turma': ['turma', 'selecionar', 'unidade', 'paulista'],
                'Programa e Metodologia': ['programa', 'metodologia', 'disciplina', 'módulo'],
                'Objetivos e Qualificações': ['objetivo', 'qualificação', 'competência'],
                'Corpo Docente': ['docente', 'professor', 'coordenador'],
                'Cronograma de Aulas': ['cronograma', 'aula', 'data', 'horário'],
                'Local e Horário': ['local', 'horário', 'endereço', 'unidade'],
                'Valor do Curso': ['valor', 'preço', 'investimento', 'parcela'],
                'Perfil do Aluno': ['perfil', 'aluno', 'candidato', 'público'],
                'Processo Seletivo': ['processo', 'seletivo', 'inscrição', 'matrícula'],
                'Perguntas Frequentes': ['pergunta', 'frequente', 'faq', 'dúvida']
              };
              
              const sectionKeywords = keywords[section] || [];
              const hasCorrectKeywords = sectionKeywords.some(keyword => text.includes(keyword));
              
              return hasCorrectKeywords && text.length > 20;
            }, selector, sectionName);
            
            if (isCorrectContent) {
              contentLoaded = true;
              console.log(`✅ Conteúdo correto de ${sectionName} carregado com sucesso`);
              break;
            } else {
              console.log(`⚠️ Conteúdo incorreto para ${sectionName} na tentativa ${attempt}`);
              
              // Se não é o conteúdo correto, tentar clicar novamente no botão
              if (attempt < maxAttempts) {
                console.log(`🔄 Tentando clicar novamente no botão ${sectionName}...`);
                await page.evaluate((text) => {
                  const btns = Array.from(document.querySelectorAll("button"));
                  const target = btns.find((btn) => btn.textContent.trim().includes(text));
                  if (target) {
                    target.click();
                  }
                }, sectionName);
                await new Promise((r) => setTimeout(r, 2000));
              }
            }
          } catch (selectorError) {
            console.log(`⚠️ Tentativa ${attempt} falhou para ${sectionName}:`, selectorError.message);
          }
        }
        
        if (!contentLoaded) {
          console.log(`⚠️ Conteúdo correto de ${sectionName} não carregou após ${maxAttempts} tentativas`);
        }

        // Verificação final antes da captura
        if (!contentLoaded) {
          console.log(`⚠️ Tentando captura mesmo sem conteúdo correto para ${sectionName}`);
        }
        
        // Aguardar um pouco mais para garantir estabilidade
        await new Promise((r) => setTimeout(r, 1000));

        // IMPORTANTE: Verificar e fechar modais antes da captura final
        try {
          console.log(`🔍 Verificando se há modais abertos antes de capturar ${sectionName}...`);
          const hasOpenModal = await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal-container, .modal, .modal-backdrop');
            return modals.length > 0;
          });
          
          if (hasOpenModal) {
            console.log(`⚠️ Modal ainda aberto para ${sectionName}, fechando...`);
            await page.evaluate(() => {
              // Forçar fechamento de todos os modais
              const modals = document.querySelectorAll('.modal-container, .modal, .modal-backdrop');
              modals.forEach(modal => {
                modal.style.display = 'none';
                modal.remove();
              });
              
              // Remover backdrop se existir
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) {
                backdrop.remove();
              }
            });
            
            // Aguardar modal fechar completamente
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(`✅ Modal fechado antes de capturar ${sectionName}`);
          }
        } catch (modalCheckError) {
          console.log(`⚠️ Erro ao verificar modais:`, modalCheckError.message);
        }

        // Esconde banners de cookies antes do screenshot
        await hideCookieBanners(page);

        const content = await page.$(selector);
        
        const nextNumber = getNextSequentialNumber(sectionNumber, outputFolder);
        const filename = `${sectionNumber}.${nextNumber} - Atualizado ${dateStr} - ${sectionName}.png`;

        // Log do conteúdo atual para debug
        if (content) {
          const currentContent = await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            return element ? element.textContent.substring(0, 200) : 'Elemento não encontrado';
          }, selector);
          console.log(`📄 Conteúdo atual para ${sectionName}:`, currentContent);
        }

        // Tentar múltiplas estratégias de captura
        if (content) {
          try {
            // Estratégia 1: Capturar elemento específico
            await content.screenshot({ path: path.join(outputFolder, filename) });
            console.log(`✅ ${sectionName} capturado (elemento): ${filename}`);
            return filename;
          } catch (screenshotError) {
            console.log(`⚠️ Erro ao capturar elemento ${sectionName}:`, screenshotError.message);
          }
        }
        
        // Estratégia 2: Capturar tela inteira
        try {
          await page.screenshot({ path: path.join(outputFolder, filename), fullPage: true });
          console.log(`✅ ${sectionName} capturado (tela inteira): ${filename}`);
          return filename;
        } catch (fallbackError) {
          console.error(`❌ Erro no fallback ${sectionName}:`, fallbackError.message);
          return null;
        }
      } catch (error) {
        console.log(`❌ Erro ao capturar ${sectionName}:`, error.message);
        return null;
      }
    };

    // Capturar todos os prints selecionados
    const capturedFiles = [];
    
    const printsToCapture = [
      { name: "Sobre o Curso", number: "01", selected: sobreCurso },
      { name: "Modalidade de Ensino", number: "02", selected: modalidadeEnsino },
      { name: "Selecionar uma Turma", number: "03", selected: selecionarTurma },
      { name: "Programa e Metodologia", number: "04", selected: programaMetodologia },
      { name: "Objetivos e Qualificações", number: "05", selected: objetivosQualificacoes },
      { name: "Corpo Docente", number: "06", selected: corpoDocente },
      { name: "Cronograma de Aulas", number: "07", selected: cronogramaAulas },
      { name: "Local e Horário", number: "08", selected: localHorario },
      { name: "Valor do Curso", number: "09", selected: valorCurso },
      { name: "Perfil do Aluno", number: "10", selected: perfilAluno },
      { name: "Processo Seletivo", number: "11", selected: processoSeletivo },
      { name: "Perguntas Frequentes", number: "12", selected: perguntasFrequentes }
    ];

    for (const print of printsToCapture) {
      const filename = await capturePrint(print.name, print.number, print.selected);
      if (filename) {
        capturedFiles.push(filename);
      }
    }

    console.log(`Retornando resposta com ${capturedFiles.length} arquivos atualizados`);
    res.json({ 
      success: true, 
      message: `${capturedFiles.length} prints atualizados com sucesso`,
      updatedFiles: capturedFiles,
      folder: folderName
    });

  } catch (error) {
    console.error("Erro na atualização:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
