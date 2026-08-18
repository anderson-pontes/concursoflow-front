import { Minus, Plus } from "lucide-react";

export type DisciplinaOpt = { id: string; nome: string };
export type TopicoOpt = { id: string; nome: string; status?: string };
export type RegistroDefaultTopico = { id: string; nome: string };
export type RegistroEstudoModalProps = {
  open: boolean;
  onClose: () => void;
  defaultDisciplinaId?: string | null;
  defaultConcursoId?: string | null;
  defaultTopicos?: RegistroDefaultTopico[] | null;
  defaultDuracaoSegundos?: number | null;
  defaultAcertos?: number | null;
  defaultErros?: number | null;
  defaultBranco?: number | null;
  sessaoId?: string | null;
  defaultDataReferencia?: string | null;
  onSaved?: () => void;
};

export type SessaoEstudoApi = {
  id: string;
  disciplina_id: string;
  topico_id: string | null;
  topico_ids: string[];
  plano_id: string | null;
  concurso_id: string | null;
  modalidade: "teoria" | "questoes" | "revisao" | null;
  categoria_id: string | null;
  data_referencia: string | null;
  inicio: string;
  fim: string | null;
  duracao_minutos: number;
  tempo_estudo_segundos: number;
  material: string | null;
  comentarios: string | null;
  teoria_finalizada: boolean;
  contabilizar_no_planejamento: boolean;
  programar_revisoes: boolean;
  revisoes_dias: number[];
  questoes_acertos: number;
  questoes_erros: number;
  questoes_em_branco: number;
  paginas_blocos: { inicio: number; fim: number }[];
};

export const NOVA_CATEGORIA_VALUE = "__nova_categoria__";
export const NONE_DISCIPLINA = "__none_disciplina__";

export function fmtDateValue(kind: "hoje" | "ontem" | "outro", custom: string) {
  if (kind === "outro") return custom;
  const date = new Date();
  if (kind === "ontem") date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function hmsToSeconds(hours: number, minutes: number, seconds: number) {
  return hours * 3600 + minutes * 60 + seconds;
}

export function fmtHms(hours: number, minutes: number, seconds: number) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimeSegment({ label, value, onInc, onDec }: { label: string; value: number; onInc: () => void; onDec: () => void }) {
  return (
    <div className="flex-1 rounded-lg border-[0.5px] border-slate-200/90 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <button type="button" onClick={onDec} className="inline-flex h-10 w-10 items-center justify-center rounded-md border-[0.5px] border-slate-300 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800" aria-label={`Diminuir ${label.toLowerCase()}`}><Minus className="h-3.5 w-3.5" /></button>
        <span className="w-8 text-center font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-neutral-100">{String(value).padStart(2, "0")}</span>
        <button type="button" onClick={onInc} className="inline-flex h-10 w-10 items-center justify-center rounded-md border-[0.5px] border-slate-300 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800" aria-label={`Aumentar ${label.toLowerCase()}`}><Plus className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

export function dedupeTopicosPorId(rows: RegistroDefaultTopico[]): TopicoOpt[] {
  const seen = new Set<string>();
  return rows.reduce<TopicoOpt[]>((result, topic) => {
    if (!topic.id || seen.has(topic.id)) return result;
    seen.add(topic.id);
    result.push({ id: topic.id, nome: topic.nome });
    return result;
  }, []);
}
