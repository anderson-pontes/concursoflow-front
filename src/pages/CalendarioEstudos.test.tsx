import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarioEstudos } from "@/pages/CalendarioEstudos";
import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";

vi.mock("@/services/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/components/estudos/RegistroEstudoModal", () => ({ RegistroEstudoModal: () => null }));
vi.mock("@/components/calendario/CalendarioDiaDetalheDialog", () => ({ CalendarioDiaDetalheDialog: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  useConcursoStore.setState({ concursoAtivoId: "concurso-1", contextResolved: true, contextError: false });
  vi.mocked(api.get).mockImplementation(async url => {
    if (url === "/disciplinas") return { data: [{ id: "d1", nome: "Direito", concurso_ids: ["concurso-1"] }] } as never;
    if (url === "/cronograma/blocos") return { data: [{ id: "bloco-1", disciplina_id: "d1", dia_semana: "seg" }] } as never;
    const params = new URL(url, "http://localhost").searchParams;
    const ano = Number(params.get("ano"));
    const mes = Number(params.get("mes"));
    const minutes = mes === 10 ? 60 : 0;
    return { data: { ano, mes, timezone: "America/Sao_Paulo", dias: [], resumo_mes: {
      dias_com_planejamento: minutes ? 1 : 0, dias_cumpridos: 0, dias_parciais: 0,
      dias_nao_cumpridos: 0, dias_estudou_sem_plano: 0, minutos_planejados: minutes,
      minutos_realizados: 0, taxa_cumprimento_pct: 0,
    } } } as never;
  });
});

function setup(month = 10) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[`/estudos/calendario?ano=2026&mes=${month}`]}><CalendarioEstudos /></MemoryRouter></QueryClientProvider>);
}

describe("calendar month navigation", () => {
  it("keeps navigation in an empty following month and lets the user return", async () => {
    setup();
    const next = await screen.findByRole("button", { name: "Próximo mês" });
    await userEvent.click(next);
    expect(await screen.findByText("Nenhuma atividade planejada neste mês.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mês anterior" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Criar cronograma" })).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/cronograma/calendario?ano=2026&mes=11&concurso_id=concurso-1");
    await userEvent.click(screen.getByRole("button", { name: "Mês anterior" }));
    await waitFor(() => expect(screen.queryByText("Nenhuma atividade planejada neste mês.")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Próximo mês" })).toBeInTheDocument();
  });

  it("supports an empty month deep link and crossing the year boundary", async () => {
    setup(12);
    expect(await screen.findByText("Nenhuma atividade planejada neste mês.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/cronograma/calendario?ano=2027&mes=1&concurso_id=concurso-1"));
    expect(await screen.findByRole("button", { name: "Mês anterior" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Criar cronograma" })).not.toBeInTheDocument();
  });
});
