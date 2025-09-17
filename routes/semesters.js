const express = require("express");
const router = express.Router();
const {
  getCurrentSemester,
  getNextSemester,
  checkSemesterFolder,
  createSemesterFolder,
  listAvailableSemesters,
} = require("../utils/semester");

// Rota para listar semestres disponíveis
router.get("/semesters/:curso", async (req, res) => {
  const { curso } = req.params;
  const basePath = `./${curso}`;

  try {
    const semesters = await listAvailableSemesters(basePath);
    res.json({ semesters });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar semestres" });
  }
});

// Rota para verificar existência da pasta do semestre
router.get("/check-semester/:curso/:semester", async (req, res) => {
  const { curso, semester } = req.params;
  const basePath = `./${curso}`;

  try {
    const exists = await checkSemesterFolder(basePath, semester);
    res.json({ exists });
  } catch (error) {
    res.status(500).json({ error: "Erro ao verificar semestre" });
  }
});

// Rota para criar pasta do próximo semestre
router.post("/create-semester/:curso", async (req, res) => {
  const { curso } = req.params;
  const basePath = `./${curso}`;
  const currentSemester = getCurrentSemester();
  const nextSemester = getNextSemester(currentSemester);

  try {
    const created = await createSemesterFolder(basePath, nextSemester);
    if (created) {
      res.json({ semester: nextSemester, success: true });
    } else {
      throw new Error("Erro ao criar pasta");
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar pasta do semestre" });
  }
});

module.exports = router;
