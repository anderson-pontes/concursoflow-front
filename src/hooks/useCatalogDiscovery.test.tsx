import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { normalizeCatalogSearch, parseCatalogQuery, useCatalogDiscovery } from "@/hooks/useCatalogDiscovery";
import { paginarEditaisPublicados } from "@/services/editaisCatalogo";

vi.mock("@/services/editaisCatalogo", () => ({
  paginarEditaisPublicados: vi.fn(async ({ page = 1, pageSize = 8 }) => ({
    items: [], page, page_size: pageSize, total: 40, total_pages: 5,
  })),
  obterFiltrosCatalogo: vi.fn(async () => ({ esferas: [], areas: [], anos: [] })),
  validarSelecaoCatalogo: vi.fn(async () => ({ eligible: true, published_version_id: null })),
}));

function Harness({ onInvalidated = () => undefined }: { onInvalidated?: () => void }) {
  const discovery = useCatalogDiscovery(onInvalidated);
  const location = useLocation();
  const navigate = useNavigate();
  return <form onSubmit={(event) => { event.preventDefault(); discovery.applySearch(); }}>
    <input aria-label="Busca" value={discovery.draftSearch} onChange={(event) => discovery.setDraftSearch(event.target.value)} />
    <button type="submit">Buscar</button>
    <button type="button" onClick={() => discovery.setPage(2)}>Página 2</button>
    <button type="button" onClick={() => discovery.applyFilters({ esfera: ["federal"], area: ["juridica"], anoEdital: [2026] })}>Aplicar filtros</button>
    <button type="button" onClick={discovery.clearFilters}>Limpar filtros</button>
    <button type="button" onClick={() => navigate(-1)}>Voltar</button>
    <output aria-label="URL">{location.search}</output>
    <output aria-label="Total">{discovery.result.data?.total ?? "carregando"}</output>
  </form>;
}

function renderHarness(initialEntry: string, onInvalidated?: () => void) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[initialEntry]}><Harness onInvalidated={onInvalidated} /></MemoryRouter></QueryClientProvider>);
}

describe("useCatalogDiscovery", () => {
  it("normaliza NFC e whitespace e aplica defaults seguros", () => {
    expect(normalizeCatalogSearch("  O\u0301rgão\t Federal ")).toBe("Órgão Federal");
    expect(parseCatalogQuery(new URLSearchParams("page=0&page_size=99&sort=other"))).toEqual({
      search: "", esfera: [], area: [], anoEdital: [], page: 1, pageSize: 8, sort: "recent",
    });
  });

  it("remove parâmetros desconhecidos e preserva somente a origem aprovada", async () => {
    renderHarness("/planos/novo?origem=catalogo&token=segredo&page=0");
    await waitFor(() => expect(screen.getByLabelText("URL")).toHaveTextContent("?origem=catalogo"));
  });

  it("mantém somente a primeira busca repetida e canonicaliza os demais parâmetros", async () => {
    renderHarness("/editais/ativar?search=TRT&search=segredo&page=2&page=3&sort=other");
    await waitFor(() => expect(screen.getByLabelText("URL")).toHaveTextContent("?search=TRT"));
    expect(screen.getByRole("textbox", { name: "Busca" })).toHaveValue("TRT");
  });

  it("mantém digitação local e aplica a busca explicitamente preservando origem", async () => {
    const user = userEvent.setup();
    const onInvalidated = vi.fn();
    renderHarness("/planos/novo?origem=catalogo", onInvalidated);
    await waitFor(() => expect(paginarEditaisPublicados).toHaveBeenCalled());
    vi.mocked(paginarEditaisPublicados).mockClear();

    await user.type(screen.getByRole("textbox", { name: "Busca" }), "  TRT   8  ");
    expect(screen.getByLabelText("URL")).toHaveTextContent("?origem=catalogo");
    expect(paginarEditaisPublicados).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await waitFor(() => expect(screen.getByLabelText("URL")).toHaveTextContent("origem=catalogo&search=TRT+8"));
    expect(onInvalidated).not.toHaveBeenCalled();
  });

  it("restaura a query da URL e pagina sem remover a seleção", async () => {
    const onInvalidated = vi.fn();
    const user = userEvent.setup();
    renderHarness("/editais/ativar?search=tribunal&page=3", onInvalidated);

    expect(screen.getByRole("textbox", { name: "Busca" })).toHaveValue("tribunal");
    await user.click(screen.getByRole("button", { name: "Página 2" }));
    await waitFor(() => expect(screen.getByLabelText("URL")).toHaveTextContent("search=tribunal&page=2"));
    expect(onInvalidated).not.toHaveBeenCalled();
  });

  it("restaura a busca pelo histórico e invalida a seleção somente quando o termo muda", async () => {
    const onInvalidated = vi.fn();
    const user = userEvent.setup();
    renderHarness("/editais/ativar?search=tribunal", onInvalidated);

    const input = screen.getByRole("textbox", { name: "Busca" });
    await user.clear(input);
    await user.type(input, "receita");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await waitFor(() => expect(screen.getByLabelText("URL")).toHaveTextContent("search=receita"));
    expect(onInvalidated).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    await waitFor(() => expect(input).toHaveValue("tribunal"));
    expect(onInvalidated).not.toHaveBeenCalled();
  });

  it("corrige página acima do total sem criar uma nova entrada no histórico", async () => {
    vi.mocked(paginarEditaisPublicados).mockResolvedValueOnce({
      items: [], page: 99, page_size: 8, total: 17, total_pages: 3,
    });
    renderHarness("/editais/ativar?page=99");

    await waitFor(() => expect(screen.getByLabelText("URL")).toHaveTextContent("?page=3"));
  });

  it("deduplica, ordena e serializa filtros repetíveis na ordem canônica", async () => {
    renderHarness("/editais/ativar?area=tecnologia&esfera=municipal&area=juridica&esfera=federal&ano_edital=2026&ano_edital=2025&page=3");
    await waitFor(() => expect(screen.getByLabelText("URL")).toHaveTextContent("?esfera=federal&esfera=municipal&area=juridica&area=tecnologia&ano_edital=2025&ano_edital=2026&page=3"));
  });

  it("aplica e limpa somente os filtros preservando a busca", async () => {
    const user = userEvent.setup();
    renderHarness("/editais/ativar?search=tribunal&page=2");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(screen.getByLabelText("URL")).toHaveTextContent("search=tribunal&esfera=federal&area=juridica&ano_edital=2026"));
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await waitFor(() => expect(screen.getByLabelText("URL")).toHaveTextContent("?search=tribunal"));
  });
});
