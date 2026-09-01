import { isAxiosError } from "axios";

import { diaLabels } from "@/lib/cronograma/constants";

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}

export function editTitleForModo(modo: string | undefined): string {
  if (modo === "automatica") return "Editar horário (Automática)";
  if (modo === "simplificada") return "Editar horário (Simplificada)";
  return "Editar horário (Analítica)";
}

export function diaLabelFromISO(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const weekDay = new Date(year, month - 1, day).getDay();
  const keys = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;
  return diaLabels[keys[weekDay]];
}

export function buildCalendarioSearch(
  ano: number,
  mes: number,
  data: string | null,
): URLSearchParams {
  const next = new URLSearchParams({ ano: String(ano), mes: String(mes) });
  if (data) next.set("data", data);
  return next;
}
