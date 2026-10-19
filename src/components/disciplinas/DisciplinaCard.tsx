import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { DisciplineActions } from "./DisciplineActions";
import { DisciplineIdentity, DisciplineStatus, DisciplineProgress, disciplineStudyState } from "./DisciplineVisual";
import { fmtPeso, fmtPontos, getDisciplinaPesoEdital, getDisciplinaPrioridade } from "@/lib/disciplinas/pontos";
export type DisciplinaCardModel={id:string;nome:string;sigla:string|null;peso:number|null;total_pontos?:number|null;prioridade_calculada?:number|null;ordem:number;topicos_iniciados?:number|null};
type Props={disciplina:DisciplinaCardModel;stats:{total:number;studied:number;pct:number};inConcurso:boolean;canToggleConcurso:boolean;onToggleConcurso:()=>void;onEdit:()=>void;onConfirmDelete:()=>void|Promise<void>;index?:number;compact?:boolean};
export function DisciplinaCard({disciplina:d,stats,inConcurso,canToggleConcurso,onToggleConcurso,onEdit,onConfirmDelete,compact=false}:Props){
 const state=disciplineStudyState(stats.total,stats.studied,d.topicos_iniciados??stats.studied);
 const context=<>{d.sigla&&<>{d.sigla} · </>}{canToggleConcurso?<span className={!inConcurso?"discipline-link-outside":undefined}>{inConcurso?"No concurso selecionado":"Fora do concurso selecionado"}</span>:"Catálogo de disciplinas"}</>;
 const actions=<DisciplineActions id={d.id} name={d.nome} canToggleConcurso={canToggleConcurso} inConcurso={inConcurso} onToggleConcurso={onToggleConcurso} onEdit={onEdit} onConfirmDelete={onConfirmDelete}/>;
 const metrics=<dl className="discipline-metrics grid grid-cols-3 gap-3 text-xs"><div><dt className="text-muted-foreground" title="Soma peso × (6 − domínio) dos tópicos">Prioridade</dt><dd className="mt-1 font-semibold tabular-nums">{fmtPontos(getDisciplinaPrioridade(d))}</dd></div><div><dt className="text-muted-foreground">Peso</dt><dd className="mt-1 font-semibold tabular-nums">{fmtPeso(getDisciplinaPesoEdital(d))}</dd></div><div><dt className="text-muted-foreground">Tópicos</dt><dd className="mt-1 font-semibold tabular-nums">{stats.studied}/{stats.total}</dd></div></dl>;
 if(compact) return <article data-discipline-card={d.id} data-study-state={state} className="discipline-list-item relative min-w-0 rounded-xl border border-border bg-card px-3 py-3">
   <div className="discipline-list-identity min-w-0"><DisciplineIdentity id={d.id} name={d.nome} context={context} state={state}/></div>
   <div className="discipline-list-status"><DisciplineStatus state={state}/></div>
   <div className="discipline-list-metrics">{metrics}</div>
   <div className="discipline-list-progress"><DisciplineProgress state={state} value={stats.pct}/></div>
   <div className="discipline-list-actions relative z-10">{actions}</div>
   <Link to={`/disciplinas/${d.id}`} aria-label={`Ver detalhes de ${d.nome}`} className="discipline-list-details relative z-10 inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight className="size-4"/></Link>
 </article>;
 return <article data-discipline-card={d.id} data-study-state={state} className="discipline-catalog-card relative flex h-full min-w-0 flex-col gap-3 rounded-xl border p-3 sm:p-4">
   <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><DisciplineIdentity id={d.id} name={d.nome} context={context} state={state}/></div><div className="relative z-10 shrink-0">{actions}</div></div>
   <DisciplineStatus state={state}/>
   {metrics}
   <div className="mt-auto border-t border-border/60 pt-3"><DisciplineProgress state={state} value={stats.pct}/><Link to={`/disciplinas/${d.id}`} className="discipline-card-details mt-1 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary hover:underline after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring">Ver detalhes<ArrowUpRight className="size-3.5"/></Link></div>
 </article>;
}
