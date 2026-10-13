import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardMiniCalendar } from "@/components/dashboard/DashboardMiniCalendar";
import { fetchCalendarioMes, fetchDiaDetalhe } from "@/services/calendario";
import type { CalendarioDia, CalendarioMesResponse, DiaDetalheResponse } from "@/lib/calendario/types";
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
    expect(await screen.findByText(/Nenhuma sessão neste dia/)).toBeInTheDocument();
  });
});
