import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TopicosModal } from "@/components/disciplinas/TopicosModal";
describe("bulk topic draft", () => {
  it("preserves text after failed saving and requires confirmation before discard", async () => {
    const user = userEvent.setup(); const onClose = vi.fn();
    const onSave = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    render(<TopicosModal open onClose={onClose} onSave={onSave} />);
    const input = screen.getByLabelText("CONTEÚDO"); await user.type(input, "Atos administrativos{Enter}Licitações");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Seu conteúdo foi preservado");
    expect(input).toHaveValue("Atos administrativos\nLicitações");
    expect(onSave).toHaveBeenCalledWith(["Atos administrativos", "Licitações"]);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(input).toHaveValue("Atos administrativos\nLicitações");
  });
});
