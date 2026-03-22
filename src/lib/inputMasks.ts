/** Mantém apenas dígitos, limitado a `max`. */
export function digitsOnly(value: string, max: number): string {
  return value.replace(/\D/g, "").slice(0, max);
}

/** 000.000.000-00 */
export function maskCpf(value: string): string {
  const d = digitsOnly(value, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function unmaskCpf(value: string): string {
  return digitsOnly(value, 11);
}

/** 00000-000 */
export function maskCep(value: string): string {
  const d = digitsOnly(value, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function unmaskCep(value: string): string {
  return digitsOnly(value, 8);
}

/** (00) 00000-0000 ou (00) 0000-0000 */
export function maskPhoneBr(value: string): string {
  const d = digitsOnly(value, 11);
  if (d.length === 0) return "";
  const rest = d.length <= 10 ? d : d.slice(0, 11);
  let out = "(" + rest.slice(0, 2);
  if (rest.length >= 2) out += ") ";
  if (rest.length <= 2) return out;
  if (rest.length <= 6) {
    out += rest.slice(2);
    return out;
  }
  if (rest.length <= 10) {
    out += rest.slice(2, 6) + "-" + rest.slice(6);
    return out;
  }
  out += rest.slice(2, 7) + "-" + rest.slice(7);
  return out;
}

export function unmaskPhone(value: string): string {
  return digitsOnly(value, 11);
}
