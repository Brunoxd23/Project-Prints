const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 3000;

// Importa rotas
const semestersRouter = require("./routes/semesters");
const dependenciaQuimicaRouter = require("./routes/dependenciaQuimica");

app.use(express.static(path.join(__dirname, "public")));

// Rotas de gerenciamento de semestres
app.use("/api/semesters", semestersRouter);

// Rotas para os cursos
app.use("/api", dependenciaQuimicaRouter);

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
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
