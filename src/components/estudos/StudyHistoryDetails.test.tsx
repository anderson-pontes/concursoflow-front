import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { NextActionCard } from "@/components/dashboard/DashboardPrimary";
import { DashboardTodayPlan } from "@/components/dashboard/DashboardTodayPlan";
import { groupStudyHistory, StudyHistoryList } from "@/components/estudos/StudyHistoryList";
import { invalidateEstudosQueries } from "@/lib/estudos/invalidateQueries";
import type { StudyHistoryEntry } from "@/lib/historico/types";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({ api: { get: vi.fn() } }));

const study = {
  disciplina_id: "disc-1", disciplina_nome: "Português",
  topico_id: "planned-topic", topico_nome: "Tópico planejado",
  data: "2026-11-24", duracao_minutos: 30,
};
const listUrl = "/sessoes-estudo/historico";
const summaryUrl = `${listUrl}/resumo`;
const triggerName = "Histórico de estudo de Português";
const first: StudyHistoryEntry = {
  id: "first", dia: "2026-11-23", inicio: "2026-11-23T15:00:00Z", segundos: 120,
  topicos: [{ id: "a", nome: "Sintaxe" }], comentarios: "Continuar na página 24.\nRever o exercício 3.",
  anotacoes: "<script>texto</script>", tipo: "livre", modalidade: null,
  questoes_acertos: 3, questoes_erros: 1, questoes_em_branco: 0,
};
const page = (items: StudyHistoryEntry[] = [first], next_cursor: string | null = null) => ({ data: { items, next_cursor, timezone: "America/Sao_Paulo" } });
const summary = (total: number) => ({ data: {
  total_sessoes: total, total_segundos: total * 120, topicos_distintos: 1, ultimo_estudo: first.dia, ultimo_id: first.id,
} });

function renderDashboardCard(card: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { client, ...render(<QueryClientProvider client={client}><MemoryRouter>{card}</MemoryRouter></QueryClientProvider>) };
}

const next = <NextActionCard compact concursoId="concurso-1" study={study} state="ready"
  isError={false} onRetry={vi.fn()} onStart={vi.fn()} onManual={vi.fn()} replanUrl="/replanejar" />;

