/**
 * Gate de design tokens — Story 8.1 / EPIC-8
 *
 * Verifica cores hardcoded (hex/rgba) em arquivos TSX.
 *
 * Regras:
 * - src/components/ui/** → zero tolerância (hex e rgba)
 * - Demais .tsx → zero hex (paletas dinâmicas ficam em src/lib/palette/*.ts ou assets)
 * - rgba fora de allowlist → aviso (não falha)
 *
 * Uso: npm run check:design-tokens
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "../src");

/** Caminhos relativos a src/ com rgba permitido (editor rich text legado). */
const RGBA_ALLOWLIST = ["components/flashcards/FlashcardsPageStyles.tsx"];

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;
const RGBA_RE = /rgba?\([^)]+\)/g;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

function relFromSrc(abs) {
  return path.relative(SRC, abs).replace(/\\/g, "/");
}

function findMatches(content, re) {
  const hits = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(content)) !== null) {
    const line = content.slice(0, m.index).split("\n").length;
    hits.push({ match: m[0], line });
  }
  return hits;
}

const files = walk(SRC);
const uiViolations = [];
const hexViolations = [];
const rgbaWarnings = [];

for (const file of files) {
  const rel = relFromSrc(file);
  const content = fs.readFileSync(file, "utf8");
  const hexHits = findMatches(content, HEX_RE);
  const rgbaHits = findMatches(content, RGBA_RE);
  const isUi = rel.startsWith("components/ui/");

  if (isUi && (hexHits.length > 0 || rgbaHits.length > 0)) {
    uiViolations.push({ rel, hits: [...hexHits, ...rgbaHits] });
  }

  if (hexHits.length > 0 && !isUi) {
    hexViolations.push({ rel, hits: hexHits });
  }

  if (rgbaHits.length > 0 && !isUi) {
    if (!RGBA_ALLOWLIST.includes(rel)) {
      rgbaWarnings.push({ rel, count: rgbaHits.length });
    }
  }
}

console.log("=== Aprovingo Design Token Check ===\n");

if (uiViolations.length === 0) {
  console.log("✅ src/components/ui/** — sem hex/rgba hardcoded");
} else {
  console.log("❌ src/components/ui/** — violações:\n");
  for (const { rel, hits } of uiViolations) {
    console.log(`  ${rel}`);
    for (const h of hits.slice(0, 5)) console.log(`    L${h.line}: ${h.match}`);
  }
}

console.log("");

if (hexViolations.length === 0) {
  console.log("✅ Nenhum hex hardcoded em arquivos .tsx");
} else {
  console.log(`❌ Hex em ${hexViolations.length} arquivo(s) .tsx:\n`);
  for (const { rel, hits } of hexViolations) {
    console.log(`  ${rel} (${hits.length})`);
    for (const h of hits.slice(0, 3)) console.log(`    L${h.line}: ${h.match}`);
  }
  console.log("");
}

if (rgbaWarnings.length > 0) {
  console.log(`⚠️  rgba() fora da allowlist em ${rgbaWarnings.length} arquivo(s):`);
  for (const { rel, count } of rgbaWarnings) console.log(`   - ${rel} (${count})`);
  console.log("");
}

const failed = uiViolations.length > 0 || hexViolations.length > 0;

if (failed) {
  console.log("Falhou. Paletas dinâmicas: src/lib/palette/*.ts · Ver design-system.md §9");
  process.exit(1);
}

console.log("Passou. TSX sem hex; paletas em lib/palette ou assets SVG.");
process.exit(0);
