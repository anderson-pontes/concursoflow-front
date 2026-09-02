import { describe, expect, it } from "vitest";

import { calendarDaysFromToday, formatNumericDate } from "@/lib/dashboard/dates";

describe("datas do dashboard", () => {
  it("calcula dias corridos sem sofrer variação de horário de verão", () => {
    expect(calendarDaysFromToday("2026-11-02", new Date(2026, 9, 31, 23, 30))).toBe(2);
  });

  it("formata datas de contrato sem depender do timezone do navegador", () => {
    expect(formatNumericDate("2026-09-02T23:59:00Z")).toBe("02/09/2026");
  });
});
