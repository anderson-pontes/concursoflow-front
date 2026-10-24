import type { ConfigPlanejamento, DisciplinaPlanoInput } from "@/types/planejamento";

export const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const WEEK_DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
export function durationLabel(minutes: number) {
  const rounded = Math.round(minutes);
  return rounded >= 60 ? `${Math.floor(rounded / 60)}h${rounded % 60 ? ` ${rounded % 60}min` : ""}` : `${rounded} min`;
}
export function durationInput(minutes: number) { return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; }
export function parseDuration(text: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(text.trim());
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes <= 1440 ? minutes : null;
}
/** Mirrors dividir_capacidade: smaller-than-minimum days are skipped; invalid partitions fail. */
export function dailySlots(minutes: number, minimum: number, maximum: number): number | null {
  if (minutes < minimum) return 0;
  let count = Math.ceil(minutes / maximum);
  if (Math.floor(minutes / count) < minimum) count = Math.floor(minutes / minimum);
  if (!count || Math.floor(minutes / count) < minimum || Math.ceil(minutes / count) > maximum) return null;
  return count;
}
export function planningValidation(config: ConfigPlanejamento, disciplines: DisciplinaPlanoInput[]) {
  const errors: string[] = [];
  const {sessao_min_minutos: min, sessao_max_minutos: max} = config;
  if (![min, max].every(n => Number.isInteger(n) && n >= 5 && n <= 240)) errors.push("As sessões devem ter entre 5 e 240 minutos inteiros.");
  else if (min > max) errors.push("A sessão mínima não pode ser maior que a máxima.");
  const start = new Date(`${config.data_inicio}T00:00:00Z`), end = new Date(`${config.data_fim}T00:00:00Z`);
  if (!Number.isFinite(+start) || !Number.isFinite(+end)) errors.push("Informe as datas de início e fim.");
  else if (start > end) errors.push("A data de início não pode ultrapassar a data final.");
  if (disciplines.some(d => d.ativa && (!Number.isInteger(d.peso) || d.peso < 1 || d.peso > 10))) errors.push("O peso de cada disciplina deve ser um número inteiro de 1 a 10.");
  const values = Array.from({length: 7}, (_, i) => config.disponibilidade_minutos[i] ?? 0);
  if (values.some(n => !Number.isInteger(n) || n < 0 || n > 1440)) errors.push("Informe durações válidas de até 24 horas por dia.");
  else if (!values.some(n => n > 0)) errors.push("Selecione pelo menos um dia de estudo.");
  const warnings: string[] = [];
  let slots = 0;
  if (!errors.length) {
    const occurrences = values.map((_, i) => {
      const offset = (i - ((start.getUTCDay() + 6) % 7) + 7) % 7;
      const length = Math.floor((+end - +start) / 86400000) + 1;
      return offset >= length ? 0 : Math.floor((length - 1 - offset) / 7) + 1;
    });
    values.forEach((minutes, i) => {
      const count = dailySlots(minutes, min, max);
      if (minutes > 0 && count === 0) warnings.push(`${WEEK_DAY_NAMES[i]}: ${durationLabel(minutes)} não comportam uma sessão mínima de ${min} min. Esse dia não gerará sessões.`);
      if (occurrences[i] && count === null) errors.push(`${WEEK_DAY_NAMES[i]}: não é possível dividir ${durationLabel(minutes)} em sessões de ${min} a ${max} min. Ajuste a duração ou os limites.`);
      slots += (count ?? 0) * occurrences[i];
    });
    if (!slots) errors.push("Não há capacidade para sessões no período escolhido. Ajuste os dias, as datas ou a sessão mínima.");
    else if (slots < disciplines.filter(d => d.ativa).length) errors.push("O período não comporta ao menos uma sessão para cada disciplina. Amplie o período ou a disponibilidade.");
  }
  return {errors, warnings, slots};
}
