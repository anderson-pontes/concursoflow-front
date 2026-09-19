import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditalVerticalizadoOverview } from "@/components/disciplinas/EditalVerticalizadoOverview";
import { useEditalVerticalizado } from "@/hooks/useEditalVerticalizado";

vi.mock("@/hooks/useEditalVerticalizado", () => ({ useEditalVerticalizado: vi.fn() }));
vi.stubGlobal("matchMedia", vi.fn().mockImplementation(() => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})));

const emptyPage = {
  contract_version: "1" as const,
  concurso: { id: "concurso-novo", status: "ativo" },
  as_of: { local_date: "2026-09-19", timezone: "America/Sao_Paulo" },
  progresso_global: { dominados: 0, total: 0, percentual: 0, texto: "0 de 0 topicos dominados" },
  disciplinas: [],
  items: [],
  page: { next_cursor: null, has_more: false, limit: 30, result_count: 0 },
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

function NavigationStateProbe() {
  const location = useLocation();
  return <output data-testid="navigation-state">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>;
}

describe("EditalVerticalizadoOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEditalVerticalizado).mockReturnValue({
      data: { pages: [emptyPage], pageParams: [null] },
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    } as never);
  });

  it("descarta filtros e busca do concurso anterior antes da primeira consulta", async () => {
    render(
      <MemoryRouter initialEntries={[{
        pathname: "/disciplinas",
        search: "?view=edital&disciplina=disciplina-antiga&expandida=topico-antigo",
        state: { editalContestId: "concurso-antigo", editalSearch: "busca antiga" },
      }]}>
        <EditalVerticalizadoOverview concursoId="concurso-novo" />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(useEditalVerticalizado).toHaveBeenNthCalledWith(
      1,
      "concurso-novo",
      expect.objectContaining({ search: undefined, disciplina_ids: [] }),
    );
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("?view=edital"));
    expect(screen.queryByDisplayValue("busca antiga")).not.toBeInTheDocument();
  });

  it("transporta busca, pagina e foco para o retorno a partir do topico", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    vi.mocked(useEditalVerticalizado).mockReturnValue({
      data: { pages: [{
        ...emptyPage,
        progresso_global: { dominados: 0, total: 1, percentual: 0, texto: "0 de 1 topicos dominados" },
        disciplinas: [{ id: "disciplina-1", nome: "Direito", ordem: 1, progresso: { dominados: 0, total: 1, percentual: 0, texto: "0 de 1 topicos dominados" }, resultados: 1 }],
        items: [{
          id: "topico-1", disciplina_id: "disciplina-1", disciplina_nome: "Direito", descricao: "Constituicao",
          status: "nao_iniciado", numero_ordem: 1, peso: 2, dominio: 1, prioridade: 10,
          ultima_atividade_em: null, proxima_revisao_id: null, proxima_revisao_em: null,
          revisao_atrasada: false, dias_atraso: 0, nunca_estudado: true, razoes_atencao: ["NUNCA_ESTUDADO"],
        }],
        page: { next_cursor: null, has_more: false, limit: 30, result_count: 1 },
      }], pageParams: [null] },
      isLoading: false, isError: false, hasNextPage: false, isFetchingNextPage: false,
      fetchNextPage: vi.fn(), refetch: vi.fn(),
    } as never);

    render(
      <MemoryRouter initialEntries={[{ pathname: "/disciplinas", search: "?view=edital", state: { editalContestId: "concurso-novo", editalSearch: "constitucional" } }]}>
        <EditalVerticalizadoOverview concursoId="concurso-novo" />
        <NavigationStateProbe />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Constituicao/ }));
    await user.click(screen.getByRole("link", { name: "Abrir tópico" }));
    const navigation = screen.getByTestId("navigation-state").textContent ?? "";
    expect(navigation).toContain('"pathname":"/disciplinas/disciplina-1"');
    expect(navigation).toContain('"editalReturnTo":"/disciplinas?view=edital&expandida=topico-1"');
    expect(navigation).toContain('"editalSearch":"constitucional"');
    expect(navigation).toContain('"editalFocusId":"topico-1"');
  });
});
