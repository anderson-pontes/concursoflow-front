import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const email = process.env.QA_EMAIL || "seed@example.com";
const password = process.env.QA_PASSWORD || "Seed@2026";
const screenshotDir = process.env.QA_SCREENSHOT_DIR ? resolve(process.env.QA_SCREENSHOT_DIR) : null;
if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });
const contest = {
  id: "20000000-0000-4000-8000-000000000001",
  nome: "Concurso Dashboard QA",
  orgao: "Órgão QA",
  cargo: "Analista QA",
  data_prova: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
};
const discipline = {
  id: "20000000-0000-4000-8000-000000000002",
  nome: "Qualidade de Software",
  concurso_ids: [contest.id],
  topicos_total: 10,
  topicos_estudados: 4,
};
const topicId = "20000000-0000-4000-8000-000000000003";
const blockId = "20000000-0000-4000-8000-000000000004";
const today = new Date();
const iso = today.toISOString().slice(0, 10);
const day = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][today.getDay()];
const block = { id: blockId, user_id: "qa", disciplina_id: discipline.id, topico_id: topicId, topico_ids: [topicId], topico_nome: "Testes automatizados", dia_semana: day, hora_inicio: "08:00", hora_fim: "08:50", tipo: "estudo", ativo: true };

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const failures = [];
let authSnapshot = "";

function json(body, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify(body) };
}

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

async function runProfile(profile) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("favicon.ico")) errors.push(message.text());
  });
  await page.setViewport({ width: profile.width, height: profile.height });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate((auth) => {
    localStorage.setItem("aprovingo-auth", auth);
    localStorage.setItem("aprovingo-concurso", JSON.stringify({ state: { concursoAtivoId: null }, version: 0 }));
  }, authSnapshot);
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    if (!path.startsWith("/api/v1/")) return request.continue();
    if (request.method() === "GET" && path.endsWith("/concursos")) return request.respond(json([contest]));
    if (request.method() === "GET" && path.endsWith("/disciplinas")) return request.respond(json([discipline]));
    if (request.method() === "GET" && path.endsWith("/dashboard/resumo")) return request.respond(json({ horas_hoje: 1, meta_horas: 2, horas_semana: 5, sessoes_semana: 6, questoes_semana: 120, rendimento_medio: 82, avisos_proximos: 0, flashcards_para_revisar: 3, streak_dias: 4, taxa_cumprimento_mes: 70, minutos_planejados_mes: 600, minutos_realizados_mes: 420 }));
    if (request.method() === "GET" && path.endsWith("/dashboard/proximo-estudo")) return request.respond(json({ item_id: blockId, concurso_id: contest.id, disciplina_id: discipline.id, disciplina_nome: discipline.nome, topico_id: topicId, topico_nome: "Testes automatizados", data: iso, duracao_minutos: 50, sessoes_recentes: 2 }));
    if (request.method() === "GET" && path.endsWith("/dashboard/revisoes-pendentes")) return request.respond(json({ total: 1, items: [{ disciplina_id: discipline.id, disciplina_nome: discipline.nome, topico_id: topicId, topico_nome: "Acessibilidade", data_prevista: iso, dias_atraso: 2 }] }));
    if (request.method() === "GET" && path.endsWith("/dashboard/heatmap")) return request.respond(json([{ date: iso, count: 1, minutes: 50 }]));
    if (request.method() === "GET" && path.endsWith("/cronograma/blocos")) return request.respond(json([block]));
    if (request.method() === "GET" && path.endsWith("/cronograma/calendario")) return request.respond(json({ ano: today.getFullYear(), mes: today.getMonth() + 1, timezone: "America/Sao_Paulo", resumo_mes: { dias_com_planejamento: 1, dias_cumpridos: 0, dias_parciais: 0, dias_nao_cumpridos: 0, dias_estudou_sem_plano: 0, minutos_planejados: 50, minutos_realizados: 0, taxa_cumprimento_pct: 0 }, dias: [] }));
    if (request.method() === "GET" && path.endsWith(`/avisos/concurso/${contest.id}`)) return request.respond(json([]));
    if (request.method() === "GET" && path.endsWith("/telemetry/preference")) return request.respond(json({ opted_out: true }));
    if (request.method() === "POST" && path.endsWith("/telemetry/events")) return request.respond(json({ accepted: 0 }, 202));
    return request.continue();
  });

  try {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForFunction((name) => document.querySelector("main h1")?.textContent?.includes(name), { timeout: 30000 }, contest.nome);
    const audit = await page.evaluate(() => {
      const main = document.querySelector("main");
      const headings = [...(main?.querySelectorAll("h1, h2") ?? [])].map((node) => node.textContent?.trim() ?? "");
      const start = [...(main?.querySelectorAll("a") ?? [])].find((node) => node.textContent?.includes("Iniciar estudo"));
      const primaryLinks = [...(main?.querySelectorAll("a") ?? [])].filter((node) => node.className.includes("bg-primary"));
      return {
        h1Count: main?.querySelectorAll("h1").length ?? 0,
        headings,
        startHref: start?.getAttribute("href") ?? "",
        primaryLinkCount: primaryLinks.length,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        errorBoundary: document.body.innerText.includes("Não foi possível exibir esta página"),
      };
    });
    if (screenshotDir) await page.screenshot({ path: resolve(screenshotDir, `${profile.name}.png`), fullPage: true });
    const expectedOrder = [contest.nome, "Qualidade de Software", "Plano de hoje", "Meta semanal", "Revisões urgentes", "Visão complementar"];
    const indexes = expectedOrder.map((label) => audit.headings.findIndex((heading) => heading.includes(label)));
    const ordered = indexes.every((index, position) => index >= 0 && (position === 0 || index > indexes[position - 1]));
    const expectedHref = `/pomodoro?from=dashboard&disciplina_id=${discipline.id}&minutos=50&topico_id=${topicId}`;
    if (audit.h1Count !== 1 || !ordered || audit.startHref !== expectedHref || audit.primaryLinkCount !== 1 || audit.overflow || audit.errorBoundary || errors.length) {
      failures.push({ profile: profile.name, audit, expectedOrder, indexes, errors });
    }
  } catch (error) {
    failures.push({ profile: profile.name, error: String(error), errors });
  } finally {
    await context.close();
  }
}

try {
  const authContext = await browser.createBrowserContext();
  const authPage = await authContext.newPage();
  await login(authPage);
  authSnapshot = await authPage.evaluate(() => localStorage.getItem("aprovingo-auth") ?? "");
  await authContext.close();
  if (!authSnapshot) throw new Error("Sessão QA não persistida após login.");
  for (const profile of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile-360", width: 360, height: 800 },
    { name: "mobile-375", width: 375, height: 812 },
  ]) await runProfile(profile);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ passed: failures.length === 0, failures }, null, 2));
if (failures.length) process.exitCode = 1;
