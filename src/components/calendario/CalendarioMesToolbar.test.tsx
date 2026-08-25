import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CalendarioMesToolbar } from "@/components/calendario/CalendarioMesToolbar";

describe("CalendarioMesToolbar", () => {
  it("usa os botões do design system e preserva a navegação mensal", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onToday = vi.fn();

    render(<CalendarioMesToolbar ano={2026} mes={8} onPrev={onPrev} onNext={onNext} onToday={onToday} />);

    const todayButton = screen.getByRole("button", { name: "Hoje" });
    const previousButton = screen.getByRole("button", { name: "Mês anterior" });
    const nextButton = screen.getByRole("button", { name: "Próximo mês" });

    expect(screen.getByRole("group", { name: "Navegação do calendário" })).toBeInTheDocument();
    expect(todayButton).toHaveAttribute("data-slot", "button");
    expect(previousButton).toHaveAttribute("data-size", "icon-lg");
    expect(nextButton).toHaveAttribute("data-size", "icon-lg");

    fireEvent.click(todayButton);
    fireEvent.click(previousButton);
    fireEvent.click(nextButton);

    expect(onToday).toHaveBeenCalledOnce();
    expect(onPrev).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });
});
