import type { EditalCargoCatalogo } from "@/types/editaisCatalogo";

export const normalizeDisciplineName = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");

/** Creates independent draft nodes. Persistence stays in the existing atomic structure PUT. */
export function copyCatalogDisciplines(
  cargos: readonly EditalCargoCatalogo[],
  targetId: string,
  sourceId: string,
  selectedIds: readonly string[],
  includeTopics: boolean,
  createId = () => `novo-${crypto.randomUUID()}`,
) {
  const target = cargos.find((cargo) => cargo.id === targetId);
  const source = cargos.find((cargo) => cargo.id === sourceId);
  if (!target || !source || targetId === sourceId) throw new Error("Selecione outro cargo deste concurso.");
  const requested = new Set(selectedIds);
  if (selectedIds.some((id) => !source.disciplinas.some((item) => item.id === id))) {
    throw new Error("As matérias de origem mudaram. Selecione novamente.");
  }
  const names = new Set(target.disciplinas.map((item) => normalizeDisciplineName(item.nome)));
  const skipped: string[] = [];
  const additions = source.disciplinas.filter((item) => requested.has(item.id)).flatMap((item) => {
    const name = normalizeDisciplineName(item.nome);
    if (names.has(name)) { skipped.push(item.nome); return []; }
    names.add(name);
    return [{
      id: createId(), nome: item.nome.trim(), sigla: item.sigla,
      ordem: 0, // Normalized after filtering duplicates below.
      topicos: includeTopics ? item.topicos.map((topic, index) => ({
        id: createId(), descricao: topic.descricao, ordem: index + 1, peso: topic.peso,
      })) : [],
    }];
  });
  return {
    cargo: { ...target, disciplinas: [...target.disciplinas, ...additions.map((item, index) => ({ ...item, ordem: target.disciplinas.length + index + 1 }))] },
    added: additions.length, skipped,
  };
}
