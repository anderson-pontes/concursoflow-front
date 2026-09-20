/**
 * Lighthouse das rotas públicas prioritárias no preview de produção (mobile).
 * Uso: LH_BASE_URL=http://127.0.0.1:4173 npm run lh:public
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import lighthouse from "lighthouse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../docs/lighthouse");
const BASE = process.env.LH_BASE_URL || "http://localhost:4173";
const DEBUG_PORT = 9224;
const ROUTES = [
  { name: "landing", path: "/" },
  { name: "login", path: "/login" },
];

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
    Object.entries(lhr.categories).map(([key, category]) => [
      key,
      Math.round((category.score ?? 0) * 100),
    ]),
  );
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--remote-debugging-port=${DEBUG_PORT}`, "--no-sandbox", "--disable-gpu"],
  });

  try {
    const results = [];
    for (const route of ROUTES) {
      const url = new URL(route.path, BASE).toString();
      const result = await lighthouse(url, LH_OPTIONS);
      const scores = extractScores(result.lhr);
      writeFileSync(join(OUT_DIR, `${route.name}-mobile.json`), result.report);
      results.push({ route: route.path, url, scores });
    }

    const summary = { fetchedAt: new Date().toISOString(), results };
    writeFileSync(
      join(OUT_DIR, "public-mobile-scores.json"),
      JSON.stringify(summary, null, 2),
    );
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Falha no Lighthouse público:", error.message);
  process.exit(1);
});
