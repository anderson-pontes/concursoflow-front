/** Classes Tailwind cíclicas para faixas/barras de ranking (sem hex em TSX). */
export const CHART_STRIP_BG_CLASSES = [
  "bg-primary",
  "bg-success",
  "bg-blue-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-teal-500",
] as const;

export function chartStripClass(index: number): (typeof CHART_STRIP_BG_CLASSES)[number] {
  return CHART_STRIP_BG_CLASSES[index % CHART_STRIP_BG_CLASSES.length];
}
