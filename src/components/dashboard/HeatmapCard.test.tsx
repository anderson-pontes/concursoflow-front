import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";

describe("constância com datas e duração reais", () => {
  it("preenche datas ausentes com zero registrado sem deslocar dias nem usar count como minutos", () => {
    render(<HeatmapCard endDate="2026-10-12" scopeLabel="Concurso ativo" data={[{ date: "2026-10-09", count: 4, minutes: 150 }, { date: "2026-10-11", count: 1, minutes: 0 }, { date: "2026-10-12", count: 7 }]} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/150 minutos registrados/);
    expect(screen.getByTitle("09/10/2026: 2h 30min")).toHaveClass("bg-primary-600");
    expect(screen.getByTitle("10/10/2026: 0 min")).toHaveClass("bg-muted");
    expect(screen.getByTitle("12/10/2026: Tempo indisponível")).toBeInTheDocument();
    expect(screen.getByText(/não acompanha o filtro de período/)).toHaveTextContent("Concurso ativo");
    expect(document.querySelectorAll('[title]')).toHaveLength(112);
    expect(screen.getByText("23/06/2026")).toBeInTheDocument();
    expect(screen.queryByTitle(/empty-/)).not.toBeInTheDocument();
  });
  it("erro não vira zero e oferece nova tentativa", () => {
    const retry = vi.fn();
    render(<HeatmapCard data={[]} isError onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(retry).toHaveBeenCalledOnce();
  });
  it("vazio explica ausência de estudos, loading usa skeleton e card não estica", () => {
    const view = render(<HeatmapCard data={[]} endDate="2026-10-12" />);
    expect(screen.getByText(/Nenhum estudo registrado nesta janela/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Constância de estudos" }).closest("section")).toHaveClass("self-start");
    view.rerender(<HeatmapCard data={[]} isLoading />);
    expect(screen.getByLabelText("Carregando constância")).toHaveAttribute("data-slot", "skeleton");
  });
});
