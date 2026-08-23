import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HistoricoAgregadoChart } from "@/components/historico/HistoricoAgregadoChart";

describe("HistoricoAgregadoChart", () => {
  it("apresenta o agrupamento como período e resume os dados", () => {
    render(
      <HistoricoAgregadoChart
        agruparPor="dia"
        onAgruparChange={vi.fn()}
        serie={[
          { chave: "2026-08-20", label: "20 ago", minutos: 90, sessoes: 2, questoes: 20, rendimento_pct: 80 },
          { chave: "2026-08-21", label: "21 ago", minutos: 30, sessoes: 1, questoes: 10, rendimento_pct: 70 },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Evolução por período" })).toBeInTheDocument();
    expect(screen.getByLabelText("Selecionar período do gráfico")).toBeInTheDocument();
    expect(screen.getByText("Total estudado")).toBeInTheDocument();
    expect(screen.getByText("Sessões")).toBeInTheDocument();
    expect(screen.getByText(/Gráfico com 2 períodos/)).toBeInTheDocument();
  });

  it("exibe orientação útil quando não há dados", () => {
    render(
      <HistoricoAgregadoChart
        agruparPor="semana"
        onAgruparChange={vi.fn()}
        serie={[]}
      />,
    );

    expect(screen.getByText("Sem dados neste período")).toBeInTheDocument();
    expect(screen.getByText(/Ajuste os filtros ou registre uma sessão/)).toBeInTheDocument();
  });
});
