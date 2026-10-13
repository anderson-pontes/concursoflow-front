import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DistribuicaoDialog } from "@/components/cronograma/DistribuicaoDialog";
import type { Bloco, Planejamento } from "@/lib/cronograma/types";
vi.mock("@/services/api", () => ({ api: { get: vi.fn(async () => ({ data: [] })) } }));
const plano: Planejamento = { id: "plan", user_id: "user", concurso_id: "contest", nome: "Plano", tipo: "manual", data_inicio: "2026-10-09", data_fim: null, dias_disponiveis: ["seg"], cargo: null, ativo: true, disciplinas: [{ disciplina_id: "a", nome: "Direito", ordem: 0 }, { disciplina_id: "b", nome: "Português", ordem: 1 }, { disciplina_id: "c", nome: "Informática", ordem: 2 }] };
function setup(blocos: Bloco[] = []) {
  const save = vi.fn();
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><DistribuicaoDialog open onClose={vi.fn()} onSave={save} plano={plano} initialIds={["a", "b", "c"]} blocos={blocos} isSaving={false} /></QueryClientProvider>);
  return save;
}
describe("distribuição em lote", () => {
  it("prévia distribui três disciplinas em sequência e envia uma única operação", async () => {
    const save = setup();
    expect(screen.getByText("Seg · 08:00–09:00 · Direito")).toBeInTheDocument();
    expect(screen.getByText("Seg · 09:00–10:00 · Português")).toBeInTheDocument();
    expect(screen.getByText("Seg · 10:00–11:00 · Informática")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Salvar distribuição" }));
    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ disciplina_ids: ["a", "b", "c"], dias_semana: ["seg"], duracao_minutos: 60, sessoes_por_semana: 1 }));
  });
  it("bloqueia lote conflitante sem alterar os horários existentes", () => {
    const save = setup([{ id: "block", user_id: "user", disciplina_id: "a", dia_semana: "seg", hora_inicio: "08:30", hora_fim: "09:30", ativo: true, tipo: "estudo" }]);
    expect(screen.getByRole("alert")).toHaveTextContent("conflito");
    expect(screen.getByRole("button", { name: "Salvar distribuição" })).toBeDisabled();
    expect(save).not.toHaveBeenCalled();
  });
});
