/**
 * Lighthouse na rota /login (mobile).
 * Uso: LH_BASE_URL=http://localhost:4173 node scripts/lighthouse-login.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import lighthouse from "lighthouse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../docs/lighthouse");
const BASE = process.env.LH_BASE_URL || "http://localhost:3000";
const DEBUG_PORT = 9223;

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
    const loginUrl = `${BASE}/login`;
    const result = await lighthouse(loginUrl, LH_OPTIONS);
    const scores = extractScores(result.lhr);

    writeFileSync(join(OUT_DIR, "login-mobile.json"), result.report);
    writeFileSync(
      join(OUT_DIR, "login-mobile-scores.json"),
      JSON.stringify({ url: loginUrl, scores, fetchedAt: new Date().toISOString() }, null, 2),
    );

    console.log("=== Lighthouse Login (mobile 375px) ===");
    console.log(JSON.stringify(scores, null, 2));
    console.log(`\nRelatório: docs/lighthouse/login-mobile.json`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Falha no Lighthouse login:", err.message);
  process.exit(1);
});
