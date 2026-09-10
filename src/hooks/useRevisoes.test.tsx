import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRevisoes } from "@/hooks/useRevisoes";
import { listarRevisoes } from "@/services/revisoes";

vi.mock("@/services/revisoes", () => ({ listarRevisoes: vi.fn() }));

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useRevisoes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pagina pelo cursor retornado sem misturar o cursor na query key", async () => {
    vi.mocked(listarRevisoes).mockImplementation(async ({ cursor }) => ({
      grupo: "hoje",
      items: [],
      next_cursor: cursor ? null : "pagina-2",
      has_more: !cursor,
      limit: 20,
    }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(
      () => useRevisoes({ concursoId: "concurso-a", grupo: "hoje", limit: 20 }),
      { wrapper: wrapperFor(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));

    expect(listarRevisoes).toHaveBeenNthCalledWith(1, {
      concursoId: "concurso-a",
      grupo: "hoje",
      limit: 20,
      cursor: null,
    });
    expect(listarRevisoes).toHaveBeenNthCalledWith(2, {
      concursoId: "concurso-a",
      grupo: "hoje",
      limit: 20,
      cursor: "pagina-2",
    });
  });

  it("não consulta enquanto o concurso não estiver resolvido", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(
      () => useRevisoes({ concursoId: null, grupo: "hoje" }),
      { wrapper: wrapperFor(queryClient) },
    );

    expect(listarRevisoes).not.toHaveBeenCalled();
  });
});
