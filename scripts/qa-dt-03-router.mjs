import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:4173";
const profiles = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile-375", width: 375, height: 812 },
];

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const failures = [];
const checks = [];

function persistedAuth(role) {
  return JSON.stringify({
    state: {
      accessToken: `qa-${role}-token`,
      refreshToken: `qa-${role}-refresh`,
      user: {
        id: `qa-${role}`,
        name: role === "admin" ? "QA Admin" : "QA User",
        email: `${role}@example.test`,
        avatar_url: null,
        daily_goal_hours: 2,
        role,
        status: "ativo",
        created_at: "2026-09-23T12:00:00Z",
        cpf: null,
        phone: null,
        birth_date: null,
        address_cep: null,
        address_street: null,
        address_number: null,
        address_complement: null,
        address_neighborhood: null,
        address_city: null,
        address_state: null,
      },
    },
    version: 4,
  });
}

async function newPage(profile, role = null) {
  const page = await browser.newPage();
  await page.setViewport({ width: profile.width, height: profile.height, deviceScaleFactor: 1 });
  if (role) {
    await page.evaluateOnNewDocument((value) => {
      localStorage.setItem("aprovingo-auth", value);
    }, persistedAuth(role));
  } else {
    await page.evaluateOnNewDocument(() => localStorage.removeItem("aprovingo-auth"));
  }
  return page;
}

async function inspect({ profile, role, route, expectedPath, expectedSearch = "", reload = false }) {
  const page = await newPage(profile, role);
  const pageErrors = [];
  const routerConsoleIssues = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    const text = message.text();
    if (
      ["error", "warn"].includes(message.type())
      && /(react router|react-router|future flag|no routes matched)/i.test(text)
    ) {
      routerConsoleIssues.push(text);
    }
  });

  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForFunction(
      ({ pathname, search }) => location.pathname === pathname && location.search === search,
      { timeout: 15_000 },
      { pathname: expectedPath, search: expectedSearch },
    );
    if (reload) {
      await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForFunction(
        ({ pathname, search }) => location.pathname === pathname && location.search === search,
        { timeout: 15_000 },
        { pathname: expectedPath, search: expectedSearch },
      );
    }

    const result = await page.evaluate(() => ({
      pathname: location.pathname,
      search: location.search,
      errorBoundary: document.body.innerText.includes("Não foi possível exibir esta página"),
    }));
    const passed = !result.errorBoundary && pageErrors.length === 0 && routerConsoleIssues.length === 0;
    checks.push({ profile: profile.name, role: role ?? "visitor", route, ...result, reload, passed });
    if (!passed) {
      failures.push({ profile: profile.name, role: role ?? "visitor", route, ...result, pageErrors, routerConsoleIssues });
    }
  } catch (error) {
    failures.push({
      profile: profile.name,
      role: role ?? "visitor",
      route,
      currentUrl: page.url(),
      error: error instanceof Error ? error.message : String(error),
      pageErrors,
      routerConsoleIssues,
    });
  } finally {
    await page.close();
  }
}

try {
  for (const profile of profiles) {
    await inspect({ profile, role: null, route: "/login", expectedPath: "/login" });
    await inspect({ profile, role: null, route: "/cronograma", expectedPath: "/login" });
    await inspect({ profile, role: "user", route: "/concursos/adicionar", expectedPath: "/planos/novo", expectedSearch: "?origem=catalogo" });
    await inspect({ profile, role: "user", route: "/admin/editais", expectedPath: "/dashboard" });
    await inspect({ profile, role: "admin", route: "/admin/editais", expectedPath: "/admin/editais" });
    await inspect({ profile, role: "user", route: "/revisoes?grupo=atrasadas", expectedPath: "/revisoes", expectedSearch: "?grupo=atrasadas", reload: true });
    await inspect({ profile, role: null, route: "/rota-inexistente", expectedPath: "/" });
    await inspect({ profile, role: "user", route: "/rota-inexistente", expectedPath: "/dashboard" });
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(JSON.stringify({ passed: false, failures, checks }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ passed: true, checks: checks.length, profiles: profiles.map(({ name, width }) => ({ name, width })) }, null, 2));
}
