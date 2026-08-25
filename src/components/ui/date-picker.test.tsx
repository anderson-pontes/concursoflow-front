import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DatePicker } from "@/components/ui/date-picker";

describe("DatePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 24, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("oferece seleção direta de mês e ano para datas de nascimento", () => {
    render(
      <DatePicker
        value=""
        onValueChange={vi.fn()}
        aria-label="Data de nascimento"
        min="1906-08-24"
        max="2026-08-24"
        defaultMonth="2008-08-24"
        showMonthYearSelectors
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Data de nascimento" }));

    expect(screen.getByRole("combobox", { name: "Selecionar mês" })).toHaveTextContent("agosto");
    expect(screen.getByRole("combobox", { name: "Selecionar ano" })).toHaveTextContent("2008");
    expect(document.querySelector("select")).not.toBeInTheDocument();
  });

  it("mantém o calendário simples como comportamento padrão", () => {
    render(<DatePicker value="" onValueChange={vi.fn()} aria-label="Data da prova" />);

    fireEvent.click(screen.getByRole("button", { name: "Data da prova" }));

    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
  });
});
