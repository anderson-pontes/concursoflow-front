import { isValid, parseISO, startOfDay } from "date-fns";
import type { Concurso } from "@/lib/concursos/types";

export function isEncerradoStatus(status: string) {
  return status === "realizado" || status === "eliminado";
}

export function getProximaProva(concursos: Concurso[], now = new Date()): Date | null {
  const today = startOfDay(now).getTime();
  const dates = concursos.flatMap((concurso) => {
    if (isEncerradoStatus(concurso.status) || !concurso.data_prova) return [];
    const date = parseISO(concurso.data_prova);
    return isValid(date) && startOfDay(date).getTime() >= today ? [date] : [];
  });
  return dates.sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
}
