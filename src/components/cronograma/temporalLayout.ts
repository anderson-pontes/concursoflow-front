import type { Bloco } from "@/lib/cronograma/types";

export function timeMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

/** Place overlapping events in separate lanes; tiny and unknown intervals use the agenda. */
export function layoutDay(items: Bloco[]) {
  const agenda: Bloco[] = [];
  const timed: { bloco: Bloco; start: number; end: number; lane: number }[] = [];
  for (const bloco of items) {
    const start = timeMinutes(bloco.hora_inicio);
    const end = timeMinutes(bloco.hora_fim);
    if (start === null || end === null || end - start < 60) agenda.push(bloco);
    else timed.push({ bloco, start, end, lane: 0 });
  }
  timed.sort((a, b) => a.start - b.start || a.end - b.end);
  const laneEnds: number[] = [];
  for (const event of timed) {
    let lane = laneEnds.findIndex(end => end <= event.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = event.end;
    event.lane = lane;
  }
  return { timed, agenda, lanes: Math.max(1, laneEnds.length) };
}
