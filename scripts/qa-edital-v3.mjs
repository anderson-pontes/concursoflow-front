import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

// Browser-only fixtures: requests never reach a backend or modify real data.
const base = process.env.QA_BASE_URL ?? "http://127.0.0.1:4175";
const mobileV4 = process.env.QA_VARIANT === "v4";
const scrollAudit=process.env.QA_SCROLL_AUDIT==='1';
const output = fileURLToPath(new URL(scrollAudit?'../docs/qa/layout-scroll-edital/':`../docs/qa/edital-${mobileV4 ? "v4" : "v3"}/`, import.meta.url));
const contests = [1, 2].map((n) => ({ id: `00000000-0000-4000-8000-00000000000${n}`, nome: `Concurso ${n}`, orgao: n === 1 ? "Tribunal Regional — acompanhamento do edital" : "Segundo concurso", cargo: "Analista Judiciário — Área Administrativa", status: "ativo", data_prova: null }));
const discipline = { id: "00000000-0000-4000-8000-000000000010", nome: "Português e interpretação de textos administrativos e legislativos", ordem: 1 };
const topic = {
  id: "00000000-0000-4000-8000-000000000020", disciplina_id: discipline.id, disciplina_nome: discipline.nome,
  descricao: "Elementos de construção do texto e seu sentido: coesão, coerência, interpretação e relações semânticas em textos extensos",
  status: "nao_iniciado", numero_ordem: 1, peso: 2, dominio: 1, prioridade: 10,
  ultima_atividade_em: "2026-10-14T14:00:00Z", proxima_revisao_id: null, proxima_revisao_em: null,
  revisao_atrasada: false, dias_atraso: 0, nunca_estudado: false, razoes_atencao: [],
};
const items = [topic, { ...topic, id: "00000000-0000-4000-8000-000000000021", descricao: "Princípios e garantias fundamentais", status: "em_andamento", dominio: 3, revisao_atrasada: true, proxima_revisao_em: "2026-10-15", razoes_atencao: ["REVISAO_ATRASADA"], dias_atraso: 2 }, { ...topic, id: "00000000-0000-4000-8000-000000000022", descricao: "TópicoComNomeSemEspaçosParaValidarQuebraResponsiva".repeat(3), ultima_atividade_em: null, nunca_estudado: true, razoes_atencao: ["NUNCA_ESTUDADO"] }];
const catalog = mobileV4 ? Array.from({ length: 300 }, (_, i) => ({ ...items[i % items.length], id: `00000000-0000-4000-8000-${String(i + 100).padStart(12, "0")}`, descricao: `${items[i % items.length].descricao}${i > 2 ? ` — item ${i + 1}` : ""}`, ...(i % 5 === 4 ? { status: "dominado", dominio: 5 } : {}) })) : items;
let mode = "data";
const queries = [];
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await mkdir(output, { recursive: true });
await page.evaluateOnNewDocument(() => {
  localStorage.setItem("aprovingo-auth", JSON.stringify({ version: 4, state: { accessToken: "browser-qa-only", refreshToken: "browser-qa-only", user: { id: "qa", name: "Validação visual", email: "qa@example.test", role: localStorage.getItem("qa-admin-mode") === "true" ? "admin" : "user", status: "ativo", daily_goal_hours: 2 } } }));
});
await page.setRequestInterception(true);
page.on("request", async (request) => {
  const path = new URL(request.url()).pathname;
  if (!path.startsWith("/api/")) return request.continue();
  let body = [];
  if (path.endsWith("/concursos")) body = contests;
  else if (path.endsWith("/notifications/unread-count")) body = { count: 0 };
  else if (path.endsWith("/pomodoro-config")) body = { mode: "pomodoro", focus_hours: 0, focus_minutes: 25, short_break_minutes: 5, long_break_minutes: 15, cycles_target: 4 };
  else if (path.endsWith("/edital-verticalizado/consulta")) {
    const query = JSON.parse(request.postData() ?? "{}");
    queries.push(query);
    if (mode === "error") return request.respond({ status: 500, contentType: "application/json", body: '{"detail":"Falha QA"}' });
    if (mode === "loading") await new Promise((resolve) => setTimeout(resolve, 2000));
    const filtered = mode === "empty" ? [] : catalog.filter((item) => (!query.search || item.descricao.toLowerCase().includes(query.search.toLowerCase())) && (!query.nunca_estudado || item.nunca_estudado) && (!query.status?.length || query.status.includes(item.status)) && (!query.dominios?.length || query.dominios.includes(item.dominio)));
    const offset = Number(query.cursor ?? 0);
    const next = offset + 30 < filtered.length ? String(offset + 30) : null;
    const dominated = catalog.filter((item) => item.status === "dominado").length;
    const total = mode === "empty" ? 0 : catalog.length;
    const progress = { dominados: mode === "empty" ? 0 : dominated, total, percentual: total ? Math.round(dominated / total * 100) : 0, texto: `${mode === "empty" ? 0 : dominated} de ${total} tópicos dominados` };
    body = { contract_version: "1", concurso: { id: path.split("/").at(-3), status: "ativo" }, as_of: { local_date: "2026-10-17", timezone: "America/Sao_Paulo" }, progresso_global: progress, indicadores: { estudados: filtered.filter((item) => !item.nunca_estudado).length, revisoes_pendentes: filtered.filter((item) => item.revisao_atrasada).length, topicos_prioritarios: filtered.filter((item) => item.nunca_estudado || item.revisao_atrasada).length }, disciplinas: [{ ...discipline, progresso: progress, resultados: filtered.length }], items: filtered.slice(offset, offset + 30), page: { next_cursor: next, has_more: Boolean(next), limit: 30, result_count: filtered.length } };
  } else if (path.endsWith("/disciplinas/paginadas")) body = { items: [], total: 0, page: 1, page_size: 9, total_pages: 0, summary: { total: 0, em_progresso: 0, no_concurso: 0, fora_concurso: 0, progresso_medio: 0 } };
  return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
});
const results = [];
const route = `${base}/disciplinas?view=edital`;
async function open(width, theme = "light", suffix = "") {
  await page.setViewport({ width, height: width < 640 ? 1000 : 1000 });
  await page.goto(route + suffix, { waitUntil: "networkidle0" });
  await page.evaluate((theme) => { localStorage.setItem("theme", theme); document.documentElement.classList.toggle("dark", theme === "dark"); }, theme);
  // Capture settled theme transitions rather than their intermediate colors.
  await new Promise((resolve) => setTimeout(resolve, 250));
  await page.waitForSelector('[aria-label="Indicadores do edital"]');
}
async function button(text) {
  const handles = await page.$$("main button");
  for (const handle of handles) {
    if ((await handle.evaluate((node) => node.getAttribute("aria-label") ?? node.textContent.trim())) === text && await handle.isVisible()) { await handle.click(); return; }
  }
  throw new Error(`Botão não encontrado: ${text}`);
}
try {
  for (const theme of ["light", "dark"]) for (const width of mobileV4 ? [320, 375, 390, 430, 768, 1440] : [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
    await open(width, theme);
    const audit = await page.evaluate(() => {
      const main = document.querySelector("main");
      const section = document.querySelector('[aria-labelledby="edital-verticalizado-title"]');
      const title = section.querySelector("h1");
      const grid = document.querySelector('[aria-label="Indicadores do edital"]');
      const bounds = (node) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right }; };
      return { width: innerWidth, columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length, title: bounds(title), header: bounds(section.querySelector("header")), grid: bounds(grid), first: bounds(section.querySelector("table") ?? section.querySelector('[data-slot="card"]')), mainOverflow: main.scrollWidth > main.clientWidth + 1, pageOverflow: document.documentElement.scrollWidth > innerWidth + 1, table: !!section.querySelector("table"), headings: [...main.querySelectorAll("h1")].map((n) => n.textContent), actionVisible: !!section.querySelector("[data-edital-topic]") };
    });
    if (audit.pageOverflow) {
      console.log(await page.evaluate(() => ({ docWidth: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll("body *")].filter((n) => n.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map((n) => ({ tag: n.tagName, classes: n.className?.baseVal ?? n.className, width: n.getBoundingClientRect().width, parent: n.parentElement?.className })) })));
      await page.screenshot({ path: `${output}/overflow-${width}.png` });
    }
    assert.equal(audit.columns, width >= 1024 ? 4 : 2);
    assert.equal(audit.mainOverflow || audit.pageOverflow, false, JSON.stringify(audit));
    if(scrollAudit)assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>document.documentElement.clientHeight+1),false,'documento não deve rolar junto do main');
    assert.ok(audit.grid.y >= audit.header.y + audit.header.h - 1);
    assert.deepEqual(audit.headings, ["Edital Verticalizado"]);
    assert.equal(audit.table, width >= 1024);
    assert.ok(audit.actionVisible);
    await page.screenshot({ path: `${output}/${theme}-${width}.png` });
    results.push({ theme, ...audit });
  }
  if (mobileV4) {
    await open(390);
    assert.equal(await page.$$eval("[data-edital-topic]", (nodes) => nodes.length), 30);
    await button("Carregar mais");
    await page.waitForFunction(() => document.querySelectorAll("[data-edital-topic]").length === 60);
    await button("Carregar mais");
    await page.waitForFunction(() => document.querySelectorAll("[data-edital-topic]").length === 90);
    assert.ok(await page.$eval("main", (node) => node.textContent.includes("90 de 300")));
    await page.$eval('[aria-label^="Detalhes de"]', (node) => node.click());
    await page.waitForSelector('[aria-label^="Detalhes de"][aria-expanded="true"]');
    await page.$eval("main", (node) => node.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/expanded.png` });
    await page.$eval('[aria-label^="Detalhes de"]', (node) => node.click());
    await page.waitForSelector('[aria-label^="Detalhes de"][aria-expanded="false"]');
    const before = queries.length;
    await page.type("#edital-search", "construção", { delay: 15 });
    await page.waitForFunction(() => document.querySelector('[aria-label="Filtros aplicados"]')?.textContent.includes("construção"));
    await page.waitForNetworkIdle();
    assert.equal(queries.length, before + 1, "Typing should produce a single debounced request");
    assert.equal(await page.$eval("#edital-search", (node) => node === document.activeElement), true, "Search must retain keyboard focus");
    assert.ok(queries.at(-1).search === "construção");
    await page.click('[aria-label="Remover filtro Busca: construção"]');
    await page.waitForFunction(() => document.querySelector("#edital-search").value === "");
    await page.waitForNetworkIdle();
    for (const theme of ["light", "dark"]) for (const width of [320, 375, 390, 430, 768]) {
      await open(width, theme, `&status=nao_iniciado&dominio=1&nunca=1&disciplina=${discipline.id}&agrupar=1`);
      await page.waitForSelector('[aria-label="Filtros aplicados"]');
      await page.waitForSelector("main details");
      assert.ok(await page.$eval("main", (node) => node.scrollWidth <= node.clientWidth + 1));
      await page.screenshot({ path: `${output}/filters-grouped-${theme}-${width}.png` });
    }
    await page.evaluate(() => localStorage.setItem("qa-admin-mode", "true"));
    await open(320);
    const touchTargets = await page.evaluate(() => [...document.querySelectorAll('header button[aria-label="Abrir menu"],header button[aria-label="Buscar páginas (Ctrl+K)"],header button[aria-label="Menu do usuário"],header button[aria-label*="otifica"]')].map((node) => { const r = node.getBoundingClientRect(); return { name: node.getAttribute("aria-label"), width: r.width, height: r.height, right: r.right }; }));
    assert.equal(touchTargets.length, 4);
    assert.ok(touchTargets.every((target) => target.width >= 44 && target.height >= 44 && target.right <= 320));
    await page.screenshot({ path: `${output}/header-admin-320.png` });
    await page.evaluate(() => localStorage.removeItem("qa-admin-mode"));
  }
  await open(390);
  await button("Tabela");
  await page.waitForSelector("main table");
  assert.ok(await page.$("main table"));
  const tableOnly = await page.evaluate(() => { const main = document.querySelector("main"); const table = main.querySelector("table"); return { confined: table.parentElement.scrollWidth > table.parentElement.clientWidth, noPageOverflow: main.scrollWidth <= main.clientWidth + 1 }; });
  assert.ok(tableOnly.confined && tableOnly.noPageOverflow);
  await button("Cards");
  await page.waitForFunction(() => !document.querySelector("main table"));
  await button("Agrupar por disciplina");
  await page.waitForSelector("main details");
  assert.equal(await page.$("main table"), null);
  await button("Agrupado por disciplina");
  await page.waitForFunction(() => !document.querySelector("main details"));
  await page.click("[data-edital-topic]");
  await page.waitForFunction(() => location.pathname === "/pomodoro");
  assert.ok(new URL(page.url()).searchParams.get("topico_id"));
  await open(390);
  await button("Filtros");
  await page.waitForSelector('[role="dialog"]');
  await page.screenshot({ path: `${output}/mobile-filtros.png` });
  await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] label')].find((n) => n.textContent.includes("Nunca estudados")).click());
  await buttonInDialog("Aplicar filtros");
  await page.waitForFunction(() => location.search.includes("nunca=1"));
  assert.ok(queries.some((q) => q.nunca_estudado));
  await open(1440);
  await button("Filtros");
  await page.waitForSelector('[role="dialog"]');
  await page.screenshot({ path: `${output}/desktop-filtros.png` });
  await page.keyboard.press("Escape");
  await page.click('button[aria-haspopup="listbox"]');
  await page.waitForSelector('[role="option"]');
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.waitForFunction((id) => JSON.parse(localStorage.getItem("cf-concurso-ativo")).state.concursoAtivoId === id, {}, contests[1].id);
  await page.waitForSelector('[aria-label="Indicadores do edital"]');
  await page.click('a[href="/disciplinas?view=cards"]');
  await page.waitForFunction(() => document.querySelector("main h1")?.textContent.includes("Disciplinas"));
  assert.equal(await page.$("#edital-verticalizado-title"), null);
  mode = "empty";
  await open(390);
  await page.waitForFunction(() => document.querySelector("main").textContent.includes("Disciplinas sem tópicos"));
  mode = "error";
  await page.goto(route, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => document.querySelector("main").textContent.includes("Não foi possível carregar o edital"), { timeout: 20000 });
  mode = "loading";
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[aria-label="Carregando edital verticalizado"]');
  await page.screenshot({ path: `${output}/mobile-loading.png` });
  assert.deepEqual(errors, []);
  const checks = ["mobile filters", "mobile grouping", "study navigation", "keyboard contest switch", "distinct page headers", "empty", "error", "loading", ...(mobileV4 ? ["300 topics paginated in batches of 30", "expand and collapse without hiding study", "single debounced search request with retained focus", "removable search chip", "active filter chips and grouping in both themes at five mobile widths", "44px menu, global search, notifications and profile at 320px"] : [])];
  await writeFile(`${output}/report.json`, JSON.stringify({ fixtureOnly: true, datasetSize: catalog.length, results, tableOnly, checks, errors }, null, 2));
  console.log(JSON.stringify({ passed: true, viewports: results.length, checks: checks.length, output }));
} finally { await browser.close(); }
async function buttonInDialog(text) {
  await page.evaluate((text) => [...document.querySelectorAll('[role="dialog"] button')].find((node) => node.textContent.trim() === text).click(), text);
}
