import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import { CronogramaWeekGrid } from "./CronogramaWeekGrid";
import type { Bloco } from "@/lib/cronograma/types";
import { DIAS } from "@/lib/cronograma/constants";

it("keeps overlapping, short and unknown-time activities in a readable detailed agenda", () => {
  const make=(id:string,start:string,end:string)=>({id,user_id:"user",disciplina_id:id,dia_semana:"seg",hora_inicio:start,hora_fim:end,tipo:"estudo",ativo:true} as Bloco);
  const items=[make("first","08:00","10:00"),make("overlap","09:00","10:00"),make("short","11:00","11:15"),make("legacy","","")];
  const grouped=Object.fromEntries(DIAS.map(day=>[day,day==="seg" ? items : []])) as Record<Bloco["dia_semana"],Bloco[]>;
  render(<MemoryRouter><CronogramaWeekGrid isLoading={false} totalBlocos={4} diaHoje="seg" grouped={grouped} disciplinaNome={id=>`Disciplina ${id}`} deletePending={false} extendPending={false} onEdit={vi.fn()} onRemove={vi.fn()} onExtend={vi.fn()} /></MemoryRouter>);
  expect(screen.getByRole("heading",{name:"Agenda detalhada"})).toBeInTheDocument();
  for (const id of ["first","overlap","short","legacy"]) expect(screen.getAllByRole("article",{name:`Bloco de estudo: Disciplina ${id}`})).toHaveLength(2);
  expect(screen.getAllByText(/Sem horário definido/)).toHaveLength(2);
});
