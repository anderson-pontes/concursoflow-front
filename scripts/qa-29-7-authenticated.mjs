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
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, auth: "real login/JWT", database: "disposable local PostgreSQL", fixtures: false, widths: [1440,375,360], flows: ["selection", "cancel", "draft-not-autosaved", "save-reload", "independent-IDs", "duplicates", "edit-isolation", "confirm-remove-isolation", "reimport-subject-only"], screenshots: "workspace/.aiox/qa/story-29-7" }));
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
