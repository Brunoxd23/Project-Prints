// Entry point: import and initialize modules
import { goHome, voltarParaHome, ensurePastasVisible } from "./modules/spa.js";
import { renderCursos } from "./modules/cards.js";
import { runScript, showPrints } from "./modules/scripts.js";
import { showToast, zoomImg } from "./modules/utils.js";

// Elementos principais
const homeView = document.getElementById("home-view");
const cardsContainer = document.getElementById("cards-container");
const cursosContainer = document.getElementById("cursos-hibrida-container");
const folderView = document.getElementById("folder-view");
const folderTitle = document.getElementById("folder-title");
const folderList = document.getElementById("folder-list");
const folderOutput = document.getElementById("folder-output");
const runScriptBtn = document.getElementById("run-script-btn");

// Array global de cursos
window.cursosHibrida = [
  {
    nome: "Cuidados Paliativos",
    descricao: "Pós com três opções de turma",
    img: "./images/cuidados_paliativos.webp",
    subcursos: [
      {
        nome: "Unidade Paulista | Quinzenal Prática Estendida",
        rota: "/run-script-cuidados-quinzenal-pratica",
        pasta: "Cuidados_Paliativos_Quinzenal_Pratica",
      },
      {
        nome: "Unidade Paulista | Quinzenal",
        rota: "/run-script-cuidados-quinzenal",
        pasta: "Cuidados_Paliativos_Quinzenal",
      },
      {
        nome: "Unidade Paulista | Semanal",
        rota: "/run-script-cuidados-semanal",
        pasta: "Cuidados_Paliativos_Semanal",
      },
    ],
  },
  {
    nome: "Dependência Química",
    descricao: "Especialização Híbrida",
    pasta: "Dependencia_Quimica",
    img: "./images/dependencia_quimica.webp",
  },
  {
    nome: "Sustentabilidade: Liderança e Inovação em ESG",
    descricao: "Especialização Híbrida",
    pasta: "Sustentabilidade_ESG",
    img: "./images/Sustentabilidade.webp",
  },
  {
    nome: "Gestão de Infraestrutura e Facilities em Saúde",
    descricao: "Especialização Híbrida",
    pasta: "Gestao_Infraestrutura",
    img: "./images/Gestão_Infra.webp",
  },
  {
    nome: "Psiquiatria Multiprofissional",
    descricao: "Especialização Híbrida",
    pasta: "Psiquiatria_Multiprofissional",
    img: "./images/Psiquiatria_multi.webp",
  },
  {
    nome: "Bases da Saúde Integrativa e Bem-Estar",
    descricao: "Especialização Híbrida",
    pasta: "Saude_Integrativa_Bem_Estar",
    img: "./images/Bases_da_Saude.webp",
  },
];

// Inicialização SPA
window.goHome = () =>
  goHome(homeView, folderView, folderList, folderOutput, runScriptBtn);
window.voltarParaHome = () =>
  voltarParaHome(cursosContainer, cardsContainer, folderView);
window.zoomImg = zoomImg;

// Renderiza cursos ao clicar no card principal
const cardHibrida = document.getElementById("card-hibrida");
if (cardHibrida) {
  cardHibrida.onclick = function () {
    cardsContainer.style.display = "none";
    cursosContainer.style.display = "flex";
    renderCursos(window.cursosHibrida, cursosContainer, cardsContainer);
  };
}

// Inicializa home
window.goHome();
