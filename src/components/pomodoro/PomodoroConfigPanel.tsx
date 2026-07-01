import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Timer, Clock, Hourglass } from "lucide-react";

import { api } from "@/services/api";
import { MODE_OPTIONS } from "@/lib/pomodoro/constants";
import { formatFocusDurationLabel, MAX_FOCUS_HOURS, MAX_FOCUS_MINUTES } from "@/lib/pomodoro/duration";
import { cn } from "@/lib/utils";
import { usePomodoroStore, type PomodoroMode } from "@/stores/pomodoroStore";

type DisciplinaOpt = { id: string; nome: string };

const MODE_ICONS: Record<PomodoroMode, React.ElementType> = {
  pomodoro: Timer,
  livre: Hourglass,
  cronometro: Clock,
};

type PomodoroConfigPanelProps = {
  disciplinas: DisciplinaOpt[];
  loadingDisciplinas?: boolean;
  disabled?: boolean;
  onPersist?: () => void;
};

export function PomodoroConfigPanel({
  disciplinas,
  loadingDisciplinas,
  disabled = false,
  onPersist,
}: PomodoroConfigPanelProps) {
  const mode = usePomodoroStore((s) => s.mode);
  const focusHours = usePomodoroStore((s) => s.focusHours);
  const focusMinutes = usePomodoroStore((s) => s.focusMinutes);
  const shortBreakMinutes = usePomodoroStore((s) => s.shortBreakMinutes);
  const longBreakMinutes = usePomodoroStore((s) => s.longBreakMinutes);
  const cyclesTarget = usePomodoroStore((s) => s.cyclesTarget);
  const disciplinaId = usePomodoroStore((s) => s.disciplinaId);
  const topicoId = usePomodoroStore((s) => s.topicoId);
  const setMode = usePomodoroStore((s) => s.setMode);
  const setDisciplinaId = usePomodoroStore((s) => s.setDisciplinaId);
  const setTopicoId = usePomodoroStore((s) => s.setTopicoId);
  const setConfig = usePomodoroStore((s) => s.setConfig);
  const setFocusDuration = usePomodoroStore((s) => s.setFocusDuration);

  const isCronometro = mode === "cronometro";
  const modeHint = MODE_OPTIONS.find((m) => m.value === mode)?.hint ?? "";

  const { data: topicos, isLoading: loadingTopicos } = useQuery({
    queryKey: ["pomodoro-topicos", disciplinaId],
    enabled: Boolean(disciplinaId),
    queryFn: async () => {
      const rows = (await api.get(`/disciplinas/${disciplinaId}/topicos`)).data as Array<{
        id: string;
        descricao: string;
      }>;
      return rows.map((t) => ({ id: String(t.id), descricao: t.descricao }));
    },
  });

  React.useEffect(() => {
    if (!topicoId || !topicos) return;
    if (!topicos.some((t) => t.id === topicoId)) setTopicoId(null);
  }, [topicoId, topicos, setTopicoId]);

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-[#6C3FC5]/40 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border/60 bg-[#F3F0FF]/50 px-5 py-4 dark:bg-[#6C3FC5]/10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#6C3FC5] dark:text-[#A78BFA]">
          Configuração da sessão
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{modeHint}</p>
      </div>

      <div className="space-y-5 p-5">
        {/* Mode tabs */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Modo</p>
          <div className="grid grid-cols-3 gap-2">
            {MODE_OPTIONS.map((opt) => {
              const Icon = MODE_ICONS[opt.value];
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setMode(opt.value);
                    onPersist?.();
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all",
                    active
                      ? "border-[#6C3FC5] bg-[#F3F0FF] text-[#6C3FC5] shadow-sm dark:border-[#A78BFA] dark:bg-[#6C3FC5]/15 dark:text-[#DDD6FE]"
                      : "border-border bg-background text-muted-foreground hover:border-[#C4B5FD] hover:bg-muted/50",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Discipline + topic */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pomodoro-disciplina" className="mb-1.5 block text-sm font-medium">
              Disciplina
            </label>
            {loadingDisciplinas ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : disciplinas.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Cadastre uma disciplina para iniciar.
              </p>
            ) : (
              <select
                id="pomodoro-disciplina"
                disabled={disabled}
                className={fieldClass}
                value={disciplinaId ?? ""}
                onChange={(e) => {
                  setDisciplinaId(e.target.value || null);
                  setTopicoId(null);
                  onPersist?.();
                }}
              >
                <option value="">Selecione...</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="pomodoro-topico" className="mb-1.5 block text-sm font-medium">
              Tópico <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <select
              id="pomodoro-topico"
              disabled={disabled || !disciplinaId || loadingTopicos}
              className={fieldClass}
              value={topicoId ?? ""}
              onChange={(e) => {
                setTopicoId(e.target.value || null);
                onPersist?.();
              }}
            >
              <option value="">Sem tópico específico</option>
              {(topicos ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.descricao}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timer params */}
        {!isCronometro ? (
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Duração do foco
              </p>
              <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
                <div>
                  <label htmlFor="pomodoro-foco-h" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Horas
                  </label>
                  <input
                    id="pomodoro-foco-h"
                    type="number"
                    min={0}
                    max={MAX_FOCUS_HOURS}
                    disabled={disabled}
                    className={fieldClass}
                    value={focusHours}
                    onChange={(e) => {
                      setFocusDuration(Number(e.target.value) || 0, focusMinutes);
                      onPersist?.();
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="pomodoro-foco-m" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Minutos
                  </label>
                  <input
                    id="pomodoro-foco-m"
                    type="number"
                    min={0}
                    max={MAX_FOCUS_MINUTES}
                    disabled={disabled}
                    className={fieldClass}
                    value={focusMinutes}
                    onChange={(e) => {
                      setFocusDuration(focusHours, Number(e.target.value) || 0);
                      onPersist?.();
                    }}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{formatFocusDurationLabel(focusHours, focusMinutes)}</span>
              </p>
            </div>

            {mode === "pomodoro" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="pomodoro-p-curta" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Pausa curta (min)
                  </label>
                  <input
                    id="pomodoro-p-curta"
                    type="number"
                    min={1}
                    max={60}
                    disabled={disabled}
                    className={fieldClass}
                    value={shortBreakMinutes}
                    onChange={(e) => {
                      setConfig({ shortBreakMinutes: Math.max(1, Number(e.target.value) || 1) });
                      onPersist?.();
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="pomodoro-p-longa" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Pausa longa (min)
                  </label>
                  <input
                    id="pomodoro-p-longa"
                    type="number"
                    min={1}
                    max={60}
                    disabled={disabled}
                    className={fieldClass}
                    value={longBreakMinutes}
                    onChange={(e) => {
                      setConfig({ longBreakMinutes: Math.max(1, Number(e.target.value) || 1) });
                      onPersist?.();
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="pomodoro-ciclos" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Ciclos
                  </label>
                  <input
                    id="pomodoro-ciclos"
                    type="number"
                    min={1}
                    max={12}
                    disabled={disabled}
                    className={fieldClass}
                    value={cyclesTarget}
                    onChange={(e) => {
                      setConfig({ cyclesTarget: Math.max(1, Number(e.target.value) || 1) });
                      onPersist?.();
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            A contagem começa do zero. Use <strong className="font-semibold text-foreground">Encerrar e salvar</strong>{" "}
            quando quiser registrar o tempo estudado.
          </p>
        )}
      </div>
    </div>
  );
}
