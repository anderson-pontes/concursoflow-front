import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Settings2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

import { api } from "@/services/api";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";

type Disciplina = { id: string; nome: string };

export function Pomodoro() {
  const setMode = usePomodoroStore((s) => s.setMode);
  const setDisciplinaId = usePomodoroStore((s) => s.setDisciplinaId);
  const disciplinaId = usePomodoroStore((s) => s.disciplinaId);
  const mode = usePomodoroStore((s) => s.mode);
  const focusMinutes = usePomodoroStore((s) => s.focusMinutes);
  const shortBreakMinutes = usePomodoroStore((s) => s.shortBreakMinutes);
  const longBreakMinutes = usePomodoroStore((s) => s.longBreakMinutes);
  const cyclesTarget = usePomodoroStore((s) => s.cyclesTarget);
  const setConfig = usePomodoroStore((s) => s.setConfig);

  const { data: disciplinas, isLoading } = useQuery({
    queryKey: ["disciplinas-all"],
    queryFn: async () => (await api.get("/disciplinas")).data as Disciplina[],
  });

  const [openRegistro, setOpenRegistro] = React.useState(false);
  const [timerActive, setTimerActive] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);

  const isCronometro = mode === "cronometro";
  const disciplinaNome = disciplinas?.find((d) => d.id === disciplinaId)?.nome;

  const modeLabels: Record<string, string> = {
    pomodoro: "Pomodoro",
    livre: "Tempo livre",
    cronometro: "Cronômetro",
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10">

      {/* ── Header ── */}
      {!timerActive ? (
        /* Setup header */
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              {isCronometro ? "Cronômetro" : "Pomodoro"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isCronometro
                ? "Contagem progressiva com registro a qualquer momento."
                : "Timer Pomodoro com registro automático."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenRegistro(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground hover:bg-muted"
          >
            <BookOpen className="h-4 w-4" />
            Registro manual
          </button>
        </div>
      ) : (
        /* Active session header — minimal */
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              Sessão em andamento
            </h1>
            <p className="text-xs text-muted-foreground">
              {modeLabels[mode] ?? mode}
              {disciplinaNome ? ` · ${disciplinaNome}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenRegistro(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Reg. manual
          </button>
        </div>
      )}

      {/* ── Config panel — hidden when timer is active ── */}
      {!timerActive ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="px-5 pt-5">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Configuração
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Mode */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Modo</label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "pomodoro" | "livre" | "cronometro")}
                >
                  <option value="pomodoro">Pomodoro (ciclos)</option>
                  <option value="livre">Tempo livre (countdown)</option>
                  <option value="cronometro">Cronômetro (count-up)</option>
                </select>
              </div>

              {/* Discipline */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">Disciplina</label>
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : (
                  <select
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
                    value={disciplinaId ?? ""}
                    onChange={(e) => setDisciplinaId(e.target.value || null)}
                  >
                    <option value="" disabled>Selecione...</option>
                    {(disciplinas ?? []).map((d) => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Timer params */}
            {!isCronometro ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Foco (min)</label>
                  <input
                    type="number" min={1}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    value={focusMinutes}
                    onChange={(e) => setConfig({ focusMinutes: Math.max(1, Number(e.target.value)) })}
                  />
                </div>
                {mode === "pomodoro" ? (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">P. curta</label>
                      <input
                        type="number" min={1}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        value={shortBreakMinutes}
                        onChange={(e) => setConfig({ shortBreakMinutes: Math.max(1, Number(e.target.value)) })}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">P. longa</label>
                      <input
                        type="number" min={1}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        value={longBreakMinutes}
                        onChange={(e) => setConfig({ longBreakMinutes: Math.max(1, Number(e.target.value)) })}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Ciclos</label>
                      <input
                        type="number" min={1}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        value={cyclesTarget}
                        onChange={(e) => setConfig({ cyclesTarget: Math.max(1, Number(e.target.value)) })}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                A contagem começa do zero e você pode salvar a sessão a qualquer momento sem parar o timer.
              </p>
            )}
          </div>

          {/* Bottom strip */}
          <div className="mt-5 flex items-center gap-2 border-t border-border/60 bg-muted/30 px-5 py-3">
            <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              Estas configurações ficam ocultas durante a sessão ativa.
            </p>
          </div>
        </div>
      ) : (
        /* Collapsed config during active session */
        <button
          type="button"
          onClick={() => setConfigOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          <span className="flex items-center gap-2">
            <Settings2 className="h-3.5 w-3.5" />
            Configurações ({modeLabels[mode]}{disciplinaNome ? ` · ${disciplinaNome}` : ""})
          </span>
          {configOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      )}

      {/* Collapsible config during active session */}
      {timerActive && configOpen ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Modo</label>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none"
                value={mode}
                onChange={(e) => setMode(e.target.value as "pomodoro" | "livre" | "cronometro")}
              >
                <option value="pomodoro">Pomodoro (ciclos)</option>
                <option value="livre">Tempo livre (countdown)</option>
                <option value="cronometro">Cronômetro (count-up)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Disciplina</label>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none"
                value={disciplinaId ?? ""}
                onChange={(e) => setDisciplinaId(e.target.value || null)}
              >
                <option value="" disabled>Selecione...</option>
                {(disciplinas ?? []).map((d) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Timer ── */}
      <PomodoroTimer
        onActiveChange={setTimerActive}
        disciplinaNome={disciplinaNome}
      />

      <RegistroEstudoModal
        open={openRegistro}
        onClose={() => setOpenRegistro(false)}
        defaultDisciplinaId={disciplinaId}
      />
    </div>
  );
}
