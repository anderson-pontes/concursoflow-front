import { BarChart3, CalendarPlus, Copy, BookOpen, MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  blocoDurationMinutes,
  fmtBlocoMinutos,
  getTipo,
  getTipoDot,
  getTipoSurface,
} from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import { blocoTopicoIds, blocoVigenciaExpirada, fmtDateBR } from "@/lib/cronograma/types";
import {
  buildDisciplinaDashboardUrl,
  launchPomodoroFromBloco,
  resolvePomodoroTopicoId,
} from "@/lib/pomodoro/launchFromCronograma";
import { cn } from "@/lib/utils";


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
  const minutos = bloco.duracao_minutos ?? blocoDurationMinutes(bloco.hora_inicio, bloco.hora_fim);
  const legacyItem = bloco.fonte === "cronograma_item" && !bloco.bloco_cronograma_id;

  const badge = getTipo(bloco.tipo);
  const topicoIds = blocoTopicoIds(bloco);
  const topicoResumo =
    bloco.topico_nome ??
    (bloco.topico_nomes && bloco.topico_nomes.length > 1
      ? `${bloco.topico_nomes.length} tópicos`
      : bloco.topico_nomes?.[0] ?? null);
  const launchTopicoId = resolvePomodoroTopicoId(bloco);
  const canEstender =
    bloco.modo_criacao === "simplificada" &&
    Boolean(bloco.grupo_id) &&
    Boolean(bloco.vigencia_fim) &&
    !bloco.vigencia_indeterminada &&
    Boolean(onEstender);
  const expirado = blocoVigenciaExpirada(bloco);
  const modoBadge =
    bloco.tipo === "revisao"
      ? { label: "revisão", cls: "bg-review/10 text-review-foreground" }
      : { label: "aprendizado", cls: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" };

  return (
    <div
      role="article"
      aria-label={`Bloco de estudo: ${disciplinaNome}`}
      className={cn(
        "relative min-w-0 overflow-hidden rounded-xl border border-border border-l-4 p-3 shadow-sm",
        getTipoSurface(bloco.tipo),
        expirado && "border-amber-300/80 opacity-90 dark:border-amber-700/60",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", getTipoDot(bloco.tipo))} />
        <p className="line-clamp-2 break-words text-sm font-semibold text-card-foreground" title={disciplinaNome}>
          {disciplinaNome}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{diaLabel}{occurrenceDate ? ` · ${fmtDateBR(occurrenceDate)}` : ""} · Planejado</p>
      {topicoResumo ? (
        <p
          className="mt-0.5 truncate pl-3.5 text-xs text-muted-foreground"
          title={bloco.topico_nomes?.join(", ") || topicoResumo}
        >
          {topicoResumo}
        </p>
      ) : null}
      <p
        className={cn("mt-1 truncate pl-3.5 text-xs font-bold tabular-nums sm:text-xs", "text-foreground")}
        title={`${bloco.hora_inicio}–${bloco.hora_fim} · ${fmtBlocoMinutos(minutos)}`}
      >
        <span className="sm:hidden">
          {bloco.hora_inicio ? bloco.hora_inicio.slice(0, 5) : "Sem horário"} · {fmtBlocoMinutos(minutos)}
        </span>
        <span className="hidden sm:inline">
          {bloco.hora_inicio ? `${bloco.hora_inicio}–${bloco.hora_fim}` : "Sem horário definido"} · {fmtBlocoMinutos(minutos)}
        </span>
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <span className={cn("inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-xs font-semibold sm:px-2 sm:text-xs", badge.cls)}>
          {badge.label}
        </span>
        {bloco.modo_criacao === "simplificada" ? (
          <span className="inline-flex rounded-full bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 sm:px-2 sm:text-xs">
            simp.
          </span>
        ) : null}
        {expirado ? (
          <span className="inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 sm:px-2 sm:text-xs">
            expirado
          </span>
        ) : null}
        {topicoIds.length > 0 ? (
          <span className={cn("inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-xs font-semibold sm:px-2 sm:text-xs", modoBadge.cls)}>
            {modoBadge.label}
          </span>
        ) : null}
      </div>
      {bloco.vigencia_fim && !bloco.vigencia_indeterminada ? (
        <p
          className={cn(
            "mt-1 truncate pl-3.5 text-xs",
            expirado ? "font-medium text-amber-700 dark:text-amber-300" : "text-muted-foreground",
          )}
          title={`${expirado ? "Expirou em" : "Até"} ${fmtDateBR(bloco.vigencia_fim)}`}
        >
          {expirado ? "Expirou" : "Até"} {fmtDateBR(bloco.vigencia_fim)}
        </p>
      ) : null}

      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          title={minutos >= 1 ? `Estudar no Pomodoro (${fmtBlocoMinutos(minutos)})` : "Duração inválida"}
          aria-label={minutos >= 1 ? `Play Pomodoro ${diaLabel}` : "Duração inválida"}
          disabled={minutos < 1}
          onClick={() => launchPomodoroFromBloco(navigate, { ...bloco, data_referencia: occurrenceDate }, minutos)}
          className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-primary-300 bg-primary-50 px-2.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-900/50"
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
  );
}
