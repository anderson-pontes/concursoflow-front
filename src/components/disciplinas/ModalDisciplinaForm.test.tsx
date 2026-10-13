import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModalDisciplinaForm } from "@/components/disciplinas/ModalDisciplinaForm";
vi.mock("@/services/api", () => ({ api: { get: vi.fn().mockResolvedValue({ data: [] }) } }));
describe("discipline draft", () => {
  it("preserves typing when refetch changes initialValues and confirms discard", async () => {
    const user = userEvent.setup(); const onClose = vi.fn(); const onSubmit = vi.fn();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = (name: string) => <QueryClientProvider client={qc}><ModalDisciplinaForm open mode="edit" initialValues={{ nome: name }} onClose={onClose} onSubmit={onSubmit} /></QueryClientProvider>;
    const view = render(tree("Original"));
    const input = screen.getByLabelText(/Nome/); await user.clear(input); await user.type(input, "Local draft");
    view.rerender(tree("Changed on server")); expect(input).toHaveValue("Local draft");
    await user.click(screen.getByText("Cancelar")); expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByText("Continuar editando")); expect(input).toHaveValue("Local draft");
    await user.click(screen.getByText("Cancelar")); await user.click(screen.getByText("Descartar")); expect(onClose).toHaveBeenCalledOnce();
  });
});
