const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const express = require("express");
const puppeteer = require("puppeteer");

// Importar as rotas do sistema existente
const dependenciaQuimicaRoute = require("../routes/dependenciaQuimica");
const basesIntegrativaRoute = require("../routes/basesIntegrativa");
const cuidadosPaliativosRoute = require("../routes/cuidadosPaliativos");
const psiquiatriaRoute = require("../routes/psiquiatriaMultiprofissional");
const infraestruturaRoute = require("../routes/infraestruturaFacilities");
const sustentabilidadeRoute = require("../routes/sustentabilidadeInovacao");

// Importar utilitários
const { getPrintsPath, setPrintsPath } = require("./utils/paths");

let mainWindow;
let serverApp;
let server;

// Configurar servidor Express interno
function setupServer() {
  serverApp = express();
  serverApp.use(express.json());

  // Configurar as rotas
  serverApp.use("/api/dependencia-quimica", dependenciaQuimicaRoute);
  serverApp.use("/api/bases-integrativa", basesIntegrativaRoute);
  serverApp.use("/api/cuidados-paliativos", cuidadosPaliativosRoute);
  serverApp.use("/api/psiquiatria", psiquiatriaRoute);
  serverApp.use("/api/infraestrutura", infraestruturaRoute);
  serverApp.use("/api/sustentabilidade", sustentabilidadeRoute);
  
  // Rota de atualização de prints (copiada do server.js principal)
  serverApp.post("/update-all-prints/:pasta/:semester", async (req, res) => {
    const { pasta, semester } = req.params;
    const updateData = req.body;
    
    console.log(`🔄 Iniciando atualização: ${pasta}/${semester}`);
    console.log("Dados de atualização:", updateData);
    
    try {
      // Fazer requisição para o servidor principal na porta 3000
      const axios = require("axios");
      const response = await axios.post(`http://localhost:3000/update-all-prints/${pasta}/${semester}`, updateData, {
        timeout: 120000 // 2 minutos
      });
      
      res.json(response.data);
    } catch (error) {
      console.error("❌ Erro ao atualizar prints:", error);
      res.status(500).json({ 
        error: "Erro ao atualizar prints", 
        details: error.message 
      });
    }
  });

  // Iniciar servidor na porta 3001 (para não conflitar)
  server = serverApp.listen(3001, () => {
    console.log("🚀 Servidor interno rodando na porta 3001");
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, "assets", "icon.png"),
    show: false,
  });

  const indexPath = path.join(__dirname, "renderer", "index.html");
  console.log("Tentando carregar:", indexPath);
  mainWindow.loadFile(indexPath);

  // Para debug
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.log("Falha ao carregar:", errorDescription);
    }
  );

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    // Sempre abrir as ferramentas de desenvolvimento durante o desenvolvimento
    mainWindow.webContents.openDevTools();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (server) {
      server.close();
    }
  });
}

