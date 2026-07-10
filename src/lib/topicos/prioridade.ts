/** Intervalos (dias) do ciclo de revisão espaçada — espelha o backend. */
export const INTERVALOS_REVISAO = [1, 3, 7, 15, 30] as const;

export const DOMINIO_LABELS = [
  "",
  "nunca vi",
  "pouco domínio",
  "domínio médio",
  "bom domínio",
  "domínio total",
] as const;

/** prioridade = peso × (6 − domínio) */
export function prioridadeAssunto(peso: number, dominio: number): number {
  return Math.round(peso * (6 - dominio));
}

export function prioridadeDisciplina(
  assuntos: Array<{ peso: number; dominio: number }>,
): number {
  return assuntos.reduce((s, a) => s + prioridadeAssunto(a.peso, a.dominio), 0);
}

export function dominioMedioPct(assuntos: Array<{ dominio: number }>): number {
  if (assuntos.length === 0) return 0;
  const media = assuntos.reduce((s, a) => s + a.dominio, 0) / assuntos.length;
  return Math.round((media / 5) * 100);
}

function diasDesde(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00");
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  return Math.floor((hoje.getTime() - d.getTime()) / 86_400_000);
}

/** Retorna chip de revisão espaçada quando domínio = 5. */
export function revisaoChip(
  dominio: number,
  ultimaRevisaoEm: string | null | undefined,
  intervaloIdx: number,
): { label: string; variant: "overdue" | "ok" | "none" } {
  if (dominio < 5) return { label: "", variant: "none" };
  const idx = Math.min(Math.max(intervaloIdx, 0), INTERVALOS_REVISAO.length - 1);
  const intervalo = INTERVALOS_REVISAO[idx];
  const dias = diasDesde(ultimaRevisaoEm);
  if (dias === null) return { label: "revisar", variant: "overdue" };
  const atraso = dias - intervalo;
  if (atraso > 0) return { label: `atrasado ${atraso}d`, variant: "overdue" };
  return { label: `revisa em ${-atraso}d`, variant: "ok" };
}
