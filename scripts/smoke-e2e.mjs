import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const email = process.env.QA_EMAIL || "seed@example.com";
const password = process.env.QA_PASSWORD || "Seed@2026";
const routes = ["/dashboard", "/cronograma", "/flashcards", "/configuracoes/estudos"];

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const failures = [];

try {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  if (page.url().includes("/login")) {
    await page.type("#login-email", email);
    await page.type("#login-password", password);
    await Promise.all([
      page.waitForFunction(() => location.pathname.includes("/dashboard"), { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);
  }

  for (const route of routes) {
    const errors = [];
    const onPageError = (error) => errors.push(error.message);
    page.on("pageerror", onPageError);
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle2", timeout: 60000 });
    const result = await page.evaluate(() => ({
      path: location.pathname,
      h1: document.querySelector("main h1")?.textContent?.trim() ?? "",
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      errorBoundary: document.body.innerText.includes("Não foi possível exibir esta página"),
    }));
    page.off("pageerror", onPageError);
    if (result.path !== route || !result.h1 || result.overflow || result.errorBoundary || errors.length) {
      failures.push({ route, ...result, errors });
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(JSON.stringify({ passed: false, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ passed: true, routes }, null, 2));
}
