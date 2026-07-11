/**
 * Lighthouse no Dashboard autenticado (mobile).
 * Usa credenciais de seed local (seed_data.py): seed@example.com / Seed@2026
 *
 * Pré-requisitos: npm run dev + backend em localhost:8000
 * Uso: node scripts/lighthouse-dashboard.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import lighthouse from "lighthouse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../docs/lighthouse");
const BASE = process.env.LH_BASE_URL || "http://localhost:3000";
const EMAIL = process.env.LH_EMAIL || "seed@example.com";
const PASSWORD = process.env.LH_PASSWORD || "Seed@2026";
const DEBUG_PORT = 9222;

const LH_OPTIONS = {
  logLevel: "error",
  output: "json",
  onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  port: DEBUG_PORT,
  formFactor: "mobile",
  screenEmulation: {
    mobile: true,
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    disabled: false,
  },
};

function extractScores(lhr) {
  return Object.fromEntries(
    Object.entries(lhr.categories).map(([key, cat]) => [key, Math.round((cat.score ?? 0) * 100)]),
  );
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [`--remote-debugging-port=${DEBUG_PORT}`, "--no-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 60_000 });
    await page.waitForSelector("#login-email", { timeout: 15_000 });
    await page.type("#login-email", EMAIL, { delay: 20 });
    await page.type("#login-password", PASSWORD, { delay: 20 });
    await page.click('button[type="submit"]');
    await page.waitForFunction(
      () => window.location.pathname.includes("/dashboard"),
      { timeout: 30_000 },
    );
    await new Promise((r) => setTimeout(r, 2500));

    const dashboardUrl = `${BASE}/dashboard`;
    const result = await lighthouse(dashboardUrl, LH_OPTIONS);
    const scores = extractScores(result.lhr);

    writeFileSync(join(OUT_DIR, "dashboard-mobile.json"), result.report);
    writeFileSync(
      join(OUT_DIR, "dashboard-mobile-scores.json"),
      JSON.stringify({ url: dashboardUrl, scores, fetchedAt: new Date().toISOString() }, null, 2),
    );

    console.log("=== Lighthouse Dashboard (mobile 375px) ===");
    console.log(JSON.stringify(scores, null, 2));
    console.log(`\nRelatório: docs/lighthouse/dashboard-mobile.json`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Falha no Lighthouse dashboard:", err.message);
  process.exit(1);
});
