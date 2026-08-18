import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "docs", "qa", "ux-ui");
const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const routes = ["/", "/login", "/register"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

mkdirSync(outputDir, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const report = { generatedAt: new Date().toISOString(), baseUrl, results: [] };

try {
  for (const viewport of viewports) {
    for (const route of routes) {
      const page = await browser.newPage();
      await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((resolve) => setTimeout(resolve, 400));
      const audit = await page.evaluate(() => {
        const visible = (node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        };
        const scrollContainers = [...document.querySelectorAll("main, form, [class]")].filter((node) => {
          if (!visible(node)) return false;
          const overflow = getComputedStyle(node).overflowY;
          return ["auto", "scroll"].includes(overflow) && node.scrollHeight > node.clientHeight + 1;
        });
        const accent = document.querySelector('[data-accent-variant="swoop"] path');
        const heading = document.querySelector("main h1");
        const accentRect = accent?.getBoundingClientRect();
        const textRects = [];
        if (heading) {
          const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
          let textNode;
          while ((textNode = walker.nextNode())) {
            if (!textNode.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(textNode);
            textRects.push(...range.getClientRects());
          }
        }
        const accentTouchesText = Boolean(accentRect && textRects.some((rect) =>
          accentRect.left < rect.right && accentRect.right > rect.left && accentRect.top < rect.bottom && accentRect.bottom > rect.top
        ));
        return {
          pathname: location.pathname,
          h1Count: document.querySelectorAll("main h1").length,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          scrollContainers: scrollContainers.map((node) => node.tagName.toLowerCase()),
          formHasOwnScroll: scrollContainers.some((node) => node.tagName === "FORM"),
          accentTouchesText,
        };
      });
      const slug = route === "/" ? "landing" : route.slice(1);
      const screenshot = `${viewport.name}-${slug}.png`;
      await page.screenshot({ path: join(outputDir, screenshot), fullPage: true });
      report.results.push({ viewport: viewport.name, route, screenshot, ...audit });
      await page.close();
    }
  }
} finally {
  await browser.close();
}

report.passed = report.results.every((item) =>
  item.h1Count === 1 && !item.horizontalOverflow && !item.formHasOwnScroll && !(item.viewport === "mobile" && item.route === "/" && item.accentTouchesText)
);
writeFileSync(join(outputDir, "public-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
