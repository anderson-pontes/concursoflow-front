import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  aggregatePlanejadoByDisciplina,
  CalendarioDiaCell,
} from "@/components/calendario/CalendarioDiaCell";
import { getDisciplinaPalette } from "@/components/disciplinas/disciplinaPalettes";
import type { CalendarioDia, PlanejadoItem } from "@/lib/calendario/types";

function item(
  disciplinaId: string,
  disciplinaNome: string,
  duracaoMinutos: number,
  id = `${disciplinaId}-${duracaoMinutos}`,
): PlanejadoItem {
  return {
    fonte: "cronograma_item",
    id,
    disciplina_id: disciplinaId,
    disciplina_nome: disciplinaNome,
    topico_id: null,
    topico_nome: null,
    duracao_minutos: duracaoMinutos,
  };
}

function dia(planejado: PlanejadoItem[]): CalendarioDia {
  return {
    data: "2026-09-22",
    status: "futuro",
    minutos_planejados: planejado.reduce((total, atual) => total + atual.duracao_minutos, 0),
    minutos_realizados: 0,
    minutos_extra: 0,
    sessoes_realizadas: 0,
    planejado,
  };
}

describe("CalendarioDiaCell", () => {
  it("agrupa itens da mesma disciplina e soma suas durações", () => {
    const resultado = aggregatePlanejadoByDisciplina([
      item("portugues", "Língua Portuguesa", 30, "item-1"),
      item("portugues", "Língua Portuguesa", 25, "item-2"),
      item("direito", "Direito Constitucional", 40),
    ]);

    expect(resultado).toEqual([
      { disciplinaId: "portugues", nome: "Língua Portuguesa", duracaoMinutos: 55 },
      { disciplinaId: "direito", nome: "Direito Constitucional", duracaoMinutos: 40 },
    ]);
  });

  it("exibe nome, tempo e uma identidade cromática por disciplina", () => {
    render(
      <CalendarioDiaCell
        dia={dia([item("portugues", "Língua Portuguesa", 55)])}
        diaNumero={22}
        isCurrentMonth
        isToday={false}
      />,
    );

    expect(screen.getByText("Língua Portuguesa")).toBeInTheDocument();
    expect(screen.getByText("55 min")).toBeInTheDocument();
    expect(screen.getByText("Língua Portuguesa").parentElement).toHaveClass(
      "border",
      ...getDisciplinaPalette("portugues").calendarItem.split(" "),
    );
    expect(screen.getByRole("button")).toHaveAccessibleName(
      /Dia 22, 55 min planejados, Língua Portuguesa, 55 min, dia futuro/,
    );
  });

  it("limita os blocos visíveis e informa quantas disciplinas permanecem no detalhe", () => {
    render(
      <CalendarioDiaCell
        dia={dia([
          item("d1", "Português", 30),
          item("d2", "Matemática", 40),
          item("d3", "Informática", 50),
          item("d4", "Direito", 60),
        ])}
        diaNumero={22}
        isCurrentMonth
        isToday={false}
      />,
    );

    expect(screen.getByText("Português")).toBeInTheDocument();
    expect(screen.getByText("Matemática")).toBeInTheDocument();
    expect(screen.getByText("Informática")).toBeInTheDocument();
    expect(screen.queryByText("Direito")).not.toBeInTheDocument();
    expect(screen.getByText("+1 disciplina")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAccessibleName(/Direito, 60 min/);
  });
});