describe("Histórico de estudo no painel", () => {
  beforeAll(async () => { await import("@/components/estudos/StudyHistoryContent"); });
  beforeEach(() => vi.resetAllMocks());

  it("carrega sob demanda, unifica o dia entre páginas e mantém o resumo e a expansão", async () => {
    vi.mocked(api.get).mockImplementation(async (url, config) => url === summaryUrl ? summary(5000)
      : (config?.params as { cursor?: string } | undefined)?.cursor ? page([
        first,
        { ...first, id: "old", topicos: [{ id: "b", nome: "Regência" }] },
        { ...first, id: "other-day", dia: "2026-11-22", topicos: [], comentarios: null, anotacoes: null, questoes_acertos: 0, questoes_erros: 0 },
      ])
        : page([first], "opaque"));
    renderDashboardCard(next);
    expect(api.get).not.toHaveBeenCalled();
    const trigger = screen.getByRole("button", { name: triggerName });
    await act(async () => { fireEvent.click(trigger); });

    await waitFor(() => expect(api.get).toHaveBeenCalledWith(listUrl, expect.objectContaining({
      params: expect.objectContaining({ concurso_id: "concurso-1", disciplina_id: "disc-1", limite: 15, cursor: null }),
      signal: expect.any(AbortSignal),
    })));
    const dialog = screen.getByRole("dialog", { name: "Histórico de estudo" });
    expect(await within(dialog).findByText("1 de 5.000 registros exibidos · Mais recentes primeiro")).toBeInTheDocument();
    const latest = within(dialog).getByText("Mais recente").closest("details")!;
    expect(latest).toHaveAttribute("open");
    expect(within(dialog).getByText("Continuar na página 24. Rever o exercício 3.")).toBeInTheDocument();
    expect(within(dialog).getByText("<script>texto</script>")).toBeInTheDocument();
    expect(within(dialog).queryByText("Tópico planejado")).not.toBeInTheDocument();

    fireEvent.click(latest.querySelector("summary")!);
    await waitFor(() => expect(latest).not.toHaveAttribute("open"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Carregar mais registros" }));
    expect((await within(dialog).findByText("Regência")).closest("details")).not.toHaveAttribute("open");
    expect(latest).not.toHaveAttribute("open");
    expect(within(dialog).getAllByRole("heading", { name: "23 de novembro de 2026" })).toHaveLength(1);
    expect(within(dialog).getByRole("heading", { name: "22 de novembro de 2026" })).toBeInTheDocument();
    expect(within(dialog).getAllByText("Sintaxe")).toHaveLength(1);
    expect(within(dialog).getByText("Sessão sem tópico").closest("details")).toBeNull();
    expect(api.get).toHaveBeenLastCalledWith(listUrl, expect.objectContaining({ params: expect.objectContaining({ cursor: "opaque" }) }));
    expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === summaryUrl)).toHaveLength(1);
    expect(within(dialog).getByText("Todos os registros foram exibidos.")).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("marca o mais recente em ordem crescente e permite leitura integral de anotações longas", () => {
    const long = `Primeiro parágrafo.\n\n${"Palavra".repeat(70)}\n\nÚltimo parágrafo integral.`;
    const older = { ...first, id: "old", dia: "2026-11-22", comentarios: long, topicos: [{ id: "b", nome: "Regência" }] };
    const { days } = groupStudyHistory([page([older, first]).data]);
    render(<StudyHistoryList days={days} latestId={first.id} newestFirst={false} timezone="America/Sao_Paulo" />);
    expect(screen.getAllByRole("heading", { level: 4 }).map((heading) => heading.textContent)).toEqual(["22 de novembro de 2026", "23 de novembro de 2026"]);
    expect(screen.getByText("Mais recente").closest("details")).toContainElement(screen.getByText("Sintaxe"));
    const old = screen.getByText("Regência").closest("details")!;
    expect(old).not.toHaveAttribute("open");
    expect(within(old.querySelector("summary")!).getByText("Livre")).toBeInTheDocument();
    fireEvent.click(old.querySelector("summary")!);
    fireEvent.click(within(old).getByRole("button", { name: "Ler mais" }));
    expect(within(old).getByText(/Último parágrafo integral/).textContent).toBe(long);
    fireEvent.click(within(old).getByRole("button", { name: "Mostrar menos" }));
    expect(within(old).queryByText(/Último parágrafo integral/)).not.toBeInTheDocument();
  });

  it("reinicia o cursor na busca e atualiza o resumo e os registros após salvar", async () => {
    vi.mocked(api.get).mockImplementation(async (url, config) => {
      if ((config?.params as { busca?: string } | undefined)?.busca) return url === summaryUrl ? summary(0) : page([]);
      return url === summaryUrl ? summary(1) : page();
    });
    const { client } = renderDashboardCard(next);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: triggerName })); });
    await screen.findByText("Sintaxe");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "  tópico distante  " } });
    await screen.findByText("Nenhum registro encontrado");
    expect(api.get).toHaveBeenCalledWith(listUrl, expect.objectContaining({
      params: expect.objectContaining({ busca: "tópico distante", cursor: null }),
    }));
    expect(api.get).toHaveBeenCalledWith(summaryUrl, expect.objectContaining({
      params: expect.objectContaining({ busca: "tópico distante" }),
    }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar pesquisa" }));
    expect(screen.getByRole("searchbox")).toHaveFocus();
    await screen.findByText("Sintaxe");
    vi.mocked(api.get).mockImplementation(async (url) => url === summaryUrl ? summary(2) : page([first, {
      ...first, id: "new", topicos: [{ id: "c", nome: "Tópico novo" }],
    }]));
    invalidateEstudosQueries(client);
    expect(await screen.findByText("Tópico novo")).toBeInTheDocument();
    expect(await screen.findByText("2 de 2 registros exibidos · Mais recentes primeiro")).toBeInTheDocument();
  });

  it("permite tentar novamente e preserva a ação de registrar no plano de hoje", async () => {
    let attempts = 0;
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === summaryUrl) return summary(0);
      if (attempts++ === 0) throw new Error("offline");
      return page([]);
    });
    const item = { ...study, id: "item", fonte: "cronograma_item", status: "planejada", hora_inicio: null, hora_fim: null } as const;
    const register = vi.fn();
    renderDashboardCard(<DashboardTodayPlan concursoId="concurso-1" items={[item]} onRegister={register} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: triggerName })); });
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o histórico.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Nenhum estudo registrado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent.click(screen.getByRole("button", { name: "Registrar estudo" }));
    expect(register).toHaveBeenCalledWith(item);
  });
});
