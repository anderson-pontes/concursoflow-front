/**
 * Story 11.2 — smoke teclado header/shell (UXD-007)
 * Uso: node scripts/qa-11.2-header-a11y-smoke.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.LH_BASE_URL || "http://localhost:3000";
const EMAIL = process.env.LH_EMAIL || "seed@example.com";
const PASSWORD = process.env.LH_PASSWORD || "Seed@2026";

const results = {
  story: "11.2",
  fetchedAt: new Date().toISOString(),
  base: BASE,
  flows: {},
  a11y: {},
};

function pass(id, ok, note = "") {
  results.flows[id] = { ok, note };
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

    // 1 ConcursoSwitcher listbox
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 800));
    const switcher = await page.$('button[aria-haspopup="listbox"]');
    if (!switcher) {
      pass("1_concurso_switcher", false, "Trigger listbox não encontrado");
    } else {
      await switcher.focus();
      await page.keyboard.press("ArrowDown");
      await new Promise((r) => setTimeout(r, 400));
      const listboxOpen = await page.evaluate(() => {
        const t = document.querySelector('button[aria-haspopup="listbox"]');
        return t?.getAttribute("aria-expanded") === "true";
      });
      await page.keyboard.press("ArrowDown");
      await new Promise((r) => setTimeout(r, 200));
      const hasActiveDesc = await page.evaluate(() => {
        const t = document.querySelector('button[aria-haspopup="listbox"]');
        const ad = t?.getAttribute("aria-activedescendant");
        return Boolean(ad && document.getElementById(ad));
      });
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 300));
      const closed = await page.evaluate(() => {
        const t = document.querySelector('button[aria-haspopup="listbox"]');
        return t?.getAttribute("aria-expanded") === "false";
      });
      pass(
        "1_concurso_switcher",
        listboxOpen && hasActiveDesc && closed,
        `open=${listboxOpen} activeDesc=${hasActiveDesc} escape=${closed}`,
      );
      results.a11y.concurso_escape = closed;
    }

    // 2 UserDropdown menu
    const userBtn = await page.$('button[aria-label="Menu do usuário"]');
    if (!userBtn) {
      pass("2_user_dropdown", false, "Trigger menu usuário não encontrado");
    } else {
      await userBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const focusOnItem = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute("role") === "menuitem" && (el.textContent || "").includes("Meu perfil");
      });
      await page.keyboard.press("ArrowDown");
      await new Promise((r) => setTimeout(r, 150));
      const focusMoved = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute("role") === "menuitem" && (el.textContent || "").includes("Alterar senha");
      });
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 300));
      const focusOnTrigger = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute("aria-label") === "Menu do usuário";
      });
      pass(
        "2_user_dropdown",
        focusOnItem && focusMoved && focusOnTrigger,
        `first=${focusOnItem} arrow=${focusMoved} escapeFocus=${focusOnTrigger}`,
      );
      results.a11y.user_menu_escape_focus = focusOnTrigger;
    }

    // 3 NotificationBell — seed não é admin
    const bell = await page.$('button[aria-label="Notificações"]');
    if (!bell) {
      pass("3_notification_bell", true, "N/A — seed@example.com não é admin (componente oculto)");
    } else {
      await bell.click();
      await new Promise((r) => setTimeout(r, 400));
      const menuOpen = await page.$('[role="menu"][aria-label="Notificações"]');
      if (menuOpen) {
        const focusItem = await page.evaluate(() => document.activeElement?.getAttribute("role") === "menuitem");
        await page.keyboard.press("Escape");
        pass("3_notification_bell", focusItem, `admin menu focus=${focusItem}`);
      } else {
        pass("3_notification_bell", false, "Menu não abriu");
      }
    }

    const keys = Object.keys(results.flows);
    const passed = keys.filter((k) => results.flows[k]?.ok).length;
    results.summary = { passed, total: keys.length, allOk: passed === keys.length };

    const outDir = join(__dirname, "../docs/qa");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "11.2-header-a11y-smoke-results.json"), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
