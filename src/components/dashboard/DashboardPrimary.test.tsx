import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { DashboardContextHeader, NextActionCard, TodayPlanCard, UrgentReviewsCard } from "@/components/dashboard/DashboardPrimary";
import { DashboardComplementary } from "@/components/dashboard/DashboardComplementary";
import { dashboardDayISO } from "@/lib/dashboard/analysis";

describe("organismos primários do dashboard", () => {
  it("identifica o concurso com um único h1 e trata data ausente", () => {
    render(<MemoryRouter><DashboardContextHeader contest={{ nome: "TRT 8ª Região", orgao: "TRT 8", cargo: "Analista", data_prova: null }} daysUntilExam={null} /></MemoryRouter>);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "TRT 8ª Região" })).toBeInTheDocument();
    expect(screen.getByText("Data da prova ainda não informada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cadastrar data da prova" })).toHaveAttribute("href", "/concursos");
  });

  it.each([
    [91, "indigo", "91"], [68, "blue", "68"], [30, "amber", "30"], [15, "orange", "15"],
    [0, "today", "A prova é hoje"], [-2, "neutral", "Prova realizada há 2 dias"],
  ] as const)("mostra o prazo de %s dias com o estado correspondente", (days, tone, text) => {
    render(<DashboardContextHeader contest={{ nome: "Receita Federal", orgao: "RFB", cargo: "Auditor Fiscal", data_prova: "2027-01-31" }} daysUntilExam={days} />);
    expect(screen.getByText(text).closest("[data-tone]")).toHaveAttribute("data-tone", tone);
    expect(screen.getByText("31 de janeiro de 2027")).toHaveAttribute("datetime", "2027-01-31");
  });

  it("preserva o prefill completo do Pomodoro e um único CTA primário", () => {
    const onStart = vi.fn();
    const onManual = vi.fn();
    render(<MemoryRouter><NextActionCard study={{ disciplina_id: "disc-1", disciplina_nome: "Português", topico_id: "top-1", topico_nome: "Interpretação", data: "2026-09-02", duracao_minutos: 50 }} state="ready" isError={false} onRetry={vi.fn()} onStart={onStart} onManual={onManual} replanUrl="/planos/concurso-1/replanejar" /></MemoryRouter>);

    const start = screen.getByRole("link", { name: /iniciar estudo/i });
    expect(start).toHaveAttribute("href", "/pomodoro?from=dashboard&disciplina_id=disc-1&minutos=50&topico_id=top-1&data_referencia=2026-09-02");
    expect(screen.getAllByRole("link").filter((link) => link.className.includes("bg-primary"))).toHaveLength(1);
    fireEvent.click(start);
    expect(onStart).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Registrar manualmente" }));
    expect(onManual).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: /replanejar/i })).toHaveAttribute("href", "/planos/concurso-1/replanejar");
  });

  it("exibe o status fornecido pelo plano e bloqueia outro clique enquanto abre o registro", () => {
    const onManual = vi.fn();
    render(<MemoryRouter><NextActionCard compact studyStatus="atrasada" registering state="ready"
      study={{ disciplina_id: "disc-1", disciplina_nome: "Português", topico_id: null, topico_nome: null, data: "2026-11-24", duracao_minutos: 50 }}
      isError={false} onRetry={vi.fn()} onStart={vi.fn()} onManual={onManual} replanUrl="/replanejar" /></MemoryRouter>);

    expect(screen.getByText("Atrasada")).toBeInTheDocument();
    expect(screen.queryByText("Planejada")).not.toBeInTheDocument();
    const manual = screen.getByRole("button", { name: "Abrindo registro…" });
    expect(manual).toBeDisabled();
    fireEvent.click(manual);
    expect(onManual).not.toHaveBeenCalled();
  });

  it.each([
    ["overdue", "Há revisões que merecem atenção hoje"],
    ["upcoming_exam", "A prova está próxima"],
    ["completed", "Meta diária alcançada"],
    ["ready", "Esta é a primeira sessão futura"],
  ] as const)("explica a variação %s sem trocar a ação recomendada", (state, message) => {
    render(<MemoryRouter><NextActionCard study={{ disciplina_id: "disc-1", disciplina_nome: "Português", topico_id: null, topico_nome: null, data: "2026-09-02", duracao_minutos: 30 }} state={state} isError={false} onRetry={vi.fn()} onStart={vi.fn()} onManual={vi.fn()} replanUrl="/replanejar" /></MemoryRouter>);

    expect(screen.getByText(new RegExp(message))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /iniciar estudo/i })).toBeInTheDocument();
  });

  it("oferece estado vazio compacto e acesso ao cronograma", () => {
    render(<MemoryRouter><TodayPlanCard items={[]} onRegister={vi.fn()} /></MemoryRouter>);

    expect(screen.getByText("Nenhum bloco planejado para hoje")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver cronograma" })).toHaveAttribute("href", "/cronograma");
  });

  it("limita revisões urgentes a três e abre o grupo adequado da Central", () => {
    const reviews = [
      { disciplina_id: "disc-1", disciplina_nome: "Direito", topico_id: "top-1", topico_nome: "Constituição", dias_atraso: 2 },
      { disciplina_id: "disc-2", disciplina_nome: "Português", topico_id: "top-2", topico_nome: "Sintaxe", dias_atraso: 0 },
      { disciplina_id: "disc-3", disciplina_nome: "TI", topico_id: "top-3", topico_nome: "Redes", dias_atraso: 1 },
      { disciplina_id: "disc-4", disciplina_nome: "RLM", topico_id: "top-4", topico_nome: "Proposições", dias_atraso: 0 },
    ];
    render(<MemoryRouter><UrgentReviewsCard reviews={reviews} total={4} isError={false} onRetry={vi.fn()} /></MemoryRouter>);

    expect(screen.getAllByRole("link", { name: "Revisar" })).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: "Revisar" })[0]).toHaveAttribute("href", "/revisoes?grupo=atrasadas");
    expect(screen.getAllByRole("link", { name: "Revisar" })[1]).toHaveAttribute("href", "/revisoes?grupo=hoje");
    expect(screen.getByRole("link", { name: "Ver todas" })).toHaveAttribute("href", "/revisoes?grupo=atrasadas");
    expect(screen.queryByText("Proposições")).not.toBeInTheDocument();
    expect(screen.getByText("Hoje · 2")).toBeInTheDocument();
    expect(screen.getByText("Em atraso · 2")).toBeInTheDocument();
  });

  it("não apresenta a lista parcial de revisões como totais por grupo", () => {
    const reviews = [{ disciplina_id: "disc", disciplina_nome: "Direito", topico_id: "top", topico_nome: "Constituição", dias_atraso: 1 }];
    render(<MemoryRouter><UrgentReviewsCard reviews={reviews} total={7} isError={false} onRetry={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText("Mostrando 1 de 7 revisões")).toBeInTheDocument();
    expect(screen.queryByText(/^Em atraso ·/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todas" })).toHaveAttribute("href", "/revisoes?grupo=atrasadas");
  });

  it("preserva a meta mensal e destaca o próximo evento sem perder os links", () => {
    const query = { isError: false, isLoading: false, refetch: vi.fn() };
    const today = dashboardDayISO();
    const later = dashboardDayISO(undefined, new Date(Date.now() + 7 * 86_400_000));
    const data = [
      { id: "past", titulo: "Evento passado", data_vencimento: "2020-01-01", data_fim: later },
      { id: "later", titulo: "Simulado", data_vencimento: later, data_fim: later },
      { id: "now", titulo: "Aula ao vivo", data_vencimento: today, data_fim: later },
      { id: "only", titulo: "Lembrete", data_vencimento: null, data_fim: later },
      { id: "extra", titulo: "Aviso adicional", data_vencimento: null, data_fim: later },
    ];
    render(<MemoryRouter><DashboardComplementary
      summary={{ ...query, data: { horas_hoje: 0, meta_horas: 2, flashcards_para_revisar: 3, streak_dias: 1, taxa_cumprimento_mes: 100, minutos_planejados_mes: 200, minutos_realizados_mes: 325 } }}
      notices={{ ...query, data }}
    /></MemoryRouter>);
    expect(screen.getByText("Meta superada em 2h 5min")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Cumprimento da meta mensal de estudo" })).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByRole("link", { name: "Revisar flashcards" })).toHaveAttribute("href", "/flashcards");
    const notices = within(screen.getByRole("region", { name: "Avisos ativos" }));
    const items = notices.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("Próximo eventoAula ao vivo");
    expect(notices.getByRole("link", { name: "Ver avisos ativos" })).toHaveAttribute("href", "/avisos?status=ativo");
  });

  it("mantém estado vazio, dados em carregamento e nova tentativa independentes", () => {
    const refetch = vi.fn();
    render(<MemoryRouter>
      <UrgentReviewsCard reviews={[]} total={0} isError={false} onRetry={vi.fn()} />
      <DashboardComplementary
        summary={{ data: undefined, isError: false, isLoading: true, refetch }}
        notices={{ data: undefined, isError: true, isLoading: false, refetch }} />
    </MemoryRouter>);
    expect(screen.getByText("Nenhuma revisão urgente no concurso ativo")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando dados do card" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Avisos indisponíveis.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
