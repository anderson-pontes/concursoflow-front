import type { DisciplinaDashboardKpis } from "@/types/disciplinaDashboard";

/** Persistência local do vínculo concurso ↔ plano (sincroniza modal e cards). */

export const CONCURSO_PROGRESS_LS_KEY = "aprov-concurso-progress-v1";

export const CONCURSO_PROGRESS_EVENT = "aprov-concurso-progress";

export type DisciplinaPersistRow = {
  key: string;
  nome: string;
  disciplinaId?: string;
  source: "plano" | "manual";
};

export type ConcursoProgressPersist = {
  planoPorConcurso: Record<string, string>;
  disciplinas: Record<string, DisciplinaPersistRow[]>;
  concursoMeta: Record<string, { label: string }>;
};

export function loadConcursoProgress(): ConcursoProgressPersist {
  try {
    const r = localStorage.getItem(CONCURSO_PROGRESS_LS_KEY);
    if (!r) return { planoPorConcurso: {}, disciplinas: {}, concursoMeta: {} };
    const p = JSON.parse(r) as Partial<ConcursoProgressPersist>;
    return {
      planoPorConcurso: p.planoPorConcurso ?? {},
      disciplinas: p.disciplinas ?? {},
      concursoMeta: p.concursoMeta ?? {},
    };
  } catch {
    return { planoPorConcurso: {}, disciplinas: {}, concursoMeta: {} };
  }
}

export function saveConcursoProgress(p: ConcursoProgressPersist) {
  try {
    localStorage.setItem(CONCURSO_PROGRESS_LS_KEY, JSON.stringify(p));
    window.dispatchEvent(new CustomEvent(CONCURSO_PROGRESS_EVENT));
  } catch {
    /* ignore */
  }
}

/** KPI do dashboard → questões resolvidas, % acerto e largura da barra (0–100). */
export function kpiToProgressRowDisplay(k: DisciplinaDashboardKpis | undefined) {
  if (!k) {
    return { questoes: 0, pct: 0, barPct: 0 };
  }
  const questoes = k.questoes_resolvidas_total;
  const pct = questoes > 0 ? Math.round((k.questoes_certas_total / questoes) * 100) : 0;
  const raw = Number(k.desempenho_geral_pct);
  const barPct = Math.min(100, Math.max(0, Number.isFinite(raw) ? Math.round(raw) : pct));
  return { questoes, pct, barPct };
}

/**
 * Totais do card da página Concursos: KPIs reais de `/disciplinas/:id/dashboard`
 * (questões resolvidas e certas agregadas por disciplina, sem duplicar o mesmo id).
 */
export function computeConcursoCardStatsFromKpis(
  rows: DisciplinaPersistRow[],
  kpisByDisciplinaId: Map<string, DisciplinaDashboardKpis>,
) {
  const seenDisc = new Set<string>();
  let respondidas = 0;
  let certas = 0;
  for (const r of rows) {
    if (!r.disciplinaId || seenDisc.has(r.disciplinaId)) continue;
    seenDisc.add(r.disciplinaId);
    const k = kpisByDisciplinaId.get(r.disciplinaId);
    if (!k) continue;
    respondidas += k.questoes_resolvidas_total;
    certas += k.questoes_certas_total;
  }
  const acertoMedioPct = respondidas > 0 ? Math.round((certas / respondidas) * 100) : 0;
  return {
    disciplinasCount: rows.length,
    questoesTotal: respondidas,
    acertoMedioPct,
  };
}

export function acertoPctTextClass(pct: number) {
  if (pct >= 70) return "text-[#16A34A]";
  if (pct >= 40) return "text-[#D97706]";
  return "text-[#EF4444]";
}
