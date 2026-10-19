import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DisciplinaCard } from "./DisciplinaCard";
import { disciplineStudyState, DisciplineProgress } from "./DisciplineVisual";
const disciplina={id:"d",nome:"Português"+"SemEspaços".repeat(30),sigla:"TRT",peso:22,ordem:0,prioridade_calculada:110,topicos_iniciados:1};
function setup(){const handlers={onEdit:vi.fn(),onToggleConcurso:vi.fn(),onConfirmDelete:vi.fn()};render(<MemoryRouter><DisciplinaCard disciplina={disciplina} stats={{total:22,studied:0,pct:0}} canToggleConcurso inConcurso={false} {...handlers}/></MemoryRouter>);return {user:userEvent.setup(),...handlers};}
describe("apresentação compartilhada das disciplinas",()=>{
 it("distingue início real de conclusão e ausência de tópicos",()=>{
  expect(disciplineStudyState(22,0,0)).toBe("new");expect(disciplineStudyState(22,0,1)).toBe("studying");expect(disciplineStudyState(22,22,22)).toBe("completed");expect(disciplineStudyState(0,0,0)).toBe("new");
 });
 it("separa andamento do vínculo e mantém nome e valores completos",()=>{
  setup();expect(screen.getByRole("link",{name:disciplina.nome})).toHaveAttribute("href","/disciplinas/d");expect(screen.getByText("Em andamento")).toBeInTheDocument();expect(screen.getByText("Fora do concurso selecionado")).toBeInTheDocument();expect(screen.getByText("110")).toBeInTheDocument();expect(screen.getByText("0/22")).toBeInTheDocument();expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow","0");
 });
 it("mantém edição e vínculo no menu com teclado",async()=>{
  const {user,onEdit,onToggleConcurso}=setup();await user.click(screen.getByRole("button",{name:/Ações da disciplina/}));await user.click(screen.getByRole("menuitem",{name:"Editar disciplina"}));expect(onEdit).toHaveBeenCalledOnce();await user.click(screen.getByRole("button",{name:/Ações da disciplina/}));await user.click(screen.getByRole("menuitem",{name:"Incluir no concurso"}));expect(onToggleConcurso).toHaveBeenCalledOnce();
 });
 it("exige confirmação antes de excluir",async()=>{
  const {user,onConfirmDelete}=setup();await user.click(screen.getByRole("button",{name:/Ações da disciplina/}));await user.click(screen.getByRole("menuitem",{name:"Excluir disciplina"}));expect(onConfirmDelete).not.toHaveBeenCalled();await user.click(within(screen.getByRole("alertdialog")).getByRole("button",{name:"Excluir disciplina"}));expect(onConfirmDelete).toHaveBeenCalledOnce();
 });
 it("preserva percentual acima da meta, limitando apenas a geometria",()=>{
  render(<DisciplineProgress value={125} label="Execução da carga semanal" state="studying"/>);expect(screen.getByText("125%")).toBeInTheDocument();expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow","100");
 });
});
