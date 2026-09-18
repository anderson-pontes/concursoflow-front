import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const profileArg = process.argv[process.argv.indexOf("--profile") + 1];
const entryArg = process.argv[process.argv.indexOf("--entry") + 1];
const authSnapshot = JSON.stringify({
  state: {
    accessToken: "qa-local-token",
    refreshToken: "qa-local-refresh-token",
    user: {
      id: "50000000-0000-4000-8000-000000000099",
      name: "Pessoa QA",
      email: "qa-local@example.invalid",
      role: "user",
      status: "ativo",
      avatar_url: null,
      daily_goal_hours: 2,
      created_at: new Date().toISOString(),
      cpf: null,
      phone: null,
      birth_date: null,
      address_cep: null,
      address_street: null,
      address_number: null,
      address_complement: null,
      address_neighborhood: null,
      address_city: null,
      address_state: null,
    },
  },
  version: 4,
});

const items = Array.from({ length: 9 }, (_, index) => {
  const suffix = String(index + 1).padStart(2, "0");
  const editalId = `50000000-0000-4000-8000-0000000000${suffix}`;
  const versaoId = `51000000-0000-4000-8000-0000000000${suffix}`;
  const cargoId = `52000000-0000-4000-8000-0000000000${suffix}`;
  const disciplinaId = `53000000-0000-4000-8000-0000000000${suffix}`;
  return {
    id: editalId,
    nome: index === 0 ? "TRT 8ª Região — Analista" : `Concurso público ${index + 1}`,
    orgao: index === 0 ? "TRT 8ª REGIÃO" : `Órgão ${index + 1}`,
    banca: index === 0 ? "Cebraspe" : "Banca QA",
    logo_url: null,
    edital_url: "https://example.invalid/edital.pdf",
    updated_at: "2026-09-15T12:00:00Z",
    versoes: [{
      id: versaoId,
      numero: 1,
      status: "publicado",
      data_prova: "2026-12-01",
    published_at: "2026-09-15T12:00:00Z",
      classificacao: {
        esfera: { id: "a1000000-0000-4000-8000-000000000001", chave: "federal", nome: "Federal", ordem: 10, ativo: true },
        areas: [{ id: "a2000000-0000-4000-8000-000000000001", chave: "juridica", nome: "Jurídica", ordem: 10, ativo: true }],
        ano_edital: 2026,
        revision: 1,
        fonte_tipo: "edital",
        fonte_ref: "Edital oficial 01/2026",
        updated_at: "2026-09-15T12:00:00Z",
      },
      cargos: [{
        id: cargoId,
        nome: "Analista",
        especialidade: null,
        ordem: 1,
        disciplinas: [{
          id: disciplinaId,
          nome: "Língua Portuguesa",
          sigla: "PORT",
          ordem: 1,
          topicos_total: 1,
          topicos: [{ id: `${index + 1}`, descricao: "Interpretação de textos", numero_ordem: 1, peso: 1 }],
        }],
      }],
    }],
  };
});

function json(body, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify(body) };
}

async function clickButton(page, label, exact = false) {
  await page.waitForFunction(
    (text, useExact) => [...document.querySelectorAll("button")].some((node) => (useExact ? node.textContent?.trim() === text : node.textContent?.includes(text)) && !node.disabled && Boolean(node.offsetWidth || node.offsetHeight)),
    { timeout: 15000 },
    label,
    exact,
  );
  await page.evaluate(
    (text, useExact) => [...document.querySelectorAll("button")].find((node) => (useExact ? node.textContent?.trim() === text : node.textContent?.includes(text)) && !node.disabled && Boolean(node.offsetWidth || node.offsetHeight))?.click(),
    label,
    exact,
  );
}

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const failures = [];

