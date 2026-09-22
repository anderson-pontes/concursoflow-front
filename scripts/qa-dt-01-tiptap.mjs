import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const email = process.env.QA_EMAIL || "seed@example.com";
const password = process.env.QA_PASSWORD || "Seed@2026";
const marker = `DT01-${Date.now()}`;
const deckName = `QA Tiptap ${marker}`;
const frontText = `Princípio da legalidade ${marker}`;
const editedSuffix = " — conteúdo editado";
const backText = `A administração atua conforme a lei ${marker}`;

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

let deckCreated = false;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function isVisible(handle) {
  return handle.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
  });
}

async function findVisible(selector, predicate, args) {
  const handles = await page.$$(selector);
  for (const handle of handles) {
    if (!(await isVisible(handle))) continue;
    const matches = await handle.evaluate(predicate, args);
    if (matches) return handle;
  }
  return null;
}

async function clickButton(text, { exact = true } = {}) {
  const handle = await findButton(text, { exact });
  if (!handle) throw new Error(`Botão visível não encontrado: ${text}`);
  await handle.click();
}

async function findButton(text, { exact = true } = {}) {
  return findVisible("button", (element, args) => {
    const value = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
    return args.exact ? value === args.text : value.includes(args.text);
  }, { text, exact });
}

async function clickElementByText(selector, text, { exact = true } = {}) {
  const handle = await findVisible(selector, (element, args) => {
    const value = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
    return args.exact ? value === args.text : value.includes(args.text);
  }, { text, exact });
  if (!handle) throw new Error(`Elemento visível não encontrado: ${selector} → ${text}`);
  await handle.click();
}

async function selectAllInEditor() {
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
}

async function clickButtonByAttribute(attribute, prefix) {
  const handle = await findVisible(`button[${attribute}]`, (button, args) =>
    (button.getAttribute(args.attribute) ?? "").startsWith(args.prefix), { attribute, prefix });
  if (!handle) throw new Error(`Botão visível não encontrado: ${attribute}^=${prefix}`);
  await handle.click();
}

async function waitForText(text, timeout = 15_000) {
  await page.waitForFunction(
    (expected) => document.body.innerText.includes(expected),
    { timeout },
    text,
  );
}

async function waitForTextAbsent(text, timeout = 15_000) {
  await page.waitForFunction(
    (expected) => !document.body.innerText.includes(expected),
    { timeout },
    text,
  );
}

async function clickDeckAction(buttonText) {
  const clicked = await page.evaluate(({ name, action }) => {
    const title = [...document.querySelectorAll('[data-slot="card-title"]')]
      .find((element) => element.textContent?.trim() === name);
    const card = title?.closest('[data-slot="card"]');
    const button = [...(card?.querySelectorAll("button") ?? [])]
      .find((element) => element.textContent?.replace(/\s+/g, " ").trim().includes(action));
    if (!(button instanceof HTMLButtonElement)) return false;
    button.click();
    return true;
  }, { name: deckName, action: buttonText });
  assert(clicked, `Ação ${buttonText} não encontrada no baralho temporário.`);
}

async function login() {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle2", timeout: 60_000 });
  if (!page.url().includes("/login")) return;
  await page.type("#login-email", email);
  await page.type("#login-password", password);
  await Promise.all([
    page.waitForFunction(() => location.pathname.includes("/dashboard"), { timeout: 30_000 }),
    clickButton("Entrar"),
  ]);
}

async function cleanupDeck() {
  if (!deckCreated) return;
  await page.goto(`${baseUrl}/flashcards`, { waitUntil: "networkidle2", timeout: 60_000 });
  await waitForText(deckName);
  await clickButtonByAttribute("aria-label", `Ações do baralho ${deckName}`);
  await clickElementByText('[role="menuitem"]', "Excluir baralho");
  const deleteResponse = page.waitForResponse(
    (response) => response.request().method() === "DELETE" && /\/api\/v1\/flashcards\/decks\/[0-9a-f-]+$/.test(response.url()),
    { timeout: 15_000 },
  );
  await clickButton("Excluir baralho");
  assert((await deleteResponse).ok(), "A limpeza do baralho temporário falhou.");
  await waitForTextAbsent(deckName);
  deckCreated = false;
}

