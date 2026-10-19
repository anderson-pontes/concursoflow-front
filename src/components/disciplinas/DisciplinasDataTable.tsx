import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { SelectField } from "@/components/ui/select-field";
import { DisciplinaCard } from "./DisciplinaCard";
import { DisciplineActions } from "./DisciplineActions";
import { DisciplineIdentity, DisciplineProgress, DisciplineStatus, disciplineStudyState } from "./DisciplineVisual";
import { getTopicosProgressFromCounts } from "./disciplinaProgress";
import { fmtPontos, fmtPeso } from "@/lib/disciplinas/pontos";
import type { Disciplina } from "@/lib/disciplinas/types";
export type DisciplinasDataTableProps={disciplinas:Disciplina[];concursoId:string;onEdit:(d:Disciplina)=>void;onToggleConcurso:(d:Disciplina)=>void;onConfirmDelete:(d:Disciplina)=>Promise<void>};
const stats=(d:Disciplina)=>getTopicosProgressFromCounts(d.topicos_total??0,d.topicos_estudados??0);
const state=(d:Disciplina)=>disciplineStudyState(d.topicos_total??0,d.topicos_estudados??0,d.topicos_iniciados??d.topicos_estudados??0);
export function DisciplinasDataTable({disciplinas,concursoId,onEdit,onToggleConcurso,onConfirmDelete}:DisciplinasDataTableProps){
 const [mobileSort,setMobileSort]=React.useState("nome");
 const sorted=[...disciplinas].sort((a,b)=>mobileSort==="nome"?a.nome.localeCompare(b.nome,"pt-BR"):mobileSort==="prioridade"?(b.prioridade_calculada??0)-(a.prioridade_calculada??0):stats(b).pct-stats(a).pct);
 const columns=React.useMemo<ColumnDef<Disciplina>[]>(()=>[
  {id:"nome",accessorKey:"nome",header:"Disciplina",cell:({row})=><DisciplineIdentity id={row.original.id} name={row.original.nome} state={state(row.original)} context={row.original.concurso_ids.includes(concursoId)?"Vinculada ao concurso selecionado":<span className="discipline-link-outside">Fora do concurso selecionado</span>}/>},
  {id:"prioridade",accessorFn:d=>d.prioridade_calculada??0,header:"Prioridade",cell:({row})=><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary" title="Soma peso × (6 − domínio) dos tópicos">{fmtPontos(row.original.prioridade_calculada)}</span>},
  {id:"peso",accessorFn:d=>d.total_pontos??d.peso??0,header:"Peso edital",cell:({row})=><span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">{fmtPeso(row.original.total_pontos??row.original.peso)}</span>},
  {id:"topicos",accessorFn:d=>d.topicos_estudados??0,header:"Tópicos",cell:({row})=><span className="tabular-nums"><strong className={(row.original.topicos_estudados??0)>0?"text-success-text":"text-muted-foreground"}>{row.original.topicos_estudados??0}</strong>/{row.original.topicos_total??0}</span>},
  {id:"progresso",accessorFn:d=>stats(d).pct,header:"Progresso",cell:({row})=><DisciplineProgress value={stats(row.original).pct} state={state(row.original)}/>},
  {id:"status",accessorFn:d=>state(d),header:"Situação",cell:({row})=><DisciplineStatus state={state(row.original)}/>},
  {id:"acoes",header:"Ações",enableSorting:false,cell:({row})=><DisciplineActions id={row.original.id} name={row.original.nome} canToggleConcurso={Boolean(concursoId)} inConcurso={row.original.concurso_ids.includes(concursoId)} onToggleConcurso={()=>onToggleConcurso(row.original)} onEdit={()=>onEdit(row.original)} onConfirmDelete={()=>onConfirmDelete(row.original)}/>},
 ],[concursoId,onEdit,onToggleConcurso,onConfirmDelete]);
 return <><div className="hidden lg:block"><DataTable className="discipline-table" hideSearch data={disciplinas} columns={columns} emptyMessage="Nenhuma disciplina neste filtro."/></div><div className="space-y-3 lg:hidden"><SelectField aria-label="Ordenar disciplinas nesta página" value={mobileSort} onValueChange={setMobileSort} options={[{value:"nome",label:"Nome: A–Z"},{value:"prioridade",label:"Maior prioridade"},{value:"progresso",label:"Maior progresso"}]}/>{sorted.map(d=><DisciplinaCard key={d.id} disciplina={d} stats={stats(d)} compact canToggleConcurso={Boolean(concursoId)} inConcurso={d.concurso_ids.includes(concursoId)} onToggleConcurso={()=>onToggleConcurso(d)} onEdit={()=>onEdit(d)} onConfirmDelete={()=>onConfirmDelete(d)}/>)}</div></>;
}
