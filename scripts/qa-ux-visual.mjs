import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "docs", "qa", "ux-ui");
const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const email = process.env.QA_EMAIL || "seed@example.com";
const password = process.env.QA_PASSWORD || "Seed@2026";
const routes = ["/dashboard", "/cronograma", "/pomodoro", "/estudos/historico", "/concursos", "/disciplinas", "/mapas-mentais"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

mkdirSync(outputDir, { recursive: true });

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  if (!page.url().includes("/login")) return;
  await page.type("#login-email", email);
  await page.type("#login-password", password);
  await Promise.all([
    page.waitForFunction(() => location.pathname.includes("/dashboard"), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
}

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const report = { generatedAt: new Date().toISOString(), baseUrl, results: [] };

try {
  await login(page);
  for (const viewport of viewports) {
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const audit = await page.evaluate(() => {
        const interactive = [...document.querySelectorAll("button, a, input, textarea, [role=button]")]
          .filter((node) => {
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
          });
        const unnamed = interactive.filter((node) => {
          const text = node.textContent?.trim();
          const id = node.getAttribute("id");
          const associatedLabel = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
          const wrappingLabel = node.closest("label");
          return !text && !node.getAttribute("aria-label") && !node.getAttribute("title") && !associatedLabel && !wrappingLabel;
        });
        const undersized = interactive.filter((node) => {
          const rect = node.getBoundingClientRect();
          return rect.width < 40 || rect.height < 40;
        });
        return {
          pathname: location.pathname,
          title: document.title,
          h1Count: document.querySelectorAll("main h1").length,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          unnamedControls: unnamed.length,
          undersizedTargets: undersized.length,
          unnamedSamples: unnamed.slice(0, 8).map((node) => node.outerHTML.slice(0, 240)),
          undersizedSamples: undersized.slice(0, 8).map((node) => {
            const rect = node.getBoundingClientRect();
            return { width: Math.round(rect.width), height: Math.round(rect.height), html: node.outerHTML.slice(0, 180) };
          }),
          bodyText: document.body.innerText.slice(0, 160),
        };
      });
      const slug = route === "/dashboard" ? "dashboard" : route.slice(1).replaceAll("/", "-");
      const screenshot = `${viewport.name}-${slug}.png`;
      await page.screenshot({ path: join(outputDir, screenshot), fullPage: true });
      report.results.push({ viewport: viewport.name, route, screenshot, ...audit });
    }
  }
} finally {
  await browser.close();
}

report.passed = report.results.every((item) => !item.horizontalOverflow && item.h1Count === 1 && item.unnamedControls === 0);
writeFileSync(join(outputDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
