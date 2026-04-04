export type TopicoStatus = "nao_iniciado" | "em_andamento" | "revisao" | "dominado";

export type TopicoProgressInput = { status: TopicoStatus };

/** Alinhado ao painel: apenas `dominado` conta como estudado no edital. */
export function getTopicosProgress(items: TopicoProgressInput[]) {
  const total = items.length;
  const studied = items.filter((t) => t.status === "dominado").length;
  const pct = total > 0 ? Math.round((studied / total) * 100) : 0;
  return { total, studied, pct };
}

export function getTopicosProgressFromCounts(topicosTotal: number, topicosEstudados: number) {
  const total = topicosTotal;
  const studied = topicosEstudados;
  const pct = total > 0 ? Math.round((studied / total) * 100) : 0;
  return { total, studied, pct };
}

export type DisciplinaStatusKind = "sem_topicos" | "concluida" | "iniciando" | "em_progresso";

export function getDisciplinaStatusLabel(stats: { total: number; studied: number }): {
  kind: DisciplinaStatusKind;
  label: string;
} {
  const { total, studied } = stats;
  if (total === 0) {
    return { kind: "sem_topicos", label: "Sem tópicos" };
  }
  if (studied === total) {
    return { kind: "concluida", label: "Concluída" };
  }
  if (studied === 0) {
    return { kind: "iniciando", label: "Iniciando" };
  }
  return { kind: "em_progresso", label: "Em progresso" };
}
