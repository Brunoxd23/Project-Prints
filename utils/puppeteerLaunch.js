const path = require("path");
const fs = require("fs");
const os = require("os");
const puppeteer = require("puppeteer");
const { getBrowserExecutablePath } = require("./config");

function findChromeExe(startDir) {
  try {
    if (!fs.existsSync(startDir)) return null;
    const stack = [startDir];
    while (stack.length) {
      const dir = stack.pop();
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          stack.push(full);
        } else if (e.isFile() && /chrome\.exe$/i.test(e.name)) {
          return full;
        }
      }
    }
  } catch (_) {}
  return null;
}

function resolveBundledChromium() {
  // 1) Prefer API do Puppeteer (se já conhece o caminho local)
  if (typeof puppeteer.executablePath === "function") {
    try {
      const p = puppeteer.executablePath();
      if (p && fs.existsSync(p)) return p;
    } catch (_) {}
  }

  // 2) Caminhos candidatos no ambiente empacotado (Electron)
  const candidates = [];
  if (process.resourcesPath) {
    candidates.push(
      path.join(
        process.resourcesPath,
        "app.asar.unpacked",
        "node_modules",
        "puppeteer",
        ".local-chromium"
      )
    );
    // Novas versões usam cache/browsers; tentar também uma pasta extraResources "chromium"
    candidates.push(path.join(process.resourcesPath, "chromium"));
  }
  // 3) Caminho em dev
  candidates.push(
    path.join(__dirname, "..", "node_modules", "puppeteer", ".local-chromium")
  );
  candidates.push(path.join(__dirname, "..", "chromium"));

  for (const root of candidates) {
    const exe = findChromeExe(root);
    if (exe) return exe;
  }

  return null;
}

function resolveSystemChromium() {
  const pf = process.env["PROGRAMFILES"] || "C:/Program Files";
  const pf86 = process.env["PROGRAMFILES(X86)"] || "C:/Program Files (x86)";
  const localAppData =
    process.env["LOCALAPPDATA"] || path.join(os.homedir(), "AppData", "Local");

  const candidates = [
    // Google Chrome
    path.join(pf, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(pf86, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
    // Brave
    path.join(pf, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
    path.join(
      pf86,
      "BraveSoftware",
      "Brave-Browser",
      "Application",
      "brave.exe"
    ),
    path.join(
      localAppData,
      "BraveSoftware",
      "Brave-Browser",
      "Application",
      "brave.exe"
    ),
    // Opera
    path.join(pf, "Opera", "launcher.exe"),
    path.join(pf86, "Opera", "launcher.exe"),
    path.join(localAppData, "Programs", "Opera", "launcher.exe"),
    // Vivaldi
    path.join(pf, "Vivaldi", "Application", "vivaldi.exe"),
    path.join(pf86, "Vivaldi", "Application", "vivaldi.exe"),
    path.join(localAppData, "Vivaldi", "Application", "vivaldi.exe"),
    // Microsoft Edge (Chromium)
    path.join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(pf86, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(localAppData, "Microsoft", "Edge", "Application", "msedge.exe"),
    // Cachê padrão do Puppeteer (Chrome for Testing)
    path.join(os.homedir(), ".cache", "puppeteer"),
  ];

  for (const p of candidates) {
    if (p.endsWith("puppeteer")) {
      const exe = findChromeExe(p);
      if (exe) return exe;
    } else {
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

function getLaunchOptions(extra = {}) {
  // 0) Config (prioridade do app) e variável de ambiente
  const cfgPath = getBrowserExecutablePath();
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) {
    return {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: envPath,
      ...extra,
    };
  }
  if (cfgPath && fs.existsSync(cfgPath)) {
    return {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: cfgPath,
      ...extra,
    };
  }

  const exe = resolveBundledChromium();
  const sys = exe ? null : resolveSystemChromium();
  const base = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
  if (exe) base.executablePath = exe;
  else if (sys) base.executablePath = sys;
  return { ...base, ...extra };
}

async function launchBrowser(extra = {}) {
  const opts = getLaunchOptions(extra);
  return puppeteer.launch(opts);
}

module.exports = {
  launchBrowser,
  getLaunchOptions,
  resolveBundledChromium,
};
