import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { api } from "@/services/api";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";

type Disciplina = {
  id: string;
  concurso_id: string;
  nome: string;
  sigla: string | null;
  total_questoes_prova: number | null;
  peso: number | null;
  prioridade: number | null;
  cor_hex: string | null;
  ordem: number;
  created_at: string;
};

export function Pomodoro() {
  const [searchParams] = useSearchParams();
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Pomodoro</h2>
        <p className="text-sm text-muted-foreground">Timer e registro automático das sessões.</p>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Modo</span>
            <select
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={mode}
              onChange={(e) => setMode(e.target.value as "pomodoro" | "livre")}
            >
              <option value="pomodoro">Pomodoro</option>
              <option value="livre">Tempo Livre</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Disciplina</span>
            {isLoading ? (
              <div className="mt-1 text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <select
                className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                value={disciplinaId ?? ""}
                onChange={(e) => setDisciplinaId(e.target.value || null)}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {(disciplinas ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium">Foco (min)</span>
            <input
              type="number"
              min={5}
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={focusMinutes}
              onChange={(e) => setConfig({ focusMinutes: Number(e.target.value) })}
            />
          </label>
          {mode === "pomodoro" ? (
            <>
              <label className="block">
                <span className="text-sm font-medium">Pausa curta (min)</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                  value={shortBreakMinutes}
                  onChange={(e) => setConfig({ shortBreakMinutes: Number(e.target.value) })}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Pausa longa (min)</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                  value={longBreakMinutes}
                  onChange={(e) => setConfig({ longBreakMinutes: Number(e.target.value) })}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Ciclos</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                  value={cyclesTarget}
                  onChange={(e) => setConfig({ cyclesTarget: Number(e.target.value) })}
                />
              </label>
            </>
          ) : null}
        </div>
      </div>

      <PomodoroTimer />
    </div>
  );
}

