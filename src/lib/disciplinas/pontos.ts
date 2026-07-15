import type { Disciplina } from "@/lib/disciplinas/types";

/**
 * Peso no edital = soma de `topico.peso` (domínio não entra).
 * Prioridade / pontos de estudo = `prioridade_calculada` = Σ peso × (6 − domínio).
 */
export function getDisciplinaPesoEdital(d: Pick<Disciplina, "peso" | "total_pontos">) {
  if (d.total_pontos != null) return d.total_pontos;
  return d.peso ?? null;
}

/** @deprecated use getDisciplinaPesoEdital — nome antigo confundia com prioridade peso×domínio */
export function getDisciplinaTotalPontos(d: Pick<Disciplina, "peso" | "total_pontos">) {
  return getDisciplinaPesoEdital(d);
}

export function getDisciplinaPrioridade(d: Pick<Disciplina, "prioridade_calculada">) {
  return d.prioridade_calculada ?? null;
}

export function fmtPeso(peso: number | null | undefined) {
  if (peso == null) return "—";
  return Number.isInteger(peso) ? String(peso) : peso.toFixed(1);
}

export function fmtPontos(pontos: number | null | undefined) {
  if (pontos == null) return "—";
  return Number.isInteger(pontos) ? String(pontos) : pontos.toFixed(1);
}
