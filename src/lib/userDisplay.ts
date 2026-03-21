/**
 * Extrai o primeiro nome para saudações e UI curta.
 * Ex.: "Anderson Pontes" → "Anderson"
 */
export function primeiroNome(fullName: string | null | undefined, fallback = "Concurseiro"): string {
  if (!fullName?.trim()) return fallback;
  const part = fullName.trim().split(/\s+/)[0];
  if (!part) return fallback;
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}
