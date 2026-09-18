import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CatalogFilters } from "@/components/editais/CatalogFilters";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const facets = {
  esferas: [{ chave: "federal", nome: "Federal", count: 12, ativo: true }],
  areas: [{ chave: "juridica", nome: "Jurídica", count: 4, ativo: true }],
  anos: [{ chave: 2026, nome: "2026", count: 8, ativo: true }],
};

describe("CatalogFilters", () => {
  it("mantém rascunho no Sheet até aplicar explicitamente", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<CatalogFilters value={{ esfera: [], area: [], anoEdital: [] }} facets={facets} onApply={onApply} onClear={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(screen.getAllByText("Federal").at(-1)!);
    expect(onApply).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(onApply).toHaveBeenCalledWith({ esfera: ["federal"], area: [], anoEdital: [] });
  });

  it("expõe chips removíveis e limpeza sem depender de cor", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClear = vi.fn();
    render(<CatalogFilters value={{ esfera: ["federal"], area: ["juridica"], anoEdital: [2026] }} facets={facets} onApply={onApply} onClear={onClear} />);

    expect(screen.getByLabelText("3 filtros ativos")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover filtro Jurídica" }));
    expect(onApply).toHaveBeenCalledWith({ esfera: ["federal"], area: [], anoEdital: [2026] });
    await user.click(screen.getAllByRole("button", { name: "Limpar filtros" }).at(-1)!);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
