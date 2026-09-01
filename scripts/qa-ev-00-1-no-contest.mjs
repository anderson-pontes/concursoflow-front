import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const email = process.env.QA_EMAIL || "seed@example.com";
const password = process.env.QA_PASSWORD || "Seed@2026";
const routes = ["/dashboard", "/cronograma"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const contextualPaths = [
  "/dashboard/resumo",
  "/dashboard/heatmap",
  "/dashboard/proximo-estudo",
  "/dashboard/revisoes-pendentes",
  "/disciplinas",
  "/cronograma/blocos",
  "/sessoes-estudo/stats",
  "/avisos/proximos",
];

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const failures = [];
const contextualRequests = [];
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("favicon.ico")) {
    consoleErrors.push(message.text());
  }
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.setRequestInterception(true);
page.on("request", async (request) => {
  const url = new URL(request.url());
  if (request.method() === "GET" && url.pathname.endsWith("/api/v1/concursos")) {
    await request.respond({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
    return;
  }
  if (contextualPaths.some((path) => url.pathname.endsWith(`/api/v1${path}`))) {
    contextualRequests.push(url.pathname);
  }
  await request.continue();
});

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.type("#login-email", email);
  await page.type("#login-password", password);
  await Promise.all([
    page.waitForFunction(() => location.pathname.includes("/dashboard"), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  for (const viewport of viewports) {
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle2", timeout: 60000 });
      const audit = await page.evaluate(() => ({
        heading: document.querySelector("main h1")?.textContent?.trim() ?? "",
        hasPrimaryCta: [...document.querySelectorAll("a")].some((node) => node.textContent?.trim() === "Escolher edital"),
        hasSecondaryCta: [...document.querySelectorAll("a")].some((node) => node.textContent?.trim() === "Cadastrar manualmente"),
        hasResidualAction: [...document.querySelectorAll("button")].some((node) =>
          /criar cronograma|mais ações|agendado|registrar estudo/i.test(node.textContent ?? ""),
        ),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        errorBoundary: document.body.innerText.includes("Não foi possível exibir esta página"),
      }));
      const expectedHeading = route === "/dashboard" ? "Painel" : "Cronograma";
      if (
        audit.heading !== expectedHeading ||
        !audit.hasPrimaryCta ||
        !audit.hasSecondaryCta ||
        audit.hasResidualAction ||
        audit.overflow ||
        audit.errorBoundary
      ) {
        failures.push({ viewport: viewport.name, route, ...audit });
      }
    }
  }
} finally {
  await browser.close();
}

if (contextualRequests.length) failures.push({ contextualRequests });
if (consoleErrors.length) failures.push({ consoleErrors });

const result = { passed: failures.length === 0, routes, viewports: viewports.map(({ name }) => name), failures };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