try {
  await login();
  await page.goto(`${baseUrl}/flashcards`, { waitUntil: "networkidle2", timeout: 60_000 });

  await clickButton("Novo baralho");
  await page.waitForSelector('[role="dialog"] #deck-name', { visible: true });
  await page.type('[role="dialog"] #deck-name', deckName);
  await page.type('[role="dialog"] #deck-description', "Baralho temporário do smoke seguro do Tiptap.");
  const createDeckResponse = page.waitForResponse(
    (response) => response.request().method() === "POST" && response.url().endsWith("/api/v1/flashcards/decks"),
    { timeout: 15_000 },
  );
  await clickButton("Criar baralho");
  assert((await createDeckResponse).ok(), "Falha ao criar o baralho temporário.");
  deckCreated = true;
  await waitForText(deckName);

  await clickDeckAction("Ver cartões");
  await waitForText("Este baralho ainda não tem cartões");
  await clickButton("Criar primeiro cartão");
  await page.waitForSelector('[role="dialog"] .ProseMirror', { visible: true });

  let editors = await page.$$('[role="dialog"] .ProseMirror');
  assert(editors.length === 1, "Editor da frente não foi carregado de forma única.");
  await editors[0].click();
  await page.keyboard.type(frontText);
  await selectAllInEditor();
  await clickButtonByAttribute("aria-label", "Negrito");

  await clickButton("👁️ Verso");
  await page.waitForSelector('[role="dialog"] .ProseMirror', { visible: true });
  editors = await page.$$('[role="dialog"] .ProseMirror');
  assert(editors.length === 1, "Editor do verso não foi carregado de forma única.");
  await editors[0].click();
  await page.keyboard.type(backText);
  await selectAllInEditor();
  await clickButtonByAttribute("aria-label", "Itálico");

  const saveCardButton = await findButton("Salvar cartão", { exact: false });
  assert(saveCardButton, "Botão visível não encontrado: Salvar cartão");
  const createCardResponse = page.waitForResponse(
    (response) => response.request().method() === "POST" && response.url().endsWith("/api/v1/flashcards"),
    { timeout: 15_000 },
  );
  await saveCardButton.click();
  const createdResponse = await createCardResponse;
  assert(createdResponse.ok(), "Falha ao criar o cartão formatado.");
  const createPayload = JSON.parse(createdResponse.request().postData() ?? "{}");
  assert(createPayload.frente?.includes("<strong>"), "A formatação em negrito da frente não foi persistida.");
  assert(createPayload.verso?.includes("<em>"), "A formatação em itálico do verso não foi persistida.");
  await waitForText(frontText);

  await clickButtonByAttribute("aria-label", "Editar cartão");
  await page.waitForSelector('[role="dialog"] .ProseMirror', { visible: true });
  editors = await page.$$('[role="dialog"] .ProseMirror');
  assert((await editors[0].evaluate((element) => element.textContent ?? "")).includes(frontText), "A frente não foi reaberta com o conteúdo salvo.");
  await editors[0].click();
  await page.keyboard.press("End");
  await page.keyboard.type(editedSuffix);
  const updateCardResponse = page.waitForResponse(
    (response) => response.request().method() === "PUT" && /\/api\/v1\/flashcards\/[0-9a-f-]+$/.test(response.url()),
    { timeout: 15_000 },
  );
  await clickButton("Salvar", { exact: false });
  const updatedResponse = await updateCardResponse;
  assert(updatedResponse.ok(), "Falha ao editar o cartão.");
  const updatePayload = JSON.parse(updatedResponse.request().postData() ?? "{}");
  assert(updatePayload.frente?.includes("conteúdo editado"), "A edição da frente não foi enviada.");
  await waitForText(`${frontText}${editedSuffix}`);

  await clickButton("Estudar este baralho");
  await waitForText("Revisar agora");
  await clickButton("Revisar agora", { exact: false });
  await waitForText("Revelar resposta");
  await waitForText(`${frontText}${editedSuffix}`);
  await clickButton("Revelar resposta", { exact: false });
  await waitForText(backText);
  const reviewResponse = page.waitForResponse(
    (response) => response.request().method() === "POST" && /\/api\/v1\/flashcards\/[0-9a-f-]+\/responder$/.test(response.url()),
    { timeout: 15_000 },
  );
  await clickButtonByAttribute("title", "Bom");
  assert((await reviewResponse).ok(), "Falha ao registrar a revisão do cartão.");
  await waitForText("Sessão concluída!");

  await clickButton("Ver meus baralhos");
  await waitForText(deckName);
  await clickDeckAction("Ver cartões");
  await waitForText(`${frontText}${editedSuffix}`);
  await clickButtonByAttribute("aria-label", "Editar cartão");
  await page.waitForSelector('[role="dialog"] .ProseMirror', { visible: true });
  editors = await page.$$('[role="dialog"] .ProseMirror');
  const reopenedFront = await editors[0].evaluate((element) => element.textContent ?? "");
  assert(reopenedFront.includes(`${frontText}${editedSuffix}`), "O conteúdo editado não foi preservado ao reabrir.");
  await clickButtonByAttribute("aria-label", "Fechar");

  assert(pageErrors.length === 0, `Erros de página encontrados: ${pageErrors.join(" | ")}`);
  assert(consoleErrors.length === 0, `Erros de console encontrados: ${consoleErrors.join(" | ")}`);

  await cleanupDeck();
  console.log(JSON.stringify({
    passed: true,
    flow: ["criar", "formatar", "salvar", "editar", "revisar", "reabrir", "limpar"],
    pageErrors: pageErrors.length,
    consoleErrors: consoleErrors.length,
  }, null, 2));
} catch (error) {
  const diagnostic = page.isClosed()
    ? { url: null, visibleButtons: [] }
    : await page.evaluate(() => ({
        url: location.href,
        visibleButtons: [...document.querySelectorAll("button")]
          .filter((button) => {
            const style = getComputedStyle(button);
            const rect = button.getBoundingClientRect();
            return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
          })
          .map((button) => button.textContent?.replace(/\s+/g, " ").trim() ?? "")
          .filter(Boolean),
      }));
  try {
    await cleanupDeck();
  } catch (cleanupError) {
    console.error(`Falha adicional na limpeza: ${cleanupError.message}`);
  }
  console.error(JSON.stringify({
    passed: false,
    error: error.message,
    diagnostic,
    pageErrors,
    consoleErrors,
    temporaryDeck: deckCreated ? deckName : null,
  }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
