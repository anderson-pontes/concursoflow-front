/** Formata horas decimais da API como "Xh Ymin" (sem fração decimal). */
export function fmtHoras(h: number) {
  const totalMin = Math.max(0, Math.round(Number(h) * 60));
  if (totalMin <= 0) return "0 min";
  if (totalMin < 60) return `${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins ? `${hours}h ${mins}min` : `${hours}h`;
}

export function fmtTempoTopico(min: number) {
  if (min <= 0) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}
