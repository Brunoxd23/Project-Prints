const fs = require("fs").promises;
const path = require("path");

// Retorna o semestre atual (2025-2, 2026-1, etc)
function getCurrentSemester() {
  const now = new Date();
  const year = now.getFullYear();
  // Se estamos após junho, é segundo semestre
  const semester = now.getMonth() >= 5 ? 2 : 1;
  return `${year}-${semester}`;
}

// Retorna o próximo semestre
function getNextSemester(currentSemester) {
  const [year, semester] = currentSemester.split("-").map(Number);
  if (semester === 1) {
    return `${year}-2`;
  } else {
    return `${year + 1}-1`;
  }
}

// Retorna o path completo da pasta do semestre
function getSemesterPath(basePath, semester) {
  return path.join(basePath, `${semester}`);
}

// Verifica se a pasta do semestre existe
async function checkSemesterFolder(basePath, semester) {
  const folderPath = getSemesterPath(basePath, semester);
  try {
    await fs.access(folderPath);
    return true;
  } catch {
    return false;
  }
}

// Cria a pasta do semestre se não existir
async function createSemesterFolder(basePath, semester) {
  const folderPath = getSemesterPath(basePath, semester);
  try {
    await fs.mkdir(folderPath, { recursive: true });
    return true;
  } catch (error) {
    console.error(`Erro ao criar pasta ${folderPath}:`, error);
    return false;
  }
}

// Lista todos os semestres disponíveis para um curso
async function listAvailableSemesters(basePath) {
  try {
    const items = await fs.readdir(basePath);
    // Filtra apenas pastas que seguem o padrão YYYY-S
    return items
      .filter((item) => /^\d{4}-[12]$/.test(item))
      .sort((a, b) => {
        const [yearA, semA] = a.split("-").map(Number);
        const [yearB, semB] = b.split("-").map(Number);
        return yearB - yearA || semB - semA;
      });
  } catch (error) {
    console.error("Erro ao listar semestres:", error);
    return [];
  }
}

module.exports = {
  getCurrentSemester,
  getNextSemester,
  getSemesterPath,
  checkSemesterFolder,
  createSemesterFolder,
  listAvailableSemesters,
};
