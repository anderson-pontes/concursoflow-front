import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const email = process.env.QA_EMAIL || "seed@example.com";
const password = process.env.QA_PASSWORD || "Seed@2026";
const contestB = { id: "00000000-0000-4000-8000-000000000002", nome: "Contexto B", orgao: "ÓRGÃO B", cargo: "CARGO B", data_prova: null };
const disciplineB = { id: "00000000-0000-4000-8000-000000000012", nome: "DISCIPLINA EXCLUSIVA B", sigla: "DEB", peso: 5, total_pontos: 10, prioridade_calculada: 5, dominio_medio_pct: 0, ordem: 1, concurso_ids: [contestB.id], topicos_total: 1, topicos_estudados: 0, total_questoes_prova: 10 };
const today = new Date();
const iso = today.toISOString().slice(0, 10);
const dayKeys = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const blockB = { id: "00000000-0000-4000-8000-000000000022", disciplina_id: disciplineB.id, dia_semana: dayKeys[today.getDay()], hora_inicio: "08:00", hora_fim: "09:00", tipo: "estudo", ativo: true, topico_id: null, topico_ids: [], topico_nome: null, modo_criacao: "analitica" };

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const failures = [];
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("favicon.ico")) errors.push(message.text()); });

async function login() {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  if (!page.url().includes("/login")) return;
  await page.type("#login-email", email);
  await page.type("#login-password", password);
  await Promise.all([
    page.waitForFunction(() => location.pathname.includes("/dashboard"), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
}

try {
  await login();
  const contestsA = await page.evaluate(async () => {
    const persisted = JSON.parse(localStorage.getItem("aprovingo-auth") || "{}");
    const token = persisted?.state?.accessToken;
    const response = await fetch("/api/v1/concursos", { headers: { Authorization: `Bearer ${token}` } });
    return response.json();
  });
  if (!Array.isArray(contestsA) || !contestsA.length) throw new Error("Conta QA sem concurso A real.");
  const contestA = contestsA[0];

  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const isB = url.searchParams.get("concurso_id") === contestB.id || path.endsWith(`/avisos/concurso/${contestB.id}`);
    if (request.method() === "GET" && path.endsWith("/api/v1/concursos")) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify([contestA, contestB]) });
    if (!isB) return request.continue();
    if (path.endsWith("/disciplinas/paginadas")) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [disciplineB], total: 1, page: 1, page_size: 9, total_pages: 1, summary: { total: 1, em_progresso: 0, no_concurso: 1, fora_concurso: 0, progresso_medio: 0 } }) });
    if (path.endsWith("/disciplinas")) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify([disciplineB]) });
    if (path.endsWith("/dashboard/resumo")) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ horas_hoje: 0, meta_horas: 4, horas_semana: 0, sessoes_semana: 0, questoes_semana: 0, rendimento_medio: 0, avisos_proximos: 0, flashcards_para_revisar: 0, streak_dias: 0, taxa_cumprimento_mes: 0, minutos_planejados_mes: 60, minutos_realizados_mes: 0 }) });
    if (path.endsWith("/dashboard/proximo-estudo")) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ item_id: blockB.id, concurso_id: contestB.id, disciplina_id: disciplineB.id, disciplina_nome: disciplineB.nome, topico_id: null, topico_nome: null, data: iso, duracao_minutos: 60, sessoes_recentes: 0 }) });
    if (path.endsWith("/dashboard/revisoes-pendentes")) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ total: 0, items: [] }) });
    if (path.endsWith("/cronograma/blocos")) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify([blockB]) });
    if (path.endsWith("/cronograma/calendario")) return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ ano: today.getFullYear(), mes: today.getMonth() + 1, timezone: "America/Sao_Paulo", resumo_mes: { dias_com_planejamento: 1, dias_cumpridos: 0, dias_parciais: 0, dias_nao_cumpridos: 0, dias_estudou_sem_plano: 0, minutos_planejados: 60, minutos_realizados: 0, taxa_cumprimento_pct: 0 }, dias: [{ data: iso, status: "futuro", minutos_planejados: 60, minutos_realizados: 0, minutos_extra: 0, sessoes_realizadas: 0, planejado: [{ fonte: "bloco_semanal", id: blockB.id, disciplina_id: disciplineB.id, disciplina_nome: disciplineB.nome, topico_id: null, topico_nome: null, duracao_minutos: 60 }] }] }) });
    if (path.endsWith(`/avisos/concurso/${contestB.id}`)) return request.respond({ status: 200, contentType: "application/json", body: "[]" });
    return request.continue();
  });

  for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
    console.log(`audit:${viewport.name}:dashboard`);
    await page.setViewport({ width: viewport.width, height: viewport.height });
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle2", timeout: 60000 });
    if (viewport.name === "desktop") {
      await page.click('button[aria-haspopup="listbox"]');
    } else {
      await page.evaluate(() => document.querySelector('button[aria-haspopup="listbox"]')?.click());
    }
    await page.waitForSelector('[role="option"]');
    if (viewport.name === "desktop") {
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
    } else {
      await page.evaluate((label) => [...document.querySelectorAll('[role="option"]')].find((node) => node.textContent?.includes(label))?.click(), contestB.orgao);
    }
    console.log(`audit:${viewport.name}:waiting-context-b`);
    await page.waitForFunction((label) => document.body.innerText.includes(label), { timeout: 30000 }, disciplineB.nome);

    for (const route of ["/cronograma", "/estudos/calendario", "/disciplinas"]) {
      console.log(`audit:${viewport.name}:${route}`);
      await page.evaluate((href) => document.querySelector(`a[href="${href}"]`)?.click(), route);
      await page.waitForFunction((expected) => location.pathname === expected, { timeout: 30000 }, route);
      await new Promise((resolve) => setTimeout(resolve, 750));
      const audit = await page.evaluate((labelA) => ({
        path: location.pathname,
        hasOldContext: document.querySelector("main")?.textContent?.includes(labelA) ?? false,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        errorBoundary: document.body.innerText.includes("Não foi possível exibir esta página"),
      }), contestA.orgao);
      if (audit.hasOldContext || audit.overflow || audit.errorBoundary) failures.push({ viewport: viewport.name, route, ...audit });
    }
  }
} finally {
  await browser.close();
}

if (errors.length) failures.push({ errors });
console.log(JSON.stringify({ passed: failures.length === 0, failures }, null, 2));
if (failures.length) process.exitCode = 1;
