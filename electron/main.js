const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = !app.isPackaged;

// Start Express server lazily after basePath is ensured
function startServer() {
  // Require server.js to start listening
  require(path.join(__dirname, "..", "server.js"));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load simplified UI hosted by express or static file as fallback
  const url = "http://localhost:3000/simple.html";
  win.loadURL(url).catch(() => {
    win.loadFile(path.join(__dirname, "..", "public", "index.html"));
  });
}

function ensureBasePathAndLaunch() {
  const cfg = require(path.join(__dirname, "..", "utils", "config.js"));
  const currentBase = cfg.getBasePath();
  if (!currentBase || typeof currentBase !== "string") {
    const result = dialog.showOpenDialogSync({ properties: ["openDirectory"] });
    if (result && result[0]) {
      cfg.setBasePath(result[0]);
    }
  }
  startServer();
  createWindow();
}

app.whenReady().then(() => {
  // IPC: allow selecting a folder at runtime (will require restart for static mount)
  const cfg = require(path.join(__dirname, "..", "utils", "config.js"));
  ipcMain.handle("select-folder", async () => {
    const res = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (!res.canceled && res.filePaths && res.filePaths[0]) {
      const selected = res.filePaths[0];
      // Testa escrita criando e removendo um arquivo temporário
      try {
        const testFile = path.join(selected, `.write_test_${Date.now()}.tmp`);
        fs.writeFileSync(testFile, "ok");
        fs.unlinkSync(testFile);
      } catch (err) {
        const code = err && err.code ? err.code : "UNKNOWN";
        const blocked = code === "EPERM" || code === "EACCES";
        if (blocked) {
          dialog.showErrorBox(
            "Sem permissão para gravar",
            "O Windows bloqueou o acesso de escrita nesta pasta. Escolha outra pasta (fora de Documentos/Área de Trabalho) ou adicione o aplicativo à lista permitida do Controle de Acesso a Pastas."
          );
          return { basePath: cfg.getBasePath(), error: code };
        }
        dialog.showErrorBox(
          "Erro ao validar pasta",
          `Não foi possível validar a pasta selecionada: ${err.message}`
        );
        return { basePath: cfg.getBasePath(), error: code };
      }

      cfg.setBasePath(selected);
      return { basePath: cfg.getBasePath() };
    }
    return { basePath: cfg.getBasePath() };
  });

  ensureBasePathAndLaunch();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
