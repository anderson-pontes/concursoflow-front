import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { auditPassed, isAdminRoute, validateRouteAudit } from "./qa-ux-audit-helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "docs", "qa", "ux-ui");
const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const email = process.env.QA_EMAIL || "seed@example.com";
const password = process.env.QA_PASSWORD || "Seed@2026";
const adminEmail = process.env.QA_ADMIN_EMAIL;
const adminPassword = process.env.QA_ADMIN_PASSWORD;
const routes = ["/dashboard", "/cronograma", "/pomodoro", "/estudos/historico", "/concursos", "/disciplinas", "/mapas-mentais", "/flashcards", "/configuracoes/estudos"];
const adminRoutes = ["/admin/usuarios"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

mkdirSync(outputDir, { recursive: true });

async function login(page, credentials) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  }).catch(() => undefined);
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  if (!page.url().includes("/login")) return;
  await page.type("#login-email", credentials.email);
  await page.type("#login-password", credentials.password);
  await Promise.all([
    page.waitForFunction(() => location.pathname.includes("/dashboard"), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
}

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const configurationErrors = [];
if (!adminEmail || !adminPassword) {
  configurationErrors.push("Defina QA_ADMIN_EMAIL e QA_ADMIN_PASSWORD para auditar rotas administrativas.");
}
const report = { generatedAt: new Date().toISOString(), baseUrl, configurationErrors, results: [] };

async function auditRoutes(profile, credentials, targetRoutes) {
  await login(page, credentials);
  for (const viewport of viewports) {
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    for (const route of targetRoutes) {
      const pageErrors = [];
      const consoleErrors = [];
      const onPageError = (error) => pageErrors.push(error.message);
      const onConsole = (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      };
      page.on("pageerror", onPageError);
      page.on("console", onConsole);

      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const audit = await page.evaluate(() => {
        const visible = (node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
        };
        const interactive = [...document.querySelectorAll("button, a, input, textarea, [role=button]")].filter(visible);
        const unnamed = interactive.filter((node) => {
          const text = node.textContent?.trim();
          const id = node.getAttribute("id");
          const associatedLabel = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
          const wrappingLabel = node.closest("label");
          return !text && !node.getAttribute("aria-label") && !node.getAttribute("title") && !associatedLabel && !wrappingLabel;
        });
        const undersized = interactive.filter((node) => {
          if (node.classList.contains("sr-only") || node.closest(".sr-only")) return false;
          const rect = node.getBoundingClientRect();
          const isInlineLink = node.tagName === "A" && getComputedStyle(node).display === "inline";
          return !isInlineLink && (rect.width < 40 || rect.height < 40);
        });
        const scrollContainers = [...document.querySelectorAll("*")]
          .filter((node) => {
            const style = getComputedStyle(node);
            return visible(node) && /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 8;
          })
          .slice(0, 4)
          .map((node, index) => ({ index, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight }));
        return {
          pathname: location.pathname,
          title: document.title,
          h1Count: document.querySelectorAll("main h1").length,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          unnamedControls: unnamed.length,
          undersizedTargets: undersized.length,
          errorBoundary: document.body.innerText.includes("Não foi possível exibir esta página"),
          unnamedSamples: unnamed.slice(0, 8).map((node) => node.outerHTML.slice(0, 240)),
          undersizedSamples: undersized.slice(0, 8).map((node) => {
            const rect = node.getBoundingClientRect();
            return { width: Math.round(rect.width), height: Math.round(rect.height), html: node.outerHTML.slice(0, 180) };
          }),
          scrollContainers,
          bodyText: document.body.innerText.slice(0, 160),
        };
      });

      const slug = route === "/dashboard" ? "dashboard" : route.slice(1).replaceAll("/", "-");
      const screenshot = `${viewport.name}-${slug}.png`;
      await page.screenshot({ path: join(outputDir, screenshot), fullPage: true });
      const scrollScreenshots = [];
      for (const container of audit.scrollContainers) {
        await page.evaluate((index) => {
          const visible = (node) => {
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
          };
          const nodes = [...document.querySelectorAll("*")].filter((node) => {
            const style = getComputedStyle(node);
            return visible(node) && /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 8;
          });
          if (nodes[index]) nodes[index].scrollTop = nodes[index].scrollHeight;
        }, container.index);
        const scrollShot = `${viewport.name}-${slug}-scroll-${container.index + 1}.png`;
        await page.screenshot({ path: join(outputDir, scrollShot) });
        scrollScreenshots.push(scrollShot);
      }

      page.off("pageerror", onPageError);
      page.off("console", onConsole);
      const filteredConsoleErrors = consoleErrors.filter((message) => !message.includes("favicon.ico"));
      const failures = validateRouteAudit({ route, ...audit, pageErrors, consoleErrors: filteredConsoleErrors });
      report.results.push({ profile, viewport: viewport.name, route, screenshot, scrollScreenshots, pageErrors, consoleErrors: filteredConsoleErrors, failures, ...audit });
    }
  }
}

try {
  await auditRoutes("user", { email, password }, routes.filter((route) => !isAdminRoute(route)));
  if (adminEmail && adminPassword) await auditRoutes("admin", { email: adminEmail, password: adminPassword }, adminRoutes);
} finally {
  await browser.close();
}

report.passed = auditPassed(report.results, report.configurationErrors);
writeFileSync(join(outputDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
