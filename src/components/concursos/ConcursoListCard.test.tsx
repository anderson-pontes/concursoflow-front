import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConcursoListCard } from "@/components/concursos/ConcursoListCard";
import type { Concurso } from "@/lib/concursos/types";
const concurso: Concurso = { id: "concurso", user_id: "user", nome: "Receita", orgao: "RFB", cargo: "Auditor Fiscal e Controle de Finanças Públicas", banca: null, status: "ativo", logo_url: null, edital_url: "/uploads/edital.pdf", data_prova: "2027-01-17", created_at: "2026-10-19" };
function setup(questoesTotal: number | null = null, acertoMedioPct: number | null = null) {
 const onEdit=vi.fn(),onViewDetails=vi.fn(),onConfirmDelete=vi.fn();
 render(<ConcursoListCard concurso={concurso} cardTotals={{disciplinasCount:3,questoesTotal,acertoMedioPct}} deletePending={false} onEdit={onEdit} onViewDetails={onViewDetails} onConfirmDelete={onConfirmDelete}/>);
 return {onEdit,onViewDetails,onConfirmDelete};
}
describe("card de concurso", () => {
 it("preserva identificação completa, links e ação principal sem inventar percentuais", async () => {
  const {onViewDetails}=setup();
  expect(screen.getByRole("heading",{name:concurso.cargo!})).toBeVisible();
  expect(screen.getByText("Banca não informada")).toBeVisible();
  expect(screen.queryByText("0%")).not.toBeInTheDocument();
  expect(screen.getAllByText("Sem dados")).toHaveLength(2);
  expect(screen.queryByText("Nos detalhes")).not.toBeInTheDocument();
  expect(screen.getByRole("link",{name:"Ver edital"})).toHaveAttribute("href",expect.stringContaining("/uploads/edital.pdf"));
  await userEvent.click(screen.getByRole("button",{name:"Ver detalhes"}));expect(onViewDetails).toHaveBeenCalledOnce();
 });
 it("diferencia ausência de questões de zero acertos com questões respondidas", () => {
  setup(0,0);expect(screen.getByText("Sem questões")).toBeVisible();expect(screen.queryByText("0%")).not.toBeInTheDocument();
 });
 it("apresenta zero acertos quando há questões respondidas", () => {
  setup(10,0);expect(screen.getByText("0%")).toBeVisible();
 });
 it("preserva edição e exige confirmação explícita para excluir", async () => {
  const {onEdit,onConfirmDelete}=setup();
  const menu=()=>userEvent.click(screen.getByRole("button",{name:/Ações do concurso/}));
  await menu();await userEvent.click(screen.getByRole("menuitem",{name:"Editar concurso"}));expect(onEdit).toHaveBeenCalledOnce();
  await menu();await userEvent.click(screen.getByRole("menuitem",{name:"Excluir concurso"}));
  expect(onConfirmDelete).not.toHaveBeenCalled();
  await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button",{name:"Cancelar"}));expect(onConfirmDelete).not.toHaveBeenCalled();
  await menu();await userEvent.click(screen.getByRole("menuitem",{name:"Excluir concurso"}));
  await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button",{name:"Excluir concurso"}));expect(onConfirmDelete).toHaveBeenCalledOnce();
 });
});
