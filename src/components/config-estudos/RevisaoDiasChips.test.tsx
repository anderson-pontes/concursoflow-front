import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { RevisaoDiasChips } from "@/components/config-estudos/RevisaoDiasChips";

function StatefulChips({ initial = [1, 7] }: { initial?: number[] }) {
  const [dias, setDias] = useState(initial);
  return <RevisaoDiasChips dias={dias} onChange={setDias} />;
}

describe("RevisaoDiasChips", () => {
  it("adiciona e remove intervalos mantendo a ordem crescente", async () => {
    const user = userEvent.setup();
    render(<StatefulChips />);

    const input = screen.getByRole("spinbutton", { name: "Adicionar intervalo em dias" });
    await user.type(input, "3");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getAllByRole("button", { name: /Remover \d+ dias/ }).map((button) => button.getAttribute("aria-label")))
      .toEqual(["Remover 1 dias", "Remover 3 dias", "Remover 7 dias"]);

    await user.click(screen.getByRole("button", { name: "Remover 3 dias" }));
    expect(screen.queryByRole("button", { name: "Remover 3 dias" })).not.toBeInTheDocument();
  });

  it("informa valores inválidos e duplicados sem alterar a lista", async () => {
    const user = userEvent.setup();
    render(<StatefulChips />);

    const input = screen.getByRole("spinbutton", { name: "Adicionar intervalo em dias" });
    await user.type(input, "0");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(screen.getByText("Informe um número inteiro maior que zero.")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "7");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(screen.getByText("Esse intervalo já está na lista.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Remover \d+ dias/ })).toHaveLength(2);
  });
});
