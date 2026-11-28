import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";

describe("constância com datas e duração reais", () => {
  it("preserva os 112 dias, as faixas de duração, sessões reais e o maior trecho consecutivo", () => {
    render(<HeatmapCard endDate="2026-10-12" scopeLabel="Concurso ativo" data={[
      { date: "2026-06-22", count: 1, minutes: 600 },
      { date: "2026-06-23", count: 1, minutes: 30 },
      { date: "2026-10-07", count: 1, minutes: 120 },
      { date: "2026-10-08", count: 1, minutes: 240 },
      { date: "2026-10-09", count: 4, minutes: 241 },
      { date: "2026-10-11", count: 1, minutes: 0 },
      { date: "2026-10-12", count: 7, minutes: null },
      { date: "2026-10-13", count: 2, minutes: 120 },
    ]} />);
    const map = within(screen.getByRole("group", { name: "Duração registrada por dia" }));
    expect(map.getAllByRole("button")).toHaveLength(112);
    for (const [name, level] of [
      [/23 de junho/, "1"], [/7 de outubro/, "2"], [/8 de outubro/, "3"], [/9 de outubro.*4 sessões/, "4"],
      [/10 de outubro.*Nenhum estudo/, "0"], [/11 de outubro.*1 sessão/, "0"], [/12 de outubro.*duração indisponível/, "unknown"],
    ] as const) expect(map.getByRole("button", { name })).toHaveAttribute("data-level", level);

    expect(screen.getByText("10h 31min")).toBeInTheDocument();
    expect(screen.getByText("3 dias")).toBeInTheDocument();
    expect(screen.getByText("23/06/2026 a 12/10/2026")).toBeInTheDocument();

    const day = map.getByRole("button", { name: /12 de outubro/ });
    expect(day).toHaveAttribute("tabindex", "0");
    fireEvent.click(day);
    expect(day).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Estudo registrado — duração indisponível · 7 sessões/)).toBeVisible();
    fireEvent.keyDown(day, { key: "ArrowUp" });
    expect(map.getByRole("button", { name: /11 de outubro/ })).toHaveFocus();
  });

  it("distingue o singular e tempo indisponível de um total de zero", () => {
    render(<HeatmapCard endDate="2026-10-12" data={[{ date: "2026-10-12", count: 1 }]} />);
    expect(screen.getByText("Dia com estudo")).toBeInTheDocument();
    expect(screen.getByText("1 dia")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sobre o período de constância" }));
    expect(screen.getByText(/não acompanha o filtro de período/)).toBeVisible();
  });

  it("erro não vira zero e oferece nova tentativa", () => {
    const retry = vi.fn();
    render(<HeatmapCard data={[]} isError onRetry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível");
    expect(screen.queryByRole("group", { name: "Duração registrada por dia" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("explica a ausência de estudos e preserva o cabeçalho durante o carregamento", () => {
    const view = render(<HeatmapCard data={[]} endDate="2026-10-12" />);
    expect(screen.getByText(/Nenhum estudo registrado nesta janela/)).toBeInTheDocument();
    expect(screen.getByText("0 min")).toBeInTheDocument();
    view.rerender(<HeatmapCard data={[]} isLoading />);
    expect(screen.getByLabelText("Carregando constância")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Constância de estudos" })).toBeInTheDocument();
  });
});
