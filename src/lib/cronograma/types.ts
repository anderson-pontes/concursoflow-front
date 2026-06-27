export type DisciplinaOption = { id: string; nome: string };

export type Bloco = {
  id: string;
  user_id: string;
  disciplina_id: string;
  dia_semana: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
  hora_inicio: string;
  hora_fim: string;
  tipo: string;
  ativo: boolean;
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
};