try {
  for (const profile of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 375, height: 812 },
  ].filter((item) => !process.argv.includes("--profile") || item.name === profileArg)) {
    for (const entry of [
      { name: "ativar", path: "/editais/ativar" },
      { name: "plano", path: "/planos/novo?origem=catalogo" },
    ].filter((item) => !process.argv.includes("--entry") || item.name === entryArg)) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      const errors = [];
      const catalogRequests = [];
      const telemetryBodies = [];
      let currentStage = "bootstrap";
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" && !message.text().includes("favicon.ico")) errors.push(message.text());
      });
      await page.setViewport({ width: profile.width, height: profile.height });
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.evaluate((auth) => localStorage.setItem("aprovingo-auth", auth), authSnapshot);
      await page.setRequestInterception(true);
      page.on("request", async (request) => {
        const url = new URL(request.url());
        if (!url.pathname.startsWith("/api/v1/")) return request.continue();
        if (request.method() === "GET" && url.pathname.endsWith("/catalogo/editais/filtros")) {
          return request.respond(json({
            esferas: [{ chave: "federal", nome: "Federal", count: 9, ativo: true }, { chave: "estadual", nome: "Estadual", count: 0, ativo: true }],
            areas: [{ chave: "juridica", nome: "Jurídica", count: 9, ativo: true }],
            anos: [{ chave: 2026, nome: "2026", count: 9, ativo: true }],
          }));
        }
        if (request.method() === "GET" && url.pathname.endsWith("/catalogo/editais")) {
          catalogRequests.push(url.search);
          const search = (url.searchParams.get("search") || "").normalize("NFC");
          const filtered = search ? items.filter((item) => `${item.nome} ${item.orgao} ${item.banca}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))) : items;
          const pageNumber = Number(url.searchParams.get("page") || 1);
          const pageSize = Number(url.searchParams.get("page_size") || 8);
          const start = (pageNumber - 1) * pageSize;
          return request.respond(json({ items: filtered.slice(start, start + pageSize), page: pageNumber, page_size: pageSize, total: filtered.length, total_pages: Math.ceil(filtered.length / pageSize) }));
        }
        if (request.method() === "POST" && url.pathname.endsWith("/catalogo/editais/selecao/validar")) {
          const body = JSON.parse(request.postData() || "{}");
          const item = items.find((candidate) => candidate.id === body.edital_id);
          return request.respond(json({ eligible: Boolean(item && item.versoes[0].id === body.version_id), published_version_id: item?.versoes[0].id ?? null }));
        }
        const detailId = url.pathname.match(/\/catalogo\/editais\/([^/]+)$/)?.[1];
        if (request.method() === "GET" && detailId) {
          const item = items.find((candidate) => candidate.id === detailId);
          return request.respond(item ? json(item) : json({ detail: "not found" }, 404));
        }
        if (request.method() === "GET" && url.pathname.endsWith("/concursos")) return request.respond(json([]));
        if (request.method() === "GET" && url.pathname.endsWith("/notifications/unread-count")) return request.respond(json({ count: 0 }));
        if (request.method() === "GET" && url.pathname.endsWith("/telemetry/preference")) return request.respond(json({ opted_out: false }));
        if (request.method() === "POST" && url.pathname.endsWith("/telemetry/events")) {
          telemetryBodies.push(request.postData() || "");
          return request.respond(json({ accepted: 1 }, 202));
        }
        return request.respond(json({}));
      });

      try {
        currentStage = "open-entry";
        await page.goto(`${baseUrl}${entry.path}`, { waitUntil: "networkidle2", timeout: 60000 });
        currentStage = "wait-results";
        await page.waitForFunction(() => document.body.innerText.includes("Resultados do catálogo"));
        const initial = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          hasRange: document.body.innerText.includes("Exibindo 1–8 de 9 editais"),
        }));
        if (initial.overflow || !initial.hasRange) failures.push({ profile: profile.name, entry: entry.name, stage: "initial", initial });

        currentStage = "apply-filter";
        await clickButton(page, profile.name === "mobile" ? "Filtros" : "Esfera", true);
        await page.waitForFunction(() => [...document.querySelectorAll("label")].some((node) => node.textContent?.includes("Federal")));
        await page.evaluate(() => {
          const label = [...document.querySelectorAll("label")].find((node) => node.textContent?.includes("Federal"));
          label?.querySelector("button")?.click();
        });
        await clickButton(page, profile.name === "mobile" ? "Aplicar filtros" : "Aplicar", true);
        await page.waitForFunction(() => new URL(location.href).searchParams.get("esfera") === "federal");
        await page.waitForSelector('[aria-label="1 filtros ativos"]');
        const filterRequestOk = catalogRequests.some((query) => new URLSearchParams(query).get("esfera") === "federal");
        if (!filterRequestOk) failures.push({ profile: profile.name, entry: entry.name, stage: "filter-request" });
        await clickButton(page, "Limpar filtros", true);
        await page.waitForFunction(() => !new URL(location.href).searchParams.has("esfera"));

        currentStage = "open-details";
        await clickButton(page, "Ver detalhes");
        await page.waitForFunction(() => document.querySelector("[role=dialog]")?.textContent?.includes("TRT 8ª Região"));
        const dialogFocused = await page.evaluate(() => document.activeElement?.getAttribute("data-catalog-dialog-title") !== null);
        if (!dialogFocused) failures.push({ profile: profile.name, entry: entry.name, stage: "dialog-initial-focus" });
        currentStage = "close-details";
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => !document.querySelector("[role=dialog]"));
        const focusReturned = await page.evaluate(() => document.activeElement?.textContent?.includes("Ver detalhes") ?? false);
        if (!focusReturned) failures.push({ profile: profile.name, entry: entry.name, stage: "dialog-return-focus" });

        currentStage = "select-item";
        await clickButton(page, "Selecionar edital", true);
        await page.waitForFunction(() => [...document.querySelectorAll("button")].some((node) => node.textContent?.trim() === "Selecionado"));
        await page.waitForSelector("[data-catalog-selection-summary]", { timeout: 15000 });
        currentStage = "next-page";
        await clickButton(page, "Próxima");
        await page.waitForFunction(() => new URL(location.href).searchParams.get("page") === "2");
        const selectionPreserved = await page.evaluate(() => Boolean(document.querySelector("[data-catalog-selection-summary]")));
        if (!selectionPreserved) failures.push({ profile: profile.name, entry: entry.name, stage: "pagination-selection" });
        currentStage = "browser-back";
        await page.goBack({ waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForFunction(() => new URL(location.href).searchParams.get("page") === null);
        await new Promise((resolve) => setTimeout(resolve, 500));

        currentStage = "draft-search";
        const requestsBeforeDraft = catalogRequests.length;
        const input = await page.$('input[type="search"]');
        await input.click();
        await page.keyboard.down("Control");
        await page.keyboard.press("A");
        await page.keyboard.up("Control");
        await input.type("  TRT   8  ");
        await new Promise((resolve) => setTimeout(resolve, 150));
        if (catalogRequests.length !== requestsBeforeDraft) failures.push({ profile: profile.name, entry: entry.name, stage: "draft-request" });
        currentStage = "apply-search";
        await clickButton(page, "Buscar");
        await page.waitForFunction(() => new URL(location.href).searchParams.get("search") === "TRT 8");
        await page.waitForFunction(() => document.body.innerText.includes("Exibindo 1–1 de 1 edital"));
        const selectionPreservedAfterValidation = await page.evaluate(() => Boolean(document.querySelector("[data-catalog-selection-summary]")));
        if (!selectionPreservedAfterValidation) failures.push({ profile: profile.name, entry: entry.name, stage: "search-selection" });

        const sensitiveTelemetry = telemetryBodies.some((body) => /TRT|50000000|Cebraspe|Órgão|federal|jurídica/i.test(body));
        if (sensitiveTelemetry) failures.push({ profile: profile.name, entry: entry.name, stage: "telemetry-privacy", telemetryBodies });
      } catch (error) {
        const diagnostics = await page.evaluate(() => ({
          url: location.href,
          buttons: [...document.querySelectorAll("button")].map((node) => ({ text: node.textContent?.trim(), disabled: node.disabled, visible: Boolean(node.offsetWidth || node.offsetHeight) })),
          text: document.querySelector("main")?.textContent?.slice(0, 1200) ?? "",
        })).catch(() => null);
        failures.push({ profile: profile.name, entry: entry.name, stage: currentStage, error: String(error), diagnostics });
      } finally {
        if (errors.length) failures.push({ profile: profile.name, entry: entry.name, stage: "console", errors });
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ passed: failures.length === 0, profiles: 2, entries: 2, failures }, null, 2));
if (failures.length) process.exitCode = 1;
