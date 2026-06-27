export function fmtHoras(h: number) {
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;
}

export function fmtTempoTopico(min: number) {
  if (min <= 0) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}
