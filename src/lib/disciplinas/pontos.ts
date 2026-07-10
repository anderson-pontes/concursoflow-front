import type { Disciplina } from "@/lib/disciplinas/types";

/**
 * Peso e "pontos" da disciplina são calculados pelo backend a partir da soma
 * do peso de cada assunto (tópico) — não há mais peso/total_questoes_prova
 * manuais na disciplina (ver docs/business-rules.md).
 */
export function getDisciplinaTotalPontos(d: Pick<Disciplina, "peso" | "total_pontos">) {
  if (d.total_pontos != null) return d.total_pontos;
  return d.peso ?? null;
}

export function fmtPeso(peso: number | null | undefined) {
  if (peso == null) return "—";
  return Number.isInteger(peso) ? String(peso) : peso.toFixed(1);
}

export function fmtPontos(pontos: number | null | undefined) {
  if (pontos == null) return "—";
  return Number.isInteger(pontos) ? String(pontos) : pontos.toFixed(1);
}

export type DisciplinaRankingRow = {
  id: string;
  nome: string;
  total_pontos: number;
  pct: number;
  rank: number;
};

export function buildDisciplinaRanking(
  disciplinas: Disciplina[],
  filter?: (d: Disciplina) => boolean,
): DisciplinaRankingRow[] {
  type RowBase = Omit<DisciplinaRankingRow, "pct" | "rank">;

  const rows: RowBase[] = [];
  for (const d of disciplinas) {
    if (filter && !filter(d)) continue;
    const total_pontos = getDisciplinaTotalPontos(d);
    if (total_pontos == null || total_pontos <= 0) continue;
    rows.push({
      id: d.id,
      nome: d.nome,
      total_pontos,
    });
  }

  const sum = rows.reduce((acc, r) => acc + r.total_pontos, 0);
  const sorted = [...rows].sort((a, b) => b.total_pontos - a.total_pontos);
  return sorted.map((r, i) => ({
    ...r,
    rank: i + 1,
    pct: sum > 0 ? Math.round((r.total_pontos / sum) * 1000) / 10 : 0,
  }));
}
