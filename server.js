const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

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
        f.startsWith("Cuidados_Paliativos_") ||
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
