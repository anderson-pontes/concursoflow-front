import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { CronogramaBlocoCard } from "@/components/cronograma/CronogramaBlocoCard";
import { getDisciplinaPalette } from "@/components/disciplinas/disciplinaPalettes";
import type { Bloco } from "@/lib/cronograma/types";

const bloco: Bloco = {
  id: "bloco-1",
  user_id: "user-1",
  disciplina_id: "direito-constitucional",
  dia_semana: "seg",
  hora_inicio: "08:00",
  hora_fim: "08:55",
  tipo: "estudo",
  ativo: true,
};

describe("CronogramaBlocoCard", () => {
  it("exibe disciplina e tempo com a cor determinística da disciplina", () => {
    render(
      <MemoryRouter>
        <CronogramaBlocoCard
          bloco={bloco}
          disciplinaNome="Direito Constitucional"
          diaLabel="Seg"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>,
    );

    const card = screen.getByText("Direito Constitucional").closest(".group");
    const palette = getDisciplinaPalette(bloco.disciplina_id);

    expect(screen.getByText("08:00–08:55 · 55 min")).toBeInTheDocument();
    expect(card).toHaveClass(...palette.cardBg.split(" "), ...palette.cardBorder.split(" "));
  });
});
