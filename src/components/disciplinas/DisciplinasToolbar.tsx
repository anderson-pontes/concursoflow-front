import { BookOpen, CheckCheck, BarChart3, LayoutGrid, List, Plus, Search, Table2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { useConcursoContextTransition } from "@/hooks/useConcursoContextTransition";
import type { FilterSeg } from "@/lib/disciplinas/types";
import { api } from "@/services/api";
import { studySurface, type StudyTone } from "@/lib/ui/studySurface";
export type DisciplinasSummary={n:number;emProg:number;noConcurso:number;fora:number;media:number;topicosTotal?:number;topicosConcluidos?:number};
type View="cards"|"list"|"table"|"edital";
type Props={updating?:boolean;search:string;onSearchChange:(value:string)=>void;filterSeg:FilterSeg;onFilterChange:(seg:FilterSeg)=>void;onCreate:()=>void;summary:DisciplinasSummary;concursoId:string;isCreating:boolean;viewMode:View;onViewModeChange:(mode:View)=>void};
export function DisciplinasToolbar({updating=false,search,onSearchChange,filterSeg,onFilterChange,onCreate,summary,concursoId,isCreating,viewMode,onViewModeChange}:Props){
 const transitionConcurso=useConcursoContextTransition();
 const {data:concursos=[]}=useQuery({queryKey:["concursos"],queryFn:async()=>(await api.get('/concursos')).data as Array<{id:string;nome:string;orgao:string;cargo:string|null}>});
 const metrics=[{label:"Total de disciplinas",value:summary.n,sub:"No conjunto filtrado",Icon:BookOpen,tone:"indigo"},{label:"Em andamento",value:summary.emProg,sub:"Iniciadas e não concluídas",Icon:BarChart3,tone:"cyan"},{label:"Tópicos concluídos",value:summary.topicosConcluidos==null?"—":`${summary.topicosConcluidos}/${summary.topicosTotal}`,sub:"Conteúdos dominados",Icon:CheckCheck,tone:"emerald"},{label:"Progresso geral",value:`${summary.media}%`,sub:"Média das disciplinas filtradas",Icon:BookOpen,tone:"violet"}];
 return <div className="space-y-4">
  <header><h1 className="text-2xl font-semibold tracking-tight">Disciplinas &amp; Tópicos</h1><p className="mt-1 text-sm text-muted-foreground">Organize suas disciplinas, acompanhe o progresso e gerencie seu edital.</p></header>
  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Resumo das disciplinas" aria-busy={updating}>{metrics.map(({label,value,sub,Icon,tone})=><div key={label} title={label==="Progresso geral"?"Média simples dos percentuais das disciplinas filtradas, com o mesmo peso por disciplina. Não é o percentual calculado pelo total de tópicos. Disciplinas sem tópicos entram como 0%, conforme a regra atual.":label==="Tópicos concluídos"?"Total de tópicos dominados sobre todos os tópicos do conjunto filtrado, incluindo outras páginas.":undefined} className={`flex min-w-0 flex-col rounded-xl p-3 ${studySurface(tone as StudyTone)}`}><div className="flex items-start justify-between gap-2"><p className="min-h-8 text-xs font-medium leading-relaxed">{label}</p><Icon className="size-4 shrink-0" aria-hidden/></div><strong className="my-2 block text-2xl tabular-nums [overflow-wrap:anywhere]">{value}</strong><p className="mt-auto text-xs leading-relaxed">{sub}</p></div>)}</div>
  <div className="space-y-3 rounded-xl border border-border bg-card p-3 sm:p-4">
   <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
    <label className="relative min-w-0 flex-1"><span className="sr-only">Buscar disciplina</span><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"/><Input type="search" value={search} onChange={e=>onSearchChange(e.target.value)} placeholder="Buscar disciplina..." className="pl-9"/></label>
    {concursos.length>0&&<SelectField aria-label="Concurso ativo" className="w-full min-w-0 lg:w-72" value={concursoId} onValueChange={value=>void transitionConcurso(value||null)} options={[{value:"",label:"Concurso ativo…"},...concursos.map(c=>({value:c.id,label:`${c.orgao} — ${c.cargo??c.nome}`}))]}/>}
    <Button disabled={isCreating} onClick={onCreate}><Plus className="mr-2 size-4"/>Nova disciplina</Button>
   </div>
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div role="group" aria-label="Filtrar por vínculo ao concurso" className="flex max-w-full gap-1 rounded-lg bg-muted p-1">{([{id:"todas",label:"Todas"},{id:"concurso",label:"No concurso"},{id:"fora",label:"Fora"}] as const).map(seg=><Button key={seg.id} size="sm" disabled={!concursoId&&seg.id!=="todas"} aria-pressed={filterSeg===seg.id} variant={filterSeg===seg.id?"default":"ghost"} onClick={()=>onFilterChange(seg.id)}>{seg.label}</Button>)}</div>
    <span className="text-xs text-muted-foreground" aria-live="polite">{updating?"Atualizando resultados...":`${summary.n} ${summary.n===1?"resultado":"resultados"}`}</span>
    <div role="group" aria-label="Modo de visualização" className="flex rounded-lg bg-muted p-1">{([{mode:"cards",label:"Grade",Icon:LayoutGrid},{mode:"list",label:"Lista",Icon:List},{mode:"table",label:"Tabela",Icon:Table2}] as const).map(({mode,label,Icon})=><Button key={mode} size="sm" variant={viewMode===mode?"default":"ghost"} aria-label={`Vista em ${mode==="cards"?"cards":mode==="list"?"lista":"tabela"}`} aria-pressed={viewMode===mode} onClick={()=>onViewModeChange(mode)}><Icon className="mr-1 size-4"/>{label}</Button>)}</div>
   </div>
  </div>
 </div>;
}
