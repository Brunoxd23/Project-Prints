const express = require("express");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use("/Neuro_Rj", express.static(path.join(__dirname, "Neuro_Rj")));
app.use("/Neuro_Sp", express.static(path.join(__dirname, "Neuro_Sp")));

app.post("/run-script-rj", (req, res) => {
  exec("node Neuro_Rj.js", { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    const rjDir = path.join(__dirname, "Neuro_Rj");
    let files = [];
    if (fs.existsSync(rjDir)) {
      files = fs
        .readdirSync(rjDir)
        .filter((f) => f.endsWith(".png"))
        .map((f) => `/Neuro_Rj/${f}`);
    }
    res.json(files);
  });
});

app.post("/run-script-sp", (req, res) => {
  exec("node Neuro_Sp.js", { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    const spDir = path.join(__dirname, "Neuro_Sp");
    let files = [];
    if (fs.existsSync(spDir)) {
      files = fs
        .readdirSync(spDir)
        .filter((f) => f.endsWith(".png"))
        .map((f) => `/Neuro_Sp/${f}`);
    }
    res.json(files);
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint não encontrado" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
