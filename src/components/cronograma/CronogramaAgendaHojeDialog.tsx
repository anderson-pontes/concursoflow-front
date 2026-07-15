import React from "react";
import { ListChecks } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTablistNavigation } from "@/hooks/useTablistNavigation";
import {
  DIAS,
  blocoDurationMinutes,
  diaAbrev,
  fmtBlocoMinutos,
  getTipo,
} from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import { blocoVigenciaExpirada } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

const JS_DAY_TO_KEY = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  blocos: Bloco[];
  disciplinaNome: (disciplinaId: string) => string;
  onCriarCronograma?: () => void;
};

function diaHojeKey(): Bloco["dia_semana"] {
  return JS_DAY_TO_KEY[new Date().getDay()];
}

function topicoResumo(bloco: Bloco): { label: string; title?: string } | null {
  if (bloco.topico_nomes && bloco.topico_nomes.length > 1) {
    return {
      label: `${bloco.topico_nomes.length} tópicos`,
      title: bloco.topico_nomes.join(", "),
    };
  }
  if (bloco.topico_nome) {
    return { label: bloco.topico_nome };
  }
  if (bloco.topico_nomes?.[0]) {
    return { label: bloco.topico_nomes[0] };
  }
  return null;
}

function subtituloDia(dia: Bloco["dia_semana"], isHoje: boolean): string {
  if (!isHoje) return diaAbrev[dia];
  const now = new Date();
  return `${diaAbrev[dia]} · ${now.getDate()} ${MESES_CURTOS[now.getMonth()]}`;
}

export function CronogramaAgendaHojeDialog({
  open,
  onClose,
  blocos,
  disciplinaNome,
  onCriarCronograma,
}: Props) {
  const hoje = diaHojeKey();
  const [diaSelecionado, setDiaSelecionado] = React.useState<Bloco["dia_semana"]>(hoje);
  const onTablistKeyDown = useTablistNavigation();
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setDiaSelecionado(diaHojeKey());
    }
  }, [open]);

  React.useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [diaSelecionado]);

  const isHoje = diaSelecionado === hoje;

  const items = React.useMemo(
    () =>
      [...blocos]
        .filter((b) => b.dia_semana === diaSelecionado && b.ativo !== false)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
    [blocos, diaSelecionado],
  );

  const empty = items.length === 0;
  const panelId = `agenda-tabpanel-${diaSelecionado}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[85vh] max-w-md gap-0 overflow-hidden p-0">
        <div className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <ListChecks className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
            O que estudar
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {subtituloDia(diaSelecionado, isHoje)}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Dias da semana"
          onKeyDown={onTablistKeyDown}
          className="flex gap-0.5 overflow-x-auto border-b border-border px-2 scrollbar-thin"
        >
          {DIAS.map((dia) => {
            const active = diaSelecionado === dia;
            const tabId = `agenda-tab-${dia}`;
            return (
              <button
                key={dia}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={panelId}
                tabIndex={active ? 0 : -1}
                onClick={() => setDiaSelecionado(dia)}
                className={cn(
                  "relative flex min-h-10 min-w-11 shrink-0 items-center justify-center px-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {diaAbrev[dia]}
                {active ? (
                  <span
                    className="absolute bottom-0 left-1.5 right-1.5 h-0.5 rounded-t-full bg-primary"
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <div
          ref={listRef}
          id={panelId}
          role="tabpanel"
          aria-labelledby={`agenda-tab-${diaSelecionado}`}
          className="max-h-[50vh] overflow-y-auto px-5 py-4"
        >
          {empty ? (
            <div className="space-y-1 py-2 text-sm text-muted-foreground">
              <p className="font-medium text-card-foreground">
                {isHoje
                  ? "Nada agendado para hoje."
                  : `Nada agendado para ${diaAbrev[diaSelecionado]}.`}
              </p>
              <p>Monte horários na grade ou crie um cronograma.</p>
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {items.map((bloco) => {
                const minutos = blocoDurationMinutes(bloco.hora_inicio, bloco.hora_fim);
                const badge = getTipo(bloco.tipo);
                const topico = topicoResumo(bloco);
                const expirado = blocoVigenciaExpirada(bloco);
                return (
                  <li
                    key={bloco.id}
                    className={cn(
                      "rounded-lg border px-3 py-2.5",
                      expirado
                        ? "border-amber-300/80 bg-amber-50/40 dark:border-amber-700/50 dark:bg-amber-950/20"
                        : "border-border bg-muted/20",
                    )}
                  >
                    <p className="text-xs font-medium tabular-nums text-muted-foreground">
                      {bloco.hora_inicio.slice(0, 5)}–{bloco.hora_fim.slice(0, 5)}
                      {minutos >= 1 ? ` · ${fmtBlocoMinutos(minutos)}` : null}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-card-foreground">
                      {disciplinaNome(bloco.disciplina_id)}
                    </p>
                    {topico ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground" title={topico.title}>
                        {topico.label}
                      </p>
                    ) : null}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", badge.cls)}>
                        {badge.label}
                      </span>
                      {expirado ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          expirado
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
          {empty && onCriarCronograma ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCriarCronograma();
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Criar cronograma
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
