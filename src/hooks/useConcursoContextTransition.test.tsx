import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useConcursoContextTransition } from "@/hooks/useConcursoContextTransition";
import { trackTelemetry } from "@/services/telemetry";
import { useConcursoStore } from "@/stores/concursoStore";

vi.mock("@/services/telemetry", () => ({ trackTelemetry: vi.fn() }));

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useConcursoContextTransition", () => {
  beforeEach(() => {
    vi.mocked(trackTelemetry).mockReset();
    useConcursoStore.setState({
      concursoAtivoId: "a",
      contextResolved: true,
      contextError: false,
    });
  });

  it("emite somente o estado sanitizado após uma troca explícita", async () => {
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useConcursoContextTransition(), { wrapper: wrapperFor(queryClient) });

    await act(async () => result.current("b", "sidebar"));

    expect(trackTelemetry).toHaveBeenCalledWith("contest_context_changed", {
      source: "sidebar",
      previous_state: "active",
      next_state: "active",
    });
    expect(JSON.stringify(vi.mocked(trackTelemetry).mock.calls)).not.toContain('"b"');
  });

  it("remove caches contextuais e preserva caches globais", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["dashboard-resumo", "a"], { concurso: "a" });
    queryClient.setQueryData(["cronograma-blocos", "b"], [{ concurso: "b" }]);
    queryClient.setQueryData(["revisoes", "a", "hoje", null, null, null], [{ concurso: "a" }]);
    queryClient.setQueryData(["disciplinas", "catalog", null], [{ id: "global" }]);
    queryClient.setQueryData(["dashboard-heatmap"], [{ date: "2026-08-29" }]);
    const { result } = renderHook(() => useConcursoContextTransition(), { wrapper: wrapperFor(queryClient) });

    await act(async () => result.current("b"));

    expect(useConcursoStore.getState()).toMatchObject({ concursoAtivoId: "b", contextResolved: true });
    expect(queryClient.getQueryData(["dashboard-resumo", "a"])).toBeUndefined();
    expect(queryClient.getQueryData(["cronograma-blocos", "b"])).toBeUndefined();
    expect(queryClient.getQueryData(["revisoes", "a", "hoje", null, null, null])).toBeUndefined();
    expect(queryClient.getQueryData(["disciplinas", "catalog", null])).toEqual([{ id: "global" }]);
    expect(queryClient.getQueryData(["dashboard-heatmap"])).toEqual([{ date: "2026-08-29" }]);
  });

  it("publica somente a seleção mais recente na troca rápida A → B → A", async () => {
    const queryClient = new QueryClient();
    const resolvers: Array<() => void> = [];
    vi.spyOn(queryClient, "cancelQueries").mockImplementation(() => new Promise<void>((resolve) => resolvers.push(resolve)));
    const { result } = renderHook(() => useConcursoContextTransition(), { wrapper: wrapperFor(queryClient) });

    let toB!: Promise<boolean>;
    let backToA!: Promise<boolean>;
    act(() => {
      toB = result.current("b");
      backToA = result.current("a");
    });
    expect(useConcursoStore.getState().contextResolved).toBe(false);

    await act(async () => {
      resolvers[1]();
      expect(await backToA).toBe(true);
    });
    await act(async () => {
      resolvers[0]();
      expect(await toB).toBe(false);
    });

    expect(useConcursoStore.getState()).toMatchObject({ concursoAtivoId: "a", contextResolved: true });
  });
});
