import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("shell mantém somente o título da página como h1", () => {
  const header = read("src/components/layout/Header.tsx");
  assert.doesNotMatch(header, /<h1\b/);
});

test("rotas lazy exibem skeleton estrutural acessível", () => {
  const app = read("src/App.tsx");
  const skeleton = read("src/components/ui/page-skeleton.tsx");
  assert.match(app, /<PageSkeleton/);
  assert.match(skeleton, /role="status"/);
  assert.match(skeleton, /aria-live="polite"/);
});

test("heatmap possui um resumo acessível e oculta células decorativas", () => {
  const heatmap = read("src/components/dashboard/HeatmapCard.tsx");
  assert.match(heatmap, /role="img"/);
  assert.match(heatmap, /aria-label=/);
  assert.match(heatmap, /aria-hidden="true"/);
});

test("não há diálogos nativos nem controles de data, hora ou select nativos", () => {
  const src = path.join(root, "src");
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".tsx")) files.push(full);
    }
  };
  walk(src);
  const violations = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (/\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/.test(content)) violations.push(file);
    if (/<select\b|type=["'](?:date|time)["']/.test(content)) violations.push(file);
  }
  assert.deepEqual(violations, []);
});

test("dashboard e cronograma não forçam grades semanais horizontais", () => {
  for (const file of ["src/pages/Dashboard.tsx", "src/pages/Cronograma.tsx"]) {
    const content = read(file);
    assert.doesNotMatch(content, /min-w-\[(?:720px|52rem)\]/);
  }
});

test("dívidas visuais auditadas possuem proteções estruturais", () => {
  const landing = read("src/components/landing/LandingHero.tsx");
  const authShell = read("src/components/auth/AuthShell.tsx");
  const register = read("src/pages/Auth/Register.tsx");
  const cronograma = read("src/pages/Cronograma.tsx");
  const historico = read("src/pages/HistoricoEstudos.tsx");
  const dashboard = read("src/components/dashboard/DashboardOverview.tsx");
  const calendar = read("src/components/ui/calendar.tsx");

  assert.match(landing, /-bottom-4 left-0[^\n]+h-4/);
  assert.match(authShell, /justify-start[^\n]+md:justify-center/);
  assert.doesNotMatch(register, /max-h-\[min\(70vh,640px\)\]|overflow-y-auto/);
  assert.match(cronograma, /stats && totalBlocos > 0/);
  assert.match(cronograma, /\) : totalBlocos > 0 \? \(/);
  assert.match(historico, /Nenhuma sessão registrada/);
  assert.match(historico, /Link to="\/pomodoro"/);
  assert.match(dashboard, /totalScheduled === 0/);
  assert.match(calendar, /button_previous: "inline-flex size-10/);
  assert.match(calendar, /button_next: "inline-flex size-10/);
});

test("mapas mentais reutiliza o design system e oferece limpeza de filtros", () => {
  const mentalMaps = read("src/pages/MentalMaps.tsx");
  assert.match(mentalMaps, /from "@\/components\/ui\/button"/);
  assert.match(mentalMaps, /from "@\/components\/ui\/card"/);
  assert.match(mentalMaps, /from "@\/components\/ui\/empty-state"/);
  assert.match(mentalMaps, /Limpar filtros/);
  assert.doesNotMatch(mentalMaps, /<(?:button|input)\b/);
});
