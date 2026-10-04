// Real HTTP/authentication; isolated PostgreSQL required, never API fixtures.
import assert from "node:assert/strict";
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import puppeteer from "puppeteer";

assert(/^qa_story297_[a-f0-9]{32}$/.test(process.env.QA_ISOLATED_DATABASE ?? ""), "Isolated database required");
const backend = new URL(process.env.QA_BACKEND_URL);
assert.equal(backend.hostname, "127.0.0.1");
assert.equal(backend.port, "18097");
assert(process.env.QA_PASSWORD, "Ephemeral password required");
const dist = resolve("dist");
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml" };
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/") || req.url.startsWith("/uploads/")) {
    const proxy = http.request(new URL(req.url, backend), { method: req.method, headers: { ...req.headers, host: backend.host } }, (response) => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    });
    proxy.on("error", () => { res.writeHead(502); res.end(); });
    req.pipe(proxy);
    return;
  }
  try {
    const file = resolve(dist, "." + new URL(req.url, "http://localhost").pathname);
    assert(file === dist || file.startsWith(dist + sep));
    const target = extname(file) ? file : resolve(dist, "index.html");
    res.setHeader("Content-Type", types[extname(target)] || "application/octet-stream");
    res.end(await readFile(target));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
async function login(page, role) {
  await page.goto(`${base}/login`, { waitUntil: "networkidle2" });
  await page.type("#login-email", `${role}@story297.example.invalid`);
  await page.type("#login-password", process.env.QA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => location.pathname === "/dashboard", { timeout: 30000 });
}
async function api(page, path, method = "GET", body = undefined, form = false) {
  return page.evaluate(async ({ path, method, body, form }) => {
    const token = JSON.parse(localStorage.getItem("aprovingo-auth")).state.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    let payload;
    if (form) { payload = new FormData(); for (const [k, v] of Object.entries(body)) payload.append(k, v); }
    else if (body) { payload = JSON.stringify(body); headers["Content-Type"] = "application/json"; }
    const response = await fetch(`/api/v1${path}`, { method, headers, body: payload });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${method} ${path}`);
    return response.status === 204 ? null : response.json();
  }, { path, method, body, form });
}

async function clickText(page, text, scope = "body") {
  const selector = await page.evaluateHandle(({ text, scope }) => [...document.querySelector(scope).querySelectorAll("button")].find((n) => n.textContent.trim() === text), { text, scope });
  assert(selector.asElement(), "Missing button: " + text);
  await selector.asElement().click();
  await selector.dispose();
}
async function choose(page, label, value) {
  const handle = await page.evaluateHandle((label) => {
    const el = [...document.querySelectorAll("label")].find((n) => n.textContent.trim() === label);
    return document.getElementById(el.htmlFor);
  }, label);
  await handle.asElement().click();
  await page.waitForSelector('[role="option"]');
  const option = await page.evaluateHandle((value) => [...document.querySelectorAll('[role="option"]')].find((n) => n.textContent.trim() === value), value);
  assert(option.asElement(), "Missing option: " + value);
  await option.asElement().click();
  await page.waitForFunction(() => !document.querySelector('[role="listbox"]'));
}
const structure = (version) => ({ cargos: version.cargos.map((c) => ({
  id: c.id, nome: c.nome, ordem: c.ordem, disciplinas: c.disciplinas.map((d) => ({
    id: d.id, nome: d.nome, sigla: d.sigla, ordem: d.ordem,
    topicos: d.topicos.map((t) => ({ id: t.id, descricao: t.descricao, numero_ordem: t.numero_ordem, peso: t.peso })),
  })),
})) });
try {
  browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", () => errors.push("Browser runtime error"));
  await login(page, "admin");
  const root = await api(page, "/admin/editais/inicializar", "POST", { nome: "QA sintético 29.7", orgao: "Órgão QA", cargo_nome: "Analista" }, true);
  const version = root.versoes[0];
  const endpoint = `/admin/editais/${root.id}/versoes/${version.id}/estrutura`;
  const initial = await api(page, endpoint, "PUT", { cargos: [
    { id: version.cargos[0].id, nome: "Analista", ordem: 1, disciplinas: [
      { nome: "Português", sigla: "LP", ordem: 1, topicos: [{ descricao: "1.1 Interpretação", numero_ordem: 1, peso: 2 }] },
      { nome: "Direito", ordem: 2, topicos: [{ descricao: "Princípios", numero_ordem: 1, peso: 1 }] },
    ] },
    { nome: "Técnico", ordem: 2, disciplinas: [] },
  ] });
  const original = structure(initial).cargos[0];
  // A different contest must never be offered as an import source.
  await api(page, "/admin/editais/inicializar", "POST", { nome: "Outro edital QA", orgao: "QA", cargo_nome: "Cargo externo" }, true);
  const loadTarget = async () => {
    await page.goto(`${base}/admin/editais/${root.id}/editar?tab=conteudo`, { waitUntil: "networkidle2" });
    await page.waitForSelector('button[title="Técnico"]');
    await page.click('button[title="Técnico"]');
  };
  const openSource = async () => {
    await clickText(page, "Adicionar matérias de outro cargo");
    await page.waitForSelector('[role="dialog"]');
    await choose(page, "Cargo de origem", "Analista");
  };
  const save = async () => {
    const saved = page.waitForResponse((r) => r.url().endsWith("/estrutura") && r.request().method() === "PUT");
    await clickText(page, "Salvar rascunho");
    assert.equal((await saved).status(), 200);
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some((n) => n.textContent.trim() === "Salvar rascunho" && !n.disabled));
  };
  const artifacts = resolve("../../.aiox/qa/story-29-7");
  await mkdir(artifacts, { recursive: true });
  for (const width of [1440, 375, 360]) {
    await page.setViewport({ width, height: 900 });
    await loadTarget();
    await openSource();
    assert.equal(await page.evaluate(() => document.querySelectorAll('[role="dialog"] [role="checkbox"][data-state="checked"]').length), 0);
    await clickText(page, "Selecionar todas", '[role="dialog"]');
    assert.equal(await page.evaluate(() => document.querySelectorAll('[role="dialog"] [role="checkbox"][data-state="checked"]').length), 2);
    // Wait for the existing color transition, so screenshots reflect the final selected palette.
    await page.waitForFunction(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const action = [...dialog.querySelectorAll("button")].find((n) => n.textContent.trim() === "Adicionar selecionadas");
      return [...dialog.querySelectorAll('[role="checkbox"][data-state="checked"]')].every((n) => getComputedStyle(n).backgroundColor === getComputedStyle(action).backgroundColor);
    });
    const geometry = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const box = dialog.getBoundingClientRect();
      const action = [...dialog.querySelectorAll("button")].find((n) => n.textContent.trim() === "Adicionar selecionadas").getBoundingClientRect();
      return { pageOverflow: document.documentElement.scrollWidth > innerWidth + 1, dialogOverflow: dialog.scrollWidth > dialog.clientWidth + 1, fits: box.left >= 0 && box.right <= innerWidth && action.bottom <= innerHeight };
    });
    assert.deepEqual(geometry, { pageOverflow: false, dialogOverflow: false, fits: true });
    await page.screenshot({ path: resolve(artifacts, `dialog-${width}.png`) });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    assert.equal((await api(page, `/admin/editais/${root.id}`)).versoes[0].cargos[1].disciplinas.length, 0);
  }
  await openSource();
  await clickText(page, "Selecionar todas", '[role="dialog"]');
  await clickText(page, "Adicionar selecionadas", '[role="dialog"]');
  await page.waitForSelector('[aria-label="Tópico 1"]');
  assert.equal((await api(page, `/admin/editais/${root.id}`)).versoes[0].cargos[1].disciplinas.length, 0);
  await save();
  await loadTarget();
  let loaded = (await api(page, `/admin/editais/${root.id}`)).versoes[0];
  assert.deepEqual(structure(loaded).cargos[0], original);
  assert.equal(loaded.cargos[1].disciplinas.length, 2);
  assert.notEqual(loaded.cargos[0].disciplinas[0].id, loaded.cargos[1].disciplinas[0].id);
  assert.notEqual(loaded.cargos[0].disciplinas[0].topicos[0].id, loaded.cargos[1].disciplinas[0].topicos[0].id);
  // Duplicate feedback is visible and cannot be selected.
  await openSource();
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] [role="checkbox"]')].every((n) => n.disabled)), true);
  await clickText(page, "Cancelar", '[role="dialog"]');
  await page.$eval('[aria-label="Tópico 1"]', (n) => { n.focus(); });
  await page.keyboard.down("Control"); await page.keyboard.press("A"); await page.keyboard.up("Control");
  await page.keyboard.type("Conteúdo somente no destino");
  await save();
  loaded = (await api(page, `/admin/editais/${root.id}`)).versoes[0];
  assert.deepEqual(structure(loaded).cargos[0], original);
  assert.equal(loaded.cargos[1].disciplinas[0].topicos[0].descricao, "Conteúdo somente no destino");
  await page.click('[aria-label="Remover Direito"]');
  await page.waitForSelector('[role="alertdialog"]');
  await clickText(page, "Remover disciplina", '[role="alertdialog"]');
  await save();
  loaded = (await api(page, `/admin/editais/${root.id}`)).versoes[0];
  assert.deepEqual(structure(loaded).cargos[0], original);
  assert.equal(loaded.cargos[1].disciplinas.length, 1);
  // Reimport only the missing subject, without its program.
  await openSource();
  await choose(page, "O que copiar?", "Somente matérias");
  await clickText(page, "Selecionar todas", '[role="dialog"]');
  await clickText(page, "Adicionar selecionadas", '[role="dialog"]');
  await save();
  await loadTarget();
  loaded = (await api(page, `/admin/editais/${root.id}`)).versoes[0];
  assert.equal(loaded.cargos[1].disciplinas[1].nome, "Direito");
  assert.equal(loaded.cargos[1].disciplinas[1].topicos.length, 0);
  assert.deepEqual(structure(loaded).cargos[0], original);
  // Long real database list: catch intrinsic fieldset sizing/overflow into the footer.
  const longStructure = structure(loaded);
  longStructure.cargos[0].disciplinas.push(...Array.from({ length: 38 }, (_, i) => ({
    nome: `Matéria ${i + 3} — Legislação e conhecimentos específicos da administração pública`,
    ordem: i + 3,
    topicos: Array.from({ length: 15 }, (_, j) => ({ descricao: `Conteúdo programático ${j + 1}`, numero_ordem: j + 1, peso: 1 })),
  })));
  await api(page, endpoint, "PUT", longStructure);
  const longListViewports = [[1440, 900], [1280, 600], [375, 812], [375, 667], [360, 640], [900, 500]];
  for (const [width, height] of longListViewports) {
    await page.setViewport({ width, height });
    await loadTarget();
    await openSource();
    const measure = () => page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const list = dialog.querySelector('[data-reuse-list]') ?? dialog.querySelector('fieldset');
      const action = [...dialog.querySelectorAll('button')].find((n) => n.textContent.trim() === 'Adicionar selecionadas');
      const footer = action.parentElement.parentElement;
      const bounds = (el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; };
      const scrollAreas = [...dialog.querySelectorAll('*')].filter((n) => ['auto', 'scroll'].includes(getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight + 1);
      return { dialog: bounds(dialog), list: bounds(list), footer: bounds(footer), action: bounds(action),
        source: bounds(dialog.querySelector('[role="combobox"]')), last: bounds(list.querySelector('section > label:last-child')),
        scrollAreas: scrollAreas.length, scrollHeight: list.scrollHeight, clientHeight: list.clientHeight,
        horizontalOverflow: dialog.scrollWidth > dialog.clientWidth + 1, viewportHeight: innerHeight };
    });
    const before = await measure();
    console.log(JSON.stringify({ longListViewport: [width, height], geometry: before }));
    await page.screenshot({ path: resolve(artifacts, `long-list-${width}-${height}-top.png`) });
    assert(before.dialog.top >= 0 && before.dialog.bottom <= height + 1, 'Dialog must fit viewport');
    assert(before.list.bottom <= before.footer.top + 1, 'List must not extend into footer');
    assert(before.clientHeight > 0 && before.scrollHeight > before.clientHeight, 'List must scroll');
    assert.equal(before.scrollAreas, 1, 'Only the list may scroll');
    assert.equal(before.horizontalOverflow, false);
    await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const list = d.querySelector('[data-reuse-list]') ?? d.querySelector('fieldset'); list.scrollTop = list.scrollHeight; });
    const after = await measure();
    assert.equal(after.footer.top, before.footer.top, 'Footer position must remain fixed');
    assert.equal(after.source.top, before.source.top, 'Origin controls must remain fixed');
    assert(after.last.bottom <= after.list.bottom + 1 && after.last.top >= after.list.top - 1, 'Last complete card must be reachable');
    assert(after.action.bottom <= height && after.action.top >= after.footer.top, 'CTA always visible');
    await page.screenshot({ path: resolve(artifacts, `long-list-${width}-${height}-bottom.png`) });
    await clickText(page, 'Selecionar todas', '[role="dialog"]');
    await page.waitForFunction(() => document.querySelectorAll('[role="dialog"] [role="checkbox"][data-state="checked"]').length === 38);
    assert(await page.$eval('[role="dialog"] [aria-live="polite"]', (n) => n.textContent.startsWith('38 matérias selecionadas')));
    await page.evaluate(() => { const list = document.querySelector('[data-reuse-list]'); list.scrollTop = list.scrollHeight; });
    const selectedGeometry = await measure();
    assert(selectedGeometry.list.bottom <= selectedGeometry.footer.top && selectedGeometry.action.bottom <= height, 'Selected counter must not overlap cards or buttons');
    await page.screenshot({ path: resolve(artifacts, `long-list-${width}-${height}-selected.png`) });
    await clickText(page, 'Cancelar', '[role="dialog"]');
    assert.equal((await api(page, `/admin/editais/${root.id}`)).versoes[0].cargos[1].disciplinas.length, 2);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, auth: "real login/JWT", database: "disposable local PostgreSQL", fixtures: false, widths: [1440,375,360], longListViewports, flows: ["selection", "cancel", "draft-not-autosaved", "save-reload", "independent-IDs", "duplicates", "edit-isolation", "confirm-remove-isolation", "reimport-subject-only", "long-list-single-scroll", "fixed-header-footer", "last-card-reachable", "selected-count-visible"], screenshots: "workspace/.aiox/qa/story-29-7" }));
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
