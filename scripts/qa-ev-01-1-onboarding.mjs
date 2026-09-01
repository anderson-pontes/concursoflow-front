import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const email = process.env.QA_EMAIL || "seed@example.com";
const password = process.env.QA_PASSWORD || "Seed@2026";
const editalId = "10000000-0000-4000-8000-000000000001";
const versionId = "10000000-0000-4000-8000-000000000002";
const cargoId = "10000000-0000-4000-8000-000000000003";
const concursoId = "10000000-0000-4000-8000-000000000004";
const edital = {
  id: editalId,
  nome: "Concurso QA Nacional",
  orgao: "Órgão QA",
  banca: "Banca QA",
  logo_url: null,
  url_oficial: null,
  status: "publicado",
  versao_atual: {
    id: versionId,
    numero: "1",
    status: "publicado",
    publicada_em: "2026-09-01T12:00:00Z",
    data_prova: "2026-12-15",
    cargos: [{
      id: cargoId,
      nome: "Analista QA",
      ordem: 0,
      disciplinas: [{
        id: "10000000-0000-4000-8000-000000000005",
        nome: "Qualidade de Software",
        sigla: "QS",
        ordem: 0,
        topicos_total: 2,
        topicos: [
          { id: "topic-1", descricao: "Testes automatizados", ordem: 0, peso: 1 },
          { id: "topic-2", descricao: "Acessibilidade", ordem: 1, peso: 1 },
        ],
      }],
    }],
  },
};

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const failures = [];
let authSnapshot = "";

function json(body, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify(body) };
}

async function clickButton(page, label) {
  await page.waitForFunction((text) => [...document.querySelectorAll("button")].some((node) => node.textContent?.trim().includes(text) && !node.disabled), { timeout: 15000 }, label);
  await page.evaluate((text) => [...document.querySelectorAll("button")].find((node) => node.textContent?.trim().includes(text) && !node.disabled)?.click(), label);
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.type("#login-email", email);
  await page.type("#login-password", password);
  await Promise.all([
    page.waitForFunction(() => location.pathname.includes("/dashboard"), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function runViewport(profile) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  let previewAttempts = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("favicon.ico") && !message.text().includes("503 (Service Unavailable)")) errors.push(message.text());
  });
  await page.setViewport({ width: profile.width, height: profile.height });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate((auth) => localStorage.setItem("aprovingo-auth", auth), authSnapshot);
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    if (!path.startsWith("/api/v1/")) return request.continue();
    if (request.method() === "GET" && path.endsWith("/catalogo/editais")) return request.respond(json({ items: [edital], page: 1, page_size: 8, total: 1, total_pages: 1 }));
    if (request.method() === "GET" && path.endsWith(`/catalogo/editais/${editalId}`)) return request.respond(json(edital));
    if (request.method() === "POST" && path.endsWith("/concursos/planejamento/preview")) {
      previewAttempts += 1;
      if (previewAttempts === 1) return request.respond(json({ detail: "indisponível" }, 503));
      return request.respond(json({
        sessoes: [{ disciplina_id: edital.versao_atual.cargos[0].disciplinas[0].id, disciplina_nome: "Qualidade de Software", data: "2026-09-02", dia_semana: 2, duracao_minutos: 50, ordem: 0 }],
        minutos_totais: 50,
        carga_semanal_minutos: 300,
        prioridades: { "Qualidade de Software": 5 },
      }));
    }
    if (request.method() === "POST" && path.endsWith("/concursos/planejamento/confirmar")) return request.respond(json({
      concurso_id: concursoId,
      criado: true,
      disciplinas_criadas: 1,
      topicos_criados: 2,
      sessoes_planejadas: 1,
      preview: { sessoes: [], minutos_totais: 50, carga_semanal_minutos: 300, prioridades: {} },
    }));
    if (request.method() === "GET" && path.endsWith("/concursos")) return request.respond(json([]));
    if (request.method() === "GET" && path.endsWith("/telemetry/preference")) return request.respond(json({ opted_out: true }));
    if (request.method() === "POST" && path.endsWith("/telemetry/events")) return request.respond(json({ accepted: 0 }, 202));
    return request.continue();
  });

  try {
    await page.goto(`${baseUrl}/planos/novo?origem=catalogo`, { waitUntil: "networkidle2", timeout: 60000 });
    await clickButton(page, "Selecionar edital");
    await page.click('[role="radio"]');
    await new Promise((resolve) => setTimeout(resolve, 500));
    await page.reload({ waitUntil: "networkidle2" });
    await clickButton(page, "Retomar rascunho");
    await page.waitForSelector('[role="radio"][aria-checked="true"]');
    await clickButton(page, "Continuar");
    await page.waitForFunction(() => document.body.innerText.includes("Escolha disciplinas e tópicos"));
    await clickButton(page, "Continuar");
    await page.waitForFunction(() => document.body.innerText.includes("Como organizar seus estudos?"));
    await clickButton(page, "Continuar");
    await page.waitForFunction(() => document.body.innerText.includes("Revise a disponibilidade"), { timeout: 15000 });
    await clickButton(page, "Continuar");
    await page.waitForFunction(() => document.body.innerText.includes("Seu plano está pronto para confirmar"), { timeout: 15000 });
    const review = await page.evaluate(() => ({
      text: document.querySelector("main")?.textContent ?? "",
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    if (!review.text.includes("Órgão QA") || !review.text.includes("Banca QA") || !review.text.includes("1 disciplinas · 2 tópicos") || review.overflow) {
      failures.push({ profile: profile.name, stage: "review", review });
    }
    await clickButton(page, "Confirmar e ativar");
    await page.waitForFunction(() => document.querySelector("main h1")?.textContent?.trim() === "Seu plano está pronto", { timeout: 15000 });
    const success = await page.evaluate(() => ({
      hasFirstAction: [...document.querySelectorAll("button")].some((node) => node.textContent?.includes("Ver próxima ação")),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    if (!success.hasFirstAction || success.overflow || previewAttempts !== 2) failures.push({ profile: profile.name, stage: "success", success, previewAttempts });
  } catch (error) {
    failures.push({ profile: profile.name, stage: "exception", error: String(error) });
  } finally {
    if (errors.length) failures.push({ profile: profile.name, stage: "console", errors });
    await context.close();
  }
}

try {
  const authContext = await browser.createBrowserContext();
  const authPage = await authContext.newPage();
  await login(authPage);
  authSnapshot = await authPage.evaluate(() => localStorage.getItem("aprovingo-auth") ?? "");
  await authContext.close();
  if (!authSnapshot) throw new Error("Sessão QA não foi persistida após o login.");
  for (const profile of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile-360", width: 360, height: 800 },
    { name: "mobile-375", width: 375, height: 812 },
  ]) await runViewport(profile);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ passed: failures.length === 0, failures }, null, 2));
if (failures.length) process.exitCode = 1;
