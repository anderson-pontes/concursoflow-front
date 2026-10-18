import { BarChart3, CalendarPlus, Copy, BookOpen, MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fmtBlocoMinutos,
  getTipo,
} from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import { blocoVigenciaExpirada, fmtDateBR } from "@/lib/cronograma/types";
import {
  buildDisciplinaDashboardUrl,
  launchPomodoroFromBloco,
  resolvePomodoroTopicoId,
} from "@/lib/pomodoro/launchFromCronograma";
import { cn } from "@/lib/utils";
import {studySurface} from "@/lib/ui/studySurface";
import {activityMinutes} from "@/lib/cronograma/activityPresentation";
import { DisciplineColorIndicator } from "@/components/disciplinas/DisciplineColorIndicator";


export type CronogramaBlocoCardProps = {
  bloco: Bloco;
  disciplinaNome: string;
  diaLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onEstender?: () => void;
  onDuplicate?: () => void;
  onRegistro?: () => void;
  occurrenceDate?: string;
  deletePending?: boolean;
  estenderPending?: boolean;
};

export function CronogramaBlocoCard({
  bloco,
  disciplinaNome,
  diaLabel,
  onEdit,
  onDelete,
  onEstender,
  onDuplicate,
  onRegistro,
  occurrenceDate,
  deletePending = false,
  estenderPending = false,
}: CronogramaBlocoCardProps) {
  const navigate = useNavigate();
  const minutos = activityMinutes(bloco);
  const legacyItem = bloco.fonte === "cronograma_item" && !bloco.bloco_cronograma_id;

  const badge = getTipo(bloco.tipo);
  const topics=bloco.topico_nomes?.filter(Boolean).length ? bloco.topico_nomes.filter(Boolean) : bloco.topico_nome ? [bloco.topico_nome] : [];
  const launchTopicoId = resolvePomodoroTopicoId(bloco);
  const canEstender =
    bloco.modo_criacao === "simplificada" &&
    Boolean(bloco.grupo_id) &&
    Boolean(bloco.vigencia_fim) &&
    !bloco.vigencia_indeterminada &&
    Boolean(onEstender);
  const avulsa=Boolean(bloco.vigencia_inicio && bloco.vigencia_inicio===bloco.vigencia_fim) || (bloco.fonte==='cronograma_item'&&!bloco.bloco_cronograma_id);
  const recurrenceEnd=!avulsa&&!bloco.vigencia_indeterminada?bloco.vigencia_fim:null;
  const expirado=Boolean(recurrenceEnd)&&blocoVigenciaExpirada(bloco);
  return (
    <div
      role="article"
      aria-label={`Bloco de estudo: ${disciplinaNome}`}
      className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring/50"
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2"><DisciplineColorIndicator disciplinaId={bloco.disciplina_id} className="h-5"/><p className="min-w-0 text-sm font-semibold leading-snug [overflow-wrap:anywhere]">{disciplinaNome}</p></div>
        {expirado&&<details className="max-w-full text-xs"><summary className={`cursor-pointer rounded-full px-2 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${studySurface('amber')}`}>Recorrência encerrada</summary><p className="mt-2 max-w-xs leading-relaxed text-muted-foreground">A repetição terminou em {fmtDateBR(recurrenceEnd)}. Isso não indica conclusão nem atraso desta atividade.</p></details>}
      </div>
      {topics.length===1&&<p className="break-words text-xs leading-snug text-muted-foreground">{topics[0]}</p>}
      {topics.length>1&&<details className="text-xs text-muted-foreground"><summary className="cursor-pointer rounded leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [overflow-wrap:anywhere]">{topics[0]} · +{topics.length-1} {topics.length===2?'assunto':'assuntos'}</summary><ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">{topics.map((topic,index)=><li key={index} className="break-words">{topic}</li>)}</ul></details>}
      <p className="text-xs leading-relaxed text-muted-foreground">{diaLabel}{occurrenceDate ? `, ${fmtDateBR(occurrenceDate).slice(0,5)}` : ''} · {fmtBlocoMinutos(minutos)} · {bloco.hora_inicio ? `${bloco.hora_inicio.slice(0,5)}–${bloco.hora_fim.slice(0,5)}` : 'Sem horário'}<span className="sr-only">{occurrenceDate?` · Data completa: ${fmtDateBR(occurrenceDate)}`:''}</span></p>
      {recurrenceEnd&&!expirado&&<p className="text-xs text-muted-foreground">Repete até {fmtDateBR(recurrenceEnd)}</p>}
      <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border pt-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{badge.label}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", bloco.ativo ? studySurface('indigo') : 'bg-muted text-muted-foreground')}>{bloco.ativo ? 'Planejada' : 'Inativa'}</span>
        </div><div className="flex items-center gap-1">
        <button
          type="button"
          title={minutos >= 1 ? `Estudar no Pomodoro (${fmtBlocoMinutos(minutos)})` : "Duração inválida"}
          aria-label={minutos >= 1 ? `Play Pomodoro ${diaLabel}` : "Duração inválida"}
          disabled={minutos < 1}
          onClick={() => launchPomodoroFromBloco(navigate, { ...bloco, data_referencia: occurrenceDate }, minutos)}
          className="inline-flex min-h-10 w-fit min-w-0 items-center justify-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-3 text-xs font-semibold text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Estudar</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Mais ações"
              aria-label={`Mais ações de ${disciplinaNome}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background/70 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild className="min-h-10 gap-2">
              <Link to={buildDisciplinaDashboardUrl(bloco.disciplina_id, launchTopicoId)}>
                <BarChart3 /> Abrir disciplina
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-10 gap-2" onSelect={onEdit} disabled={legacyItem}>
              <Pencil /> Editar bloco
            </DropdownMenuItem>
            {onRegistro && <DropdownMenuItem className="min-h-10 gap-2" onSelect={onRegistro}><BookOpen />Registrar estudo</DropdownMenuItem>}
            {onDuplicate && <DropdownMenuItem className="min-h-10 gap-2" onSelect={onDuplicate}><Copy />Duplicar atividade</DropdownMenuItem>}
            {canEstender ? (
              <DropdownMenuItem
                className="min-h-10 gap-2"
                disabled={estenderPending}
                onSelect={onEstender}
              >
                <CalendarPlus /> Estender por 12 meses
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              variant="destructive"
              className="min-h-10 gap-2"
              disabled={deletePending || legacyItem}
              onSelect={onDelete}
            >
              <Trash2 /> Remover bloco
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
