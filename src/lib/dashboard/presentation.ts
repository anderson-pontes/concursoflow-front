import type { ConcursoContextStatus } from "@/lib/concursos/context";

export type DashboardActionState =
  | "ready"
  | "no_plan"
  | "empty_plan"
  | "completed"
  | "overdue"
  | "upcoming_exam";

type DashboardPresentationInput = {
  contextStatus: ConcursoContextStatus;
  overdueReviews: number;
  daysUntilExam: number | null;
  hoursToday: number;
  dailyGoalHours: number;
};

export function resolveDashboardActionState({
  contextStatus,
  overdueReviews,
  daysUntilExam,
  hoursToday,
  dailyGoalHours,
}: DashboardPresentationInput): DashboardActionState | null {
  if (contextStatus === "no_plan" || contextStatus === "empty_plan") return contextStatus;
  if (contextStatus !== "ready") return null;
  if (overdueReviews > 0) return "overdue";
  if (daysUntilExam !== null && daysUntilExam >= 0 && daysUntilExam <= 30) return "upcoming_exam";
  if (dailyGoalHours > 0 && hoursToday >= dailyGoalHours) return "completed";
  return "ready";
}

export const dashboardStateMessage: Record<Exclude<DashboardActionState, "no_plan" | "empty_plan">, string> = {
  overdue: "Há revisões que merecem atenção hoje. Sua próxima sessão planejada continua disponível.",
  upcoming_exam: "A prova está próxima. Mantenha o ritmo com a próxima sessão do seu planejamento.",
  completed: "Meta diária alcançada. Você pode encerrar por hoje ou avançar na próxima sessão.",
  ready: "Esta é a primeira sessão futura do seu planejamento, ordenada por data.",
};
