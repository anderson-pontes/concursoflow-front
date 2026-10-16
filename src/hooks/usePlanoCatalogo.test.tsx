import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlanoCatalogo } from "@/hooks/usePlanoCatalogo";
import { obterConteudoCargo, obterResumoEditalPublicado } from "@/services/editaisCatalogo";
import type { EditalCatalogo, EditalCargoCatalogo } from "@/types/editaisCatalogo";

vi.mock("@/services/editaisCatalogo", () => ({ obterResumoEditalPublicado: vi.fn(), obterConteudoCargo: vi.fn() }));
const cargo: EditalCargoCatalogo = { id: "cargo", nome: "Analista", ordem: 0, disciplinas: [] };
const edital = (id: string) => ({ id, versao_atual: { id: `v-${id}`, cargos: [cargo] } }) as EditalCatalogo;
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const initialProps: { id: string | null; cargoId: string | null } = { id: null, cargoId: null };
  return { client, ...renderHook(({ id, cargoId }: typeof initialProps) => usePlanoCatalogo(id, cargoId), { wrapper, initialProps }) };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(obterResumoEditalPublicado).mockImplementation(async (id) => edital(id));
  vi.mocked(obterConteudoCargo).mockResolvedValue(cargo);
});
describe("catálogo progressivo do plano", () => {
  it("busca somente após seleção, reutiliza cache e respeita invalidação pública", async () => {
    const { result, rerender, client } = setup();
    expect(obterResumoEditalPublicado).not.toHaveBeenCalled();
    rerender({ id: "a", cargoId: null });
    await waitFor(() => expect(result.current.resumo.isSuccess).toBe(true));
    expect(obterConteudoCargo).not.toHaveBeenCalled();
    rerender({ id: "a", cargoId: "cargo" });
    await waitFor(() => expect(result.current.conteudo.isSuccess).toBe(true));
    expect(obterConteudoCargo).toHaveBeenCalledWith("a", "v-a", "cargo", expect.any(AbortSignal));
    rerender({ id: "b", cargoId: null });
    await waitFor(() => expect(result.current.resumo.data?.id).toBe("b"));
    expect(result.current.conteudo.data).toBeUndefined();
    rerender({ id: "a", cargoId: "cargo" });
    await waitFor(() => expect(result.current.conteudo.isSuccess).toBe(true));
    expect(obterConteudoCargo).toHaveBeenCalledTimes(1);
    expect(obterResumoEditalPublicado).toHaveBeenCalledTimes(2);
    await act(async () => { await client.invalidateQueries({ queryKey: ["catalogo-edital", "public"] }); });
    expect(obterConteudoCargo).toHaveBeenCalledTimes(2);
    expect(obterResumoEditalPublicado).toHaveBeenCalledTimes(3);
  });
  it("cancela resumo anterior e ignora resposta obsoleta ao trocar rapidamente", async () => {
    let resolveOld!: (value: EditalCatalogo) => void;
    let oldSignal: AbortSignal | undefined;
    vi.mocked(obterResumoEditalPublicado).mockImplementation((id, signal) => id === "a" ? new Promise((resolve) => { resolveOld = resolve; oldSignal = signal; }) : Promise.resolve(edital(id)));
    const { result, rerender } = setup();
    rerender({ id: "a", cargoId: null });
    await waitFor(() => expect(oldSignal).toBeDefined());
    rerender({ id: "b", cargoId: null });
    await waitFor(() => expect(result.current.resumo.data?.id).toBe("b"));
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => resolveOld(edital("a")));
    expect(result.current.resumo.data?.id).toBe("b");
    expect(obterConteudoCargo).not.toHaveBeenCalled();
  });
  it("não busca conteúdo de cargo que não pertence ao edital", async () => {
    const { result, rerender } = setup();
    rerender({ id: "a", cargoId: "cargo-de-outro-edital" });
    await waitFor(() => expect(result.current.resumo.isSuccess).toBe(true));
    expect(result.current.cargo).toBeUndefined();
    expect(obterConteudoCargo).not.toHaveBeenCalled();
  });
});
