import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import ts from "typescript";

const helperUrl = new URL("../src/lib/cronograma/disciplinasConcurso.ts", import.meta.url);
const cronogramaUrl = new URL("../src/pages/Cronograma.tsx", import.meta.url);
const helperSource = await readFile(helperUrl, "utf8");
const cronogramaSource = await readFile(cronogramaUrl, "utf8");
const source = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { filtrarDisciplinasDoConcursoAtivo } = await import(moduleUrl);

const disciplinas = [
  { id: "portugues", concurso_ids: ["concurso-a"] },
  { id: "matematica", concurso_ids: ["concurso-b"] },
  { id: "informatica", concurso_ids: ["concurso-a", "concurso-b"] },
  { id: "global", concurso_ids: [] },
  { id: "sem-vinculos" },
];

assert.deepEqual(
  filtrarDisciplinasDoConcursoAtivo(disciplinas, "concurso-a").map((d) => d.id),
  ["portugues", "informatica"],
);
assert.deepEqual(
  filtrarDisciplinasDoConcursoAtivo(disciplinas, "concurso-b").map((d) => d.id),
  ["matematica", "informatica"],
);
assert.deepEqual(filtrarDisciplinasDoConcursoAtivo(disciplinas, "concurso-c"), []);
assert.deepEqual(filtrarDisciplinasDoConcursoAtivo(disciplinas, null), []);

assert.match(
  cronogramaSource,
  /const disciplinasDoConcursoAtivo = React\.useMemo\([\s\S]*?filtrarDisciplinasDoConcursoAtivo/,
);
assert.equal(
  cronogramaSource.match(/disciplinas=\{disciplinasDoConcursoAtivo\}/g)?.length,
  5,
  "Os modais Automático, Analítico e Simplificado, incluindo edição, devem usar a lista filtrada.",
);

console.log("Story 13.6 smoke: filtro por concurso ativo aprovado nos três modos.");
