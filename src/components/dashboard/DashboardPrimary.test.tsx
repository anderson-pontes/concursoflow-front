import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { DashboardContextHeader, NextActionCard, TodayPlanCard } from "@/components/dashboard/DashboardPrimary";

describe("organismos primários do dashboard", () => {
  it("identifica o concurso com um único h1 e trata data ausente", () => {
    render(<DashboardContextHeader contest={{ nome: "TRT 8ª Região", orgao: "TRT 8", cargo: "Analista", data_prova: null }} daysUntilExam={null} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "TRT 8ª Região" })).toBeInTheDocument();
    expect(screen.getByText("Data da prova ainda não informada")).toBeInTheDocument();
  });

  it("preserva o prefill completo do Pomodoro e um único CTA primário", () => {
    const onStart = vi.fn();
    const onManual = vi.fn();
    render(<MemoryRouter><NextActionCard study={{ disciplina_id: "disc-1", disciplina_nome: "Português", topico_id: "top-1", topico_nome: "Interpretação", data: "2026-09-02", duracao_minutos: 50 }} state="ready" isError={false} onRetry={vi.fn()} onStart={onStart} onManual={onManual} replanUrl="/planos/concurso-1/replanejar" /></MemoryRouter>);

    const start = screen.getByRole("link", { name: /iniciar estudo/i });
    expect(start).toHaveAttribute("href", "/pomodoro?from=dashboard&disciplina_id=disc-1&minutos=50&topico_id=top-1");
    expect(screen.getAllByRole("link").filter((link) => link.className.includes("bg-primary"))).toHaveLength(1);
    fireEvent.click(start);
    expect(onStart).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Registrar manualmente" }));
    expect(onManual).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: /replanejar/i })).toHaveAttribute("href", "/planos/concurso-1/replanejar");
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
});
