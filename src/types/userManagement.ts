export type UserStatus = "pendente" | "ativo" | "bloqueado" | "reprovado" | "inativo";

export type StudyGoal =
  | "policia"
  | "tribunais"
  | "fiscal"
  | "controle"
  | "bancario"
  | "administrativo"
  | "militar"
  | "outros";

export type StudyLevel = "medio" | "superior" | "tecnico";

export const STUDY_GOAL_OPTIONS: { value: StudyGoal; label: string }[] = [
  { value: "policia", label: "Polícia" },
  { value: "tribunais", label: "Tribunais" },
  { value: "fiscal", label: "Fiscal" },
  { value: "controle", label: "Controle" },
  { value: "bancario", label: "Bancário" },
  { value: "administrativo", label: "Administrativo" },
  { value: "militar", label: "Militar" },
  { value: "outros", label: "Outros" },
];

export const STUDY_LEVEL_OPTIONS: { value: StudyLevel; label: string }[] = [
  { value: "medio", label: "Médio" },
  { value: "superior", label: "Superior" },
  { value: "tecnico", label: "Técnico" },
];

export const USER_STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "ativo", label: "Ativo" },
  { value: "bloqueado", label: "Bloqueado" },
  { value: "reprovado", label: "Reprovado" },
  { value: "inativo", label: "Inativo" },
];

export const STATUS_BADGE_CLASS: Record<UserStatus, string> = {
  pendente: "bg-amber-100 text-amber-800",
  ativo: "bg-emerald-100 text-emerald-800",
  bloqueado: "bg-rose-100 text-rose-800",
  reprovado: "bg-neutral-200 text-neutral-700",
  inativo: "bg-slate-100 text-slate-600",
};

export function statusLabel(status: string): string {
  return USER_STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

export function studyGoalLabel(goal: string | null | undefined): string {
  if (!goal) return "—";
  return STUDY_GOAL_OPTIONS.find((s) => s.value === goal)?.label ?? goal;
}

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  avatar_url: string | null;
  status: UserStatus;
  role: string;
  study_goal: StudyGoal | null;
  created_at: string;
  last_login_at: string | null;
  sessoes_count: number;
};

export type AdminUserDetail = AdminUserListItem & {
  phone: string | null;
  whatsapp: string | null;
  birth_date: string | null;
  gender: string | null;
  target_contest: string | null;
  desired_role: string | null;
  study_level: StudyLevel | null;
  study_area: string | null;
  daily_study_time: string | null;
  referral_source: string | null;
  marketing_opt_in: boolean;
  admin_notes: string | null;
  rejection_reason: string | null;
  block_reason: string | null;
  last_login_ip: string | null;
  last_login_user_agent: string | null;
  approved_at: string | null;
  blocked_at: string | null;
};

export type UsersDashboard = {
  total: number;
  pendentes: number;
  ativos: number;
  bloqueados: number;
  novos_hoje: number;
  novos_mes: number;
};

export type PaginatedUsers = {
  items: AdminUserListItem[];
  total: number;
  page: number;
  page_size: number;
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  related_user_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type UserAuditLog = {
  id: string;
  actor_id: string | null;
  target_user_id: string;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};
