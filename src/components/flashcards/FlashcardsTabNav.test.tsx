import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FlashcardsTabNav, type FlashcardsTabItem } from "@/components/flashcards/FlashcardsTabNav";

const tabs: FlashcardsTabItem[] = [
  { id: "baralhos", label: "Meus Baralhos", mobileLabel: "Baralhos", icon: <span aria-hidden>1</span> },
  { id: "revisar", label: "Revisar Hoje", mobileLabel: "Revisar", icon: <span aria-hidden>2</span> },
  { id: "config", label: "Configurações", mobileLabel: "Ajustes", icon: <span aria-hidden>3</span> },
];

describe("FlashcardsTabNav", () => {
  it("mantém nomes acessíveis completos e labels mobile curtos", () => {
    render(<FlashcardsTabNav tabs={tabs} activeTab="baralhos" dueTodayTotal={3} onTabChange={vi.fn()} />);

    expect(screen.getByRole("tab", { name: "Meus Baralhos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Baralhos")).toBeInTheDocument();
    expect(screen.getByText("Ajustes")).toBeInTheDocument();
  });

  it("altera a aba por clique sem perder a semântica de tablist", async () => {
    const onTabChange = vi.fn();
    render(<FlashcardsTabNav tabs={tabs} activeTab="baralhos" dueTodayTotal={0} onTabChange={onTabChange} />);

    await userEvent.click(screen.getByRole("tab", { name: "Revisar Hoje" }));
    expect(onTabChange).toHaveBeenCalledWith("revisar");
    expect(screen.getByRole("tablist", { name: "Seções de flashcards" })).toBeInTheDocument();
  });
});
