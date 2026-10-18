import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import userEvent from '@testing-library/user-event';
import { CronogramaWeekGrid } from "./CronogramaWeekGrid";
import type { Bloco } from "@/lib/cronograma/types";
import { DIAS } from "@/lib/cronograma/constants";

it("keeps overlapping, short and unknown-time activities in a readable detailed agenda", () => {
  const make=(id:string,start:string,end:string)=>({id,user_id:"user",disciplina_id:id,dia_semana:"seg",hora_inicio:start,hora_fim:end,tipo:"estudo",ativo:true} as Bloco);
  const items=[make("first","08:00","10:00"),make("overlap","09:00","10:00"),make("short","11:00","11:15"),make("legacy","","")];
  const grouped=Object.fromEntries(DIAS.map(day=>[day,day==="seg" ? items : []])) as Record<Bloco["dia_semana"],Bloco[]>;
  render(<MemoryRouter><CronogramaWeekGrid isLoading={false} totalBlocos={4} diaHoje="seg" grouped={grouped} disciplinaNome={id=>`Disciplina ${id}`} deletePending={false} extendPending={false} onEdit={vi.fn()} onRemove={vi.fn()} onExtend={vi.fn()} /></MemoryRouter>);
  expect(screen.getByRole("heading",{name:"Agenda da semana"})).toBeInTheDocument();
  for (const id of ["first","overlap","short","legacy"]) expect(screen.getAllByRole("article",{name:`Bloco de estudo: Disciplina ${id}`})).toHaveLength(1);
  expect(screen.getAllByText(/Sem horário/)).toHaveLength(1);
});

it('seleciona um dia vazio, adiciona nele e retorna à semana sem perder atividades', async()=>{
  const item={id:'first',user_id:'user',disciplina_id:'d',dia_semana:'seg',hora_inicio:'08:00',hora_fim:'09:00',tipo:'estudo',ativo:true} as Bloco;
  const grouped=Object.fromEntries(DIAS.map(day=>[day,day==='seg'?[item]:[]])) as Record<Bloco['dia_semana'],Bloco[]>;
  const onAdd=vi.fn();
  render(<MemoryRouter><CronogramaWeekGrid isLoading={false} totalBlocos={1} diaHoje="seg" grouped={grouped} disciplinaNome={()=>'Direito'} deletePending={false} extendPending={false} onEdit={vi.fn()} onRemove={vi.fn()} onExtend={vi.fn()} onAdd={onAdd}/></MemoryRouter>);
  const user=userEvent.setup();
  await user.click(screen.getByRole('button',{name:'Terça, 0 atividades, 0 min'}));
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  expect(screen.getByText('Sem atividades neste dia.')).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Adicionar atividade Ter'}));
  expect(onAdd).toHaveBeenCalledWith('ter');
  await user.click(screen.getByRole('button',{name:'Mostrar todos os dias'}));
  expect(screen.getByRole('article',{name:'Bloco de estudo: Direito'})).toBeInTheDocument();
});
