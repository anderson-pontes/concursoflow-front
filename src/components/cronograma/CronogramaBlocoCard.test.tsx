import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { CronogramaBlocoCard } from "@/components/cronograma/CronogramaBlocoCard";

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
  it('mostra assuntos reais e permite expandir a lista em vez de exibir apenas a contagem',async()=>{
    render(<MemoryRouter><CronogramaBlocoCard bloco={{...bloco,topico_nome:'2 tópicos',topico_nomes:['Concordância verbal','Regência nominal']}} disciplinaNome="Português" diaLabel="Seg" onEdit={vi.fn()} onDelete={vi.fn()}/></MemoryRouter>);
    expect(screen.getByText('Concordância verbal · +1 assunto')).toBeInTheDocument();
    expect(screen.queryByText('2 tópicos')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Concordância verbal · +1 assunto'));
    expect(screen.getByText('Regência nominal')).toBeVisible();
  });
  it('não trata a data de uma atividade avulsa passada como fim de recorrência',()=>{
    render(<MemoryRouter><CronogramaBlocoCard bloco={{...bloco,vigencia_inicio:'2020-01-01',vigencia_fim:'2020-01-01'}} occurrenceDate="2020-01-01" disciplinaNome="Português" diaLabel="Seg" onEdit={vi.fn()} onDelete={vi.fn()}/></MemoryRouter>);
    expect(screen.queryByText('Recorrência encerrada')).not.toBeInTheDocument();
    expect(screen.getByText('Planejada')).toBeInTheDocument();
  });
  it('explica o fim de uma janela de repetição sem inferir conclusão ou atraso',async()=>{
    render(<MemoryRouter><CronogramaBlocoCard bloco={{...bloco,vigencia_inicio:'2020-01-01',vigencia_fim:'2020-02-01'}} disciplinaNome="Português" diaLabel="Seg" onEdit={vi.fn()} onDelete={vi.fn()}/></MemoryRouter>);
    await userEvent.click(screen.getByText('Recorrência encerrada'));
    expect(screen.getByText(/Isso não indica conclusão nem atraso/)).toBeVisible();
    expect(screen.getByText('Planejada')).toBeInTheDocument();
  });
  it("exibe disciplina, tempo e tipo de atividade sem depender da cor", () => {
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


    expect(screen.getByText(/55 min · 08:00–08:55/)).toBeInTheDocument();
    expect(card).toHaveClass("bg-card", "border-border");
    expect(screen.getByText("Planejada")).toBeInTheDocument();
    expect(screen.getByText("Estudo")).toBeInTheDocument();
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
