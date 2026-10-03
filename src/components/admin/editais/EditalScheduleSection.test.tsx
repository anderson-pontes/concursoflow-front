import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditalScheduleSection, scheduleIssue } from "./EditalScheduleSection";

describe("Cronograma do Edital", () => {
  it("apresenta quatro datas opcionais com os calendários compartilhados", async () => {
    const user = userEvent.setup();
    render(<EditalScheduleSection value={{}} onChange={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Cronograma do Edital" })).toBeVisible();
    for (const name of ["Início das inscrições", "Encerramento das inscrições", "Limite para pagamento", "Data da prova"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
    await user.click(screen.getByRole("button", { name: "Data da prova" }));
    expect(screen.getByRole("combobox", { name: "Selecionar ano" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Selecionar mês" })).toBeVisible();
  });

  it("carrega e permite limpar uma data já salva", async () => {
    const onChange = vi.fn();
    render(<EditalScheduleSection value={{ data_prova: "2026-12-01" }} onChange={onChange} published />);
    expect(screen.getByRole("button", { name: "Data da prova" })).toHaveTextContent("01/12/2026");
    await userEvent.setup().click(screen.getByRole("button", { name: "Limpar data da prova" }));
    expect(onChange).toHaveBeenCalledWith({ data_prova: null });
    expect(screen.getByText(/avisos manuais serão preservados/i)).toBeVisible();
  });

  it("bloqueia datas durante operação e valida inscrições sem exigir outros campos", () => {
    render(<EditalScheduleSection value={{}} onChange={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "Data da prova" })).toBeDisabled();
    expect(scheduleIssue({})).toBeNull();
    expect(scheduleIssue({ data_prova: "2026-12-01" })).toBeNull();
    expect(scheduleIssue({ inicio_inscricoes: "2026-11-02", encerramento_inscricoes: "2026-11-01" })).toMatch(/encerramento/);
  });
});
