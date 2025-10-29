const fs = require("fs");
const path = require("path");
const os = require("os");

// Resolve local gravável para config em produção (Electron) e fallback em dev
function getConfigPaths() {
  let userDataDir = null;
  try {
    if (process.versions && process.versions.electron) {
      // Dentro do Electron (main process)
      const { app } = require("electron");
      if (app) {
        userDataDir = app.getPath("userData");
      }
    }
  } catch (_) {}

  const productionDir =
    userDataDir || path.join(os.homedir(), ".project-prints");
  const productionPath = path.join(productionDir, "config.json");
  const repoPath = path.join(__dirname, "..", "config.json");
  return { productionDir, productionPath, repoPath };
}

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (_) {}
}

function readJson(file) {
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function readConfig() {
  const { productionPath, repoPath } = getConfigPaths();
  // 1) Prioriza config em userData (gravável no app empacotado)
  const prod = readJson(productionPath);
  if (prod) return prod;
  // 2) Fallback: config do repositório (dev)
  const repo = readJson(repoPath);
  return repo || {};
}

function writeConfig(cfg) {
  const { productionDir, productionPath } = getConfigPaths();
  ensureDir(productionDir);
  fs.writeFileSync(productionPath, JSON.stringify(cfg, null, 2), "utf-8");
}

function getBasePath() {
  const cfg = readConfig();
  // Caminho padrão antigo como fallback
  return (
    cfg.basePath ||
    path.join("C:", "Users", "drt62324", "Documents", "Pós Graduação")
  );
}

function setBasePath(basePath) {
  const cfg = readConfig();
  cfg.basePath = basePath;
  writeConfig(cfg);
  return cfg.basePath;
}

function ensureBaseDir() {
  const base = getBasePath();
  try {
    fs.mkdirSync(base, { recursive: true });
  } catch (_) {}
  return base;
}

function getBrowserExecutablePath() {
  const cfg = readConfig();
  return cfg.browserExecutablePath || null;
}

function setBrowserExecutablePath(exePath) {
  const cfg = readConfig();
  if (exePath) cfg.browserExecutablePath = exePath;
  else delete cfg.browserExecutablePath;
  writeConfig(cfg);
  return cfg.browserExecutablePath || null;
}

module.exports = {
  getBasePath,
  setBasePath,
  readConfig,
  writeConfig,
  ensureBaseDir,
  getBrowserExecutablePath,
  setBrowserExecutablePath,
};
