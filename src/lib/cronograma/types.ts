export type DisciplinaOption = {
  id: string;
  nome: string;
  peso?: number | null;
  total_pontos?: number | null;
  concurso_ids?: string[];
};

export type ModoCriacao = "automatica" | "analitica" | "simplificada";

export type Bloco = {
  id: string;
  user_id: string;
  cronograma_id?: string | null;
  concurso_id?: string | null;
  data?: string;
  fonte?: "cronograma_item" | "bloco_semanal";
  cronograma_item_id?: string | null;
  duracao_minutos?: number;
  bloco_cronograma_id?: string | null;
  disciplina_id: string;
  topico_id?: string | null;
  topico_ids?: string[];
  topico_nome?: string | null;
  topico_nomes?: string[];
  dia_semana: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
  hora_inicio: string;
  hora_fim: string;
  tipo: string;
  ativo: boolean;
  modo_criacao?: ModoCriacao | string;
  grupo_id?: string | null;
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
  vigencia_indeterminada?: boolean;
};

export type Planejamento = {
  id: string;
  user_id: string;
  concurso_id: string;
  nome: string;
  tipo: "manual" | "automatico";
  data_inicio: string;
  data_fim: string | null;
  dias_disponiveis: Bloco["dia_semana"][];
  cargo: string | null;
  ativo: boolean;
  disciplinas: { disciplina_id: string; nome: string; ordem: number }[];
};

export type PlanejamentoForm = Pick<Planejamento, "nome" | "data_inicio" | "data_fim" | "dias_disponiveis" | "cargo">;
export type DistribuicaoForm = {
  disciplina_ids: string[];
  dias_semana: Bloco["dia_semana"][];
  hora_inicio: string;
  hora_fim?: string;
  duracao_minutos: number;
  sessoes_por_semana: number;
  tipo: string;
  topico_ids: string[];
};
export type PlanejamentoResumo = {
  minutos_planejados_semana: number;
  minutos_estudados_semana: number;
  disciplinas_count: number;
  atividades_planejadas: number;
  atividades_concluidas: number;
  progresso_pct: number;
  disciplinas: { disciplina_id: string; minutos_planejados: number; minutos_estudados: number; sessoes_semana: number; progresso_pct: number }[];
  questoes_total: number;
  acertos: number;
  erros: number;
  rendimento_pct: number;
};

export type SessaoStats = {
  tempo_total_horas?: number;
  sessoes_count?: number;
  media_diaria_horas?: number;
  [key: string]: unknown;
};

export type TipoBadge = { label: string; cls: string };

export type FormState = {
  disciplina_id: string;
  dia_semana: Bloco["dia_semana"];
  hora_inicio: string;
  hora_fim: string;
  tipo: string;
  ativo: boolean;
  topico_ids: string[];
};

export type VigenciaModo = "periodo" | "12_meses" | "indeterminado";

export type SimplificadoFormState = {
  disciplina_id: string;
  dias_semana: Bloco["dia_semana"][];
  hora_inicio: string;
  hora_fim: string;
  tipo: string;
  vigencia_modo: VigenciaModo;
  vigencia_inicio: string;
  vigencia_fim: string;
};

/** Resolve IDs for display/launch with legacy topico_id fallback. */
export function blocoTopicoIds(bloco: Pick<Bloco, "topico_id" | "topico_ids">): string[] {
  if (bloco.topico_ids && bloco.topico_ids.length > 0) return bloco.topico_ids;
  if (bloco.topico_id) return [bloco.topico_id];
  return [];
}

/** YYYY-MM-DD local today. */
export function hojeISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add calendar months then subtract 1 day (ADR 12 meses). */
export function vigenciaFim12Meses(inicioISO: string): string {
  const [y, m, d] = inicioISO.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 12);
  end.setDate(end.getDate() - 1);
  const yy = end.getFullYear();
  const mm = String(end.getMonth() + 1).padStart(2, "0");
  const dd = String(end.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function fmtDateBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Vigência já passou (comparação por YYYY-MM-DD). */
export function blocoVigenciaExpirada(bloco: Pick<Bloco, "vigencia_fim" | "vigencia_indeterminada">, hoje = hojeISO()): boolean {
  if (bloco.vigencia_indeterminada || !bloco.vigencia_fim) return false;
  return bloco.vigencia_fim.slice(0, 10) < hoje;
}

/** Preview do novo fim após estender (+12m se vigente; senão hoje+12m−1). */
export function previewEstenderFim(vigenciaFim: string | null | undefined, hoje = hojeISO()): string {
  if (vigenciaFim && vigenciaFim.slice(0, 10) >= hoje) {
    return addMonthsISO(vigenciaFim, 12);
  }
  return vigenciaFim12Meses(hoje);
}

/** Soma meses civis a uma data ISO (YYYY-MM-DD). */
export function addMonthsISO(iso: string, months: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setMonth(dt.getMonth() + months);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
