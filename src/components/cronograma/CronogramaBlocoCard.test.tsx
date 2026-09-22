import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    const card = screen.getByRole("article", {
      name: "Bloco de estudo: Direito Constitucional",
    });
    const palette = getDisciplinaPalette(bloco.disciplina_id);

    expect(screen.getByText("08:00–08:55 · 55 min")).toBeInTheDocument();
    expect(card).toHaveClass(...palette.cardBg.split(" "), ...palette.cardBorder.split(" "));
  });

  it("mantém as ações secundárias acessíveis em um menu compacto", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <MemoryRouter>
        <CronogramaBlocoCard
          bloco={bloco}
          disciplinaNome="Direito Constitucional"
          diaLabel="Seg"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Play Pomodoro Seg" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Mais ações de Direito Constitucional" }));

    expect(screen.getByRole("menuitem", { name: "Abrir disciplina" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Editar bloco" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Remover bloco" })).toBeVisible();

    await user.click(screen.getByRole("menuitem", { name: "Editar bloco" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
