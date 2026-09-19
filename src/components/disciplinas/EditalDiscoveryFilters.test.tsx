import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  EditalDiscoveryFilters,
  type EditalAppliedFilters,
} from "@/components/disciplinas/EditalDiscoveryFilters";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const emptyFilters: EditalAppliedFilters = {
  disciplineIds: [],
  status: "todos",
  domain: "todos",
  neverStudied: false,
  overdue: false,
  sort: "ordem_edital",
};

describe("EditalDiscoveryFilters", () => {
  it("mantem os filtros do Sheet como rascunho ate a aplicacao explicita", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(
      <EditalDiscoveryFilters
        disciplines={[{ id: "direito", nome: "Direito" }]}
        value={emptyFilters}
        appliedSearch=""
        onApply={onApply}
        onRemoveSearch={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(screen.getByText("Direito"));
    expect(onApply).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onApply).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(screen.getByText("Direito"));
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(onApply).toHaveBeenCalledWith({ ...emptyFilters, disciplineIds: ["direito"] });
  });

  it("oferece chips removiveis e limpeza sem depender de cor", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClear = vi.fn();
    render(
      <EditalDiscoveryFilters
        disciplines={[{ id: "direito", nome: "Direito" }]}
        value={{ ...emptyFilters, disciplineIds: ["direito"], overdue: true }}
        appliedSearch="constitucional"
        onApply={onApply}
        onRemoveSearch={vi.fn()}
        onClear={onClear}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remover filtro Direito" }));
    expect(onApply).toHaveBeenCalledWith({ ...emptyFilters, disciplineIds: [], overdue: true });
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
