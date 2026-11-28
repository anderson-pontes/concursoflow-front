import assert from "node:assert/strict";
import puppeteer from "puppeteer";

const base = "http://127.0.0.1:4175";
const id = "00000000-0000-4000-8000-000000000001";
const user = { id, name: "Estudante QA", email: "qa@example.invalid", role: "user", status: "ativo" };
const orgao = "Secretaria de Administração e Planejamento da Região Metropolitana";
const cargo = "Auditor-Fiscal da Receita Federal do Brasil";
const modal = '[role="dialog"]';
const waitClosed = (page) => page.waitForFunction((selector) => !document.querySelector(selector), {}, modal);
const click = (page, label) => page.locator(`::-p-aria(${label})`).click();
const waitText = (page, value) => page.waitForFunction((text) => document.body.innerText.includes(text), {}, value);
const acceptJson = (request, data, status = 200) => request.respond({ status, contentType: "application/json", body: JSON.stringify(data) });

async function activateByKeyboard(page, selector) {
  await page.$eval(selector, (button) => {
    button.scrollIntoView({ block: "center" });
    button.focus({ preventScroll: true });
  });
  await page.keyboard.press("Enter");
}

async function openForm(page) {
  await click(page, "Cadastro manual");
  await page.waitForSelector("#concurso-nome");
  assert.equal(await page.$eval(modal, (dialog) => document.getElementById(dialog.getAttribute("aria-labelledby"))?.textContent), "Novo concurso");
}

async function dropFile(page, label, options) {
  await page.evaluate(async ({ label, options }) => {
    const input = document.querySelector(`input[type=file][aria-label="${label}"]`);
    let content = options.text;
    if (options.dimensions) {
      const canvas = document.createElement("canvas");
      [canvas.width, canvas.height] = options.dimensions;
      const context = canvas.getContext("2d");
      context.fillStyle = "#4338ca";
      context.fillRect(0, 0, canvas.width, canvas.height);
      content = await new Promise((resolve) => canvas.toBlob(resolve));
    }
    if (options.size) content = new Uint8Array(options.size);
    const transfer = new DataTransfer();
    transfer.items.add(new File([content], options.name, { type: options.type }));
    input.nextElementSibling.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
  }, { label, options });
}

async function verifyLayout(page, width) {
  const layout = await page.$eval(modal, (dialog) => {
    const cardBounds = Array.from(dialog.querySelectorAll("article"), (card) => card.getBoundingClientRect());
    const bounds = dialog.getBoundingClientRect();
    const body = dialog.querySelector("form > div");
    const top = dialog.querySelector("header").getBoundingClientRect().bottom;
    const bottom = dialog.querySelector("footer").getBoundingClientRect().top;
    body.scrollTop = body.scrollHeight;
    const fixed = dialog.querySelector("header").getBoundingClientRect().bottom === top &&
      dialog.querySelector("footer").getBoundingClientRect().top === bottom;
    body.scrollTop = 0;
    return {
      width: bounds.width,
      insideViewport: bounds.x >= -1 && bounds.top >= -1 && bounds.right <= innerWidth + 1 && bounds.bottom <= innerHeight + 1,
      overflow: body.scrollWidth > body.clientWidth + 1 || cardBounds.some((card) => card.right > bounds.right + 1),
      sideBySide: Math.abs(cardBounds[0].top - cardBounds[1].top) < 1,
      equalHeight: Math.abs(cardBounds[0].height - cardBounds[1].height) < 1,
      fixed,
    };
  });
  assert.ok(layout.insideViewport && !layout.overflow && layout.fixed, JSON.stringify(layout));
  assert.equal(layout.sideBySide, width >= 640);
  if (width >= 1024) assert.equal(layout.width, 896);
  if (width >= 640) assert.ok(layout.equalHeight);
}

const browser = await puppeteer.launch({
  headless: "shell",
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  args: ["--no-sandbox"],
});

