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
