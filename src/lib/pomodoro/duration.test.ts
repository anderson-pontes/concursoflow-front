import { describe, expect, it } from "vitest";

import { resolvePersistedFocusMinutes } from "@/lib/pomodoro/duration";

describe("resolvePersistedFocusMinutes", () => {
  it("aceita somente a duração persistida entre 1 e 480 minutos", () => {
    expect(resolvePersistedFocusMinutes(0, 1)).toBe(1);
    expect(resolvePersistedFocusMinutes(1, 30)).toBe(90);
    expect(resolvePersistedFocusMinutes(8, 0)).toBe(480);
  });

  it("não aplica fallback ou correção silenciosa", () => {
    expect(resolvePersistedFocusMinutes(0, 0)).toBeNull();
    expect(resolvePersistedFocusMinutes(8, 1)).toBeNull();
    expect(resolvePersistedFocusMinutes(1, 60)).toBeNull();
    expect(resolvePersistedFocusMinutes(Number.NaN, 25)).toBeNull();
  });
});
