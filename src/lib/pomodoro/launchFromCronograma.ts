import { toast } from "sonner";

import type { Bloco } from "@/lib/cronograma/types";
import { blocoTopicoIds } from "@/lib/cronograma/types";
import { clampFocusDuration } from "@/lib/pomodoro/duration";
import { usePomodoroStore } from "@/stores/pomodoroStore";

export type PomodoroLaunchParams = {
  source: PomodoroLaunchSource;
  disciplinaId: string;
  topicoId: string | null;
  minutos: number;
  revisaoId?: string;
  revisaoVersao?: number;
  concursoId?: string;
  blocoId?: string;
  itemId?: string;
  dataReferencia?: string;
  returnTo?: string;
};

export type PomodoroLaunchSource = "cronograma" | "dashboard" | "revisao" | "edital";

const LAUNCH_SOURCES = new Set<PomodoroLaunchSource>(["cronograma", "dashboard", "revisao", "edital"]);

/** AC6: N=1 → topico_id; N=0 ou N>1 → sem topico_id (disciplina + minutos). */
export function resolvePomodoroTopicoId(
  bloco: Pick<Bloco, "disciplina_id" | "topico_id" | "topico_ids">,
): string | null {
  const ids = blocoTopicoIds(bloco);
  return ids.length === 1 ? ids[0] : null;
}

export function buildPomodoroLaunchUrl(
  bloco: Pick<Bloco, "disciplina_id" | "topico_id" | "topico_ids"> & Partial<Pick<Bloco, "id" | "concurso_id" | "cronograma_item_id" | "bloco_cronograma_id" | "data">> & { data_referencia?: string },
  minutos: number,
): string {
  return buildPomodoroLaunchUrlFromStudy({
    source: "cronograma",
    disciplinaId: bloco.disciplina_id,
    topicoId: resolvePomodoroTopicoId(bloco),
    minutos,
    blocoId: bloco.cronograma_item_id ? undefined : bloco.bloco_cronograma_id ?? bloco.id,
    itemId: bloco.cronograma_item_id ?? undefined,
    concursoId: bloco.concurso_id ?? undefined,
    dataReferencia: bloco.data_referencia ?? bloco.data,
  });
}

export function buildPomodoroLaunchUrlFromStudy({
  source,
  disciplinaId,
  topicoId,
  minutos,
  concursoId,
  blocoId,
  itemId,
  dataReferencia,
  returnTo,
}: PomodoroLaunchParams): string {
  if (!Number.isInteger(minutos) || minutos < 1 || minutos > 480) {
    throw new Error("invalid_pomodoro_duration");
  }
  const params = new URLSearchParams({
    from: source,
    disciplina_id: disciplinaId,
    minutos: String(minutos),
  });
  if (topicoId) params.set("topico_id", topicoId);
  if (concursoId) params.set("concurso_id", concursoId);
  if (blocoId) params.set("bloco_id", blocoId);
  if (itemId) params.set("item_id", itemId);
  if (dataReferencia) params.set("data_referencia", dataReferencia);
  if (source === "edital") {
    if (!concursoId || !topicoId) throw new Error("invalid_edital_context");
    params.set("concurso_id", concursoId);
    params.set("return_to", allowlistedReturnTo(returnTo, "/disciplinas"));
  }
  return `/pomodoro?${params.toString()}`;
}

export function buildPomodoroRevisionLaunchUrl(params: {
  revisaoId: string;
  revisaoVersao: number;
  concursoId: string;
  disciplinaId: string;
  topicoId: string;
  minutos: number;
  returnTo: string;
}) {
  if (!Number.isInteger(params.minutos) || params.minutos < 1 || params.minutos > 480) {
    throw new Error("invalid_pomodoro_duration");
  }
  const search = new URLSearchParams({
    from: "revisao",
    revisao_id: params.revisaoId,
    revisao_versao: String(params.revisaoVersao),
    concurso_id: params.concursoId,
    disciplina_id: params.disciplinaId,
    topico_id: params.topicoId,
    minutos: String(params.minutos),
    return_to: allowlistedReturnTo(params.returnTo, "/revisoes"),
  });
  return `/pomodoro?${search.toString()}`;
}

