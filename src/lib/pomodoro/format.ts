export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatMMSS(seconds: number) {
  const total = Math.abs(seconds);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function formatHHMMSS(seconds: number) {
  const total = Math.abs(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
