import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const email = process.env.QA_EMAIL || "seed@example.com";
const password = process.env.QA_PASSWORD || "Seed@2026";
const adminEmail = process.env.QA_ADMIN_EMAIL;
const adminPassword = process.env.QA_ADMIN_PASSWORD;
const requireAdmin = process.env.QA_REQUIRE_ADMIN === "1";
const publicRoutes = ["/", "/login", "/register"];
const routes = [
  "/dashboard", "/concursos", "/disciplinas", "/cronograma", "/estudos/calendario",
  "/estudos/historico", "/pomodoro", "/avisos", "/flashcards", "/mapas-mentais", "/configuracoes/estudos",
];
const adminRoutes = ["/admin/usuarios", "/admin/editais"];

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const failures = [];
const warnings = [];

async function login(targetPage, credentials) {
  await targetPage.goto(`${baseUrl}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  if (!targetPage.url().includes("/login")) return;
  await targetPage.type("#login-email", credentials.email);
  await targetPage.type("#login-password", credentials.password);
  await Promise.all([
    targetPage.waitForFunction(() => location.pathname.includes("/dashboard"), { timeout: 30000 }),
    targetPage.click('button[type="submit"]'),
  ]);
}

async function inspectRoute(targetPage, route, profile) {
  const errors = [];
  const onPageError = (error) => errors.push(error.message);
  targetPage.on("pageerror", onPageError);
  await targetPage.goto(`${baseUrl}${route}`, { waitUntil: "networkidle2", timeout: 60000 });
  const result = await targetPage.evaluate(() => ({
    path: location.pathname,
    h1: document.querySelector("main h1")?.textContent?.trim() ?? "",
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    errorBoundary: document.body.innerText.includes("Não foi possível exibir esta página"),
  }));
  targetPage.off("pageerror", onPageError);
  if (result.path !== route || !result.h1 || result.overflow || result.errorBoundary || errors.length) {
    failures.push({ profile, route, ...result, errors });
  }
}

try {
  const publicContext = await browser.createBrowserContext();
  const publicPage = await publicContext.newPage();
  await publicPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  for (const route of publicRoutes) await inspectRoute(publicPage, route, "public");
  await publicContext.close();

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await login(page, { email, password });

  for (const route of routes) await inspectRoute(page, route, "user");

  await page.goto(`${baseUrl}/admin/usuarios`, { waitUntil: "networkidle2", timeout: 60000 });
  if (new URL(page.url()).pathname === "/admin/usuarios") {
    failures.push({ profile: "user", route: "/admin/usuarios", error: "Usuário comum acessou rota administrativa" });
  }

  if (adminEmail && adminPassword) {
    const adminContext = await browser.createBrowserContext();
    const adminPage = await adminContext.newPage();
    await adminPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await login(adminPage, { email: adminEmail, password: adminPassword });
    for (const route of adminRoutes) await inspectRoute(adminPage, route, "admin");
    await adminContext.close();
  } else {
    const message = "QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD ausentes; smoke administrativo não executado";
    if (requireAdmin) failures.push({ profile: "admin", error: message });
    else warnings.push(message);
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(JSON.stringify({ passed: false, failures, warnings }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ passed: true, publicRoutes, userRoutes: routes, adminRoutes: adminEmail && adminPassword ? adminRoutes : [], warnings }, null, 2));
}
