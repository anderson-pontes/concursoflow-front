import { BarChart3, Pencil, Play, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  blocoDurationMinutes,
  fmtBlocoMinutos,
  getTipo,
  getTipoDot,
} from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import {
  buildDisciplinaDashboardUrl,
  launchPomodoroFromBloco,
} from "@/lib/pomodoro/launchFromCronograma";
import { cn } from "@/lib/utils";

export type CronogramaBlocoCardProps = {
  bloco: Bloco;
  disciplinaNome: string;
  diaLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  deletePending?: boolean;
};

export function CronogramaBlocoCard({
  bloco,
  disciplinaNome,
  diaLabel,
  onEdit,
  onDelete,
  deletePending = false,
}: CronogramaBlocoCardProps) {
  const navigate = useNavigate();
  const minutos = blocoDurationMinutes(bloco.hora_inicio, bloco.hora_fim);
  const badge = getTipo(bloco.tipo);
  const modoBadge =
    bloco.tipo === "revisao"
      ? { label: "revisão", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" }
      : { label: "aprendizado", cls: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-white p-2.5 shadow-sm dark:bg-neutral-900">
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", getTipoDot(bloco.tipo))} />
        <p className="truncate text-xs font-semibold text-card-foreground">{disciplinaNome}</p>
      </div>
      {bloco.topico_nome ? (
        <p className="mt-0.5 truncate pl-3.5 text-[11px] text-muted-foreground">{bloco.topico_nome}</p>
      ) : null}
      <p className="mt-1 pl-3.5 text-xs font-bold tabular-nums text-primary-700 dark:text-primary-300">
        {bloco.hora_inicio}–{bloco.hora_fim} · {fmtBlocoMinutos(minutos)}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", badge.cls)}>
          {badge.label}
        </span>
        {bloco.topico_id ? (
          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", modoBadge.cls)}>
            {modoBadge.label}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-center gap-1">
        <button
          type="button"
          title={minutos >= 1 ? `Estudar no Pomodoro (${fmtBlocoMinutos(minutos)})` : "Duração inválida"}
          disabled={minutos < 1}
          onClick={() => launchPomodoroFromBloco(navigate, bloco, minutos)}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-primary-300 bg-primary-50 px-2 text-[11px] font-semibold text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-900/50"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          Play
        </button>
        <Link
          to={buildDisciplinaDashboardUrl(bloco.disciplina_id, bloco.topico_id)}
          title="Abrir dashboard da disciplina"
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Disciplina
        </Link>
        <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Editar bloco"
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Excluir bloco"
            disabled={deletePending}
            onClick={() => {
              if (
                window.confirm(
                  `Excluir ${disciplinaNome}${bloco.topico_nome ? ` — ${bloco.topico_nome}` : ""} (${fmtBlocoMinutos(minutos)}) de ${diaLabel}?`,
                )
              ) {
                onDelete();
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
