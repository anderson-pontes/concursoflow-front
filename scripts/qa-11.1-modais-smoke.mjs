/**
 * Story 11.1 — smoke modais disciplinas/planos (Radix)
 * Uso: node scripts/qa-11.1-modais-smoke.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.LH_BASE_URL || "http://localhost:4173";
const EMAIL = process.env.LH_EMAIL || "seed@example.com";
const PASSWORD = process.env.LH_PASSWORD || "Seed@2026";

const results = {
  story: "11.1",
  fetchedAt: new Date().toISOString(),
  base: BASE,
  flows: {},
  a11y: {},
};

function pass(id, ok, note = "") {
  results.flows[id] = { ok, note };
}

async function clickByText(page, text, tag = "button") {
  return page.evaluate(
    (t, tg) => {
      const el = [...document.querySelectorAll(tg)].find((e) =>
        (e.textContent || "").trim().includes(t),
      );
      if (el) {
        el.click();
        return true;
      }
      return false;
    },
    text,
    tag,
  );
}

async function hasDialog(page) {
  return Boolean(await page.$('[role="dialog"]'));
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector("#login-email", { timeout: 15000 });
  await page.type("#login-email", EMAIL, { delay: 5 });
  await page.type("#login-password", PASSWORD, { delay: 5 });
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.includes("/dashboard"), { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();

  try {
    await login(page);

    // 1 ModalDisciplinaForm — Nova disciplina
    await page.goto(`${BASE}/disciplinas`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    const openedDisc = await clickByText(page, "Nova disciplina");
    await new Promise((r) => setTimeout(r, 600));
    const discDialog = await hasDialog(page);
    const discTitle = await page.evaluate(() =>
      [...document.querySelectorAll('[role="dialog"]')].some((d) =>
        d.textContent?.includes("Nova disciplina"),
      ),
    );
    if (discDialog) {
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 400));
    }
    const discEsc = !(await hasDialog(page));
    pass(
      "1_modal_disciplina",
      openedDisc && discDialog && discTitle && discEsc,
      `open=${openedDisc} dialog=${discDialog} escape=${discEsc}`,
    );
    results.a11y.disciplina_escape = discEsc;

    // 2 ModalCriarPlano — página /planos não roteada em App.tsx
    await page.goto(`${BASE}/planos`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    const onPlanosPage = await page.evaluate(() => document.body.innerText.includes("Planos de Estudo"));
    if (onPlanosPage) {
      const openedPlano = (await clickByText(page, "Novo Plano")) || (await clickByText(page, "Criar novo plano"));
      await new Promise((r) => setTimeout(r, 600));
      const planoDialog = await hasDialog(page);
      const planoTitle = await page.evaluate(() =>
        [...document.querySelectorAll('[role="dialog"]')].some((d) =>
          d.textContent?.includes("Novo plano de estudo"),
        ),
      );
      if (planoDialog) {
        await page.keyboard.press("Escape");
        await new Promise((r) => setTimeout(r, 400));
      }
      pass(
        "2_modal_plano",
        openedPlano && planoDialog && planoTitle,
        `open=${openedPlano} dialog=${planoDialog}`,
      );
    } else {
      pass("2_modal_plano", false, "N/T — rota /planos ausente (catch-all → dashboard)");
    }

    // 3 DrawerDisciplina — requer rota ativa de detalhe do plano
    pass(
      "3_drawer_disciplina",
      false,
      "N/T — App.tsx redireciona /concursos/planos/:id → /concursos (débito pré-existente)",
    );

    // 4 TopicosModal — via primeira disciplina (card é role=button)
    await page.goto(`${BASE}/disciplinas`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
    const openedDiscDetail = await page.evaluate(() => {
      const card = document.querySelector('[aria-label^="Abrir painel de"]');
      if (card) {
        card.click();
        return true;
      }
      return false;
    });
    if (openedDiscDetail) {
      await page.waitForFunction(() => window.location.pathname.match(/\/disciplinas\/[^/]+/), {
        timeout: 15000,
      });
      await new Promise((r) => setTimeout(r, 1200));
      const openedTopico = await clickByText(page, "Adicionar tópicos");
      if (!openedTopico) {
        const alt = await clickByText(page, "Novo tópico");
        pass("4_topicos_modal", false, `botão não encontrado (alt=${alt})`);
      } else {
        await new Promise((r) => setTimeout(r, 600));
        const topDialog = await hasDialog(page);
        const topTitle = await page.evaluate(() =>
          [...document.querySelectorAll('[role="dialog"]')].some((d) => d.textContent?.includes("Tópico")),
        );
        if (topDialog) await page.keyboard.press("Escape");
        pass("4_topicos_modal", topDialog && topTitle, `dialog=${topDialog} title=${topTitle}`);
      }
    } else {
      pass("4_topicos_modal", false, "Nenhuma disciplina no catálogo (API vazia)");
    }

    const keys = Object.keys(results.flows);
    const passed = keys.filter((k) => results.flows[k]?.ok).length;
    results.summary = { passed, total: keys.length, allOk: passed === keys.length };

    const outDir = join(__dirname, "../docs/qa");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "11.1-modais-smoke-results.json"), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
