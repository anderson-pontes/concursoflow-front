import { BarChart3, CalendarPlus, MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";
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
} from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import { blocoTopicoIds, blocoVigenciaExpirada, fmtDateBR } from "@/lib/cronograma/types";
import {
  buildDisciplinaDashboardUrl,
  launchPomodoroFromBloco,
  resolvePomodoroTopicoId,
} from "@/lib/pomodoro/launchFromCronograma";
import { cn } from "@/lib/utils";
import { getDisciplinaPalette } from "@/components/disciplinas/disciplinaPalettes";

export type CronogramaBlocoCardProps = {
  bloco: Bloco;
  disciplinaNome: string;
  diaLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onEstender?: () => void;
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
  deletePending = false,
  estenderPending = false,
}: CronogramaBlocoCardProps) {
  const navigate = useNavigate();
  const minutos = blocoDurationMinutes(bloco.hora_inicio, bloco.hora_fim);
  const palette = getDisciplinaPalette(bloco.disciplina_id);
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
      ? { label: "revisão", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" }
      : { label: "aprendizado", cls: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" };

  return (
    <div
      role="article"
      aria-label={`Bloco de estudo: ${disciplinaNome}`}
      className={cn(
        "relative min-w-0 overflow-hidden rounded-lg border p-2 shadow-sm sm:p-2.5",
        palette.cardBg,
        palette.cardBorder,
        expirado && "border-amber-300/80 opacity-90 dark:border-amber-700/60",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", getTipoDot(bloco.tipo))} />
        <p className="truncate text-xs font-semibold text-card-foreground" title={disciplinaNome}>
          {disciplinaNome}
        </p>
      </div>
      {topicoResumo ? (
        <p
          className="mt-0.5 truncate pl-3.5 text-[11px] text-muted-foreground"
          title={bloco.topico_nomes?.join(", ") || topicoResumo}
        >
          {topicoResumo}
        </p>
      ) : null}
      <p
        className={cn("mt-1 truncate pl-3.5 text-[11px] font-bold tabular-nums sm:text-xs", palette.accent)}
        title={`${bloco.hora_inicio}–${bloco.hora_fim} · ${fmtBlocoMinutos(minutos)}`}
      >
        <span className="sm:hidden">
          {bloco.hora_inicio.slice(0, 5)} · {fmtBlocoMinutos(minutos)}
        </span>
        <span className="hidden sm:inline">
          {bloco.hora_inicio}–{bloco.hora_fim} · {fmtBlocoMinutos(minutos)}
        </span>
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <span className={cn("inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-[11px]", badge.cls)}>
          {badge.label}
        </span>
        {bloco.modo_criacao === "simplificada" ? (
          <span className="inline-flex rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 sm:px-2 sm:text-[11px]">
            simp.
          </span>
        ) : null}
        {expirado ? (
          <span className="inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 sm:px-2 sm:text-[11px]">
            expirado
          </span>
        ) : null}
        {topicoIds.length > 0 ? (
          <span className={cn("inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-[11px]", modoBadge.cls)}>
            {modoBadge.label}
          </span>
        ) : null}
      </div>
      {bloco.vigencia_fim && !bloco.vigencia_indeterminada ? (
        <p
          className={cn(
            "mt-1 truncate pl-3.5 text-[10px]",
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
          onClick={() => launchPomodoroFromBloco(navigate, bloco, minutos)}
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
            <DropdownMenuItem className="min-h-10 gap-2" onSelect={onEdit}>
              <Pencil /> Editar bloco
            </DropdownMenuItem>
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
              disabled={deletePending}
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
