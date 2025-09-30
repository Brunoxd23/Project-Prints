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

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // Adicionar middleware para parsing de JSON

// Rotas de gerenciamento de semestres
app.use("/api/semesters", semestersRouter);

// Rotas para os cursos
app.use("/api", dependenciaQuimicaRouter);
app.use("/api", sustentabilidadeInovacaoRouter);

// Endpoint para listar semestres disponíveis para um curso específico
app.get("/listar-semestres/:pasta", (req, res) => {
  const { pasta } = req.params;
  const publicDir = path.join(__dirname, "public");

  try {
    // Lista todos os diretórios no public
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
    .filter(
      (f) =>
        f.startsWith("Pratica_Estendida_") ||
        f.startsWith("Paliativos_Quinzenal_") ||
        f.startsWith("Paliativos_Semanal_") ||
        f.startsWith("Dependencia_Quimica_") ||
        f.startsWith("Sustentabilidade_ESG_") ||
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
  const outputFolder = path.join(__dirname, "public", folderName);
  
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
    if (pasta.includes("Paliativos_Quinzenal")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10691&cidade=sp";
    } else if (pasta.includes("Pratica_Estendida")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10690&cidade=sp";
    } else if (pasta.includes("Paliativos_Semanal")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10693&cidade=sp";
    } else if (pasta.includes("Paliativos_RJ")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10923&cidade=rj";
    } else if (pasta.includes("Paliativos_GO")) {
      baseUrl = "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10939&cidade=go";
    } else if (pasta.includes("Sustentabilidade")) {
      baseUrl = "https://ensino.einstein.br/pos_gt_sustentabilidade_lider_inovacao_esg_p14832/p?sku=10905&cidade=sp";
    } else if (pasta.includes("Dependencia")) {
      baseUrl = "https://ensino.einstein.br/pos_dependencia_quimica_p5174/p?sku=10697&cidade=sp";
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
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
