export function isValidISODate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export type CalendarioUrlState = {
  ano: number;
  mes: number;
  data: string | null;
};

/** `data` wins over ano/mes when valid. Invalid params → current month, no data. */
export function parseCalendarioSearchParams(params: URLSearchParams): CalendarioUrlState {
  const now = new Date();
  const fallback: CalendarioUrlState = {
    ano: now.getFullYear(),
    mes: now.getMonth() + 1,
    data: null,
  };

  const dataRaw = params.get("data");
  if (isValidISODate(dataRaw)) {
    const [y, m] = dataRaw.split("-").map(Number);
    return { ano: y, mes: m, data: dataRaw };
  }

  const ano = Number(params.get("ano"));
  const mes = Number(params.get("mes"));
  if (
    Number.isInteger(ano) &&
    ano >= 2000 &&
    ano <= 2100 &&
    Number.isInteger(mes) &&
    mes >= 1 &&
    mes <= 12
  ) {
    return { ano, mes, data: null };
  }

  return fallback;
}

export function calendarioHref(ano: number, mes: number, data?: string | null): string {
  const p = new URLSearchParams();
  p.set("ano", String(ano));
  p.set("mes", String(mes));
  if (data && isValidISODate(data)) p.set("data", data);
  return `/estudos/calendario?${p.toString()}`;
}
