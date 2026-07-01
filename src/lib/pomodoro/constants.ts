import type { PomodoroMode } from "@/stores/pomodoroStore";

export const POMODORO_DEFAULTS = {
  focusHours: 0,
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesTarget: 4,
} as const;

export const MODE_OPTIONS: { value: PomodoroMode; label: string; hint: string }[] = [
  {
    value: "pomodoro",
    label: "Pomodoro",
    hint: "Ciclos de foco e pausa com registro automático ao concluir cada bloco.",
  },
  {
    value: "livre",
    label: "Tempo livre",
    hint: "Countdown único — ideal para blocos personalizados de estudo.",
  },
  {
    value: "cronometro",
    hint: "Contagem progressiva — salve quando quiser sem interromper o timer.",
    label: "Cronômetro",
  },
];

export const MODE_LABELS: Record<PomodoroMode, string> = {
  pomodoro: "Pomodoro",
  livre: "Tempo livre",
  cronometro: "Cronômetro",
};
