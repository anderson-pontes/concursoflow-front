import type { EditalCargoCatalogo, EditalDisciplinaCatalogo, EditalTopicoCatalogo } from "@/types/editaisCatalogo";

export type DeltaOperation = {
  entity: "cargo" | "disciplina" | "topico";
  action: "upsert" | "delete";
  id: string;
  parent_id: string | null;
  data: Record<string, string | number | null>;
};
export type DraftDelta = { expected_revision: number; mutation_id: string; operations: DeltaOperation[] };
export type DraftDeltaAck = { revision: number; id_map: Record<string, string> };
const cargoData = (c: EditalCargoCatalogo) => ({ nome: c.nome.trim().replace(/\s+/gu, " ").normalize("NFC"), especialidade: c.especialidade ?? null, ordem: c.ordem });
const disciplineData = (d: EditalDisciplinaCatalogo) => ({ nome: d.nome.trim(), sigla: d.sigla?.trim() || null, ordem: d.ordem });
const topicData = (t: EditalTopicoCatalogo) => ({ descricao: t.descricao.trim(), numero_ordem: t.ordem, peso: t.peso });
const sameData = (a: DeltaOperation["data"], b: DeltaOperation["data"]) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((key) => a[key] === b[key]);

/** Baseline populated once on hydration; updates only walk the changed branch. */
export class CatalogDraftLedger {
  revision = 0;
  private baseline = new Map<string, DeltaOperation>();
  private pending = new Map<string, DeltaOperation>();
  private attempt: DraftDelta | null = null;
  get dirty() { return this.pending.size > 0; }

  hydrate(cargos: EditalCargoCatalogo[], revision: number) {
    this.baseline.clear(); this.pending.clear(); this.attempt = null; this.revision = revision;
    for (const cargo of cargos) {
      this.remember("cargo", cargo.id, null, cargoData(cargo));
      for (const disc of cargo.disciplinas) {
        this.remember("disciplina", disc.id, cargo.id, disciplineData(disc));
        for (const topic of disc.topicos) this.remember("topico", topic.id, disc.id, topicData(topic));
      }
    }
  }
  private remember(entity: DeltaOperation["entity"], id: string, parent_id: string | null, data: DeltaOperation["data"]) {
    this.baseline.set(id, { entity, id, parent_id, data, action: "upsert" });
  }
  private stage(entity: DeltaOperation["entity"], id: string, parent_id: string | null, data: DeltaOperation["data"] | null) {
    const before = this.baseline.get(id);
    if ((!data && !before) || (data && before && before.parent_id === parent_id && sameData(data, before.data))) this.pending.delete(id);
    else this.pending.set(id, { entity, id, parent_id, data: data ?? {}, action: data ? "upsert" : "delete" });
    this.attempt = null;
  }
  trackCargo(before: EditalCargoCatalogo | undefined, next: EditalCargoCatalogo | undefined) {
    if (before === next) return;
    const cargo = next ?? before!;
    this.stage("cargo", cargo.id, null, next ? cargoData(next) : null);
    const oldDiscs = new Map(before?.disciplinas.map((d) => [d.id, d]) ?? []);
    for (const disc of next?.disciplinas ?? []) {
      const old = oldDiscs.get(disc.id); oldDiscs.delete(disc.id);
      if (old === disc) continue;
      this.stage("disciplina", disc.id, cargo.id, disciplineData(disc));
      const oldTopics = new Map(old?.topicos.map((t) => [t.id, t]) ?? []);
      for (const topic of disc.topicos) {
        const prior = oldTopics.get(topic.id); oldTopics.delete(topic.id);
        if (prior !== topic) this.stage("topico", topic.id, disc.id, topicData(topic));
      }
      for (const topic of oldTopics.values()) this.stage("topico", topic.id, disc.id, null);
    }
    for (const disc of oldDiscs.values()) {
      for (const topic of disc.topicos) this.stage("topico", topic.id, disc.id, null);
      this.stage("disciplina", disc.id, cargo.id, null);
    }
  }
  snapshot(): DraftDelta {
    if (this.attempt) return this.attempt;
    const rank = { cargo: 0, disciplina: 1, topico: 2 };
    const operations = [...this.pending.values()].sort((a, b) => {
      if (a.action !== b.action) return a.action === "delete" ? -1 : 1;
      return a.action === "delete" ? rank[b.entity] - rank[a.entity] : rank[a.entity] - rank[b.entity];
    });
    for (const operation of operations) if (operation.action === "upsert") {
      if (operation.entity === "topico" && !String(operation.data.descricao).trim()) throw new Error("Preencha ou remova os tópicos vazios.");
      if (operation.entity !== "topico" && !String(operation.data.nome).trim()) throw new Error("Informe o nome do cargo ou disciplina alterado.");
    }
    this.attempt = { expected_revision: this.revision, mutation_id: crypto.randomUUID(), operations };
    return this.attempt;
  }
  acknowledge(ack: DraftDeltaAck, cargos: EditalCargoCatalogo[]): EditalCargoCatalogo[] {
    const operations = this.attempt?.operations ?? [];
    const mapped = (id: string) => ack.id_map[id] ?? id;
    const affectedDiscs = new Set<string>(); const affectedCargos = new Set<string>();
    for (const op of operations) {
      const parent = op.parent_id ? (this.pending.get(op.parent_id) ?? this.baseline.get(op.parent_id)) : undefined;
      if (op.entity === "cargo") affectedCargos.add(op.id);
      if (op.entity === "disciplina") { affectedDiscs.add(op.id); if (op.parent_id) affectedCargos.add(op.parent_id); }
      if (op.entity === "topico") { if (op.parent_id) affectedDiscs.add(op.parent_id); if (parent?.parent_id) affectedCargos.add(parent.parent_id); }
    }
    const normalized = (id: string) => this.pending.get(id)?.data ?? {};
    const updated = cargos.map((c) => !affectedCargos.has(c.id) ? c : {
      ...c, ...normalized(c.id), id: mapped(c.id),
      disciplinas: c.disciplinas.map((d) => !affectedDiscs.has(d.id) ? d : {
        ...d, ...normalized(d.id), id: mapped(d.id),
        topicos: d.topicos.map((t) => {
          const data = normalized(t.id);
          return !this.pending.has(t.id) ? t : { ...t, ...data, id: mapped(t.id), ordem: Number(data.numero_ordem ?? t.ordem) };
        }),
      }),
    });
    for (const op of operations) {
      this.baseline.delete(op.id);
      if (op.action === "upsert") this.baseline.set(mapped(op.id), { ...op, id: mapped(op.id), parent_id: op.parent_id ? mapped(op.parent_id) : null });
    }
    this.pending.clear(); this.attempt = null; this.revision = ack.revision;
    return updated;
  }
}
