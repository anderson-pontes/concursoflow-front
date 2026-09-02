import { describe, expect, it } from "vitest";

import { resolveDashboardActionState } from "@/lib/dashboard/presentation";

const ready = {
  contextStatus: "ready" as const,
  overdueReviews: 0,
  daysUntilExam: null,
  hoursToday: 0,
  dailyGoalHours: 2,
};

describe("resolveDashboardActionState", () => {
  it("preserva estados contextuais sem criar variantes paralelas", () => {
    expect(resolveDashboardActionState({ ...ready, contextStatus: "no_plan" })).toBe("no_plan");
    expect(resolveDashboardActionState({ ...ready, contextStatus: "empty_plan" })).toBe("empty_plan");
    expect(resolveDashboardActionState({ ...ready, contextStatus: "error" })).toBeNull();
  });

  it("aplica a precedência atraso, prova próxima, meta concluída e pronto", () => {
    expect(resolveDashboardActionState({ ...ready, overdueReviews: 1, daysUntilExam: 7, hoursToday: 3 })).toBe("overdue");
    expect(resolveDashboardActionState({ ...ready, daysUntilExam: 7, hoursToday: 3 })).toBe("upcoming_exam");
    expect(resolveDashboardActionState({ ...ready, daysUntilExam: 31, hoursToday: 2 })).toBe("completed");
    expect(resolveDashboardActionState(ready)).toBe("ready");
  });

  it("não considera prova passada como próxima", () => {
    expect(resolveDashboardActionState({ ...ready, daysUntilExam: -1 })).toBe("ready");
  });
});
