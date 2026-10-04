// Real HTTP/authentication; isolated PostgreSQL required, never API fixtures.
import assert from "node:assert/strict";
import http from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import puppeteer from "puppeteer";

assert(/^qa_story298_[a-f0-9]{32}$/.test(process.env.QA_ISOLATED_DATABASE ?? ""), "Isolated database required");
const backend = new URL(process.env.QA_BACKEND_URL);
assert.equal(backend.hostname, "127.0.0.1");
assert.equal(backend.port, "18098");
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
  await page.type("#login-email", `${role}@story298.example.invalid`);
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
const results = []; let finalEdictId;
try {
  browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, headless: true });
  const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 1000 }); await login(page, "admin");
  const selector = 'input[placeholder$="pressione Enter"]'; let requests = []; const records = new Map();
  page.on("request", (req) => {
    if (!req.url().includes("/api/v1/admin/editais")) return;
    const item = { method: req.method(), path: new URL(req.url()).pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/g, ":id"), bytes: Buffer.byteLength(req.postData() || ""), start: performance.now() };
    requests.push(item); records.set(req, item);
  });
  page.on("response", (response) => {
    const item = records.get(response.request()); if (!item) return;
    const headers = response.headers();
    item.backend_ms = Number(headers["x-qa-backend-ms"] || 0);
    item.db_ms = Number(headers["x-qa-db-ms"] || 0);
    item.response_bytes = Number(headers["x-qa-response-bytes"] || 0);
    item.sql = Object.fromEntries(["select", "insert", "update", "delete", "total"].map((op) => [op, Number(headers["x-qa-sql-" + op] || 0)]));
  });
  page.on("requestfinished", (req) => {
    const item = records.get(req); if (item) { item.http_ms = Math.round((performance.now() - item.start) * 100) / 100; delete item.start; }
  });
  const snapshotRequests = () => requests.map((item) => ({ ...item, sql: { ...item.sql } }));
  for (const [nc, nd, nt] of [[25, 165, 2180], [30, 200, 3000]]) {
    const root = await api(page, "/admin/editais/inicializar", "POST", { nome: "Benchmark " + nc, orgao: "Synthetic QA", cargo_nome: "Cargo 001" }, true);
    finalEdictId = root.id;
    const version = root.versoes[0];
    const cargos = Array.from({ length: nc }, (_, i) => ({ ...(i === 0 ? { id: version.cargos[0].id } : {}), nome: "Cargo " + String(i + 1).padStart(3, "0"), ordem: i + 1, disciplinas: [] }));
    const disciplines = Array.from({ length: nd }, (_, i) => ({ nome: "Disciplina " + String(i + 1).padStart(3, "0"), ordem: Math.floor(i / nc) + 1, sigla: null, topicos: [] }));
    for (let i = 0; i < nd; i++) cargos[i % nc].disciplinas.push(disciplines[i]);
    for (let i = 0; i < nt; i++) disciplines[i % nd].topicos.push({ descricao: "Topico sintetico " + String(i + 1).padStart(5, "0") + " - conceitos, fundamentos e aplicacoes de estudo", numero_ordem: Math.floor(i / nd) + 1, peso: 1 });
    await api(page, "/admin/editais/" + root.id + "/versoes/" + version.id + "/estrutura", "PUT", { cargos });
    requests = []; const open = performance.now(); await page.goto(base + "/admin/editais/" + root.id + "/editar?tab=conteudo", { waitUntil: "networkidle2" }); await page.waitForSelector(selector);
    const initial = { scenario: [nc, nd, nt], action: "open", networkidle_load_ms: Math.round(performance.now() - open), requests: snapshotRequests() }; results.push(initial); console.log(JSON.stringify(initial));
    requests = []; await page.type(selector, "Novo topico navegador sintetico"); const local = performance.now(); await page.keyboard.press("Enter");
    await page.waitForFunction(() => [...document.querySelectorAll("textarea")].some((e) => e.value === "Novo topico navegador sintetico"));
    const localMs = performance.now() - local; await new Promise((r) => setTimeout(r, 750));
    assert.equal(requests.length, 0, "No autosave");
    const added = { scenario: [nc, nd, nt], action: "add", keyboard_and_puppeteer_ms: Math.round(localMs * 100) / 100, requests: snapshotRequests() }; results.push(added); console.log(JSON.stringify(added));
    requests = []; const save = performance.now(); await clickText(page, "Salvar rascunho");
    await page.waitForFunction(() => [...document.querySelectorAll("[data-sonner-toast]")].some((e) => e.textContent.includes("Rascunho salvo.")), { timeout: 60000 });
    const saved = { scenario: [nc, nd, nt], action: "save", click_to_success_ms: Math.round(performance.now() - save), requests: snapshotRequests() };
    assert.equal(requests.length, 1, "A topic change has exactly one request");
    assert.equal(requests[0].method, "PATCH"); assert(requests[0].bytes < 1000, "Delta payload must not scale with tree");
    assert(requests[0].backend_ms > 0, "Backend instrumentation required");
    results.push(saved); console.log(JSON.stringify(saved));
    requests = []; const unchanged = performance.now(); await clickText(page, "Salvar rascunho");
    await new Promise((r) => setTimeout(r, 300)); assert.equal(requests.length, 0, "Clean save must not write the tree");
    results.push({ scenario: [nc, nd, nt], action: "unchanged", requests: 0, click_and_observation_ms: Math.round(performance.now() - unchanged) });
    // Verification reads are outside the measured click/save window.
    const stored = await api(page, "/admin/editais/" + root.id);
    assert.equal(stored.versoes[0].cargos.flatMap((c) => c.disciplinas.flatMap((d) => d.topicos)).length, nt + 1);
    assert(stored.versoes[0].cargos.some((c) => c.disciplinas.some((d) => d.topicos.some((t) => t.descricao === "Novo topico navegador sintetico"))));
    // Repeat the diagnostic's three single-topic edits; never include verification GETs.
    for (let iteration = 1; iteration <= 3; iteration++) {
      await page.waitForFunction(() => ![...document.querySelectorAll("[data-sonner-toast]")].some((e) => e.textContent.includes("Rascunho salvo.")), { timeout: 15000 });
      await page.click("textarea");
      await page.keyboard.down("Control"); await page.keyboard.press("A"); await page.keyboard.up("Control");
      await page.keyboard.type("Topico sintetico editado " + iteration);
      requests = []; const editedAt = performance.now();
      await clickText(page, "Salvar rascunho");
      await page.waitForFunction(() => [...document.querySelectorAll("[data-sonner-toast]")].some((e) => e.textContent.includes("Rascunho salvo.")), { timeout: 60000 });
      assert.equal(requests.length, 1); assert.equal(requests[0].method, "PATCH");
      assert(requests[0].bytes < 1000);
      const edited = { scenario: [nc, nd, nt], action: "edit", iteration, click_to_success_ms: Math.round(performance.now() - editedAt), requests: snapshotRequests() };
      results.push(edited); console.log(JSON.stringify(edited));
    }
    await page.goto(base + "/admin/editais", { waitUntil: "networkidle2" });
  }
  // Real refetch and conflict checks are outside the performance windows.
  await page.goto(base + "/admin/editais/" + finalEdictId + "/editar?tab=conteudo", { waitUntil: "networkidle2" });
  await page.waitForSelector("textarea");
  const current = await api(page, "/admin/editais/" + finalEdictId);
  const currentVersion = current.versoes[0]; const firstDiscipline = currentVersion.cargos[0].disciplinas[0];
  await page.click("textarea"); await page.keyboard.down("Control"); await page.keyboard.press("A"); await page.keyboard.up("Control");
  await page.keyboard.type("Rascunho local preservado");
  await api(page, "/admin/editais/" + finalEdictId + "/versoes/" + currentVersion.id + "/estrutura", "PATCH", {
    expected_revision: currentVersion.estrutura_revision, mutation_id: crypto.randomUUID(),
    operations: [{ entity: "topico", action: "upsert", id: "novo-external", parent_id: firstDiscipline.id, data: { descricao: "Alteracao externa sintetica", numero_ordem: firstDiscipline.topicos.length + 1, peso: 1 } }],
  });
  const refetched = page.waitForResponse((response) => response.request().method() === "GET" && new URL(response.url()).pathname === "/api/v1/admin/editais/" + finalEdictId);
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await refetched;
  assert.equal(await page.$eval("textarea", (el) => el.value), "Rascunho local preservado");
  const conflictResponse = page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().endsWith("/estrutura"));
  await clickText(page, "Salvar rascunho");
  assert.equal((await conflictResponse).status(), 409);
  await page.waitForFunction(() => [...document.querySelectorAll('[role="alert"]')].some((el) => el.textContent.includes("preservadas")));
  assert.equal(await page.$eval("textarea", (el) => el.value), "Rascunho local preservado");
  results.push({ action: "refetch-conflict", real_refetch_preserved: true, http_conflict: 409, local_draft_preserved: true });
  const output = resolve("../../.aiox/artifacts/29.8"); await mkdir(output, { recursive: true });
  await writeFile(resolve(output, "performance.json"), JSON.stringify(results, null, 2));
} finally { if (browser) await browser.close(); await new Promise((r) => server.close(r)); }
