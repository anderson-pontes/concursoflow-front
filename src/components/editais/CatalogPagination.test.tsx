import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CatalogPagination } from "@/components/editais/CatalogPagination";

describe("CatalogPagination", () => {
  it("navega entre páginas respeitando os limites", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(
      <CatalogPagination page={2} totalPages={3} total={25} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);

    rerender(<CatalogPagination page={3} totalPages={3} total={25} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("aceita rótulo contextual e mantém a navegação acessível", () => {
    render(
      <CatalogPagination
        page={1}
        totalPages={2}
        total={12}
        itemLabel="disciplina"
        ariaLabel="Paginação de disciplinas"
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Paginação de disciplinas" })).toBeInTheDocument();
    expect(screen.getByText(/12 disciplinas/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
  });
});
