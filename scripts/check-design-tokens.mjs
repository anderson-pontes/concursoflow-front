/**
 * Gate de design tokens — Story 8.1 / EPIC-8 / Story 9.1
 *
 * Verifica cores hardcoded (hex/rgba) em arquivos TSX e regressões tipográficas.
 *
 * Regras:
 * - src/components/ui/** → zero tolerância (hex e rgba)
 * - Demais .tsx → zero hex (paletas em src/lib/palette/*.ts ou assets)
 * - Demais .tsx → zero fontFamily Inter hardcoded
 * - src/lib/** → rgba fora de allowlist → aviso (não falha)
 *
 * Uso: npm run check:design-tokens
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "../src");

/** Caminhos relativos a src/ com rgba permitido em .tsx (editor rich text legado). */
const RGBA_TSX_ALLOWLIST = ["components/flashcards/RichTextEditor.tsx"];

/** Caminhos relativos a src/lib/ com rgba permitido (gradientes decorativos). */
const RGBA_LIB_ALLOWLIST = ["lib/pomodoro/theme.ts"];

/**
 * UXD-012 — auditoria de tamanho de componente (aviso).
 * Arquivos .tsx acima do limite exigem justificativa documentada (allowlist abaixo).
 * Novos monólitos fora do allowlist geram aviso — ver docs/ux-debt-report.md § UXD-012.
 */
const SIZE_LIMIT = 400;
const SIZE_ALLOWLIST = [
  "components/estudos/RegistroEstudoModal.tsx",
  "pages/Flashcards.tsx",
  "components/pomodoro/PomodoroTimer.tsx",
  "components/concursos/ConcursoDetalheModal.tsx",
  "components/flashcards/CardFormModal.tsx",
  "components/flashcards/FlashcardsReviewTab.tsx",
  "components/cronograma/GerarCronogramaAutoModal.tsx",
  "components/disciplinaDashboard/DisciplinaDashboardTopicosTable.tsx",
  "components/layout/Sidebar.tsx",
  "pages/Dashboard.tsx",
  "pages/DisciplinaDashboard.tsx",
];

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;
const RGBA_RE = /rgba?\([^)]+\)/g;
const INTER_FONT_RE = /fontFamily\s*:\s*["']Inter/g;

function walk(dir, acc = [], ext = ".tsx") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc, ext);
    else if (entry.name.endsWith(ext)) acc.push(full);
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

const tsxFiles = walk(SRC, [], ".tsx");
const libFiles = walk(path.join(SRC, "lib"), [], ".ts");

const uiViolations = [];
const hexViolations = [];
const interViolations = [];
const rgbaTsxWarnings = [];
const rgbaLibWarnings = [];
const sizeWarnings = [];

for (const file of tsxFiles) {
  const rel = relFromSrc(file);
  const content = fs.readFileSync(file, "utf8");
  const hexHits = findMatches(content, HEX_RE);
  const rgbaHits = findMatches(content, RGBA_RE);
  const interHits = findMatches(content, INTER_FONT_RE);
  const isUi = rel.startsWith("components/ui/");

  const lineCount = content.split("\n").length;
  if (lineCount > SIZE_LIMIT && !SIZE_ALLOWLIST.includes(rel)) {
    sizeWarnings.push({ rel, lineCount });
  }

  if (isUi && (hexHits.length > 0 || rgbaHits.length > 0)) {
    uiViolations.push({ rel, hits: [...hexHits, ...rgbaHits] });
  }

  if (hexHits.length > 0 && !isUi) {
    hexViolations.push({ rel, hits: hexHits });
  }

  if (interHits.length > 0) {
    interViolations.push({ rel, hits: interHits });
  }

  if (rgbaHits.length > 0 && !isUi && !RGBA_TSX_ALLOWLIST.includes(rel)) {
    rgbaTsxWarnings.push({ rel, count: rgbaHits.length });
  }
}

for (const file of libFiles) {
  const rel = relFromSrc(file);
  const content = fs.readFileSync(file, "utf8");
  const rgbaHits = findMatches(content, RGBA_RE);
  if (rgbaHits.length > 0 && !RGBA_LIB_ALLOWLIST.includes(rel)) {
    rgbaLibWarnings.push({ rel, count: rgbaHits.length });
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

if (interViolations.length === 0) {
  console.log("✅ Nenhuma fonte Inter hardcoded em .tsx");
} else {
  console.log(`❌ fontFamily Inter em ${interViolations.length} arquivo(s):\n`);
  for (const { rel, hits } of interViolations) {
    console.log(`  ${rel}`);
    for (const h of hits.slice(0, 3)) console.log(`    L${h.line}: ${h.match}`);
  }
  console.log("");
}

if (rgbaTsxWarnings.length > 0) {
  console.log(`⚠️  rgba() em .tsx fora da allowlist (${rgbaTsxWarnings.length} arquivo(s)):`);
  for (const { rel, count } of rgbaTsxWarnings) console.log(`   - ${rel} (${count})`);
  console.log("");
}

if (rgbaLibWarnings.length > 0) {
  console.log(`⚠️  rgba() em src/lib/ fora da allowlist (${rgbaLibWarnings.length} arquivo(s)):`);
  for (const { rel, count } of rgbaLibWarnings) console.log(`   - ${rel} (${count})`);
  console.log("");
}

if (sizeWarnings.length === 0) {
  console.log(`✅ Nenhum componente novo acima de ${SIZE_LIMIT} linhas (UXD-012)`);
} else {
  console.log(`⚠️  Componente(s) > ${SIZE_LIMIT} linhas fora do allowlist UXD-012:`);
  for (const { rel, lineCount } of sizeWarnings) console.log(`   - ${rel} (${lineCount})`);
  console.log("   → Decomponha ou adicione ao SIZE_ALLOWLIST com justificativa.");
}

console.log("");

const failed = uiViolations.length > 0 || hexViolations.length > 0 || interViolations.length > 0;

if (failed) {
  console.log("Falhou. Paletas: src/lib/palette/*.ts · Tipografia: font-sans (Geist)");
  process.exit(1);
}

console.log("Passou. TSX sem hex/Inter; paletas em lib/palette ou assets SVG.");
process.exit(0);
