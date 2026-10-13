/** Classes Tailwind cíclicas para faixas/barras de ranking (sem hex em TSX). */
export const CHART_STRIP_BG_CLASSES = [
  "bg-primary",
  "bg-success",
  "bg-info",
  "bg-warning",
  "bg-review",
  "bg-secondary",
] as const;

export function chartStripClass(index: number): (typeof CHART_STRIP_BG_CLASSES)[number] {
  return CHART_STRIP_BG_CLASSES[index % CHART_STRIP_BG_CLASSES.length];
}
