/** Paletas visuais cíclicas por disciplina (hash do UUID). */
export type DisciplinaPalette = {
  /** Classes Tailwind para o fundo do card */
  cardBg: string;
  /** Borda do card */
  cardBorder: string;
  /** Ícone / destaque primário */
  accent: string;
  /** Barra de progresso preenchida */
  progressFill: string;
  /** Fundo da trilha da barra */
  progressTrack: string;
  /** Texto secundário */
  muted: string;
  /** Fundo do item selecionado na lista de pré-visualização (ex.: modal de tópicos) */
  selectionHighlight: string;
};

export const DISCIPLINA_PALETTES: DisciplinaPalette[] = [
  {
    cardBg: "bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/40 dark:to-card",
    cardBorder: "border-sky-200/80 dark:border-sky-800/60",
    accent: "text-sky-600 dark:text-sky-400",
    progressFill: "bg-sky-600 dark:bg-sky-500",
    progressTrack: "bg-sky-100 dark:bg-sky-950/50",
    muted: "text-sky-900/70 dark:text-sky-200/70",
    selectionHighlight: "bg-sky-200/60 dark:bg-sky-900/40",
  },
  {
    cardBg: "bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/40 dark:to-card",
    cardBorder: "border-violet-200/80 dark:border-violet-800/60",
    accent: "text-violet-600 dark:text-violet-400",
    progressFill: "bg-violet-600 dark:bg-violet-500",
    progressTrack: "bg-violet-100 dark:bg-violet-950/50",
    muted: "text-violet-900/70 dark:text-violet-200/70",
    selectionHighlight: "bg-violet-200/60 dark:bg-violet-900/40",
  },
  {
    cardBg: "bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/35 dark:to-card",
    cardBorder: "border-emerald-200/80 dark:border-emerald-800/60",
    accent: "text-emerald-600 dark:text-emerald-400",
    progressFill: "bg-emerald-600 dark:bg-emerald-500",
    progressTrack: "bg-emerald-100 dark:bg-emerald-950/50",
    muted: "text-emerald-900/70 dark:text-emerald-200/70",
    selectionHighlight: "bg-emerald-200/60 dark:bg-emerald-900/40",
  },
  {
    cardBg: "bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/35 dark:to-card",
    cardBorder: "border-amber-200/80 dark:border-amber-800/60",
    accent: "text-amber-700 dark:text-amber-400",
    progressFill: "bg-amber-600 dark:bg-amber-500",
    progressTrack: "bg-amber-100 dark:bg-amber-950/50",
    muted: "text-amber-900/70 dark:text-amber-200/70",
    selectionHighlight: "bg-amber-200/60 dark:bg-amber-900/40",
  },
  {
    cardBg: "bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/35 dark:to-card",
    cardBorder: "border-rose-200/80 dark:border-rose-800/60",
    accent: "text-rose-600 dark:text-rose-400",
    progressFill: "bg-rose-600 dark:bg-rose-500",
    progressTrack: "bg-rose-100 dark:bg-rose-950/50",
    muted: "text-rose-900/70 dark:text-rose-200/70",
    selectionHighlight: "bg-rose-200/60 dark:bg-rose-900/40",
  },
  {
    cardBg: "bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/35 dark:to-card",
    cardBorder: "border-cyan-200/80 dark:border-cyan-800/60",
    accent: "text-cyan-600 dark:text-cyan-400",
    progressFill: "bg-cyan-600 dark:bg-cyan-500",
    progressTrack: "bg-cyan-100 dark:bg-cyan-950/50",
    muted: "text-cyan-900/70 dark:text-cyan-200/70",
    selectionHighlight: "bg-cyan-200/60 dark:bg-cyan-900/40",
  },
  {
    cardBg: "bg-gradient-to-br from-fuchsia-50 to-white dark:from-fuchsia-950/35 dark:to-card",
    cardBorder: "border-fuchsia-200/80 dark:border-fuchsia-800/60",
    accent: "text-fuchsia-600 dark:text-fuchsia-400",
    progressFill: "bg-fuchsia-600 dark:bg-fuchsia-500",
    progressTrack: "bg-fuchsia-100 dark:bg-fuchsia-950/50",
    muted: "text-fuchsia-900/70 dark:text-fuchsia-200/70",
    selectionHighlight: "bg-fuchsia-200/60 dark:bg-fuchsia-900/40",
  },
  {
    cardBg: "bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-card",
    cardBorder: "border-indigo-200/80 dark:border-indigo-800/60",
    accent: "text-indigo-600 dark:text-indigo-400",
    progressFill: "bg-indigo-600 dark:bg-indigo-500",
    progressTrack: "bg-indigo-100 dark:bg-indigo-950/50",
    muted: "text-indigo-900/70 dark:text-indigo-200/70",
    selectionHighlight: "bg-indigo-200/60 dark:bg-indigo-900/40",
  },
];

function stableHashUuid(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getDisciplinaPaletteIndex(id: string): number {
  const n = DISCIPLINA_PALETTES.length;
  if (n === 0) return 0;
  return stableHashUuid(id) % n;
}
