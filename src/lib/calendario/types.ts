export type DiaStatus =
  | "cumprido"
  | "parcial"
  | "nao_cumprido"
  | "sem_planejamento"
  | "estudou_sem_plano"
  | "futuro";

export type PlanejadoItem = {
  fonte: "cronograma_item" | "bloco_semanal";
  id: string;
  disciplina_id: string;
  disciplina_nome: string;
  topico_id: string | null;
  topico_nome: string | null;
  duracao_minutos: number;
  modo?: "aprendizado" | "revisao" | null;
};

export type CalendarioDia = {
  data: string;
  status: DiaStatus;
  minutos_planejados: number;
  minutos_realizados: number;
  minutos_extra: number;
  sessoes_realizadas: number;
  planejado: PlanejadoItem[];
};

export type CalendarioResumoMes = {
  dias_com_planejamento: number;
  dias_cumpridos: number;
  dias_parciais: number;
  dias_nao_cumpridos: number;
  dias_estudou_sem_plano: number;
  minutos_planejados: number;
  minutos_realizados: number;
  taxa_cumprimento_pct: number;
};

export type CalendarioMesResponse = {
  ano: number;
  mes: number;
  timezone: string;
  resumo_mes: CalendarioResumoMes;
  dias: CalendarioDia[];
};

export type DiaDetalheResponse = {
  data: string;
  status: DiaStatus;
  timezone: string;
  totais: { planejados: number; realizados: number; extra: number };
  planejado: PlanejadoItem[];
  realizado: import("@/lib/historico/types").SessaoEstudoRow[];
};
