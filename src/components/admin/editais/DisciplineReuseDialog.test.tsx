import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DisciplineReuseDialog } from "@/components/admin/editais/DisciplineReuseDialog";
import { CargoContentEditor } from "@/components/admin/editais/CargoContentEditor";
import type { EditalCargoCatalogo } from "@/types/editaisCatalogo";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
beforeAll(() => {
  HTMLElement.prototype.scrollIntoView ??= vi.fn();
  HTMLElement.prototype.hasPointerCapture ??= () => false;
  HTMLElement.prototype.releasePointerCapture ??= vi.fn();
});
const source: EditalCargoCatalogo = { id: "a", nome: "Analista", ordem: 1, disciplinas: [
  { id: "p", nome: "Português", sigla: null, ordem: 1, topicos: [{ id: "t", descricao: "Interpretação", ordem: 1, peso: 1 }] },
  { id: "d", nome: "Direito", sigla: null, ordem: 2, topicos: [] },
] };
const target: EditalCargoCatalogo = { id: "b", nome: "Técnico", ordem: 2, disciplinas: [] };

async function choose(label: string, option: string) {
  fireEvent.keyDown(screen.getByRole("combobox", { name: label }), { key: "ArrowDown" });
  await userEvent.click(await screen.findByRole("option", { name: option }));
}
async function open(cargo = target, sources = [source, cargo]) {
  const onChange = vi.fn();
  render(<DisciplineReuseDialog cargo={cargo} sourceCargos={sources} editable onChange={onChange} />);
  await userEvent.click(screen.getByRole("button", { name: "Adicionar matérias de outro cargo" }));
  await choose("Cargo de origem", "Analista");
  return onChange;
}

describe("DisciplineReuseDialog", () => {
  it("não pré-seleciona e adiciona apenas a matéria escolhida com conteúdo", async () => {
    const onChange = await open();
    expect(screen.getByRole("button", { name: "Adicionar selecionadas" })).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: "Português" }));
    await userEvent.click(screen.getByRole("button", { name: "Adicionar selecionadas" }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].disciplinas).toHaveLength(1);
    expect(onChange.mock.calls[0][0].disciplinas[0].topicos[0].descricao).toBe("Interpretação");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("seleciona/desmarca todas e permite copiar somente matérias", async () => {
    const onChange = await open();
    await userEvent.click(screen.getByRole("button", { name: "Selecionar todas" }));
    expect(screen.getAllByRole("checkbox").every((item) => item.getAttribute("data-state") === "checked")).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Desmarcar todas" }));
    expect(screen.getByRole("button", { name: "Adicionar selecionadas" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Selecionar todas" }));
    await choose("O que copiar?", "Somente matérias");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar selecionadas" }));
    expect(onChange.mock.calls[0][0].disciplinas.map((item: { topicos: unknown[] }) => item.topicos)).toEqual([[], []]);
  });
  it("explica duplicatas, mantendo as demais elegíveis", async () => {
    const onChange = await open({ ...target, disciplinas: [{ ...source.disciplinas[0], id: "existing" }] });
    expect(screen.getByText("Português já está adicionada a este cargo.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Português" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Selecionar todas" }));
    await userEvent.click(screen.getByRole("button", { name: "Adicionar selecionadas" }));
    expect(onChange.mock.calls[0][0].disciplinas.map((item: { nome: string }) => item.nome)).toEqual(["Português", "Direito"]);
  });
  it("cancelar não altera o rascunho e reabrir limpa a seleção", async () => {
    const onChange = await open();
    await userEvent.click(screen.getByRole("checkbox", { name: "Português" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Adicionar matérias de outro cargo" }));
    expect(screen.getByRole("button", { name: "Adicionar selecionadas" })).toBeDisabled();
    expect(screen.getByText("Escolha um cargo para visualizar suas matérias.")).toBeInTheDocument();
  });
  it("trocar de origem limpa a seleção e informa origem vazia", async () => {
    await open(target, [source, target, { id: "c", nome: "Auditor", ordem: 3, disciplinas: [] }]);
    await userEvent.click(screen.getByRole("checkbox", { name: "Português" }));
    await choose("Cargo de origem", "Auditor");
    expect(screen.getByText("Este cargo ainda não possui matérias cadastradas.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar selecionadas" })).toBeDisabled();
  });
  it("oferece orientação sem outro cargo e esconde a ação somente leitura", () => {
    const view = render(<DisciplineReuseDialog cargo={target} sourceCargos={[target]} editable onChange={vi.fn()} />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("Cadastre outro cargo neste concurso para reutilizar suas matérias.")).toBeInTheDocument();
    view.rerender(<DisciplineReuseDialog cargo={target} sourceCargos={[source, target]} editable={false} onChange={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("mantém criação manual e exibe imediatamente a cópia no editor", async () => {
    function Editor() {
      const [cargo, setCargo] = React.useState(target);
      return <CargoContentEditor cargo={cargo} sourceCargos={[source, cargo]} disciplineSuggestions={[]} editable allowRemove={false} onChange={setCargo} onRemove={vi.fn()} requestConfirmation={vi.fn()} />;
    }
    render(<Editor />);
    await userEvent.click(screen.getByRole("button", { name: "Adicionar disciplina" }));
    await userEvent.type(screen.getByPlaceholderText("Ex.: Direito Administrativo"), "Matemática");
    await userEvent.click(screen.getByRole("button", { name: /^Adicionar$/ }));
    expect(screen.getByRole("button", { name: /Matemática.*0 tópicos/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Adicionar matérias de outro cargo" }));
    await choose("Cargo de origem", "Analista");
    await userEvent.click(screen.getByRole("checkbox", { name: "Português" }));
    await userEvent.click(screen.getByRole("button", { name: "Adicionar selecionadas" }));
    expect(screen.getByRole("button", { name: /Português.*1 tópicos/ })).toBeInTheDocument();
  });
});
