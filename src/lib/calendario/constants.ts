import type { DiaStatus } from "./types";

export const STATUS_LABEL: Record<DiaStatus, string> = {
  cumprido: "Cumprido",
  parcial: "Parcial",
  nao_cumprido: "Pendente",
  sem_planejamento: "Sem plano",
  estudou_sem_plano: "Estudo extra",
  futuro: "Futuro",
};

export const STATUS_CELL_CLASS: Record<DiaStatus, string> = {
  cumprido: "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
  parcial: "bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
  nao_cumprido: "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800",
  sem_planejamento: "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700",
  estudou_sem_plano: "bg-sky-100 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800",
  futuro: "bg-background border-dashed border-border",
};

export const STATUS_DOT_CLASS: Record<DiaStatus, string> = {
  cumprido: "bg-emerald-500",
  parcial: "bg-amber-500",
  nao_cumprido: "bg-violet-400",
  sem_planejamento: "bg-neutral-300 dark:bg-neutral-600",
  estudou_sem_plano: "bg-sky-500",
  futuro: "bg-transparent",
};

export const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const DIAS_SEMANA_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
