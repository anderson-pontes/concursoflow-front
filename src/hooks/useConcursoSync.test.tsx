import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useConcursoSync } from "@/hooks/useConcursoSync";
import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";

vi.mock("@/services/api", () => ({
  api: { get: vi.fn() },
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useConcursoSync", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    useConcursoStore.setState({
      concursoAtivoId: "removido",
      contextResolved: true,
      contextError: false,
    });
    await useConcursoStore.persist.rehydrate();
  });

  it("substitui concurso persistido removido pelo primeiro concurso permitido", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: "permitido" }] });

    renderHook(() => useConcursoSync(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(useConcursoStore.getState()).toMatchObject({
        concursoAtivoId: "permitido",
        contextResolved: true,
      });
    });
  });

  it("resolve contexto vazio quando a conta não possui concursos", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    renderHook(() => useConcursoSync(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(useConcursoStore.getState()).toMatchObject({
        concursoAtivoId: null,
        contextResolved: true,
      });
    });
  });

  it("preserva a seleção e expõe erro quando a lista de concursos falha", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("rede indisponível"));

    renderHook(() => useConcursoSync(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(useConcursoStore.getState()).toMatchObject({
        concursoAtivoId: "removido",
        contextResolved: true,
        contextError: true,
      });
    });
  });
});
