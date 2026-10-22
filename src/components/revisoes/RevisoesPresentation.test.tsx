import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import { RevisoesEmpty, RevisoesSummary } from "@/components/revisoes/RevisoesPresentation";
import type { RevisaoGrupo } from "@/types/revisao";

const zero:Record<RevisaoGrupo,number> = {hoje:0,atrasadas:0,proximas:0,concluidas:0,ignoradas:0};
const onNext=vi.fn(),onClear=vi.fn();
function empty(resumo?:Record<RevisaoGrupo,number>,filtered=false,grupo:RevisaoGrupo="hoje") {
  return render(<MemoryRouter><RevisoesEmpty grupo={grupo} filtered={filtered} resumo={resumo} onNext={onNext} onClear={onClear}/></MemoryRouter>);
}
it("oferece próximas revisões apenas quando existem futuras carregadas",()=>{
  empty({...zero,proximas:3});
  fireEvent.click(screen.getByRole("button",{name:"Ver próximas revisões"}));
  expect(onNext).toHaveBeenCalled();
  expect(screen.queryByRole("link",{name:"Ver cronograma"})).not.toBeInTheDocument();
});
it("não sugere futuras ausentes quando há revisões em outros grupos",()=>{
  empty({...zero,concluidas:5});
  expect(screen.getByText("Você não tem revisões programadas para hoje.")).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Ver próximas revisões"})).not.toBeInTheDocument();
  expect(screen.queryByText("Nenhuma revisão disponível neste concurso.")).not.toBeInTheDocument();
});
it("orienta ao Cronograma quando o resumo confirma todos os grupos vazios",()=>{
  empty(zero);
  expect(screen.getByText("Nenhuma revisão disponível neste concurso.")).toBeInTheDocument();
  expect(screen.getByRole("link",{name:"Ver cronograma"})).toHaveAttribute("href","/cronograma");
  expect(screen.queryByRole("button",{name:"Ver próximas revisões"})).not.toBeInTheDocument();
});
it("não conclui ausência global quando os totais são desconhecidos",()=>{
  empty();
  expect(screen.getByText("Você não tem revisões programadas para hoje.")).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("prioriza a limpeza de filtros e mantém o vazio de atrasadas discreto",()=>{
  const {unmount}=empty(zero,true);
  fireEvent.click(screen.getByRole("button",{name:"Limpar filtros"}));expect(onClear).toHaveBeenCalled();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();unmount();
  empty(zero,false,"atrasadas");expect(screen.getByText("Nenhuma revisão atrasada.")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("preserva os valores dos KPIs e remove a explicação fixa",()=>{
  render(<RevisoesSummary resumo={{...zero,hoje:193,concluidas:54}} loading={false}/>);
  expect(screen.getByText("193")).toBeInTheDocument();expect(screen.getByText("54")).toBeInTheDocument();
  expect(screen.queryByText("Indicadores do concurso ativo, considerando os filtros de disciplina e período.")).not.toBeInTheDocument();
});
