function dateOnlyParts(value: string): [number, number, number] {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return [year, month, day];
}

function utcDay(value: string | Date): number {
  if (typeof value === "string") {
    const [year, month, day] = dateOnlyParts(value);
    return Date.UTC(year, month - 1, day);
  }
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
}

export function calendarDaysFromToday(value: string, today = new Date()): number {
  return Math.round((utcDay(value) - utcDay(today)) / 86_400_000);
}

function dateOnlyAtUtc(value: string): Date {
  const [year, month, day] = dateOnlyParts(value);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatExamDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateOnlyAtUtc(value));
}

export function formatStudyDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  }).format(dateOnlyAtUtc(value));
}

export function formatNumericDate(value: string): string {
  const [year, month, day] = dateOnlyParts(value);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}
