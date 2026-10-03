import { describe, expect, it } from "vitest";
import { copyCatalogDisciplines } from "@/lib/catalogDisciplineReuse";
import type { EditalCargoCatalogo } from "@/types/editaisCatalogo";

const source: EditalCargoCatalogo = { id: "a", nome: "Analista", ordem: 1, disciplinas: [
  { id: "port", nome: "Língua Portuguesa", sigla: "LP", ordem: 1, topicos: [{ id: "t1", descricao: "1.1 Interpretação", ordem: 3, peso: 2 }] },
  { id: "dir", nome: "Direito", sigla: null, ordem: 2, topicos: [{ id: "t2", descricao: "Princípios", ordem: 1, peso: 1 }] },
] };
const target: EditalCargoCatalogo = { id: "b", nome: "Técnico", ordem: 2, disciplinas: [] };

describe("catalogDisciplineReuse", () => {
  it("copia somente a seleção e preserva conteúdo, sigla e pesos com IDs próprios", () => {
    const result = copyCatalogDisciplines([source, target], "b", "a", ["port"], true);
    expect(result.added).toBe(1);
    expect(result.cargo.disciplinas[0]).toMatchObject({ nome: "Língua Portuguesa", sigla: "LP", ordem: 1 });
    expect(result.cargo.disciplinas[0].id).toMatch(/^novo-/);
    expect(result.cargo.disciplinas[0].topicos[0]).toMatchObject({ descricao: "1.1 Interpretação", ordem: 1, peso: 2 });
    expect(result.cargo.disciplinas[0].topicos[0].id).not.toBe("t1");
  });
  it("copia todas sem conteúdo, sem duplicar uma seleção repetida", () => {
    const result = copyCatalogDisciplines([source, target], "b", "a", ["port", "dir", "port"], false);
    expect(result.added).toBe(2);
    expect(result.cargo.disciplinas.map((item) => [item.ordem, item.topicos.length])).toEqual([[1, 0], [2, 0]]);
  });
  it("ignora nome já adicionado sem bloquear outras matérias", () => {
    const existing = { ...target, disciplinas: [{ ...source.disciplinas[0], id: "existing", nome: " língua  PORTUGUESA " }] };
    const result = copyCatalogDisciplines([source, existing], "b", "a", ["port", "dir"], true);
    expect(result.skipped).toEqual(["Língua Portuguesa"]);
    expect(result.added).toBe(1);
    expect(result.cargo.disciplinas[1].ordem).toBe(2);
  });
  it("editar e remover cópias não altera a origem nem o destino de entrada", () => {
    const before = JSON.stringify(source);
    const copy = copyCatalogDisciplines([source, target], "b", "a", ["port", "dir"], true).cargo;
    copy.disciplinas[0].nome = "Outro nome";
    copy.disciplinas[0].topicos[0].descricao = "Outro conteúdo";
    copy.disciplinas.splice(1, 1);
    expect(JSON.stringify(source)).toBe(before);
    expect(target.disciplinas).toHaveLength(0);
  });
  it("não aceita origem fora do conjunto contextual ou o próprio cargo", () => {
    expect(() => copyCatalogDisciplines([source, target], "b", "externo", [], true)).toThrow();
    expect(() => copyCatalogDisciplines([source, target], "b", "b", [], true)).toThrow();
    expect(() => copyCatalogDisciplines([source, target], "b", "a", ["externa"], true)).toThrow();
  });
  it("não modifica nada sem seleção", () => {
    expect(copyCatalogDisciplines([source, target], "b", "a", [], true)).toMatchObject({ added: 0, cargo: target });
  });
});
