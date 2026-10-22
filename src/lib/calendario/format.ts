import { fmtBlocoMinutos } from "@/lib/cronograma/constants";

export function fmtMinutosEstudo(min: number): string {
  return fmtBlocoMinutos(min);
}

export function fmtMesAno(ano: number, mes: number): string {
  const nomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${nomes[mes - 1]} ${ano}`;
}

/** Calendar presentation only; raw minutes and schedule calculations are unchanged. */
export function fmtDuracaoCalendario(minutos: number): string {
  if (!Number.isFinite(minutos)) return "—";
  const total = Math.max(0, Math.round(minutos));
  const horas = Math.floor(total / 60), resto = total % 60;
  return horas ? `${horas}h${resto ? ` ${String(resto).padStart(2,"0")}min` : ""}` : `${resto} min`;
}
