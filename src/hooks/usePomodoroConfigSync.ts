import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/services/api";
import { usePomodoroStore, type PomodoroMode } from "@/stores/pomodoroStore";

export type PomodoroConfigApi = {
  id: string;
  mode: PomodoroMode;
  focus_hours: number;
  focus_minutes: number;
  short_break_minutes: number;
  long_break_minutes: number;
  cycles_target: number;
  last_disciplina_id: string | null;
  last_topico_id: string | null;
  focus_total_seconds: number;
};

export function usePomodoroConfigSync(options?: { skipInitialHydration?: boolean }) {
  const skipInitialHydration = options?.skipInitialHydration ?? false;
  const qc = useQueryClient();
  const setConfig = usePomodoroStore((s) => s.setConfig);
  const setMode = usePomodoroStore((s) => s.setMode);
  const setDisciplinaId = usePomodoroStore((s) => s.setDisciplinaId);
  const setTopicoId = usePomodoroStore((s) => s.setTopicoId);

  const query = useQuery({
    queryKey: ["pomodoro-config"],
    queryFn: async () => (await api.get("/pomodoro-config")).data as PomodoroConfigApi,
  });

  const hydratedRef = React.useRef(false);

  React.useEffect(() => {
    if (skipInitialHydration) {
      // Evita que, ao limpar a query string do launch, a hidratação sobrescreva o store.
      hydratedRef.current = true;
      return;
    }
    if (!query.data || hydratedRef.current) return;
    hydratedRef.current = true;
    const cfg = query.data;
    setMode(cfg.mode);
    setConfig({
      focusHours: cfg.focus_hours,
      focusMinutes: cfg.focus_minutes,
      shortBreakMinutes: cfg.short_break_minutes,
      longBreakMinutes: cfg.long_break_minutes,
      cyclesTarget: cfg.cycles_target,
    });
    if (cfg.last_disciplina_id) setDisciplinaId(cfg.last_disciplina_id);
    if (cfg.last_topico_id) setTopicoId(cfg.last_topico_id);
  }, [query.data, setConfig, setDisciplinaId, setMode, setTopicoId, skipInitialHydration]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.put("/pomodoro-config", payload)).data as PomodoroConfigApi,
    onSuccess: (data) => {
      qc.setQueryData(["pomodoro-config"], data);
    },
  });

  return { query, saveMutation };
}
