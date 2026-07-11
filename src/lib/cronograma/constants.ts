import type { Bloco, FormState, TipoBadge } from "@/lib/cronograma/types";

export const DIAS: Bloco["dia_semana"][] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

export const diaLabels: Record<Bloco["dia_semana"], string> = {
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
  dom: "Domingo",
};

export const diaAbrev: Record<Bloco["dia_semana"], string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
  dom: "Dom",
};

export const diaIndex: Record<Bloco["dia_semana"], number> = {
  dom: 0,
  seg: 1,
  ter: 2,
  qua: 3,
  qui: 4,
  sex: 5,
  sab: 6,
};

export const tipoMap: Record<string, TipoBadge> = {
  estudo: { label: "Estudo", cls: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" },
  revisao: { label: "Revisão", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  questoes: { label: "Questões", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  livre: { label: "Livre", cls: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300" },
  pomodoro: { label: "Pomodoro", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
};

export function getTipo(tipo: string): TipoBadge {
  return tipoMap[tipo.toLowerCase()] ?? { label: tipo, cls: "bg-neutral-100 text-neutral-500" };
}

/** Cor sólida (bolinha/acento) por tipo de bloco — tokens Tailwind, sem hex. */
export const tipoDotMap: Record<string, string> = {
  estudo: "bg-primary-500",
  revisao: "bg-amber-500",
  questoes: "bg-emerald-500",
  livre: "bg-neutral-400",
  pomodoro: "bg-rose-500",
};

export function getTipoDot(tipo: string): string {
  return tipoDotMap[tipo.toLowerCase()] ?? "bg-neutral-400";
}

export function fmtHorasStats(h: number | undefined): string {
  if (!h || h <= 0) return "—";
  const totalMin = Math.round(h * 60);
  if (totalMin < 60) return `${totalMin} min`;
  const hrs = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return min > 0 ? `${hrs}h ${min}min` : `${hrs}h`;
}

/** Duração de um bloco a partir de hora_inicio / hora_fim (HH:MM). */
export function blocoDurationHours(horaInicio: string, horaFim: string): number {
  const [sh, sm] = horaInicio.split(":").map(Number);
  const [eh, em] = horaFim.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

/** Duração de um bloco a partir de hora_inicio / hora_fim (HH:MM), em minutos. */
export function blocoDurationMinutes(horaInicio: string, horaFim: string): number {
  return Math.round(blocoDurationHours(horaInicio, horaFim) * 60);
}

/** Exibe duração do bloco em minutos (ex.: `50 min`), nunca em fração de horas. */
export function fmtBlocoMinutos(min: number): string {
  if (min <= 0) return "—";
  return `${min} min`;
}

/** @deprecated Preferir `fmtBlocoMinutos` — mantido para chamadas legadas que passam horas. */
export function fmtBlocoHoras(h: number): string {
  return fmtBlocoMinutos(Math.round(h * 60));
}

export type BlocoDiaAgrupado = {
  disciplina_id: string;
  horas: number;
  blocoIds: string[];
  bloco: Bloco;
};

/** Agrupa blocos do mesmo dia por disciplina (soma duração), como na prévia do automático. */
export function aggregateBlocosPorDisciplina(blocos: Bloco[]): BlocoDiaAgrupado[] {
  const map = new Map<string, BlocoDiaAgrupado>();
  for (const b of blocos) {
    const h = blocoDurationHours(b.hora_inicio, b.hora_fim);
    const cur = map.get(b.disciplina_id);
    if (!cur) {
      map.set(b.disciplina_id, { disciplina_id: b.disciplina_id, horas: h, blocoIds: [b.id], bloco: b });
    } else {
      cur.horas += h;
      cur.blocoIds.push(b.id);
    }
  }
  return [...map.values()].sort((a, b) => a.bloco.hora_inicio.localeCompare(b.bloco.hora_inicio));
}

export const defaultForm: FormState = {
  disciplina_id: "",
  dia_semana: "seg",
  hora_inicio: "08:00",
  hora_fim: "09:00",
  tipo: "estudo",
  ativo: true,
};
