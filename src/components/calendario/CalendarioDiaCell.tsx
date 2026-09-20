import { cn } from "@/lib/utils";
import type { CalendarioDia, DiaStatus, PlanejadoItem } from "@/lib/calendario/types";
import { STATUS_CELL_CLASS, STATUS_DOT_CLASS, STATUS_LABEL } from "@/lib/calendario/constants";
import { fmtMinutosEstudo } from "@/lib/calendario/format";
import { getDisciplinaPalette } from "@/components/disciplinas/disciplinaPalettes";

type Props = {
  dia: CalendarioDia | null;
  diaNumero: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick?: () => void;
};

export type CalendarioDisciplinaResumo = {
  disciplinaId: string;
  nome: string;
  duracaoMinutos: number;
};

export function aggregatePlanejadoByDisciplina(
  planejado: PlanejadoItem[],
): CalendarioDisciplinaResumo[] {
  const disciplinas = new Map<string, CalendarioDisciplinaResumo>();

  planejado.forEach((item) => {
    const atual = disciplinas.get(item.disciplina_id);
    if (atual) {
      atual.duracaoMinutos += Math.max(0, item.duracao_minutos);
      return;
    }

    disciplinas.set(item.disciplina_id, {
      disciplinaId: item.disciplina_id,
      nome: item.disciplina_nome,
      duracaoMinutos: Math.max(0, item.duracao_minutos),
    });
  });

  return [...disciplinas.values()];
}

function cellTitle(dia: CalendarioDia): string {
  if (dia.status === "futuro" && dia.minutos_planejados > 0) {
    return `${dia.data}: Planejado — ${fmtMinutosEstudo(dia.minutos_planejados)}`;
  }
  return `${dia.data}: ${STATUS_LABEL[dia.status]} — ${fmtMinutosEstudo(dia.minutos_realizados)}/${fmtMinutosEstudo(dia.minutos_planejados)}`;
}

function cellAriaLabel(
  dia: CalendarioDia | null,
  diaNumero: number,
  status: DiaStatus,
  disciplinas: CalendarioDisciplinaResumo[],
): string {
  if (!dia) return `Dia ${diaNumero}`;
  const resumoDisciplinas = disciplinas.length
    ? `, ${disciplinas.map((item) => `${item.nome}, ${fmtMinutosEstudo(item.duracaoMinutos)}`).join("; ")}`
    : "";
  if (dia.status === "futuro" && dia.minutos_planejados > 0) {
    return `Dia ${diaNumero}, ${fmtMinutosEstudo(dia.minutos_planejados)} planejados${resumoDisciplinas}, dia futuro`;
  }
  return `Dia ${diaNumero}, ${STATUS_LABEL[status]}${resumoDisciplinas}`;
}

export function CalendarioDiaCell({ dia, diaNumero, isCurrentMonth, isToday, onClick }: Props) {
  const status = dia?.status ?? (isCurrentMonth ? "sem_planejamento" : "futuro");
  const minutosPlanejados = dia?.minutos_planejados ?? 0;
  const minutosRealizados = dia?.minutos_realizados ?? 0;
  const futuroComPlano = status === "futuro" && minutosPlanejados > 0;
  const futuroVazio =
    status === "futuro" && minutosPlanejados === 0 && minutosRealizados === 0;
  const disciplinas = aggregatePlanejadoByDisciplina(dia?.planejado ?? []);
  const disciplinasVisiveis = disciplinas.slice(0, 3);
  const disciplinasOcultas = Math.max(0, disciplinas.length - disciplinasVisiveis.length);

  const disabled = !isCurrentMonth || futuroVazio;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={dia ? cellTitle(dia) : undefined}
      aria-label={cellAriaLabel(dia, diaNumero, status, disciplinas)}
      className={cn(
        "flex min-h-[132px] flex-col rounded-lg border p-2 text-left transition hover:ring-2 hover:ring-primary-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-40 disabled:hover:ring-0 sm:min-h-[160px]",
        isCurrentMonth ? STATUS_CELL_CLASS[status] : "border-transparent bg-transparent",
        isToday && "ring-2 ring-primary-500 ring-offset-1",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isToday ? "text-primary-700 dark:text-primary-300" : "text-foreground",
            !isCurrentMonth && "text-muted-foreground/40",
          )}
        >
          {diaNumero}
        </span>
        {dia && isCurrentMonth && futuroComPlano ? (
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary-400/70" aria-hidden />
        ) : null}
        {dia && isCurrentMonth && status !== "futuro" && status !== "sem_planejamento" ? (
          <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT_CLASS[status])} aria-hidden />
        ) : null}
      </div>

      {dia && isCurrentMonth && disciplinasVisiveis.length > 0 ? (
        <div className="mt-2 space-y-1">
          {disciplinasVisiveis.map((disciplina) => {
            const palette = getDisciplinaPalette(disciplina.disciplinaId);
            return (
              <div
                key={disciplina.disciplinaId}
                className={cn("min-w-0 rounded-md border px-1.5 py-1 shadow-sm", palette.calendarItem)}
              >
                <p className="truncate text-[11px] font-semibold leading-tight sm:text-xs">
                  {disciplina.nome}
                </p>
                <p className={cn("mt-0.5 text-[10px] font-medium leading-none tabular-nums", palette.calendarMuted)}>
                  {fmtMinutosEstudo(disciplina.duracaoMinutos)}
                </p>
              </div>
            );
          })}
          {disciplinasOcultas > 0 ? (
            <p className="px-1 text-[10px] font-medium leading-tight text-muted-foreground">
              +{disciplinasOcultas} {disciplinasOcultas === 1 ? "disciplina" : "disciplinas"}
            </p>
          ) : null}
        </div>
      ) : null}

      {dia && isCurrentMonth && futuroComPlano && disciplinasVisiveis.length === 0 ? (
        <div className="mt-auto space-y-0.5 pt-1">
          <p className="truncate text-xs font-medium leading-tight text-primary-700 dark:text-primary-300">
            {fmtMinutosEstudo(minutosPlanejados)}
          </p>
          <p className="text-[10px] leading-tight text-muted-foreground">planejado</p>
        </div>
      ) : null}

      {dia && isCurrentMonth && status !== "futuro" && disciplinasVisiveis.length === 0 ? (
        <div className="mt-auto space-y-0.5 pt-1">
          {dia.minutos_planejados > 0 ? (
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {fmtMinutosEstudo(dia.minutos_realizados)} / {fmtMinutosEstudo(dia.minutos_planejados)}
            </p>
          ) : dia.minutos_realizados > 0 ? (
            <p className="truncate text-xs font-medium leading-tight text-info">
              {fmtMinutosEstudo(dia.minutos_realizados)}
            </p>
          ) : null}
          {dia.sessoes_realizadas > 0 ? (
            <p className="text-xs leading-tight text-muted-foreground">{dia.sessoes_realizadas} sess.</p>
          ) : dia.minutos_planejados === 0 && dia.minutos_realizados === 0 ? (
            <p className="text-xs leading-tight text-muted-foreground/70">Sem estudo</p>
          ) : null}
        </div>
      ) : null}

      {dia && isCurrentMonth && status !== "futuro" && disciplinasVisiveis.length > 0 && minutosRealizados > 0 ? (
        <p className="mt-auto truncate pt-1 text-[10px] leading-tight text-muted-foreground">
          Realizado: {fmtMinutosEstudo(minutosRealizados)}
        </p>
      ) : null}
    </button>
  );
}