export function parsePomodoroLaunchParams(searchParams: URLSearchParams): PomodoroLaunchParams | null {
  const source = searchParams.get("from") as PomodoroLaunchSource | null;
  if (!source || !LAUNCH_SOURCES.has(source)) return null;
  const disciplinaId = searchParams.get("disciplina_id");
  const minutosRaw = searchParams.get("minutos");
  if (!disciplinaId || !minutosRaw) return null;
  const minutos = Number(minutosRaw);
  if (!Number.isInteger(minutos) || minutos < 1 || minutos > 480) return null;
  const topicoId = searchParams.get("topico_id");
  const parsed: PomodoroLaunchParams = {
    source,
    disciplinaId,
    topicoId: topicoId || null,
    minutos,
  };
  if (source === "cronograma" || source === "dashboard") {
    parsed.blocoId = searchParams.get("bloco_id") || undefined;
    parsed.itemId = searchParams.get("item_id") || undefined;
    if (parsed.blocoId && parsed.itemId) return null;
    parsed.concursoId = searchParams.get("concurso_id") || undefined;
    const refDate = searchParams.get("data_referencia");
    if (refDate && !/^\d{4}-\d{2}-\d{2}$/.test(refDate)) return null;
    parsed.dataReferencia = refDate || undefined;
  }
  if (source === "revisao") {
    const revisaoId = searchParams.get("revisao_id");
    const revisaoVersao = Number(searchParams.get("revisao_versao"));
    const concursoId = searchParams.get("concurso_id");
    if (!revisaoId || !Number.isInteger(revisaoVersao) || revisaoVersao < 1 || !concursoId || !topicoId) return null;
    parsed.revisaoId = revisaoId;
    parsed.revisaoVersao = revisaoVersao;
    parsed.concursoId = concursoId;
    const returnTo = searchParams.get("return_to");
    parsed.returnTo = allowlistedReturnTo(returnTo, "/revisoes");
  } else if (source === "edital") {
    const concursoId = searchParams.get("concurso_id");
    if (!concursoId || !topicoId) return null;
    parsed.concursoId = concursoId;
    parsed.returnTo = allowlistedReturnTo(searchParams.get("return_to"), "/disciplinas");
  }
  return parsed;
}

export function hasPomodoroLaunchParams(searchParams: URLSearchParams): boolean {
  return parsePomodoroLaunchParams(searchParams) !== null;
}

/** Chave estável para detectar novo launch (mesmo componente montado). */
export function pomodoroLaunchSignature(params: PomodoroLaunchParams): string {
  return `${params.source}|${params.disciplinaId}|${params.topicoId ?? ""}|${params.minutos}|${params.revisaoId ?? ""}|${params.revisaoVersao ?? ""}|${params.concursoId ?? ""}${params.blocoId || params.itemId || params.dataReferencia ? `|${params.blocoId ?? ""}|${params.itemId ?? ""}|${params.dataReferencia ?? ""}` : ""}`;
}

export function applyPomodoroLaunchToStore(params: PomodoroLaunchParams): { focusHours: number; focusMinutes: number } {
  const { hours, minutes } = clampFocusDuration(Math.floor(params.minutos / 60), params.minutos % 60);
  const store = usePomodoroStore.getState();
  store.setMode("livre");
  store.setDisciplinaId(params.disciplinaId);
  store.setTopicoId(params.topicoId);
  store.setFocusDuration(hours, minutes);
  store.setConfig({ activityContext: { disciplinaId: params.disciplinaId, concursoId: params.concursoId, blocoId: params.blocoId, itemId: params.itemId, dataReferencia: params.dataReferencia } });
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
  bloco: Pick<Bloco, "disciplina_id" | "topico_id" | "topico_ids"> & Partial<Pick<Bloco, "id" | "concurso_id" | "cronograma_item_id" | "bloco_cronograma_id" | "data">> & { data_referencia?: string },
  minutos: number,
): boolean {
  if (minutos < 1) {
    toast.error("Duração inválida para iniciar no Pomodoro.");
    return false;
  }
  navigate(buildPomodoroLaunchUrl(bloco, minutos));
  return true;
}

function allowlistedReturnTo(value: string | null | undefined, fallback: "/revisoes" | "/disciplinas") {
  if (!value?.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.startsWith("/revisoes") || value.startsWith("/disciplinas")) return value;
  return fallback;
}
