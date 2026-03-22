export function onlyDigitsCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export function isValidCpf(cpf: string): boolean {
  const d = onlyDigitsCpf(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const calc = (base: string, weights: number[]) => {
    const s = base.split("").reduce((acc, digit, i) => acc + parseInt(digit, 10) * weights[i]!, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(d.slice(0, 9), w1);
  const d2 = calc(d.slice(0, 9) + String(d1), w2);
  return d[9] === String(d1) && d[10] === String(d2);
}
