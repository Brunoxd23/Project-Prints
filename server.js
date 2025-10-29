const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { launchBrowser } = require("./utils/puppeteerLaunch");
const {
  getBasePath,
  setBasePath,
  ensureBaseDir,
  getBrowserExecutablePath,
  setBrowserExecutablePath,
} = require("./utils/config");

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

// Servir arquivos da pasta configurada (basePath) com remount dinâmico
let printsStaticMiddleware = null;
function remountPrintsStatic() {
  try {
    const base = ensureBaseDir();
    // Remove o middleware anterior, se existir
    if (printsStaticMiddleware && app._router && app._router.stack) {
      const stack = app._router.stack;
      const idx = stack.findIndex(
        (layer) => layer.handle === printsStaticMiddleware
      );
      if (idx !== -1) {
        stack.splice(idx, 1);
      }
    }
    printsStaticMiddleware = express.static(base);
    app.use("/prints", printsStaticMiddleware);
    console.log(`📁 Pasta de prints montada em /prints -> ${base}`);
  } catch (err) {
    console.error("❌ Falha ao montar pasta de prints:", err.message);
  }
}

// Monta inicialmente
remountPrintsStatic();

// Endpoints de configuração
app.get("/api/config/base-path", (req, res) => {
  return res.json({ basePath: getBasePath() });
});

app.post("/api/config/base-path", (req, res) => {
  const { basePath } = req.body || {};
  if (!basePath || typeof basePath !== "string") {
    return res.status(400).json({ error: "basePath inválido" });
  }

  // Tentar criar/validar diretório antes de salvar a configuração
  try {
    fs.mkdirSync(basePath, { recursive: true });
  } catch (err) {
    const code = err && err.code ? err.code : "UNKNOWN";
    const blocked = code === "EPERM" || code === "EACCES";
    return res.status(blocked ? 403 : 500).json({
      error: blocked
        ? "Sem permissão para gravar na pasta selecionada. Escolha uma pasta fora de Documentos/Área de Trabalho ou permita o app no Controle de Acesso a Pastas do Windows."
        : `Erro ao preparar a pasta: ${err.message}`,
      code,
    });
  }

  setBasePath(basePath);
  remountPrintsStatic();
  return res.json({ basePath: getBasePath() });
});

// Endpoints para configurar navegador do Puppeteer (opcional)
app.get("/api/config/browser-executable", (req, res) => {
  return res.json({ browserExecutablePath: getBrowserExecutablePath() });
});

