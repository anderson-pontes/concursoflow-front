import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AtividadeDialog } from "@/components/cronograma/AtividadeDialog";
import type { Bloco } from "@/lib/cronograma/types";
vi.mock("@/services/api", () => ({ api: { get: vi.fn(async () => ({ data: [] })) } }));
const bloco: Bloco = { id: "bloco", user_id: "user", disciplina_id: "direito", dia_semana: "sex", hora_inicio: "10:00", hora_fim: "11:00", tipo: "estudo", ativo: true };
describe("edição de atividade recorrente", () => {
  it.each([["Somente esta ocorrência", "one"], ["Esta e as próximas ocorrências", "future"], ["Toda a série", "all"]])("envia escopo %s com a data, preservando os vínculos", async (name, scope) => {
    const save = vi.fn();
    render(<QueryClientProvider client={new QueryClient()}><AtividadeDialog open onClose={vi.fn()} onSave={save} disciplinas={[{ id: "direito", nome: "Direito" }]} bloco={bloco} initialDate="2026-10-09" isSaving={false} /></QueryClientProvider>);
    expect(screen.getByRole("button", { name: "Data da ocorrência" })).toHaveTextContent("09/10/2026");
    await userEvent.click(screen.getByRole("radio", { name }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ scope, data: "2026-10-09", form: expect.objectContaining({ disciplina_id: "direito", hora_inicio: "10:00", hora_fim: "11:00" }) }));
  });
});
