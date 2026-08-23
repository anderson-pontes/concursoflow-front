import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TimePicker } from "@/components/ui/time-picker";

describe("TimePicker", () => {
  it("expõe hora e minutos como selects acessíveis do design system", () => {
    render(<TimePicker value="08:30" onValueChange={vi.fn()} aria-label="Início" />);

    expect(screen.getByRole("group", { name: "Início" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Início: hora" })).toHaveTextContent("08");
    expect(screen.getByRole("combobox", { name: "Início: minutos" })).toHaveTextContent("30");
  });

  it("propaga o estado desabilitado para os dois controles", () => {
    render(<TimePicker value="09:15" onValueChange={vi.fn()} disabled aria-label="Fim" />);

    expect(screen.getByRole("combobox", { name: "Fim: hora" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Fim: minutos" })).toBeDisabled();
  });
});
