import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer";

// Exclusivamente localhost, APIs interceptadas. Não acessa dados de produção.
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
assert.ok(['127.0.0.1','localhost'].includes(new URL(baseUrl).hostname));
const output = new URL(process.env.QA_VARIANT === 'redesign' ? "../docs/qa/cronograma-redesign/incremental/" : "../docs/qa/cronograma-manual/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const results = [];
const profiles = [{ name: "desktop", width: 1440, height: 900 }, { name: "tablet", width: 768, height: 1024 }, { name: "mobile", width: 375, height: 812 }];
const names = ["Direito Constitucional", "Língua Portuguesa", "Banco de Dados", "Raciocínio Lógico"];
const disciplines = names.map((nome, index) => ({ id: `disc-${index}`, nome, concurso_ids: ["contest"] }));
const json = data => ({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
async function clickText(page, text) {
  await page.waitForFunction(label => [...document.querySelectorAll("button,[role=tab]")].some(el => el.textContent?.trim() === label), {}, text);
  const handle = await page.evaluateHandle(label => [...document.querySelectorAll("button,[role=tab]")].find(el => el.textContent?.trim() === label), text);
  await handle.asElement().click();
  await handle.dispose();
}
async function expectText(page, text) { await page.waitForFunction(value => document.body.innerText.includes(value), {}, text); }
async function screenshot(page, name) {
  await page.screenshot({ path: new URL(`${name}.png`, output).pathname.replace(/^\/(?=[A-Za-z]:)/, ""), fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${name}: overflow horizontal`);
}
try {
  for (const profile of profiles) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const errors = [];
    let plan = null;
    let blocks = [];
    let createCount = 0;
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewport({ width: profile.width, height: profile.height });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("aprovingo-auth", JSON.stringify({ state: { accessToken: "qa-local", refreshToken: "qa-local", user: { id: "user", name: "QA Local", email: "qa@example.invalid", daily_goal_hours: 2, role: "user", status: "ativo", created_at: "2026-10-09" } }, version: 4 }));
      localStorage.setItem("cf-concurso-ativo", JSON.stringify({ state: { concursoAtivoId: "contest" }, version: 0 }));
    });
    await page.setRequestInterception(true);
    page.on("request", async request => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/api/v1/")) {
        if (url.origin !== baseUrl) return request.abort();
        return request.continue();
      }
      const path = url.pathname.replace("/api/v1", "");
      const method = request.method();
      const body = request.postData() ? JSON.parse(request.postData()) : {};
      if (path === "/concursos") return request.respond(json([{ id: "contest", nome: "Concurso QA", orgao: "Órgão", cargo: "Analista" }]));
      if (path === "/disciplinas") return request.respond(json(disciplines));
      if (path === "/cronograma/planejamento" && method === "GET") return request.respond(json(plan));
      if (path === "/cronograma/planejamento" && method === "POST") { createCount++; plan = { ...body, id: "plan", user_id: "user", ativo: true, tipo: "manual", disciplinas: [] }; return request.respond(json(plan)); }
      if (path === "/cronograma/planejamento/plan/disciplinas") { plan.disciplinas.push(...body.disciplina_ids.map((id, ordem) => ({ disciplina_id: id, nome: disciplines.find(d => d.id === id).nome, ordem }))); return request.respond(json(plan)); }
      if (path.endsWith("/distribuicao")) {
        const counts = {};
        blocks.push(...body.disciplina_ids.flatMap(id => Array.from({ length: body.sessoes_por_semana }, (_, i) => {
          const day = body.dias_semana[i % body.dias_semana.length];
          const start = 480 + (counts[day] ?? 0) * body.duracao_minutos; counts[day] = (counts[day] ?? 0) + 1;
          const time = value => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
          return { id: `b-${id}-${i}`, user_id: "user", disciplina_id: id, cronograma_id: "plan", concurso_id: "contest", dia_semana: day, hora_inicio: time(start), hora_fim: time(start + body.duracao_minutos), tipo: "estudo", ativo: true, modo_criacao: "analitica", vigencia_inicio: plan.data_inicio, vigencia_fim: null, vigencia_indeterminada: true };
        })));
        return request.respond(json({ blocos: blocks }));
      }
      if (path.endsWith("/atividades")) {
        const start = new Date(`${url.searchParams.get("inicio")}T12:00:00`);
        const days = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
        return request.respond(json(blocks.map(b => { const d = new Date(start); d.setDate(d.getDate() + days.indexOf(b.dia_semana)); return { ...b, data: d.toISOString().slice(0, 10), fonte: "bloco_semanal", bloco_cronograma_id: b.id }; })));
      }
      if (path === "/cronograma/blocos") return request.respond(json(blocks));
      if (path.endsWith("/resumo") && path.includes("cronograma")) return request.respond(json({ minutos_planejados_semana: blocks.length * 60, minutos_estudados_semana: 0, disciplinas_count: plan.disciplinas.length, atividades_planejadas: blocks.length, atividades_concluidas: 0, progresso_pct: 0, questoes_total: 0, acertos: 0, erros: 0, rendimento_pct: 0, disciplinas: plan.disciplinas.map(d => ({ disciplina_id: d.disciplina_id, minutos_planejados: 60, minutos_estudados: 0, sessoes_semana: 1, progresso_pct: 0 })) }));
      if (path === "/dashboard/resumo") return request.respond(json({ horas_hoje: 0, meta_horas: 10, horas_semana: 0, sessoes_semana: 0, rendimento_medio: 0, flashcards_para_revisar: 0, streak_dias: 0 }));
      if (path === "/notifications/unread-count") return request.respond(json({ count: 0 }));
      if (path === "/telemetry/preference") return request.respond(json({ opted_out: true }));
      if (path === "/auth/me") return request.respond(json({ id: "user", name: "QA Local", email: "qa@example.invalid", role: "user", status: "ativo", daily_goal_hours: 2 }));
      return request.respond(json([]));
    });
    try {
      await page.goto(`${baseUrl}/cronograma`, { waitUntil: "networkidle2" });
      await clickText(page, "Criar cronograma");
      await page.click('[aria-label="Manual: cria um cronograma e adiciona disciplinas incrementalmente"]');
      await screenshot(page, `${profile.name}-cadastro`);
      await clickText(page, "Criar cronograma manual");
      await expectText(page, "Seu cronograma está pronto!");
      await clickText(page, "Adicionar disciplinas");
      await screenshot(page, `${profile.name}-disciplinas-selecao`);
      await page.evaluate(() => [...document.querySelectorAll('[role=dialog] input[type=checkbox]')].slice(0, 3).forEach(el => el.click()));
      await clickText(page, "Adicionar 3 disciplinas");
      await expectText(page, "Configuração rápida");
      await clickText(page, "Configuração rápida");
      await screenshot(page, `${profile.name}-distribuicao`);
      await clickText(page, "Salvar distribuição");
      await page.waitForFunction(() => !document.querySelector('[role=dialog]'));
      await screenshot(page, `${profile.name}-disciplinas`);
      await clickText(page, "Calendário");
      await clickText(page, "Próxima semana");
      await page.waitForSelector('[role="article"][aria-label^="Bloco de estudo:"]');
      await screenshot(page, `${profile.name}-calendario`);
      await page.reload({ waitUntil: "networkidle2" });
      assert.equal(createCount, 1);
      assert.equal(plan.disciplinas.length, 3);
      assert.ok(blocks.length >= 3);
      await clickText(page, "Adicionar disciplinas");
      await page.evaluate(() => [...document.querySelectorAll('[role=dialog] input[type=checkbox]')].find(el => !el.disabled)?.click());
      await clickText(page, "Adicionar 1 disciplina");
      await page.waitForFunction(() => !document.querySelector('[role=dialog]'));
      assert.equal(plan.disciplinas.length, 4);
      assert.equal(createCount, 1);
      await clickText(page, "Atividades");
      await screenshot(page, `${profile.name}-atividades`);
      await clickText(page, "Desempenho");
      await expectText(page, "Nenhum estudo registrado nesta semana");
      await screenshot(page, `${profile.name}-desempenho`);
      assert.deepEqual(errors, []);
      results.push({ profile: profile.name, passed: true, createCount, disciplineCount: plan.disciplinas.length, blocks: blocks.length, overflow: false });
    } catch (error) { results.push({ profile: profile.name, passed: false, error: String(error), errors }); }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(new URL("smoke-results.json", output), JSON.stringify({ mocked: true, results }, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.some(r => !r.passed)) process.exitCode = 1;