app.whenReady().then(() => {
  setupServer();
  createWindow();


  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (server) {
      server.close();
    }
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle("gerar-prints", async (event, { curso, pasta, semestre }) => {
  try {
    console.log(
      `🎯 Iniciando captura de prints: ${curso}, pasta: ${pasta}, semestre: ${semestre}`
    );

    // Notificar progresso
    mainWindow.webContents.send(
      "print-progress",
      "Iniciando geração de prints..."
    );

    const routeMap = {
      "Dependência Química":
        "/api/dependencia-quimica/run-script-dependencia-quimica",
      "Bases da Saúde Integrativa":
        "/api/bases-integrativa/run-script-bases-integrativa-mensal",
      "Cuidados Paliativos - Mensal":
        "/api/cuidados-paliativos/run-script-cuidados-paliativos-mensal",
      "Cuidados Paliativos - Quinzenal":
        "/api/cuidados-paliativos/run-script-cuidados-paliativos-quinzenal",
      "Cuidados Paliativos - Prática Estendida":
        "/api/cuidados-paliativos/run-script-cuidados-paliativos-pratica-estendida",
      "Psiquiatria Multiprofissional":
        "/api/psiquiatria/run-script-psiquiatria-multiprofissional",
      "Infraestrutura e Facilities":
        "/api/infraestrutura/run-script-infraestrutura-mensal",
      "Sustentabilidade e Inovação":
        "/api/sustentabilidade/run-script-sustentabilidade-quinzenal",
    };

    const route = routeMap[curso];
    if (!route) {
      throw new Error(`Curso não encontrado: ${curso}`);
    }

    const axios = require("axios");
    // Tentar primeiro o servidor principal na porta 3000
    let response;
    try {
      response = await axios.post(`http://localhost:3000${route}`, {
        semester: semestre,
      }, { timeout: 120000 });
    } catch (error) {
      console.log("⚠️ Servidor principal não disponível, tentando servidor interno...");
      response = await axios.post(`http://localhost:3001${route}`, {
        semester: semestre,
      }, { timeout: 120000 });
    }

    return {
      success: true,
      message: `✅ Prints capturados com sucesso para ${curso}!`,
      files: response.data,
    };
  } catch (error) {
    console.error("❌ Erro ao capturar prints:", error);
    return {
      success: false,
      message: `❌ Erro: ${error.message}`,
      error: error.message,
    };
  }
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Selecionar pasta para salvar prints",
    defaultPath: getPrintsPath(),
  });

  if (!result.canceled) {
    setPrintsPath(result.filePaths[0]);
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("check-folder", async (event, folderPath) => {
  try {
    return fs.existsSync(folderPath);
  } catch (error) {
    return false;
  }
});

ipcMain.handle(
  "update-prints",
  async (event, { curso, semestre, updateData }) => {
    try {
      console.log(`🔄 Iniciando atualização: ${curso}, semestre: ${semestre}`);
      console.log("Dados de atualização:", updateData);

      const courseToFolderMap = {
        "Dependência Química": "DQ_Mensal",
        "Bases da Saúde Integrativa": "BSI_Mensal",
        "Cuidados Paliativos - Mensal": "CP_Mensal",
        "Cuidados Paliativos - Quinzenal": "CP_Quinzenal",
        "Cuidados Paliativos - Prática Estendida": "CP_Pratica_Estendida",
        "Psiquiatria Multiprofissional": "PM_Mensal",
        "Infraestrutura e Facilities": "GIF_Mensal",
        "Sustentabilidade e Inovação": "SLI_Quinzenal",
      };

      const pasta = courseToFolderMap[curso];
      if (!pasta) {
        throw new Error(
          `Mapeamento de pasta não encontrado para o curso: ${curso}`
        );
      }

      const axios = require("axios");
      let response;
      const endpointsToTry = [
        `http://localhost:3001/update-all-prints/${pasta}/${semestre}`,
        `http://localhost:3000/update-all-prints/${pasta}/${semestre}`,
      ];

      let lastError = null;
      for (const url of endpointsToTry) {
        try {
          console.log(`🔗 Tentando atualizar prints via: ${url}`);
          response = await axios.post(url, updateData, { timeout: 60000 });
          console.log(`✅ Resposta recebida de ${url}`);
          break;
        } catch (err) {
          lastError = err;
          console.warn(`⚠️ Falha ao chamar ${url}: ${err.message}`);
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error("Nenhuma rota de atualização disponível");
      }

      return {
        success: true,
        message: `✅ ${
          response.data.updatedFiles?.length || 0
        } prints atualizados com sucesso!`,
        files: response.data.updatedFiles || [],
      };
    } catch (error) {
      console.error("❌ Erro ao atualizar prints:", error);
      return {
        success: false,
        message: `❌ Erro: ${error.response?.data?.error || error.message}`,
        error: error.message,
      };
    }
  }
);
