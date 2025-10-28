const { app } = require("electron");
const path = require("path");
const fs = require("fs");

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

// Carregar/Salvar caminho configurado
const getConfigPath = () => {
  const configPath = path.join(app.getPath("userData"), "config.json");
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      printsPath: path.join(
        process.env.USERPROFILE || process.env.HOME,
        "Documents",
        "Pós Graduação"
      ),
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  }
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
};

// Salvar novo caminho
const setPrintsPath = (newPath) => {
  const configPath = path.join(app.getPath("userData"), "config.json");
  const config = getConfigPath();
  config.printsPath = newPath;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

// Obter caminho atual dos prints
const getPrintsPath = () => {
  const config = getConfigPath();
  return ensureDirectoryExists(config.printsPath);
};

// Caminho específico para prints de um curso/semestre
const getCoursePrintsPath = (courseFolder, semesterFolder) => {
  const coursePath = path.join(getPrintsPath(), courseFolder, semesterFolder);
  return ensureDirectoryExists(coursePath);
};

module.exports = {
  getAppDataPath: () => app.getPath("userData"),
  getPrintsPath,
  setPrintsPath,
  getCoursePrintsPath,
};
