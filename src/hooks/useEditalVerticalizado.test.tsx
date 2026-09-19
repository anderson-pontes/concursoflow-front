import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEditalVerticalizado } from "@/hooks/useEditalVerticalizado";
import { consultarEditalVerticalizado } from "@/services/editalVerticalizado";
import type { EditalConsulta, EditalVerticalizadoPage } from "@/types/editalVerticalizado";

vi.mock("@/services/editalVerticalizado", () => ({ consultarEditalVerticalizado: vi.fn() }));

const query: EditalConsulta = { disciplina_ids: [], status: [], dominios: [], sort: "ordem_edital", limit: 30 };
const page = (cursor: string | null, hasMore: boolean): EditalVerticalizadoPage => ({ contract_version: "1", concurso: { id: "concurso-a", status: "ativo" }, as_of: { local_date: "2026-09-18", timezone: "America/Sao_Paulo" }, progresso_global: { dominados: 0, total: 0, percentual: 0, texto: "0 de 0 topicos dominados" }, disciplinas: [], items: [], page: { next_cursor: cursor, has_more: hasMore, limit: 30, result_count: 0 } });

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; };
}

describe("useEditalVerticalizado", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mantem cursor interno e pagina somente depois de has_more", async () => {
    vi.mocked(consultarEditalVerticalizado).mockImplementation(async (_contest, _query, cursor) => cursor ? page(null, false) : page("cursor-2", true));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useEditalVerticalizado("concurso-a", query), { wrapper: wrapperFor(client) });
    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await act(async () => { await result.current.fetchNextPage(); });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(consultarEditalVerticalizado).toHaveBeenNthCalledWith(1, "concurso-a", query, null, expect.any(AbortSignal));
    expect(consultarEditalVerticalizado).toHaveBeenNthCalledWith(2, "concurso-a", query, "cursor-2", expect.any(AbortSignal));
  });

  it("segmenta o cache pelo concurso", async () => {
    vi.mocked(consultarEditalVerticalizado).mockResolvedValue(page(null, false));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { rerender } = renderHook(({ id }) => useEditalVerticalizado(id, query), { initialProps: { id: "concurso-a" }, wrapper: wrapperFor(client) });
    await waitFor(() => expect(consultarEditalVerticalizado).toHaveBeenCalledTimes(1));
    rerender({ id: "concurso-b" });
    await waitFor(() => expect(consultarEditalVerticalizado).toHaveBeenCalledTimes(2));
  });
});
