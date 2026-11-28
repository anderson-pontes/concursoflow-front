import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardMiniCalendar } from "@/components/dashboard/DashboardMiniCalendar";
import { fetchCalendarioMes, fetchDiaDetalhe } from "@/services/calendario";
import type { CalendarioDia, CalendarioMesResponse, DiaDetalheResponse } from "@/lib/calendario/types";
import { invalidateEstudosQueries } from "@/lib/estudos/invalidateQueries";
vi.mock("@/services/calendario", () => ({ fetchCalendarioMes: vi.fn(), fetchDiaDetalhe: vi.fn() }));
const day: CalendarioDia = { data: "2026-12-31", status: "parcial", minutos_planejados: 60, minutos_realizados: 30, minutos_extra: 0, sessoes_realizadas: 1, planejado: [{ id: "bloco", fonte: "bloco_semanal", disciplina_id: "direito", disciplina_nome: "Direito", topico_id: null, topico_nome: null, duracao_minutos: 60 }] };
const response = (year: number, month: number): CalendarioMesResponse => ({ ano: year, mes: month, timezone: "America/Sao_Paulo", resumo_mes: { dias_com_planejamento: 1, dias_cumpridos: 0, dias_parciais: 1, dias_nao_cumpridos: 0, dias_estudou_sem_plano: 0, minutos_planejados: 60, minutos_realizados: 30, taxa_cumprimento_pct: 50 }, dias: year === 2026 && month === 12 ? [day] : [] });
function setup(concursoId = "concurso-a") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><MemoryRouter><DashboardMiniCalendar concursoId={concursoId} /></MemoryRouter></QueryClientProvider>);
  return { ...view, client, changeContest: (id: string) => view.rerender(<QueryClientProvider client={client}><MemoryRouter><DashboardMiniCalendar concursoId={id} /></MemoryRouter></QueryClientProvider>) };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(Date, "now").mockReturnValue(new Date("2026-12-31T12:00:00").getTime());
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-12-31T12:00:00"));
  vi.mocked(fetchCalendarioMes).mockImplementation(async ({ ano, mes }) => response(ano, mes));
  vi.mocked(fetchDiaDetalhe).mockResolvedValue({ data: day.data, status: "parcial", timezone: "America/Sao_Paulo", totais: { planejados: 60, realizados: 30, extra: 0 }, planejado: day.planejado, realizado: [] } as DiaDetalheResponse);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("mini calendário independente do período", () => {
  it("identifica revisão somente quando o planejamento informa o modo de revisão", async () => {
    vi.mocked(fetchCalendarioMes).mockResolvedValue({ ...response(2026, 12), dias: [{ ...day, planejado: day.planejado.map(item=>({...item,modo:'revisao' as const})) }] });
    setup();
    expect(await screen.findByRole('button',{name:/31\/12\/2026.*revisão programada/})).toBeInTheDocument();
  });
  it("Hoje usa o fuso do usuário ao atravessar meia-noite UTC e mudar de ano", async () => {
    vi.setSystemTime(new Date("2027-01-01T01:00:00Z"));
    vi.mocked(fetchCalendarioMes).mockImplementation(async ({ ano, mes }) => ({ ...response(ano, mes), timezone: "America/Sao_Paulo" }));
    const view = setup();
    expect(await screen.findByText("Dezembro 2026")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hoje" }));
    expect(await screen.findByRole("button", { name: /31\/12\/2026, hoje/ })).toHaveAttribute("aria-pressed", "true");
    vi.mocked(fetchCalendarioMes).mockImplementation(async ({ ano, mes }) => ({ ...response(ano, mes), timezone: "UTC" }));
    view.rerender(<QueryClientProvider client={view.client}><MemoryRouter><DashboardMiniCalendar concursoId="concurso-a" timezone="UTC" /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByText("Janeiro 2027")).toBeInTheDocument();
    await waitFor(() => expect(fetchCalendarioMes).toHaveBeenCalledWith({ ano: 2027, mes: 1, concursoId: "concurso-a" }));
    expect(await screen.findByRole("button", { name: /01\/01\/2027, hoje/ })).toHaveAttribute("aria-pressed", "true");
  });
  it("navega dezembro/janeiro e Hoje restaura mês e seleção com data local", async () => {
    setup();
    expect(await screen.findByText("Dezembro 2026")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(await screen.findByText("Janeiro 2027")).toBeInTheDocument();
    await waitFor(() => expect(fetchCalendarioMes).toHaveBeenCalledWith({ ano: 2027, mes: 1, concursoId: "concurso-a" }));
    fireEvent.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(await screen.findByText("Dezembro 2026")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hoje" }));
    expect(await screen.findByRole("button", { name: /31\/12\/2026, hoje/ })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText("Sessões de 31/12/2026")).toBeInTheDocument();
    expect(await screen.findByText("Direito")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver calendário completo" })).toHaveAttribute("href", "/estudos/calendario?ano=2026&mes=12&data=2026-12-31");
    expect(screen.queryByText("Sem estudo")).not.toBeInTheDocument();
  });
  it("isola cache por concurso e limpa sessões selecionadas ao mudar o contexto", async () => {
    const view = setup();
    await screen.findByRole("button", { name: /31\/12\/2026, hoje/ });
    fireEvent.click(screen.getByRole("button", { name: /31\/12\/2026, hoje/ }));
    await waitFor(() => expect(fetchDiaDetalhe).toHaveBeenCalledWith({ data: "2026-12-31", concursoId: "concurso-a" }));
    view.changeContest("concurso-b");
    await waitFor(() => expect(fetchCalendarioMes).toHaveBeenCalledWith({ ano: 2026, mes: 12, concursoId: "concurso-b" }));
    expect(view.client.getQueryData(["calendario", 2026, 12, "concurso-a"])).toBeDefined();
    expect(view.client.getQueryData(["calendario", 2026, 12, "concurso-b"])).toBeDefined();
    expect(screen.queryByText("Sessões de 31/12/2026")).not.toBeInTheDocument();
  });
  it("trata falha e retry sem inventar sessões e diferencia estado vazio", async () => {
    vi.mocked(fetchCalendarioMes).mockRejectedValueOnce(new Error("offline"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o calendário");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await screen.findByRole("button", { name: /31\/12\/2026, hoje/ });
    vi.mocked(fetchDiaDetalhe).mockResolvedValueOnce({ data: "2026-12-30", status: "sem_planejamento", timezone: "America/Sao_Paulo", totais: { planejados: 0, realizados: 0, extra: 0 }, planejado: [], realizado: [] });
    fireEvent.click(screen.getByRole("button", { name: "30/12/2026" }));
    expect(await screen.findByText(/Nenhuma atividade planejada ou registrada para este dia/)).toBeInTheDocument();
  });

  it.each([[2026, 2, 28], [2028, 2, 29], [2026, 11, 30], [2026, 8, 31]])(
    "exibe os %i/%i com %i dias e mantém a grade de seis semanas",
    async (year, month, days) => {
      vi.setSystemTime(new Date(year, month - 1, 10, 12));
      setup();
      const grid = await screen.findByRole("group", { name: "Dias do mini calendário" });
      expect(within(grid).getAllByRole("button")).toHaveLength(days);
      expect(grid.children).toHaveLength(42);
    },
  );

  it("mostra marcadores simultâneos, limita o resumo e abre o dia no calendário", async () => {
    const planned = [
      day.planejado[0],
      { ...day.planejado[0], id: "mat", disciplina_id: "mat", disciplina_nome: "Matemática" },
      { ...day.planejado[0], id: "por", disciplina_id: "por", disciplina_nome: "Português", modo: "revisao" as const },
    ];
    vi.mocked(fetchCalendarioMes).mockResolvedValue({ ...response(2026, 12), dias: [{ ...day, planejado: planned, minutos_realizados: 0 }] });
    vi.mocked(fetchDiaDetalhe).mockResolvedValue({ data: day.data, timezone: "America/Sao_Paulo", status: "parcial", totais: { planejados: 180, realizados: 0, extra: 0 }, planejado: planned, realizado: [] });
    setup();
    const button = await screen.findByRole("button", { name: /31\/12\/2026.*Direito.*Matemática.*Português.*estudo registrado.*revisão programada/ });
    expect(within(button).getByText("+1")).toBeInTheDocument();
    fireEvent.click(button);
    const list = await screen.findByRole("list", { name: "Sessões do dia selecionado" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("1 revisão")).toBeInTheDocument();
    expect(screen.getByText("1 realizada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todas as atividades do dia" })).toHaveAttribute("href", "/estudos/calendario?ano=2026&mes=12&data=2026-12-31");
  });

  it("atualiza o mês e o dia selecionado após invalidar o registro de estudos", async () => {
    const { client } = setup();
    fireEvent.click(await screen.findByRole("button", { name: /31\/12\/2026, hoje/ }));
    expect(await screen.findByText("1 realizada")).toBeVisible();
    const updated = { ...day, sessoes_realizadas: 2 };
    vi.mocked(fetchCalendarioMes).mockResolvedValue({ ...response(2026, 12), dias: [updated] });
    invalidateEstudosQueries(client);
    expect(await screen.findByText("2 realizadas")).toBeVisible();
    expect(fetchDiaDetalhe).toHaveBeenCalledTimes(2);
  });

  it("mostra o horário local de uma sessão que atravessou a meia-noite", async () => {
    vi.mocked(fetchDiaDetalhe).mockResolvedValue({
      data: day.data, status: "parcial", timezone: "America/Sao_Paulo",
      totais: { planejados: 60, realizados: 30, extra: 0 },
      planejado: day.planejado,
      realizado: [{
        id: "sessao", disciplina_id: "direito", topico_id: null, data_referencia: "2026-12-31",
        inicio: "2027-01-01T02:40:00Z", fim: "2027-01-01T03:10:00Z", tempo_estudo_segundos: 1800,
      } as DiaDetalheResponse["realizado"][number]],
    });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: /31\/12\/2026, hoje/ }));
    expect(await screen.findByText("Realizada · 23:40")).toBeVisible();
    expect(screen.getByText("30 min")).toBeVisible();
  });
});
