import { ArrowDown, ArrowUp, BookOpen, CalendarClock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DisciplineIdentity, DisciplineProgress } from "@/components/disciplinas/DisciplineVisual";
import { diaAbrev } from "@/lib/cronograma/constants";
import type { Bloco, Planejamento, PlanejamentoResumo } from "@/lib/cronograma/types";

export function formatStudyMinutes(value: number) {
  const minutes = Math.max(0, Math.round(value));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ""}` : `${minutes} min`;
}

export function PlanejamentoDisciplinas({ plano, resumo, blocos, filter, onFilter, onConfigure, onEdit, onActivity, onRemove, onOrder, pending }: { plano: Planejamento; resumo?: PlanejamentoResumo; blocos: Bloco[]; filter: string; onFilter: (id: string) => void; onConfigure: (ids: string[]) => void; onEdit: (bloco: Bloco) => void; onActivity: (id: string) => void; onRemove: (id: string) => void; onOrder: (ids: string[]) => void; pending: boolean }) {
  function move(index: number, direction: number) {
    const ids = plano.disciplinas.map(d => d.disciplina_id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    onOrder(ids);
  }
  return <div className="space-y-4"><div className="flex flex-wrap gap-2"><Button onClick={() => onConfigure(plano.disciplinas.map(d => d.disciplina_id))} disabled={!plano.disciplinas.length}><CalendarClock />Configuração rápida</Button>{filter && <Button variant="outline" onClick={() => onFilter("")}>Mostrar todas</Button>}</div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plano.disciplinas.map((d, index) => {
    if (filter && filter !== d.disciplina_id) return null;
    const metrics = resumo?.disciplinas.find(r => r.disciplina_id === d.disciplina_id);
    const activities = blocos.filter(b => b.disciplina_id === d.disciplina_id && b.ativo);
    return <article key={d.disciplina_id} data-study-state={metrics?.minutos_estudados?"studying":"new"} className="discipline-catalog-card min-w-0 space-y-4 rounded-xl border p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><DisciplineIdentity id={d.disciplina_id} name={d.nome} state={metrics?.minutos_estudados?"studying":"new"} context={activities.length ? "Com horários" : "Aguardando configuração"}/><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label={`Mover ${d.nome} para cima`} disabled={index === 0 || pending} onClick={() => move(index, -1)}><ArrowUp /></Button><Button size="icon" variant="ghost" aria-label={`Mover ${d.nome} para baixo`} disabled={index === plano.disciplinas.length - 1 || pending} onClick={() => move(index, 1)}><ArrowDown /></Button></div></div>
      <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Sessões na semana</dt><dd>{metrics?.sessoes_semana ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Dias de estudo</dt><dd>{[...new Set(activities.map(b => diaAbrev[b.dia_semana]))].join(", ") || "Não configurados"}</dd></div><div><dt className="text-xs text-muted-foreground">Tempo planejado</dt><dd>{metrics ? formatStudyMinutes(metrics.minutos_planejados) : "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Tempo estudado</dt><dd>{metrics ? formatStudyMinutes(metrics.minutos_estudados) : "—"}</dd></div></dl>
      <DisciplineProgress value={metrics?.progresso_pct??null} label="Progresso de atividades" state={metrics?.progresso_pct===100?"completed":metrics?.minutos_estudados?"studying":"new"}/>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onConfigure([d.disciplina_id])}><CalendarClock />Configurar horários</Button>{activities.length > 0 && <Button size="sm" variant="outline" onClick={() => { onFilter(d.disciplina_id); onEdit(activities[0]); }}>Editar distribuição</Button>}<Button size="sm" variant="outline" onClick={() => onActivity(d.disciplina_id)}><Plus />Adicionar atividade</Button><Button size="sm" variant="ghost" onClick={() => onFilter(d.disciplina_id)}><BookOpen />Ver atividades</Button><Button size="sm" variant="ghost" disabled={pending} onClick={() => onRemove(d.disciplina_id)} className="text-destructive"><Trash2 />Remover</Button></div>
    </article>;
  })}</div></div>;
}