try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const calls = [];
    const errors = [];
    let rows = [{ id, user_id: id, nome: "Concurso inicial", orgao, status: "eliminado", cargo: null, banca: null, data_prova: null, logo_url: null, edital_url: "uploads/edital%20atual.pdf?download=1", created_at: "2026-10-01T00:00:00" }];
    let failCreate = false;
    let failDocument = false;
    page.on("pageerror", (error) => errors.push(error.message));
    await page.evaluateOnNewDocument(({ user, id, theme }) => {
      localStorage.setItem("theme", theme);
      localStorage.setItem("aprovingo-auth", JSON.stringify({ state: { user, accessToken: "qa", refreshToken: "qa" }, version: 4 }));
      localStorage.setItem("cf-concurso-ativo", JSON.stringify({ state: { concursoAtivoId: id }, version: 0 }));
    }, { user, id, theme });
    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      const url = new URL(request.url());
      if (url.origin !== base) return request.abort();
      if (url.pathname.startsWith("/uploads/")) return request.respond({ status: 200, body: "%PDF-1.4" });
      if (!url.pathname.startsWith("/api/v1/")) return request.continue();
      const path = url.pathname.slice("/api/v1".length);
      if (request.method() === "GET") {
        const data = { "/auth/me": user, "/concursos": rows, "/notifications/unread-count": { count: 0 }, "/telemetry/preference": { opted_out: true } };
        return acceptJson(request, data[path] ?? []);
      }
      if (!path.startsWith("/concursos")) return acceptJson(request, {});
      const parts = path.split("/");
      const upload = parts[3];
      const body = upload ? null : JSON.parse(request.postData());
      calls.push({ path, body });
      if (path === "/concursos") {
        if (failCreate) return acceptJson(request, { detail: "Falha de criação" }, 500);
        const row = { ...body, id: `created-${rows.length}`, user_id: id, created_at: "2026-11-28T00:00:00", logo_url: null, edital_url: null };
        rows = [...rows, row];
        return acceptJson(request, row, 201);
      }
      const index = rows.findIndex((row) => row.id === parts[2]);
      if (!upload) rows[index] = { ...rows[index], ...body };
      if (upload) {
        assert.match(request.headers()["content-type"], /^multipart\/form-data; boundary=/);
        if (upload === "upload-edital" && failDocument) return acceptJson(request, { detail: "Falha de upload" }, 500);
        const key = upload === "upload-logo" ? "logo_url" : "edital_url";
        rows[index] = { ...rows[index], [key]: key === "logo_url" ? null : "/uploads/teste.pdf" };
      }
      return acceptJson(request, rows[index]);
    });

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${base}/concursos`, { waitUntil: "networkidle2" });
    await openForm(page);
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("dark")), theme === "dark");
    for (const width of [360, 390, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewport({ width, height: width < 640 ? 690 : 900 });
      await verifyLayout(page, width);
    }
    await page.setViewport({ width: 390, height: 380 });
    await verifyLayout(page, 390);
    await page.setViewport({ width: 1440, height: 900 });
    await page.keyboard.press("Escape");
    await waitClosed(page);
    await page.waitForFunction(() => document.activeElement?.textContent.includes("Cadastro manual"));
    if (theme === "dark") {
      await openForm(page);
      await page.locator("#concurso-nome").fill("Rascunho");
      await click(page, "Cancelar");
      await page.waitForSelector('[role="alertdialog"]');
      await click(page, "Descartar alterações");
      await waitClosed(page);
      await openForm(page);
      assert.equal(await page.$eval("#concurso-nome", (input) => input.value), "");
      await page.keyboard.press("Escape");
      await waitClosed(page);
      assert.deepEqual(calls, []);
      assert.deepEqual(errors, []);
      await context.close();
      console.log("Escuro: 7 larguras, rolagem e restauração de foco");
      continue;
    }

    await openForm(page);
    await click(page, "Criar concurso");
    await waitText(page, "Informe o nome do concurso.");
    assert.equal(await page.evaluate(() => document.activeElement.id), "concurso-nome");
    await page.locator("#concurso-nome").fill("Pré-edital");
    await page.locator("#concurso-orgao").fill("Receita Federal");
    await page.keyboard.press("Escape");
    await click(page, "Continuar editando");
    assert.equal(await page.$eval("#concurso-nome", (input) => input.value), "Pré-edital");
    await click(page, "Criar concurso");
    await waitClosed(page);
    assert.equal(calls[0].body.data_prova, null);
    assert.equal(calls[0].body.status, "ativo");

    await openForm(page);
    await page.locator("#concurso-nome").fill("Auditoria");
    await page.locator("#concurso-orgao").fill("Secretaria");
    await page.waitForSelector('[role="option"]');
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assert.equal(await page.$eval("#concurso-orgao", (input) => input.value), orgao);
    await page.locator("#concurso-banca").fill("FGV");
    await page.locator("#concurso-cargo").fill(cargo);
    await page.locator('label:has(input[name="concurso-status"][value="realizado"])').click();
    await page.click("#concurso-data-prova");
    await page.waitForSelector('[data-slot="popover-content"]');
    await click(page, "Selecionar ano");
    await page.locator('[role="option"]:not([aria-disabled])').click();
    const daySelector = '[data-slot="popover-content"] button[data-day]:not([disabled])';
    const expectedDate = await page.$eval(daySelector, (button) => button.dataset.day);
    await page.click(daySelector);
    assert.ok((await page.$eval("#concurso-data-prova", (button) => button.textContent)).includes(expectedDate.split("/").map((part) => part.padStart(2, "0")).join("/")));
    await click(page, "Limpar data");
    await waitText(page, "Selecionar data");
    await page.click("#concurso-data-prova");
    const selectedDay = await page.$eval(daySelector, (button) => button.dataset.day);
    await page.click(daySelector);

    const logoLabel = "Logo do órgão";
    const editalLabel = "Edital em PDF";
    for (const [index, dimensions] of [[200, 40], [40, 200], [80, 80]].entries()) {
      await dropFile(page, logoLabel, { name: `logo-${index}.png`, type: "image/png", dimensions });
      await page.waitForFunction(([width, height]) => {
        const image = document.querySelector('img[alt="Prévia da logo do órgão"]');
        return image?.naturalWidth === width && image.naturalHeight === height && getComputedStyle(image).objectFit === "contain";
      }, {}, dimensions);
    }
    await dropFile(page, editalLabel, { name: "invalido.pdf", type: "application/pdf", text: "Incompatível" });
    await waitText(page, "O conteúdo do arquivo não corresponde");
    await dropFile(page, editalLabel, { name: "grande.pdf", type: "application/pdf", size: 10 * 1024 ** 2 + 1 });
    await waitText(page, "O arquivo excede o limite de 10 MB.");
    const filename = `Edital-${"muito-longo-".repeat(17)}.pdf`;
    const pdf = { name: filename, type: "application/pdf", text: "%PDF-1.4\n%%EOF" };
    await dropFile(page, editalLabel, pdf);
    await page.waitForSelector('a[href^="blob:"]');
    await activateByKeyboard(page, `button[title="${filename}"]`);
    const filePopover = '[data-slot="popover-content"][aria-label="Nome completo do arquivo"]';
    await page.waitForSelector(filePopover);
    assert.equal(await page.$eval(filePopover, (popover) => popover.textContent), filename);
    await page.keyboard.press("Escape");
    await page.waitForSelector(filePopover, { hidden: true });
    assert.equal(await page.$eval('a[href^="blob:"]', async (link) => (await (await fetch(link.href)).blob()).type), "application/pdf");
    await activateByKeyboard(page, 'button[aria-label="Remover edital em pdf"]');
    await waitText(page, "Adicionar edital");
    await dropFile(page, editalLabel, pdf);
    await page.waitForSelector('a[href^="blob:"]');
    await page.setViewport({ width: 360, height: 690 });
    await verifyLayout(page, 360);
    assert.ok(await page.$eval("#concurso-cargo", (input) => input.scrollHeight <= input.clientHeight + 1));
    await page.setViewport({ width: 1440, height: 900 });
    await verifyLayout(page, 1440);

    failCreate = true;
    await click(page, "Criar concurso");
    await waitText(page, "Não foi possível salvar o concurso.");
    assert.equal(await page.$eval("#concurso-cargo", (input) => input.value), cargo);
    failCreate = false;
    failDocument = true;
    await page.$eval(`${modal} form`, (form) => { form.requestSubmit(); form.requestSubmit(); });
    await waitText(page, "Não foi possível armazenar o arquivo.");
    assert.equal(calls.filter(({ path }) => path === "/concursos").length, 3);
    assert.equal(rows.filter((row) => row.nome === "Auditoria").length, 1);
    const full = calls.find(({ body }) => body?.nome === "Auditoria").body;
    const [day, month, year] = selectedDay.split("/");
    assert.equal(full.data_prova, `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    assert.equal(full.status, "realizado");
    assert.equal(full.orgao, orgao);
    assert.equal(full.banca, "FGV");
    await waitText(page, "Upload concluído");
    failDocument = false;
    await click(page, "Criar concurso");
    await waitClosed(page);
    assert.equal(calls.filter(({ path }) => path === "/concursos").length, 3);
    assert.equal(calls.filter(({ path }) => path.endsWith("/upload-logo")).length, 1);
    assert.equal(calls.filter(({ path }) => path.endsWith("/upload-edital")).length, 2);

    await page.locator('[data-concurso-card] button[aria-label^="Ações"]').click();
    await click(page, "Editar concurso");
    await page.waitForSelector("#concurso-nome");
    assert.ok(await page.$(`${modal} button[title="edital atual.pdf"]`));
    assert.ok(await page.$(`${modal} a[href="/uploads/edital%20atual.pdf?download=1"]`));
    assert.equal(await page.$eval('input[name="concurso-status"]:checked', (input) => input.closest("label").textContent), "Encerrado");
    await page.locator("#concurso-cargo").fill("Cargo atualizado");
    await click(page, "Salvar alterações");
    await waitClosed(page);
    assert.equal(calls.at(-1).body.status, "eliminado");
    assert.equal(calls.at(-1).body.cargo, "Cargo atualizado");

    // Registros anteriores podem ter sido criados sem órgão, que hoje é obrigatório no formulário.
    rows[0] = { ...rows[0], orgao: "" };
    await page.reload({ waitUntil: "networkidle2" });
    await page.locator('[data-concurso-card] button[aria-label^="Ações"]').click();
    await click(page, "Editar concurso");
    await page.waitForSelector("#concurso-nome");
    assert.equal(await page.$eval("#concurso-orgao", (input) => input.value), "");
    const requestCount = calls.length;
    await click(page, "Salvar alterações");
    await waitClosed(page);
    assert.equal(calls.length, requestCount);
    assert.deepEqual(errors, []);
    console.log("Claro: 7 larguras, criação, edição, data civil, arquivos, erro e reenvio sem duplicação");
    await context.close();
  }
} finally {
  await browser.close();
}
