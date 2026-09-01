import { describe, expect, it } from "vitest";

import { isConcursoContextQueryKey, resolveConcursoContextStatus } from "@/lib/concursos/context";

describe("resolveConcursoContextStatus", () => {
  it.each([
    [{ resolved: false, concursoId: "a" }, "hydrating"],
    [{ resolved: true, concursoId: "a", essentialError: true }, "error"],
    [{ resolved: true, concursoId: null }, "no_contest"],
    [{ resolved: true, concursoId: "a", essentialLoading: true }, "hydrating"],
    [{ resolved: true, concursoId: "a", disciplinesLoaded: true, disciplinesCount: 0 }, "no_disciplines"],
    [{ resolved: true, concursoId: "a", disciplinesLoaded: true, disciplinesCount: 2, planLoaded: true, plannedItemsCount: 0 }, "no_plan"],
    [{ resolved: true, concursoId: "a", disciplinesLoaded: true, disciplinesCount: 2, planLoaded: true, plannedItemsCount: 3, actionableItemsCount: 0 }, "empty_plan"],
    [{ resolved: true, concursoId: "a", disciplinesLoaded: true, disciplinesCount: 2, planLoaded: true, plannedItemsCount: 3, actionableItemsCount: 1 }, "ready"],
  ] as const)("resolve %o como %s", (snapshot, expected) => {
    expect(resolveConcursoContextStatus(snapshot)).toBe(expected);
  });
});

describe("isConcursoContextQueryKey", () => {
  it("remove chaves contextuais e preserva catálogos/histórico global", () => {
    expect(isConcursoContextQueryKey(["dashboard-resumo", "a"])).toBe(true);
    expect(isConcursoContextQueryKey(["disciplinas", "paginated", null, "a"])).toBe(true);
    expect(isConcursoContextQueryKey(["calendario", 2026, 8, "a"])).toBe(true);
    expect(isConcursoContextQueryKey(["concursos"])).toBe(false);
    expect(isConcursoContextQueryKey(["disciplinas", "catalog", null])).toBe(false);
    expect(isConcursoContextQueryKey(["dashboard-heatmap"])).toBe(false);
    expect(isConcursoContextQueryKey(["notifications"])).toBe(false);
  });
});
