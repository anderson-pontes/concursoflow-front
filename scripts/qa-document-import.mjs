import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3011";
const output = new URL("../../../docs/qa/document-import/", import.meta.url);
await mkdir(output, { recursive: true });
const session = { id: "qa-session", document_key: "QA-CONCURSO-001", status: "validado", revision: 1, metadata_json: {}, summary: { cargos: 2, disciplinas: 1, relacoes: 2, topicos: 5000, anexos: 1, eventos: 1, erros: 0 }, report: null, edital_id: null, version_id: null, created_at: "2026-10-25T12:00:00Z" };
const contract = { version: "CLICKEDITAL-IMPORT-V1", sections: { "02": { title: "Dados gerais", headers: ["campo", "valor"] }, "08": { title: "Tópicos", headers: ["codigo", "titulo"] } } };
const auth = { state: { accessToken: "qa-only", refreshToken: "qa-only", user: { id: "qa-admin", name: "Admin QA", email: "qa@example.invalid", role: "admin", status: "ativo", daily_goal_hours: 2, created_at: "2026-10-25T12:00:00Z" } }, version: 4 };
const browser = await puppeteer.launch({ headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 1000 });
    await page.evaluateOnNewDocument(value => { localStorage.setItem("aprovingo-auth", JSON.stringify(value)); }, auth);
    await page.setRequestInterception(true);
    page.on("request", request => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/api/v1/")) { void request.continue(); return; }
      let data = [];
      if (url.pathname.endsWith("/contrato")) data = contract;
      else if (url.pathname.endsWith("/linhas")) data = { items: [{ id: "row-1", section: "02", line: 2, data: { campo: "nome", valor: "Concurso público de exemplo — Administração Federal" }, issues: [] }], total: 1, page: 1, page_size: 50 };
      else if (url.pathname.endsWith("/qa-session")) data = session;
      else if (url.pathname.endsWith("/importacoes-documentos")) data = { items: [session], total: 1, page: 1, page_size: 10 };
      else if (url.pathname.includes("notifications")) data = { items: [], total: 0, unread_count: 0 };
      void request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
    });
    await page.goto(`${baseUrl}/admin/editais/importar-documento`, { waitUntil: "networkidle0" });
    await page.waitForSelector("#document-import-file");
    const uploadOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth || document.querySelector("main").scrollWidth > document.querySelector("main").clientWidth);
    assert.equal(uploadOverflow, false, `upload overflow at ${width}`);
    await page.screenshot({ path: new URL(`upload-${width}.png`, output).pathname.replace(/^\/([A-Z]:)/, "$1"), fullPage: true });
    await page.goto(`${baseUrl}/admin/editais/importar-documento?sessao=qa-session`, { waitUntil: "networkidle0" });
    await page.waitForSelector('[role="tablist"]');
    await page.locator('[role="tab"]').filter(element => element.textContent.includes("Dados gerais")).click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent.includes("Tópicos"));
    assert.match(await page.$eval('[role="tab"][aria-selected="true"]', element => element.textContent), /Tópicos/);
    const previewOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth || document.querySelector("main").scrollWidth > document.querySelector("main").clientWidth);
    assert.equal(previewOverflow, false, `preview overflow at ${width}`);
    await page.screenshot({ path: new URL(`preview-${width}.png`, output).pathname.replace(/^\/([A-Z]:)/, "$1"), fullPage: true });
    console.log(`${width}px: upload and preview fit; tab keyboard navigation passed`);
    await page.close();
  }
} finally { await browser.close(); }
