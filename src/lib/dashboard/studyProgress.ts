import type {AnalysisDay} from '@/lib/dashboard/analysis';

export function studyProgress(planned: number, actual: number) {
  const percent = planned > 0 ? actual / planned * 100 : null;
  const status = percent == null ? 'Sem meta' : actual === 0 ? 'Meta não iniciada'
    : actual > planned ? 'Meta superada' : actual === planned ? 'Meta atingida' : 'Meta parcialmente cumprida';
  return {
    percent,
    fill: Math.max(0, Math.min(100, percent ?? 0)),
    remaining: planned > 0 ? Math.max(0, planned - actual) : null,
    excess: planned > 0 ? Math.max(0, actual - planned) : null,
    status,
  };
}

/** Ratio of all study minutes to all planned minutes, including unplanned study. */
export function periodStudyProgress(days: Pick<AnalysisDay, 'minutos_planejados' | 'minutos_estudados'>[]) {
  const totals = days.reduce((sum, day) => ({
    planned: sum.planned + day.minutos_planejados,
    actual: sum.actual + day.minutos_estudados,
  }), {planned: 0, actual: 0});
  return studyProgress(totals.planned, totals.actual).percent;
}

export function formatStudyPercent(percent: number | null) {
  return percent == null ? 'Sem meta' : `${percent.toLocaleString('pt-BR', {maximumFractionDigits: 1})}%`;
}
