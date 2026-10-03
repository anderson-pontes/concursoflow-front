// Browser-only regression: synthetic authentication and API fixtures. No real writes.
import assert from "node:assert/strict";
import puppeteer from "puppeteer";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
assert(["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname), "Local QA only");
const dates = { inicio_inscricoes: "2026-10-01", encerramento_inscricoes: "2026-10-30", limite_pagamento: "2026-11-01", data_prova: "2026-12-01" };
const user = { id: "50000000-0000-4000-8000-000000000099", name: "Schedule QA", email: "schedule@example.invalid", role: "admin", status: "ativo", avatar_url: null, daily_goal_hours: 2, created_at: "2026-10-01T00:00:00Z" };
const root = {
  id: "50000000-0000-4000-8000-000000000001", nome: "Concurso sintético de homologação", orgao: "Órgão QA", banca: "Banca QA", url_oficial: null, edital_url: null, logo_url: null,
  versoes: [{ id: "51000000-0000-4000-8000-000000000001", numero: 1, status: "publicado", ...dates, published_at: "2026-10-01T00:00:00Z", classificacao: { esfera: null, areas: [], ano_edital: null, revision: 0, fonte_tipo: null, updated_at: null }, cargos: [{ id: "52000000-0000-4000-8000-000000000001", nome: "Analista", ordem: 1, disciplinas: [] }] }],
};
const json = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, args: ["--no-sandbox"] });
const results = [];
try {
  for (const width of [1440, 375, 360]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const errors = [];
    const writes = [];
    let state = structuredClone(root);
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewport({ width, height: 900 });
    await page.evaluateOnNewDocument((snapshot) => localStorage.setItem("aprovingo-auth", JSON.stringify(snapshot)), { state: { accessToken: "qa-synthetic", refreshToken: "qa-synthetic-refresh", user }, version: 4 });
    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/api/")) return request.continue();
      if (request.method() === "OPTIONS") return request.respond(json({}));
      if (request.method() !== "GET") writes.push({ path: url.pathname, method: request.method(), body: request.postData() });
      if (url.pathname.endsWith("/cronograma")) {
        assert.equal(request.method(), "PUT");
        state.versoes[0] = { ...state.versoes[0], ...JSON.parse(request.postData()) };
        return request.respond(json(state.versoes[0]));
      }
      if (url.pathname.includes(`/admin/editais/${root.id}`)) return request.respond(json(state));
      if (url.pathname.endsWith("/users/me")) return request.respond(json(user));
      if (url.pathname.endsWith("/unread-count")) return request.respond(json({ count: 0 }));
      if (url.pathname.includes("classificacoes")) return request.respond(json([]));
      // Never forward an unrecognized API request to the real backend.
      return request.respond(json([]));
    });
    await page.goto(`${base}/admin/editais/${root.id}/editar?tab=geral`, { waitUntil: "networkidle2" });
    await page.waitForSelector('[aria-label="Limpar data da prova"]');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Overflow at ${width}`);
    await page.click('[aria-label="Data da prova"]');
    await page.waitForSelector('[role="combobox"][aria-label="Selecionar ano"]');
    assert.equal(await page.evaluate(() => { const r = document.querySelector('[data-slot="popover-content"]')?.getBoundingClientRect() ?? document.querySelector('[role="dialog"]')?.getBoundingClientRect(); return !r || r.left >= -1 && r.right <= innerWidth + 1; }), true, "Calendar must fit viewport");
    await page.keyboard.press("Escape");
    await page.click('[aria-label="Limpar data da prova"]');
    await page.evaluate(() => [...document.querySelectorAll("button")].find((node) => node.textContent.trim() === "Salvar cronograma")?.click());
    await page.waitForSelector('[role="alertdialog"]');
    await page.evaluate(() => [...document.querySelector('[role="alertdialog"]').querySelectorAll("button")].find((node) => node.textContent.trim() === "Salvar cronograma")?.click());
    await page.waitForFunction(() => document.querySelector('[aria-label="Data da prova"]')?.textContent.includes("Selecione uma data"));
    const scheduleWrites = writes.filter((r) => r.path.endsWith("/cronograma"));
    assert.equal(scheduleWrites.length, 1);
    assert.deepEqual(JSON.parse(scheduleWrites[0].body), { ...dates, data_prova: null });
    assert.equal(writes.filter((r) => r.path.includes("/estrutura") || r.path.endsWith("/publicar")).length, 0);
    assert.deepEqual(errors, []);
    results.push({ width, result: "PASS", api: "synthetic fixtures; real PostgreSQL verified separately" });
    await context.close();
  }
  console.log(JSON.stringify({ results }));
} finally {
  await browser.close();
}
