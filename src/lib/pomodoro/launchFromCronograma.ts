import { toast } from "sonner";

import type { Bloco } from "@/lib/cronograma/types";
import { blocoTopicoIds } from "@/lib/cronograma/types";
import { clampFocusDuration } from "@/lib/pomodoro/duration";
import { usePomodoroStore } from "@/stores/pomodoroStore";

export type PomodoroLaunchParams = {
  disciplinaId: string;
  topicoId: string | null;
  minutos: number;
};

const LAUNCH_FROM = "cronograma";

/** AC6: N=1 → topico_id; N=0 ou N>1 → sem topico_id (disciplina + minutos). */
export function resolvePomodoroTopicoId(
  bloco: Pick<Bloco, "disciplina_id" | "topico_id" | "topico_ids">,
): string | null {
  const ids = blocoTopicoIds(bloco);
  return ids.length === 1 ? ids[0] : null;
}

export function buildPomodoroLaunchUrl(
  bloco: Pick<Bloco, "disciplina_id" | "topico_id" | "topico_ids">,
  minutos: number,
): string {
  const params = new URLSearchParams({
    from: LAUNCH_FROM,
    disciplina_id: bloco.disciplina_id,
    minutos: String(minutos),
  });
  const topicoId = resolvePomodoroTopicoId(bloco);
  if (topicoId) params.set("topico_id", topicoId);
  return `/pomodoro?${params.toString()}`;
}

export function parsePomodoroLaunchParams(searchParams: URLSearchParams): PomodoroLaunchParams | null {
  if (searchParams.get("from") !== LAUNCH_FROM) return null;
  const disciplinaId = searchParams.get("disciplina_id");
  const minutosRaw = searchParams.get("minutos");
  if (!disciplinaId || !minutosRaw) return null;
  const minutos = parseInt(minutosRaw, 10);
  if (!Number.isFinite(minutos) || minutos < 1) return null;
  const topicoId = searchParams.get("topico_id");
  return {
    disciplinaId,
    topicoId: topicoId || null,
    minutos,
  };
}

export function hasPomodoroLaunchParams(searchParams: URLSearchParams): boolean {
  return parsePomodoroLaunchParams(searchParams) !== null;
}

/** Chave estável para detectar novo launch (mesmo componente montado). */
export function pomodoroLaunchSignature(params: PomodoroLaunchParams): string {
  return `${params.disciplinaId}|${params.topicoId ?? ""}|${params.minutos}`;
}

export function applyPomodoroLaunchToStore(params: PomodoroLaunchParams): { focusHours: number; focusMinutes: number } {
  const { hours, minutes } = clampFocusDuration(Math.floor(params.minutos / 60), params.minutos % 60);
  const store = usePomodoroStore.getState();
  store.setMode("livre");
  store.setDisciplinaId(params.disciplinaId);
  store.setTopicoId(params.topicoId);
  store.setFocusDuration(hours, minutes);
  return { focusHours: hours, focusMinutes: minutes };
}

export function buildDisciplinaDashboardUrl(
  disciplinaId: string,
  topicoId?: string | null,
): string {
  const base = `/disciplinas/${disciplinaId}`;
  if (!topicoId) return base;
  return `${base}?topico=${encodeURIComponent(topicoId)}`;
}

/** Valida minutos e navega; retorna false se inválido. */
export function launchPomodoroFromBloco(
  navigate: (to: string) => void,
  bloco: Pick<Bloco, "disciplina_id" | "topico_id" | "topico_ids">,
  minutos: number,
): boolean {
  if (minutos < 1) {
    toast.error("Duração inválida para iniciar no Pomodoro.");
    return false;
  }
  navigate(buildPomodoroLaunchUrl(bloco, minutos));
  return true;
}
