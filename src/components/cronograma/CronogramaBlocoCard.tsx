import { BarChart3, Pencil, Play, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-lg border bg-white p-2 shadow-sm dark:bg-neutral-900 sm:p-2.5",
        expirado ? "border-amber-300/80 opacity-90 dark:border-amber-700/60" : "border-border",
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
        className="mt-1 truncate pl-3.5 text-[11px] font-bold tabular-nums text-primary-700 dark:text-primary-300 sm:text-xs"
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

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <button
          type="button"
          title={minutos >= 1 ? `Estudar no Pomodoro (${fmtBlocoMinutos(minutos)})` : "Duração inválida"}
          aria-label={minutos >= 1 ? `Play Pomodoro ${diaLabel}` : "Duração inválida"}
          disabled={minutos < 1}
          onClick={() => launchPomodoroFromBloco(navigate, bloco, minutos)}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-primary-300 bg-primary-50 px-1.5 text-[11px] font-semibold text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-900/50 sm:px-2"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span className="sr-only sm:not-sr-only">Play</span>
        </button>
        <Link
          to={buildDisciplinaDashboardUrl(bloco.disciplina_id, launchTopicoId)}
          title="Abrir dashboard da disciplina"
          aria-label={`Dashboard ${disciplinaNome}`}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-1.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:px-2"
        >
          <BarChart3 className="h-3.5 w-3.5 shrink-0" />
          <span className="sr-only xl:not-sr-only">Disciplina</span>
        </Link>
        {canEstender ? (
          <button
            type="button"
            disabled={estenderPending}
            title="Estender vigência por mais 12 meses"
            onClick={onEstender}
            className={cn(
              "inline-flex h-7 items-center rounded-md border px-1.5 text-[10px] font-semibold transition disabled:opacity-50 sm:px-2 sm:text-[11px]",
              expirado
                ? "border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100"
                : "border-border font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="xl:hidden">+12m</span>
            <span className="hidden xl:inline">Estender 12 meses</span>
          </button>
        ) : null}
        <div className="ml-auto flex gap-1 opacity-100 transition-opacity 2xl:opacity-0 2xl:group-hover:opacity-100 2xl:group-focus-within:opacity-100">
          <button
            type="button"
            title="Editar bloco"
            aria-label={`Editar ${disciplinaNome}`}
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Excluir bloco"
            aria-label={`Remover ${disciplinaNome}`}
            disabled={deletePending}
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
