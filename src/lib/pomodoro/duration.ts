export const MAX_FOCUS_HOURS = 8;
export const MAX_FOCUS_MINUTES = 59;
export const MIN_FOCUS_TOTAL_SECONDS = 60;
export const MAX_FOCUS_TOTAL_SECONDS = MAX_FOCUS_HOURS * 3600;

export function getFocusTotalSeconds(hours: number, minutes: number): number {
  return Math.max(0, hours) * 3600 + Math.max(0, minutes) * 60;
}

export function clampFocusDuration(hours: number, minutes: number): { hours: number; minutes: number } {
  let h = Math.min(MAX_FOCUS_HOURS, Math.max(0, Math.floor(hours)));
  let m = Math.min(MAX_FOCUS_MINUTES, Math.max(0, Math.floor(minutes)));
  let total = getFocusTotalSeconds(h, m);

  if (total < MIN_FOCUS_TOTAL_SECONDS) {
    if (h === 0 && m === 0) m = 1;
    total = getFocusTotalSeconds(h, m);
  }

  if (total > MAX_FOCUS_TOTAL_SECONDS) {
    h = MAX_FOCUS_HOURS;
    m = 0;
  }

  return { hours: h, minutes: m };
}

export function formatFocusDurationLabel(hours: number, minutes: number): string {
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes} min`);
  return parts.join(" ");
}

export function formatTimerDisplay(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}
