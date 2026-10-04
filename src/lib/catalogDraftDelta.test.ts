import { describe, it, expect } from "vitest";
import { CatalogDraftLedger } from "@/lib/catalogDraftDelta";
import type { EditalCargoCatalogo } from "@/types/editaisCatalogo";

const cargo: EditalCargoCatalogo = { id: "c", nome: "Analista", ordem: 1, disciplinas: [{ id: "d", nome: "Português", sigla: null, ordem: 1, topicos: [{ id: "t", descricao: "Texto", ordem: 1, peso: 1 }] }] };
const changed = (descricao: string): EditalCargoCatalogo => ({ ...cargo, disciplinas: [{ ...cargo.disciplinas[0], topicos: [{ ...cargo.disciplinas[0].topicos[0], descricao }] }] });
describe("ledger incremental do rascunho", () => {
  it("edita apenas um tópico sem serializar o cargo ou outros ramos", () => {
    const ledger = new CatalogDraftLedger(); ledger.hydrate([cargo], 4); ledger.trackCargo(cargo, changed("Texto editado"));
    expect(ledger.snapshot()).toMatchObject({ expected_revision: 4, operations: [{ entity: "topico", action: "upsert", id: "t", parent_id: "d", data: { descricao: "Texto editado", numero_ordem: 1, peso: 1 } }] });
    expect(ledger.snapshot().operations).toHaveLength(1);
  });
  it("reutiliza mutation e payload após falha, mas troca ao editar novamente", () => {
    const ledger = new CatalogDraftLedger(); ledger.hydrate([cargo], 0); const next = changed("Editado"); ledger.trackCargo(cargo, next);
    const attempt = ledger.snapshot(); expect(ledger.snapshot()).toBe(attempt);
    ledger.trackCargo(next, changed("Outra edição")); expect(ledger.snapshot().mutation_id).not.toBe(attempt.mutation_id);
  });
  it("reverter para baseline elimina a operação", () => {
    const ledger = new CatalogDraftLedger(); ledger.hydrate([cargo], 0); const next = changed("Editado"); ledger.trackCargo(cargo, next); ledger.trackCargo(next, cargo); expect(ledger.dirty).toBe(false);
  });
  it("remover uma disciplina nova cancela seus tópicos novos", () => {
    const ledger = new CatalogDraftLedger(); const empty = { ...cargo, disciplinas: [] }; ledger.hydrate([empty], 0);
    const next = { ...cargo, disciplinas: [{ ...cargo.disciplinas[0], id: "novo-d", topicos: [{ id: "novo-t", descricao: "Novo", ordem: 1, peso: 1 }] }] };
    ledger.trackCargo(empty, next); expect(ledger.snapshot().operations).toHaveLength(2); ledger.trackCargo(next, empty); expect(ledger.dirty).toBe(false);
  });
  it("confirma IDs de um tópico novo e a próxima edição usa UUID confirmado", () => {
    const ledger = new CatalogDraftLedger(); ledger.hydrate([cargo], 2);
    const next = { ...cargo, disciplinas: [{ ...cargo.disciplinas[0], topicos: [...cargo.disciplinas[0].topicos, { id: "novo-t", descricao: "Novo", ordem: 2, peso: 1 }] }] };
    ledger.trackCargo(cargo, next); ledger.snapshot(); const [ack] = ledger.acknowledge({ revision: 3, id_map: { "novo-t": "confirmed" } }, [next]);
    expect(ack.disciplinas[0].topicos[1].id).toBe("confirmed"); expect(ledger.dirty).toBe(false);
    const edit = { ...ack, disciplinas: [{ ...ack.disciplinas[0], topicos: ack.disciplinas[0].topicos.map((t) => t.id === "confirmed" ? { ...t, descricao: "Outro" } : t) }] };
    ledger.trackCargo(ack, edit); expect(ledger.snapshot()).toMatchObject({ expected_revision: 3, operations: [{ id: "confirmed" }] });
  });
  it("mantém a referência de cargos não afetados após ACK", () => {
    const other = { ...cargo, id: "other", disciplinas: [] }; const ledger = new CatalogDraftLedger(); ledger.hydrate([cargo, other], 0); ledger.trackCargo(cargo, changed("Editado")); ledger.snapshot();
    expect(ledger.acknowledge({ revision: 1, id_map: {} }, [changed("Editado"), other])[1]).toBe(other);
  });
  it("rejeita somente o tópico vazio alterado antes da requisição", () => {
    const ledger = new CatalogDraftLedger(); ledger.hydrate([cargo], 0); ledger.trackCargo(cargo, changed(" ")); expect(() => ledger.snapshot()).toThrow(/vazios/);
  });
  it("normaliza o nome de cargo como o backend sem precisar de GET após ACK", () => {
    const ledger = new CatalogDraftLedger(); ledger.hydrate([cargo], 0);
    const next = { ...cargo, nome: "  Te\u0301cnico   Administrativo  " };
    ledger.trackCargo(cargo, next);
    expect(ledger.snapshot().operations[0].data.nome).toBe("Técnico Administrativo");
    const [confirmed] = ledger.acknowledge({ revision: 1, id_map: {} }, [next]);
    expect(confirmed.nome).toBe("Técnico Administrativo");
    ledger.trackCargo(confirmed, { ...confirmed }); expect(ledger.dirty).toBe(false);
  });
  it("confirma toda a hierarquia nova e usa o pai definitivo no próximo delta", () => {
    const ledger = new CatalogDraftLedger(); ledger.hydrate([], 0);
    const next = { ...cargo, id: "novo-c", disciplinas: [{ ...cargo.disciplinas[0], id: "novo-d", topicos: [{ ...cargo.disciplinas[0].topicos[0], id: "novo-t" }] }] };
    ledger.trackCargo(undefined, next); ledger.snapshot();
    const [confirmed] = ledger.acknowledge({ revision: 1, id_map: { "novo-c": "c", "novo-d": "d", "novo-t": "t" } }, [next]);
    ledger.trackCargo(confirmed, changed("Depois"));
    expect(ledger.snapshot().operations).toEqual([{ entity: "topico", action: "upsert", id: "t", parent_id: "d", data: { descricao: "Depois", numero_ordem: 1, peso: 1 } }]);
  });
});