app.post("/api/config/browser-executable", (req, res) => {
  const { path: exePath } = req.body || {};
  if (exePath && typeof exePath !== "string") {
    return res.status(400).json({ error: "Parâmetro 'path' inválido" });
  }
  if (exePath) {
    if (!fs.existsSync(exePath)) {
      return res.status(400).json({ error: "Arquivo não encontrado" });
    }
  }
  const saved = setBrowserExecutablePath(exePath || null);
  return res.json({ browserExecutablePath: saved });
});

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
  const baseDir = getBasePath();

  try {
    // Mapear pasta para curso e subcurso
    const getRouteMapping = (routePath) => {
      const routeMap = {
        CP_Quinzenal_Pratica: {
          course: "Cuidados Paliativos",
          subcourse: "Unidade Paulista | Quinzenal Prática Estendida",
        },
        CP_Pratica_Estendida: {
          course: "Cuidados Paliativos",
          subcourse: "Unidade Paulista | Quinzenal Prática Estendida",
        },
        CP_Quinzenal: {
          course: "Cuidados Paliativos",
          subcourse: "Unidade Paulista | Quinzenal",
        },
        CP_Semanal: {
          course: "Cuidados Paliativos",
          subcourse: "Unidade Paulista | Semanal",
        },
        CP_RJ_Mensal: {
          course: "Cuidados Paliativos",
          subcourse: "Unidade Rio de Janeiro | Mensal",
        },
        CP_GO_Mensal: {
          course: "Cuidados Paliativos",
          subcourse: "Unidade Goiânia | Mensal",
        },
        DQ_Mensal: {
          course: "Dependência Química",
          subcourse: "Unidade Paulista | Mensal",
        },
        BSI_Mensal: {
          course: "Bases da Saúde Integrativa e Bem-Estar",
          subcourse: "Unidade Paulista | Mensal",
        },
        IFS_Mensal: {
          course: "Gestão de Infraestrutura e Facilities em Saúde",
          subcourse: "Unidade Paulista | Mensal",
        },
        GIF_Mensal: {
          course: "Gestão de Infraestrutura e Facilities em Saúde",
          subcourse: "Unidade Paulista II | Mensal",
        },
        PM_Mensal: {
          course: "Psiquiatria Multiprofissional",
          subcourse: "Unidade Paulista | Mensal",
        },
        SI_Mensal: {
          course: "Sustentabilidade: Liderança e Inovação em ESG",
          subcourse: "Unidade Paulista | Mensal",
        },
        SLI_Quinzenal: {
          course: "Sustentabilidade: Liderança e Inovação em ESG",
          subcourse: "Unidade Paulista II | Quinzenal",
        },
      };
      return (
        routeMap[routePath] || {
          course: "Cuidados Paliativos",
          subcourse: "Unidade Paulista | Quinzenal",
        }
      );
    };

    const getCourseFolderName = (courseName, subcourseName) => {
      const courseMap = {
        "Cuidados Paliativos": "Pós-graduação em Cuidados Paliativos",
        "Bases da Saúde Integrativa e Bem-Estar":
          "Pós-graduação em Bases da Saúde Integrativa e Bem-Estar",
        "Dependência Química": "Pós-graduação em Dependência Química",
        "Gestão de Infraestrutura e Facilities em Saúde":
          "Pós-graduação em Gestão de Infraestrutura e Facilities em Saúde",
        "Psiquiatria Multiprofissional":
          "Pós-graduação em Psiquiatria Multiprofissional",
        "Sustentabilidade: Liderança e Inovação em ESG":
          "Pós-graduação em Sustentabilidade - Liderança e Inovação em ESG",
      };

      const subcourseMap = {
        "Unidade Paulista | Quinzenal Prática Estendida": "Prática Estendida",
        "Unidade Paulista | Quinzenal": "Quinzenal",
        "Unidade Paulista II | Quinzenal": "Quinzenal",
        "Unidade Rio de Janeiro | Mensal": "RJ-Mensal",
        "Unidade Goiânia | Mensal": "GO-Mensal",
        "Unidade Paulista | Semanal": "Semanal",
        "Unidade Paulista | Mensal": "Mensal",
        "Unidade Paulista II | Mensal": "Mensal",
      };

      const fullCourseName = courseMap[courseName] || courseName;
      const fullSubcourseName = subcourseMap[subcourseName] || subcourseName;

      return {
        courseFolder: fullCourseName,
        subcourseFolder: fullSubcourseName,
      };
    };

    console.log(`🔍 DEBUG - pasta recebida: "${pasta}"`);
    const routeMapping = getRouteMapping(pasta);
    console.log(`🔍 DEBUG - routeMapping:`, routeMapping);
    const courseInfo = getCourseFolderName(
      routeMapping.course,
      routeMapping.subcourse
    );
    console.log(`🔍 DEBUG - courseInfo:`, courseInfo);
    const courseDir = path.join(baseDir, courseInfo.courseFolder);

    console.log(`🔍 Procurando semestres em: ${courseDir}`);
    console.log(`🔍 DEBUG - Diretório existe? ${fs.existsSync(courseDir)}`);

    // Verificar se o diretório do curso existe
    if (!fs.existsSync(courseDir)) {
      console.log(`❌ Diretório do curso não encontrado: ${courseDir}`);
      return res.json({ semesters: [] });
    }

    // Lista todos os diretórios na pasta do curso
    const allDirs = fs
      .readdirSync(courseDir)
      .filter((f) => fs.statSync(path.join(courseDir, f)).isDirectory());

    console.log(`📁 Diretórios encontrados:`, allDirs);

    // Filtra apenas os diretórios que começam com o nome do subcurso e têm o padrão de semestre
    const semesterDirs = allDirs
      .filter((dir) => {
        const startsWithSubcourse = dir.startsWith(
          `${courseInfo.subcourseFolder} `
        );
        console.log(`🔍 Verificando pasta: "${dir}"`);
        console.log(
          `   - Começa com "${courseInfo.subcourseFolder} "? ${startsWithSubcourse}`
        );
        return startsWithSubcourse;
      })
      .map((dir) => {
        // Extrai o semestre (YYYY-N) do nome da pasta
        console.log(`🔍 Processando pasta: "${dir}"`);
        console.log(`   - Subcourse folder: "${courseInfo.subcourseFolder}"`);

        // Verificar se a pasta começa com o nome do subcurso + espaço
        const expectedPrefix = `${courseInfo.subcourseFolder} `;
        console.log(`   - Prefixo esperado: "${expectedPrefix}"`);

        if (dir.startsWith(expectedPrefix)) {
          const semesterPart = dir.substring(expectedPrefix.length);
          console.log(`   - Parte do semestre extraída: "${semesterPart}"`);

          // Verificar se corresponde ao padrão YYYY-N
          const semesterMatch = semesterPart.match(/^(\d{4}-\d+)$/);
          console.log(`   - Match do semestre:`, semesterMatch);

          if (semesterMatch) {
            console.log(`   ✅ Semestre encontrado: ${semesterMatch[1]}`);
            return semesterMatch[1];
          } else {
            console.log(
              `   ❌ Parte "${semesterPart}" não corresponde ao padrão YYYY-N`
            );
          }
        } else {
          console.log(`   ❌ Pasta não começa com "${expectedPrefix}"`);
        }

        return null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Ordena por ano (decrescente) e depois por semestre (decrescente)
        const [yearA, semA] = a.split("-").map(Number);
        const [yearB, semB] = b.split("-").map(Number);
        return yearB - yearA || semB - semA;
      });

    console.log(`📅 Semestres encontrados:`, semesterDirs);

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

  console.log(`🔍 DEBUG - listar-prints chamado com pasta: "${pasta}"`);

  // Mapear pasta para curso e subcurso (mesmo mapeamento da rota listar-semestres)
  const getRouteMapping = (routePath) => {
    const routeMap = {
      CP_Quinzenal_Pratica: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Paulista | Quinzenal Prática Estendida",
      },
      CP_Pratica_Estendida: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Paulista | Quinzenal Prática Estendida",
      },
      CP_Quinzenal: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Paulista | Quinzenal",
      },
      CP_Semanal: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Paulista | Semanal",
      },
      CP_RJ_Mensal: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Rio de Janeiro | Mensal",
      },
      CP_GO_Mensal: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Goiânia | Mensal",
      },
      DQ_Mensal: {
        course: "Dependência Química",
        subcourse: "Unidade Paulista | Mensal",
      },
      BSI_Mensal: {
        course: "Bases da Saúde Integrativa e Bem-Estar",
        subcourse: "Unidade Paulista | Mensal",
      },
      IFS_Mensal: {
        course: "Gestão de Infraestrutura e Facilities em Saúde",
        subcourse: "Unidade Paulista | Mensal",
      },
      GIF_Mensal: {
        course: "Gestão de Infraestrutura e Facilities em Saúde",
        subcourse: "Unidade Paulista II | Mensal",
      },
      PM_Mensal: {
        course: "Psiquiatria Multiprofissional",
        subcourse: "Unidade Paulista | Mensal",
      },
      SI_Mensal: {
        course: "Sustentabilidade: Liderança e Inovação em ESG",
        subcourse: "Unidade Paulista | Mensal",
      },
      SLI_Quinzenal: {
        course: "Sustentabilidade: Liderança e Inovação em ESG",
        subcourse: "Unidade Paulista II | Quinzenal",
      },
    };
    return (
      routeMap[routePath] || {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Paulista | Quinzenal",
      }
    );
  };

  const getCourseFolderName = (courseName, subcourseName) => {
    const courseMap = {
      "Cuidados Paliativos": "Pós-graduação em Cuidados Paliativos",
      "Bases da Saúde Integrativa e Bem-Estar":
        "Pós-graduação em Bases da Saúde Integrativa e Bem-Estar",
      "Dependência Química": "Pós-graduação em Dependência Química",
      "Gestão de Infraestrutura e Facilities em Saúde":
        "Pós-graduação em Gestão de Infraestrutura e Facilities em Saúde",
      "Psiquiatria Multiprofissional":
        "Pós-graduação em Psiquiatria Multiprofissional",
      "Sustentabilidade: Liderança e Inovação em ESG":
        "Pós-graduação em Sustentabilidade - Liderança e Inovação em ESG",
    };

    const subcourseMap = {
      "Unidade Paulista | Quinzenal Prática Estendida": "Prática Estendida",
      "Unidade Paulista | Quinzenal": "Quinzenal",
      "Unidade Paulista II | Quinzenal": "Quinzenal",
      "Unidade Rio de Janeiro | Mensal": "RJ-Mensal",
      "Unidade Goiânia | Mensal": "GO-Mensal",
      "Unidade Paulista | Semanal": "Semanal",
      "Unidade Paulista | Mensal": "Mensal",
      "Unidade Paulista II | Mensal": "Mensal",
    };

    const fullCourseName = courseMap[courseName] || courseName;
    const fullSubcourseName = subcourseMap[subcourseName] || subcourseName;

    return {
      courseFolder: fullCourseName,
      subcourseFolder: fullSubcourseName,
    };
  };

  // Extrair curso e semestre da pasta (formato: CP_Pratica_Estendida_2025-6)
  const parts = pasta.split("_");
  console.log(`🔍 DEBUG - parts:`, parts);

  if (parts.length < 3) {
    console.log(`❌ Formato de pasta inválido: "${pasta}"`);
    return res.status(400).json({ error: "Formato de pasta inválido" });
  }

  const cursoPart = parts.slice(0, -1).join("_"); // CP_Pratica_Estendida
  const semesterPart = parts[parts.length - 1]; // 2025-6

  console.log(
    `🔍 DEBUG - cursoPart: "${cursoPart}", semesterPart: "${semesterPart}"`
  );

  const routeMapping = getRouteMapping(cursoPart);
  console.log(`🔍 DEBUG - routeMapping:`, routeMapping);

  const courseInfo = getCourseFolderName(
    routeMapping.course,
    routeMapping.subcourse
  );
  console.log(`🔍 DEBUG - courseInfo:`, courseInfo);

  const baseDir = getBasePath();
  const courseDir = path.join(baseDir, courseInfo.courseFolder);
  const semesterFolderPath = path.join(
    courseDir,
    `${courseInfo.subcourseFolder} ${semesterPart}`
  );

  console.log(`🔍 DEBUG - baseDir: ${baseDir}`);
  console.log(`🔍 DEBUG - courseDir: ${courseDir}`);
  console.log(`🔍 DEBUG - semesterFolderPath: ${semesterFolderPath}`);
  console.log(
    `🔍 DEBUG - Diretório existe? ${fs.existsSync(semesterFolderPath)}`
  );

  if (
    !fs.existsSync(semesterFolderPath) ||
    !fs.statSync(semesterFolderPath).isDirectory()
  ) {
    console.log(`❌ Pasta não encontrada: ${semesterFolderPath}`);
    return res.status(404).json({ error: "Pasta não encontrada" });
  }

  const prints = fs
    .readdirSync(semesterFolderPath)
    .filter((f) => f.endsWith(".png"))
    .map((f) => {
      // Criar um caminho relativo simples
      const courseFolder = courseInfo.courseFolder;
      const semesterFolder = `${courseInfo.subcourseFolder} ${semesterPart}`;
      const printPath = `/prints/${courseFolder}/${semesterFolder}/${f}`;
      console.log(`🔍 DEBUG - Print path gerado: ${printPath}`);
      return printPath;
    });

  console.log(`🔍 DEBUG - Prints encontrados: ${prints.length}`);
  console.log(`🔍 DEBUG - Prints:`, prints);

  res.json(prints);
});
// Endpoint para listar todas as pastas de prints disponíveis
app.get("/listar-pastas", (req, res) => {
  const publicDir = getBasePath();
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
app.use("/api", cuidadosPaliativosRoutes);

// =========================
//   ROTA DE ATUALIZAÇÃO DE PRINTS
// =========================

// Rota para atualizar prints específicos (08 e 09) de um semestre
app.post("/update-prints/:pasta/:semester", async (req, res) => {
  const { pasta, semester } = req.params;
  const { localHorario = true, valorCurso = true } = req.body; // Valores padrão se não especificados
  const folderName = `${pasta}_${semester}`;
  const outputFolder = path.join(getBasePath(), folderName);

  console.log(`Iniciando atualização de prints para ${pasta}/${semester}`);
  console.log(
    `Opções selecionadas: Local e Horário: ${localHorario}, Valor do Curso: ${valorCurso}`
  );

  // Verificar se a pasta existe
  if (!fs.existsSync(outputFolder)) {
    return res.status(404).json({ error: "Pasta do semestre não encontrada" });
  }

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Determinar URL base baseada na pasta do curso com parâmetros corretos
    let baseUrl;
    if (pasta.includes("CP_Quinzenal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10691&cidade=sp";
    } else if (pasta.includes("CP_Pratica_Estendida")) {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10690&cidade=sp";
    } else if (pasta.includes("CP_Semanal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10693&cidade=sp";
    } else if (pasta.includes("CP_RJ")) {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10923&cidade=rj";
    } else if (pasta.includes("CP_GO")) {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10939&cidade=go";
    } else if (pasta.includes("SLI_Quinzenal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_gt_sustentabilidade_lider_inovacao_esg_p14832/p?sku=10905&cidade=sp";
    } else if (pasta.includes("DQ_Mensal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_dependencia_quimica_p5174/p?sku=10697&cidade=sp";
    } else if (pasta.includes("GIF_Mensal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_gt_infraestrutura_facilities_saude_p14827/p?sku=10906&cidade=sp";
    } else if (pasta.includes("PM_Mensal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_psiquiatria_multiprofissional_p4542/p?sku=10771&cidade=sp";
    } else if (pasta.includes("BSI_Mensal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_bases_saude_integrativa_bem_estar_p0078/p?sku=10685&cidade=sp";
    } else {
      // URL padrão para outros cursos
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10691&cidade=sp";
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
          "button[contains(text(), 'Fechar')]",
        ];

        for (const selector of cookieSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              console.log(
                `✅ Cookie banner fechado usando seletor: ${selector}`
              );
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
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log("✅ Cookies tratados e página estabilizada");

    // Primeiro, selecionar uma turma (necessário para acessar as seções)
    console.log("Selecionando uma turma...");
    try {
      await page.waitForSelector(".seletor-container.turma-selecionada", {
        visible: true,
        timeout: 10000,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

        files.forEach((file) => {
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
    const dateStr = now.toLocaleDateString("pt-BR").replace(/\//g, "-"); // Formato DD-MM-YYYY

    // Capturar Local e Horário (08) - apenas se selecionado
    if (localHorario) {
      console.log("Capturando Local e Horário...");
      try {
        // Usar a mesma lógica do arquivo cuidadosPaliativos.js
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
          }, "Local e Horário"),
        ]);

        // Aguarda o conteúdo aparecer com timeout maior
        try {
          await page.waitForSelector(".turma-wrapper-content", {
            visible: true,
            timeout: 15000,
          });
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log("✅ Conteúdo Local e Horário carregado");
        } catch (selectorError) {
          console.log(
            "⚠️ Seletor .turma-wrapper-content não encontrado para Local e Horário:",
            selectorError.message
          );
          // Tentar continuar mesmo sem o seletor
        }

        const nextNumber08 = getNextSequentialNumber("08", outputFolder);
        const localHorarioFilename = `08.${nextNumber08} - Atualizado ${dateStr} - Local e Horario.png`;

        // Captura apenas o conteúdo da seção
        const content = await page.$(".turma-wrapper-content");
        if (content) {
          try {
            await content.screenshot({
              path: path.join(outputFolder, localHorarioFilename),
            });
            console.log(
              `✅ Local e Horário capturado: ${localHorarioFilename}`
            );
          } catch (screenshotError) {
            console.error(
              `❌ Erro ao salvar screenshot Local e Horário:`,
              screenshotError.message
            );
            // Tentar capturar a página inteira como fallback
            try {
              await page.screenshot({
                path: path.join(outputFolder, localHorarioFilename),
                fullPage: true,
              });
              console.log(
                `✅ Local e Horário capturado (fallback): ${localHorarioFilename}`
              );
            } catch (fallbackError) {
              console.error(
                `❌ Erro no fallback Local e Horário:`,
                fallbackError.message
              );
            }
          }
        } else {
          console.error(`❌ Content not found for section: Local e Horário`);
          // Tentar capturar a página inteira como fallback
          try {
            await page.screenshot({
              path: path.join(outputFolder, localHorarioFilename),
              fullPage: true,
            });
            console.log(
              `✅ Local e Horário capturado (fallback): ${localHorarioFilename}`
            );
          } catch (fallbackError) {
            console.error(
              `❌ Erro no fallback Local e Horário:`,
              fallbackError.message
            );
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
          }, "Valor do Curso"),
        ]);

        // Aguarda o conteúdo aparecer com timeout maior
        try {
          await page.waitForSelector(".turma-wrapper-content", {
            visible: true,
            timeout: 15000,
          });
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log("✅ Conteúdo Valor do Curso carregado");
        } catch (selectorError) {
          console.log(
            "⚠️ Seletor .turma-wrapper-content não encontrado para Valor do Curso:",
            selectorError.message
          );
          // Tentar continuar mesmo sem o seletor
        }

        const nextNumber09 = getNextSequentialNumber("09", outputFolder);
        const valorCursoFilename = `09.${nextNumber09} - Atualizado ${dateStr} - Valor do Curso.png`;

        // Captura apenas o conteúdo da seção
        const content = await page.$(".turma-wrapper-content");
        if (content) {
          try {
            await content.screenshot({
              path: path.join(outputFolder, valorCursoFilename),
            });
            console.log(`✅ Valor do Curso capturado: ${valorCursoFilename}`);
          } catch (screenshotError) {
            console.error(
              `❌ Erro ao salvar screenshot Valor do Curso:`,
              screenshotError.message
            );
            // Tentar capturar a página inteira como fallback
            try {
              await page.screenshot({
                path: path.join(outputFolder, valorCursoFilename),
                fullPage: true,
              });
              console.log(
                `✅ Valor do Curso capturado (fallback): ${valorCursoFilename}`
              );
            } catch (fallbackError) {
              console.error(
                `❌ Erro no fallback Valor do Curso:`,
                fallbackError.message
              );
            }
          }
        } else {
          console.error(`❌ Content not found for section: Valor do Curso`);
          // Tentar capturar a página inteira como fallback
          try {
            await page.screenshot({
              path: path.join(outputFolder, valorCursoFilename),
              fullPage: true,
            });
            console.log(
              `✅ Valor do Curso capturado (fallback): ${valorCursoFilename}`
            );
          } catch (fallbackError) {
            console.error(
              `❌ Erro no fallback Valor do Curso:`,
              fallbackError.message
            );
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
      const localHorarioFile = `08.${
        getNextSequentialNumber("08", outputFolder) - 1
      } - Atualizado ${dateStr} - Local e Horario.png`;
      if (fs.existsSync(path.join(outputFolder, localHorarioFile))) {
        updatedFiles.push(localHorarioFile);
        console.log(`✅ Arquivo Local e Horário encontrado`);
      } else {
        console.log(`❌ Arquivo Local e Horário não encontrado`);
      }
    }

    if (valorCurso) {
      const valorCursoFile = `09.${
        getNextSequentialNumber("09", outputFolder) - 1
      } - Atualizado ${dateStr} - Valor do Curso.png`;
      if (fs.existsSync(path.join(outputFolder, valorCursoFile))) {
        updatedFiles.push(valorCursoFile);
        console.log(`✅ Arquivo Valor do Curso encontrado`);
      } else {
        console.log(`❌ Arquivo Valor do Curso não encontrado`);
      }
    }

    console.log(
      `Retornando resposta com ${updatedFiles.length} arquivos atualizados`
    );
    res.json({
      success: true,
      message: "Prints atualizados com sucesso!",
      updatedFiles: updatedFiles,
    });
  } catch (error) {
    console.error("Erro ao atualizar prints:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      error: "Erro interno do servidor",
      details: error.message,
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
    perguntasFrequentes = false,
  } = req.body;

  // Resolver pasta real do semestre (estrutura por curso/subcurso)
  const mapRoute = (routePath) => {
    const routeMap = {
      CP_Quinzenal_Pratica: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Paulista | Quinzenal Prática Estendida",
      },
      CP_Pratica_Estendida: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Paulista | Quinzenal Prática Estendida",
      },
      CP_Quinzenal: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Paulista | Quinzenal",
      },
      CP_Semanal: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Paulista | Semanal",
      },
      CP_RJ_Mensal: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Rio de Janeiro | Mensal",
      },
      CP_GO_Mensal: {
        course: "Cuidados Paliativos",
        subcourse: "Unidade Goiânia | Mensal",
      },
      DQ_Mensal: {
        course: "Dependência Química",
        subcourse: "Unidade Paulista | Mensal",
      },
      BSI_Mensal: {
        course: "Bases da Saúde Integrativa e Bem-Estar",
        subcourse: "Unidade Paulista | Mensal",
      },
      IFS_Mensal: {
        course: "Gestão de Infraestrutura e Facilities em Saúde",
        subcourse: "Unidade Paulista | Mensal",
      },
      GIF_Mensal: {
        course: "Gestão de Infraestrutura e Facilities em Saúde",
        subcourse: "Unidade Paulista II | Mensal",
      },
      PM_Mensal: {
        course: "Psiquiatria Multiprofissional",
        subcourse: "Unidade Paulista | Mensal",
      },
      SI_Mensal: {
        course: "Sustentabilidade: Liderança e Inovação em ESG",
        subcourse: "Unidade Paulista | Mensal",
      },
      SLI_Quinzenal: {
        course: "Sustentabilidade: Liderança e Inovação em ESG",
        subcourse: "Unidade Paulista II | Quinzenal",
      },
    };
    return routeMap[routePath] || {
      course: "Cuidados Paliativos",
      subcourse: "Unidade Paulista | Quinzenal",
    };
  };

  const courseFolderMap = {
    "Cuidados Paliativos": "Pós-graduação em Cuidados Paliativos",
    "Bases da Saúde Integrativa e Bem-Estar":
      "Pós-graduação em Bases da Saúde Integrativa e Bem-Estar",
    "Dependência Química": "Pós-graduação em Dependência Química",
    "Gestão de Infraestrutura e Facilities em Saúde":
      "Pós-graduação em Gestão de Infraestrutura e Facilities em Saúde",
    "Psiquiatria Multiprofissional":
      "Pós-graduação em Psiquiatria Multiprofissional",
    "Sustentabilidade: Liderança e Inovação em ESG":
      "Pós-graduação em Sustentabilidade - Liderança e Inovação em ESG",
  };

  const subcourseFolderMap = {
    "Unidade Paulista | Quinzenal Prática Estendida": "Prática Estendida",
    "Unidade Paulista | Quinzenal": "Quinzenal",
    "Unidade Paulista II | Quinzenal": "Quinzenal",
    "Unidade Rio de Janeiro | Mensal": "RJ-Mensal",
    "Unidade Goiânia | Mensal": "GO-Mensal",
    "Unidade Paulista | Semanal": "Semanal",
    "Unidade Paulista | Mensal": "Mensal",
    "Unidade Paulista II | Mensal": "Mensal",
  };

  const mapping = mapRoute(pasta);
  const basePath = getBasePath();
  const courseDir = path.join(basePath, courseFolderMap[mapping.course] || mapping.course);
  const outputFolder = path.join(
    courseDir,
    `${subcourseFolderMap[mapping.subcourse] || mapping.subcourse} ${semester}`
  );

  console.log(
    `Iniciando atualização completa de prints para ${pasta}/${semester}`
  );
  console.log(`🗂️ Pasta resolvida: ${outputFolder}`);
  console.log(`Opções selecionadas:`, req.body);

  // Verificar se a pasta existe
  if (!fs.existsSync(outputFolder)) {
    return res.status(404).json({ error: "Pasta do semestre não encontrada" });
  }

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Determinar URL base baseada na pasta do curso
    let baseUrl;
    if (pasta.includes("CP_Quinzenal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10691&cidade=sp";
    } else if (pasta.includes("CP_Pratica_Estendida")) {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10690&cidade=sp";
    } else if (pasta.includes("CP_Semanal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10693&cidade=sp";
    } else if (pasta.includes("CP_RJ")) {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10923&cidade=rj";
    } else if (pasta.includes("CP_GO")) {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10939&cidade=go";
    } else if (pasta.includes("SLI_Quinzenal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_gt_sustentabilidade_lider_inovacao_esg_p14832/p?sku=10905&cidade=sp";
    } else if (pasta.includes("DQ_Mensal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_dependencia_quimica_p5174/p?sku=10697&cidade=sp";
    } else if (pasta.includes("GIF_Mensal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_gt_infraestrutura_facilities_saude_p14827/p?sku=10906&cidade=sp";
    } else if (pasta.includes("PM_Mensal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_psiquiatria_multiprofissional_p4542/p?sku=10771&cidade=sp";
    } else if (pasta.includes("BSI_Mensal")) {
      baseUrl =
        "https://ensino.einstein.br/pos_bases_saude_integrativa_bem_estar_p0078/p?sku=10685&cidade=sp";
    } else {
      baseUrl =
        "https://ensino.einstein.br/pos_cuidados_paliativos_p0081/p?sku=10691&cidade=sp";
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
          "button[contains(text(), 'Fechar')]",
        ];

        for (const selector of cookieSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              await button.click();
              console.log(
                `✅ Cookie banner fechado usando seletor: ${selector}`
              );
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
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log("✅ Cookies tratados e página estabilizada");

    // Selecionar uma turma
    console.log("Selecionando uma turma...");
    try {
      await page.waitForSelector(".seletor-container.turma-selecionada", {
        visible: true,
        timeout: 10000,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

        files.forEach((file) => {
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
    const dateStr = now.toLocaleDateString("pt-BR").replace(/\//g, "-");

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
          console.error(
            `❌ Página foi fechada durante captura de ${sectionName}`
          );
          return null;
        }

        // Determinar o seletor correto baseado na seção
        const getSelector = (section) => {
          if (section === "Sobre o Curso") {
            return ".sobre-section";
          } else if (section === "Selecionar uma Turma") {
            return ".seletor-container.turma-selecionada";
          } else if (section === "Modalidade de Ensino") {
            return ".modalidade-front";
          } else if (section === "Programa e Metodologia") {
            // Seletor específico para capturar todo o conteúdo de Programa e Metodologia
            return ".turma-wrapper-content, .programa-metodologia-content, .content-wrapper";
          } else if (section === "Objetivos e Qualificações") {
            // Seletor específico para incluir o título da seção
            return ".turma-wrapper-content, .objetivos-content, .content-wrapper";
          } else {
            return ".turma-wrapper-content";
          }
        };

        const selector = getSelector(sectionName);
        console.log(`🎯 Usando seletor: ${selector} para ${sectionName}`);

        // Para "Sobre o Curso", expandir links "...mais" antes de capturar
        if (sectionName === "Sobre o Curso") {
          console.log(
            `ℹ️ ${sectionName} é conteúdo estático; verificando se há links "...mais" para expandir`
          );
          try {
            const expanded = await page.evaluate(() => {
              let clicked = false;
              const candidates = Array.from(document.querySelectorAll('a, button, span'));
              candidates.forEach((el) => {
                const t = (el.textContent || '').trim().toLowerCase();
                if (t === '...mais' || t === 'mais' || t.includes('leia mais')) {
                  try { el.click(); clicked = true; } catch (e) {}
                }
              });
              return clicked;
            });
            if (expanded) {
              console.log('✅ "...mais" clicado; aguardando conteúdo expandir');
              await new Promise((r) => setTimeout(r, 1200));
            } else {
              console.log('ℹ️ Nenhum link "...mais" encontrado');
            }
          } catch (e) {
            console.log('⚠️ Falha ao tentar expandir "...mais":', e.message);
          }
        } else if (sectionName === "Modalidade de Ensino") {
          console.log(`🎯 Executando ação específica para ${sectionName}...`);

          // Usar a mesma lógica simples das outras seções que funcionam
          try {
            console.log("Clicando no botão Modalidade de Ensino...");

            // Clica no botão da seção (igual às outras seções que funcionam)
            try {
              const [navigation] = await Promise.all([
                page
                  .waitForNavigation({
                    waitUntil: "networkidle2",
                    timeout: 30000,
                  })
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
              console.log(
                `⚠️ Erro de navegação para ${sectionName}, continuando...`
              );
            }

            // Aguardar um pouco para o conteúdo carregar
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Tentar clicar no botão HÍBRIDO se aparecer
            try {
              await page.evaluate(() => {
                const buttons = Array.from(
                  document.querySelectorAll(".modalidade-front")
                );
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
              await new Promise((resolve) => setTimeout(resolve, 5000));
            } catch (e) {
              console.log("Erro ao clicar no botão HÍBRIDO:", e.message);
            }

            // Usar a mesma lógica de captura das outras seções
            const nextNumber = getNextSequentialNumber(
              sectionNumber,
              outputFolder
            );
            const filename = `${sectionNumber}.${nextNumber} - Atualizado ${dateStr} - ${sectionName}.png`;

            // Tentar capturar o modal se estiver visível
            try {
              const modalElement = await page.$(".modal-container");
              if (modalElement) {
                await modalElement.screenshot({
                  path: path.join(outputFolder, filename),
                });
                console.log(`✅ ${sectionName} capturado (modal): ${filename}`);
                return filename;
              }
            } catch (modalError) {
              console.log("Erro ao capturar modal:", modalError.message);
            }

            // Fallback: capturar tela inteira (igual às outras seções)
            try {
              await page.screenshot({
                path: path.join(outputFolder, filename),
                fullPage: true,
              });
              console.log(
                `✅ ${sectionName} capturado (fallback): ${filename}`
              );
              return filename;
            } catch (fallbackError) {
              console.error(
                `❌ Erro no fallback ${sectionName}:`,
                fallbackError.message
              );
              return null;
            }
          } catch (error) {
            console.log(`❌ Erro ao capturar ${sectionName}:`, error.message);
            return null;
          }
        } else if (sectionName === "Programa e Metodologia") {
          console.log(`🎯 Executando ação específica para ${sectionName}...`);

          // IMPORTANTE: Fechar qualquer modal aberto antes de navegar para outras seções
          try {
            console.log(
              `🔒 Fechando modais abertos antes de ${sectionName}...`
            );
            await page.evaluate(() => {
              const modalCloseSelectors = [
                ".modal-close",
                ".modal .close",
                ".modal-header .close",
                '[data-dismiss="modal"]',
                ".modal-backdrop",
                ".modal-container .close",
              ];

              for (const selector of modalCloseSelectors) {
                const closeBtn = document.querySelector(selector);
                if (closeBtn) {
                  console.log(`Fechando modal com seletor: ${selector}`);
                  closeBtn.click();
                  return true;
                }
              }

              const modal = document.querySelector(".modal-container, .modal");
              if (modal) {
                console.log("Clicando fora do modal para fechar");
                modal.style.display = "none";
                return true;
              }

              return false;
            });

            await new Promise((resolve) => setTimeout(resolve, 2000));
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
                  return btns.find((btn) =>
                    btn.textContent.trim().includes(text)
                  );
                },
                () => {
                  const btns = Array.from(document.querySelectorAll("button"));
                  const keywords = text
                    .split(" ")
                    .filter((word) => word.length > 2);
                  return btns.find((btn) =>
                    keywords.some((keyword) =>
                      btn.textContent.trim().includes(keyword)
                    )
                  );
                },
              ];

              for (let i = 0; i < strategies.length; i++) {
                const button = strategies[i]();
                if (button) {
                  console.log(
                    `Botão encontrado com estratégia ${i + 1}: ${text}`
                  );
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
                  timeout: 20000,
                });
                console.log(`✅ Navegação para ${sectionName} concluída`);
              } catch (navError) {
                console.log(
                  `⚠️ Navegação não detectada para ${sectionName}, aguardando conteúdo...`
                );
                await new Promise((r) => setTimeout(r, 3000));
              }
            }
          } catch (navError) {
            console.log(
              `⚠️ Erro ao clicar no botão ${sectionName}:`,
              navError.message
            );
          }

          // Aguardar conteúdo carregar
          try {
            console.log(`🔄 Aguardando conteúdo de ${sectionName} carregar...`);
            await page.waitForSelector(".turma-wrapper-content", {
              visible: true,
              timeout: 10000,
            });
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Detectar número de accordions disponíveis
            const totalAccordions = await page.evaluate(() => {
              // Tentar diferentes seletores para encontrar os accordions
              let accordions = document.querySelectorAll(
                ".accordion.template.campo"
              );
              console.log(
                `🔍 Detecção - Accordions encontrados com '.accordion.template.campo': ${accordions.length}`
              );

              if (accordions.length === 0) {
                accordions = document.querySelectorAll(
                  ".accordion-title.grupo.template"
                );
                console.log(
                  `🔍 Detecção - Accordions encontrados com '.accordion-title.grupo.template': ${accordions.length}`
                );
              }

              if (accordions.length === 0) {
                accordions = document.querySelectorAll('[class*="accordion"]');
                console.log(
                  `🔍 Detecção - Accordions encontrados com '[class*="accordion"]': ${accordions.length}`
                );
              }

              return accordions.length;
            });

            console.log(
              `🎯 Total de accordions detectados: ${totalAccordions}`
            );

            // Determinar número esperado de accordions baseado no curso
            let expectedAccordions = 6; // padrão
            if (
              pasta.includes("SLI_Quinzenal") ||
              pasta.includes("GIF_Mensal")
            ) {
              expectedAccordions = 16; // Sustentabilidade e Infraestrutura têm 16 accordions
            } else if (pasta.includes("DQ_Mensal")) {
              expectedAccordions = 6; // Dependência Química tem 6 accordions
            }

            const accordionsToProcess = Math.min(
              totalAccordions,
              expectedAccordions
            );
            console.log(`📋 Processando ${accordionsToProcess} accordions...`);

            // Capturar cada accordion individualmente
            for (let i = 0; i < accordionsToProcess; i++) {
              console.log(
                `📸 Capturando accordion ${i + 1} de ${accordionsToProcess}...`
              );

              // Encontrar e clicar no accordion específico
              const accordionClicked = await page.evaluate((index) => {
                // Tentar diferentes seletores para encontrar os accordions
                let accordions = document.querySelectorAll(
                  ".accordion.template.campo"
                );
                console.log(
                  `🔍 Tentativa 1 - Accordions encontrados com '.accordion.template.campo': ${accordions.length}`
                );

                if (accordions.length === 0) {
                  accordions = document.querySelectorAll(
                    ".accordion-title.grupo.template"
                  );
                  console.log(
                    `🔍 Tentativa 2 - Accordions encontrados com '.accordion-title.grupo.template': ${accordions.length}`
                  );
                }

                if (accordions.length === 0) {
                  accordions = document.querySelectorAll(
                    '[class*="accordion"]'
                  );
                  console.log(
                    `🔍 Tentativa 3 - Accordions encontrados com '[class*="accordion"]': ${accordions.length}`
                  );
                }

                if (index >= accordions.length) {
                  console.log(
                    `❌ Índice ${index} fora do range (${accordions.length} accordions disponíveis)`
                  );
                  return false;
                }

                const targetAccordion = accordions[index];
                if (!targetAccordion) {
                  console.log(`❌ Accordion no índice ${index} não encontrado`);
                  return false;
                }

                const title = targetAccordion.textContent
                  ? targetAccordion.textContent.trim().substring(0, 50)
                  : `Accordion ${index + 1}`;
                console.log(
                  `🎯 Processando accordion ${index + 1}: "${title}"`
                );

                // Fechar todos os accordions primeiro
                console.log("🔒 Fechando todos os accordions primeiro...");
                accordions.forEach((el) => {
                  const panel = el.nextElementSibling;
                  if (panel && panel.style.display !== "none") {
                    el.click();
                  }
                });

                // Aguardar um pouco para o fechamento
                setTimeout(() => {}, 500);

                // Scroll especial para o primeiro accordion para evitar sobreposição do botão "Inscreva-se"
                if (index === 0) {
                  console.log(
                    "📜 Fazendo scroll especial para o primeiro accordion..."
                  );
                  window.scrollBy(0, 200);
                  setTimeout(() => {}, 300);
                }

                // Agora clicar no accordion alvo
                console.log(`🎯 Clicando no accordion ${index + 1}...`);
                targetAccordion.click();

                // Verificar se abriu e tentar novamente se necessário
                setTimeout(() => {
                  const panel = targetAccordion.nextElementSibling;
                  if (!panel || panel.style.display === "none") {
                    console.log(
                      "🔄 Accordion não abriu, tentando novamente..."
                    );
                    targetAccordion.click();

                    // Se ainda não abriu, tentar clicar diretamente no texto
                    setTimeout(() => {
                      const panel2 = targetAccordion.nextElementSibling;
                      if (!panel2 || panel2.style.display === "none") {
                        console.log("🔁 Tentando clicar no texto do accordion");
                        targetAccordion.click();
                      }
                    }, 200);
                  }
                }, 300);

                return true;
              }, i);

              if (accordionClicked) {
                // Aguardar abertura do accordion com mais tempo
                await new Promise((resolve) => setTimeout(resolve, 3000));

                // Verificar se o accordion realmente abriu
                const accordionOpened = await page.evaluate((index) => {
                  // Usar os mesmos seletores da detecção
                  let accordions = document.querySelectorAll(
                    ".accordion.template.campo"
                  );
                  if (accordions.length === 0) {
                    accordions = document.querySelectorAll(
                      ".accordion-title.grupo.template"
                    );
                  }
                  if (accordions.length === 0) {
                    accordions = document.querySelectorAll(
                      '[class*="accordion"]'
                    );
                  }

                  if (index >= accordions.length) return false;

                  const accordion = accordions[index];
                  const content = accordion.nextElementSibling;
                  if (content && content.style.display !== "none") {
                    console.log(`✅ Accordion ${index + 1} está aberto`);
                    return true;
                  } else {
                    console.log(
                      `⚠️ Accordion ${index + 1} pode não ter aberto`
                    );
                    return false;
                  }
                }, i);

                if (accordionOpened) {
                  // Aguardar mais um pouco para estabilização
                  await new Promise((resolve) => setTimeout(resolve, 1500));
                } else {
                  console.log(
                    `⚠️ Accordion ${
                      i + 1
                    } pode não ter aberto, mas continuando...`
                  );
                }

                // Capturar screenshot
                const nextNumber = getNextSequentialNumber(
                  sectionNumber,
                  outputFolder
                );
                const filename = `${sectionNumber}.${
                  i + 1
                } - Atualizado ${dateStr} - ${sectionName}.png`;

                try {
                  await page.screenshot({
                    path: path.join(outputFolder, filename),
                    fullPage: true,
                  });
                  console.log(`✅ Screenshot salvo: ${filename}`);
                } catch (screenshotError) {
                  console.error(
                    `❌ Erro ao salvar screenshot ${filename}:`,
                    screenshotError.message
                  );
                }

                // Fechar o accordion (clicar novamente)
                await page.evaluate((index) => {
                  // Usar os mesmos seletores da detecção
                  let accordions = document.querySelectorAll(
                    ".accordion.template.campo"
                  );
                  if (accordions.length === 0) {
                    accordions = document.querySelectorAll(
                      ".accordion-title.grupo.template"
                    );
                  }
                  if (accordions.length === 0) {
                    accordions = document.querySelectorAll(
                      '[class*="accordion"]'
                    );
                  }

                  if (index >= accordions.length) return false;

                  const accordion = accordions[index];
                  console.log(`🔒 Fechando accordion ${index + 1}`);
                  accordion.click();
                  return true;
                }, i);

                // Aguardar fechamento
                await new Promise((resolve) => setTimeout(resolve, 1000));
              } else {
                console.log(`❌ Falha ao clicar no accordion ${i + 1}`);
              }
            }

            console.log(
              `✅ Captura múltipla do Programa e Metodologia concluída!`
            );
            return `${accordionsToProcess} accordions capturados`;
          } catch (expandError) {
            console.log(`⚠️ Erro ao expandir conteúdo:`, expandError.message);
          }
        } else {
          console.log(`🔄 Clicando no botão para ${sectionName}...`);

          // IMPORTANTE: Fechar qualquer modal aberto antes de navegar para outras seções
          try {
            console.log(
              `🔒 Fechando modais abertos antes de ${sectionName}...`
            );
            await page.evaluate(() => {
              // Tentar fechar modais comuns
              const modalCloseSelectors = [
                ".modal-close",
                ".modal .close",
                ".modal-header .close",
                '[data-dismiss="modal"]',
                ".modal-backdrop",
                ".modal-container .close",
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
              const modal = document.querySelector(".modal-container, .modal");
              if (modal) {
                console.log("Clicando fora do modal para fechar");
                modal.style.display = "none";
                return true;
              }

              return false;
            });

            // Aguardar modal fechar
            await new Promise((resolve) => setTimeout(resolve, 2000));
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
                  return btns.find((btn) =>
                    btn.textContent.trim().includes(text)
                  );
                },
                // Estratégia 3: Busca por palavras-chave
                () => {
                  const btns = Array.from(document.querySelectorAll("button"));
                  const keywords = text
                    .split(" ")
                    .filter((word) => word.length > 2);
                  return btns.find((btn) =>
                    keywords.some((keyword) =>
                      btn.textContent.trim().includes(keyword)
                    )
                  );
                },
              ];

              for (let i = 0; i < strategies.length; i++) {
                const button = strategies[i]();
                if (button) {
                  console.log(
                    `Botão encontrado com estratégia ${i + 1}: ${text}`
                  );
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
                  timeout: 20000,
                });
                console.log(`✅ Navegação para ${sectionName} concluída`);
              } catch (navError) {
                console.log(
                  `⚠️ Navegação não detectada para ${sectionName}, aguardando conteúdo...`
                );
                await new Promise((r) => setTimeout(r, 3000));
              }
            } else {
              console.log(`❌ Não foi possível clicar no botão ${sectionName}`);
            }
          } catch (navError) {
            console.log(
              `⚠️ Erro ao clicar no botão ${sectionName}:`,
              navError.message
            );
          }
        }

        // Para "Programa e Metodologia", usar EXATAMENTE a mesma lógica do sistema original
        if (sectionName === "Programa e Metodologia") {
          console.log(`📸 Capturando seção: ${sectionName}`);

          // Aguardar entre cada seção (igual ao original)
          await new Promise((r) => setTimeout(r, 1000));

          const nextNumber = getNextSequentialNumber(
            sectionNumber,
            outputFolder
          );
          const filename = `${sectionNumber}.${nextNumber} - Atualizado ${dateStr} - ${sectionName}.png`;

          try {
            // Verifica se a página ainda está conectada (igual ao original)
            if (page.isClosed()) {
              console.error(
                `❌ Página foi fechada durante captura de ${sectionName}`
              );
              return null;
            }

            // Clica no botão da seção com tratamento de erro melhorado (igual ao original)
            try {
              const [navigation] = await Promise.all([
                page
                  .waitForNavigation({
                    waitUntil: "networkidle2",
                    timeout: 30000,
                  })
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
              console.log(
                `⚠️ Erro de navegação para ${sectionName}, continuando...`
              );
            }

            // Espera o conteúdo aparecer com timeout maior (igual ao original)
            try {
              await page.waitForSelector(".turma-wrapper-content", {
                visible: true,
                timeout: 15000,
              });
              await new Promise((r) => setTimeout(r, 1000));
            } catch (selectorError) {
              console.log(
                `⚠️ Seletor .turma-wrapper-content não encontrado para ${sectionName}`
              );
              return null;
            }

            // Esconde banners de cookies antes de cada screenshot (igual ao original)
            await hideCookieBanners(page);

            // Captura usando elemento específico (igual ao original)
            const content = await page.$(".turma-wrapper-content");
            if (content) {
              try {
                await content.screenshot({
                  path: path.join(outputFolder, filename),
                });
                console.log(`✅ Screenshot saved: ${filename}`);
                return filename;
              } catch (screenshotError) {
                console.error(
                  `❌ Erro ao salvar screenshot para ${sectionName}: ${screenshotError.message}`
                );
                return null;
              }
            } else {
              console.error(`❌ Content not found for section: ${sectionName}`);
              return null;
            }
          } catch (error) {
            console.error(
              `❌ Error capturing section ${sectionName}:`,
              error.message
            );
            return null;
          }
        }

        // Para "Objetivos e Qualificações", usar estratégia de recarregamento da página
        if (sectionName === "Objetivos e Qualificações") {
          console.log(`📸 Capturando seção: ${sectionName}`);

          const nextNumber = getNextSequentialNumber(
            sectionNumber,
            outputFolder
          );
          const filename = `${sectionNumber}.${nextNumber} - Atualizado ${dateStr} - ${sectionName}.png`;

          try {
            // Verifica se a página ainda está conectada
            if (page.isClosed()) {
              console.error(
                `❌ Página foi fechada durante captura de ${sectionName}`
              );
              return null;
            }

            // ESTRATÉGIA RADICAL: Recarregar a página para garantir estado limpo
            console.log(`🔄 Recarregando página para garantir estado limpo...`);
            await page.reload({ waitUntil: "networkidle2", timeout: 30000 });
            await new Promise((resolve) => setTimeout(resolve, 3000));
            console.log(`✅ Página recarregada`);

            // Esconder banners de cookies após recarregamento
            await hideCookieBanners(page);

            // Clicar no botão da seção (igual ao sistema original)
            console.log(`🎯 Clicando no botão ${sectionName}...`);
            try {
              const [navigation] = await Promise.all([
                page
                  .waitForNavigation({
                    waitUntil: "networkidle2",
                    timeout: 30000,
                  })
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
              console.log(
                `⚠️ Erro de navegação para ${sectionName}, continuando...`
              );
            }

            // Aguardar carregamento do conteúdo
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Espera o conteúdo aparecer
            try {
              await page.waitForSelector(".turma-wrapper-content", {
                visible: true,
                timeout: 15000,
              });
              await new Promise((r) => setTimeout(r, 2000));
            } catch (selectorError) {
              console.log(
                `⚠️ Seletor .turma-wrapper-content não encontrado para ${sectionName}`
              );
              return null;
            }

            // Esconde banners de cookies antes de cada screenshot
            await hideCookieBanners(page);

            // Captura usando elemento específico (igual ao original)
            const content = await page.$(".turma-wrapper-content");
            if (content) {
              try {
                await content.screenshot({
                  path: path.join(outputFolder, filename),
                });
                console.log(`✅ Screenshot saved: ${filename}`);
                return filename;
              } catch (screenshotError) {
                console.error(
                  `❌ Erro ao salvar screenshot para ${sectionName}: ${screenshotError.message}`
                );
                return null;
              }
            } else {
              console.error(`❌ Content not found for section: ${sectionName}`);
              return null;
            }
          } catch (error) {
            console.error(
              `❌ Error capturing section ${sectionName}:`,
              error.message
            );
            return null;
          }
        }

        // Para "Modalidade de Ensino", já foi capturado acima, não precisa continuar
        if (sectionName === "Modalidade de Ensino") {
          console.log(
            `ℹ️ ${sectionName} já foi capturado acima, finalizando...`
          );
          return null;
        }

        // Espera o conteúdo correto aparecer com verificação específica
        let contentLoaded = false;
        const maxAttempts = 5;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            console.log(
              `🔄 Tentativa ${attempt}/${maxAttempts} para carregar ${sectionName}...`
            );

            // Aguardar um pouco antes de tentar novamente
            if (attempt > 1) {
              await new Promise((r) => setTimeout(r, 3000));
            }

            await page.waitForSelector(selector, {
              visible: true,
              timeout: 15000,
            });

            // Verificar se o conteúdo correto foi carregado baseado na seção
            const isCorrectContent = await page.evaluate(
              (sel, section) => {
                const element = document.querySelector(sel);
                if (!element) return false;

                const text = element.textContent.toLowerCase();
                console.log(
                  `Verificando conteúdo para ${section}:`,
                  text.substring(0, 100)
                );

                // Palavras-chave específicas para cada seção
                const keywords = {
                  "Sobre o Curso": [
                    "sobre",
                    "curso",
                    "especialização",
                    "objetivo",
                  ],
                  "Modalidade de Ensino": [
                    "modalidade",
                    "híbrido",
                    "presencial",
                    "online",
                  ],
                  "Selecionar uma Turma": [
                    "turma",
                    "selecionar",
                    "unidade",
                    "paulista",
                  ],
                  "Programa e Metodologia": [
                    "programa",
                    "metodologia",
                    "disciplina",
                    "módulo",
                  ],
                  "Objetivos e Qualificações": [
                    "objetivo",
                    "qualificação",
                    "competência",
                  ],
                  "Corpo Docente": ["docente", "professor", "coordenador"],
                  "Cronograma de Aulas": [
                    "cronograma",
                    "aula",
                    "data",
                    "horário",
                  ],
                  "Local e Horário": [
                    "local",
                    "horário",
                    "endereço",
                    "unidade",
                  ],
                  "Valor do Curso": [
                    "valor",
                    "preço",
                    "investimento",
                    "parcela",
                  ],
                  "Perfil do Aluno": [
                    "perfil",
                    "aluno",
                    "candidato",
                    "público",
                  ],
                  "Processo Seletivo": [
                    "processo",
                    "seletivo",
                    "inscrição",
                    "matrícula",
                  ],
                  "Perguntas Frequentes": [
                    "pergunta",
                    "frequente",
                    "faq",
                    "dúvida",
                  ],
                };

                const sectionKeywords = keywords[section] || [];
                const hasCorrectKeywords = sectionKeywords.some((keyword) =>
                  text.includes(keyword)
                );

                return hasCorrectKeywords && text.length > 20;
              },
              selector,
              sectionName
            );

            if (isCorrectContent) {
              contentLoaded = true;
              console.log(
                `✅ Conteúdo correto de ${sectionName} carregado com sucesso`
              );
              break;
            } else {
              console.log(
                `⚠️ Conteúdo incorreto para ${sectionName} na tentativa ${attempt}`
              );

              // Se não é o conteúdo correto, tentar clicar novamente no botão
              if (attempt < maxAttempts) {
                console.log(
                  `🔄 Tentando clicar novamente no botão ${sectionName}...`
                );
                await page.evaluate((text) => {
                  const btns = Array.from(document.querySelectorAll("button"));
                  const target = btns.find((btn) =>
                    btn.textContent.trim().includes(text)
                  );
                  if (target) {
                    target.click();
                  }
                }, sectionName);
                await new Promise((r) => setTimeout(r, 2000));
              }
            }
          } catch (selectorError) {
            console.log(
              `⚠️ Tentativa ${attempt} falhou para ${sectionName}:`,
              selectorError.message
            );
          }
        }

        if (!contentLoaded) {
          console.log(
            `⚠️ Conteúdo correto de ${sectionName} não carregou após ${maxAttempts} tentativas`
          );
        }

        // Verificação final antes da captura
        if (!contentLoaded) {
          console.log(
            `⚠️ Tentando captura mesmo sem conteúdo correto para ${sectionName}`
          );
        }

        // Aguardar um pouco mais para garantir estabilidade
        await new Promise((r) => setTimeout(r, 1000));

        // IMPORTANTE: Verificar e fechar modais antes da captura final
        try {
          console.log(
            `🔍 Verificando se há modais abertos antes de capturar ${sectionName}...`
          );
          const hasOpenModal = await page.evaluate(() => {
            const modals = document.querySelectorAll(
              ".modal-container, .modal, .modal-backdrop"
            );
            return modals.length > 0;
          });

          if (hasOpenModal) {
            console.log(
              `⚠️ Modal ainda aberto para ${sectionName}, fechando...`
            );
            await page.evaluate(() => {
              // Forçar fechamento de todos os modais
              const modals = document.querySelectorAll(
                ".modal-container, .modal, .modal-backdrop"
              );
              modals.forEach((modal) => {
                modal.style.display = "none";
                modal.remove();
              });

              // Remover backdrop se existir
              const backdrop = document.querySelector(".modal-backdrop");
              if (backdrop) {
                backdrop.remove();
              }
            });

            // Aguardar modal fechar completamente
            await new Promise((resolve) => setTimeout(resolve, 2000));
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
            return element
              ? element.textContent.substring(0, 200)
              : "Elemento não encontrado";
          }, selector);
          console.log(`📄 Conteúdo atual para ${sectionName}:`, currentContent);
        }

        // Tentar múltiplas estratégias de captura
        if (content) {
          try {
            // Estratégia 1: Capturar elemento específico
            await content.screenshot({
              path: path.join(outputFolder, filename),
            });
            console.log(`✅ ${sectionName} capturado (elemento): ${filename}`);
            return filename;
          } catch (screenshotError) {
            console.log(
              `⚠️ Erro ao capturar elemento ${sectionName}:`,
              screenshotError.message
            );
          }
        }

        // Estratégia 2: Capturar tela inteira
        try {
          await page.screenshot({
            path: path.join(outputFolder, filename),
            fullPage: true,
          });
          console.log(
            `✅ ${sectionName} capturado (tela inteira): ${filename}`
          );
          return filename;
        } catch (fallbackError) {
          console.error(
            `❌ Erro no fallback ${sectionName}:`,
            fallbackError.message
          );
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
      {
        name: "Modalidade de Ensino",
        number: "02",
        selected: modalidadeEnsino,
      },
      { name: "Selecionar uma Turma", number: "03", selected: selecionarTurma },
      {
        name: "Programa e Metodologia",
        number: "04",
        selected: programaMetodologia,
      },
      {
        name: "Objetivos e Qualificações",
        number: "05",
        selected: objetivosQualificacoes,
      },
      { name: "Corpo Docente", number: "06", selected: corpoDocente },
      { name: "Cronograma de Aulas", number: "07", selected: cronogramaAulas },
      { name: "Local e Horário", number: "08", selected: localHorario },
      { name: "Valor do Curso", number: "09", selected: valorCurso },
      { name: "Perfil do Aluno", number: "10", selected: perfilAluno },
      { name: "Processo Seletivo", number: "11", selected: processoSeletivo },
      {
        name: "Perguntas Frequentes",
        number: "12",
        selected: perguntasFrequentes,
      },
    ];

    for (const print of printsToCapture) {
      const filename = await capturePrint(
        print.name,
        print.number,
        print.selected
      );
      if (filename) {
        capturedFiles.push(filename);
      }
    }

    // Nome legível da pasta para retorno
    const folderName = path.basename(outputFolder);

    console.log(
      `Retornando resposta com ${capturedFiles.length} arquivos atualizados`
    );
    res.json({
      success: true,
      message: `${capturedFiles.length} prints atualizados com sucesso`,
      updatedFiles: capturedFiles,
      folder: folderName,
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
