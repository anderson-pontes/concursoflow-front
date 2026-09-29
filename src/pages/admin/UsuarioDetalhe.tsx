import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { UserActionsMenu } from "@/components/admin/UserActionsMenu";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchUserAudit, fetchUserDetail } from "@/services/adminUsers";
import { STATUS_BADGE_CLASS, statusLabel, studyGoalLabel, type UserStatus } from "@/types/userManagement";

export function UsuarioDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userQuery = useQuery({ queryKey: ["admin-user", id], queryFn: () => fetchUserDetail(id!), enabled: Boolean(id) });
  const auditQuery = useQuery({ queryKey: ["admin-user-audit", id], queryFn: () => fetchUserAudit(id!), enabled: Boolean(id) });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-audit", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-users-dashboard"] });
  };

  if (userQuery.isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-64" /></div>;
  if (userQuery.isError || !userQuery.data) return <EmptyState title="Usuário não encontrado" description="A conta pode ter sido removida ou você não possui acesso." action={<Button asChild variant="outline"><Link to="/admin/usuarios">Voltar à gestão</Link></Button>} />;
  const user = userQuery.data;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3"><Button asChild variant="ghost" size="icon"><Link to="/admin/usuarios" aria-label="Voltar"><ArrowLeft /></Link></Button><div className="min-w-0"><h1 className="truncate text-2xl font-semibold">{user.name}</h1><p className="truncate text-sm text-muted-foreground">{user.email}</p></div></div>
      <div className="flex items-center gap-2"><span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_BADGE_CLASS[user.status as UserStatus])}>{statusLabel(user.status)}</span><UserActionsMenu user={user} onChanged={() => { refresh(); if (!userQuery.data) navigate("/admin/usuarios"); }} /></div>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <InfoCard title="Dados da conta" items={[["E-mail", user.email], ["CPF", user.cpf], ["Telefone", user.phone], ["WhatsApp", user.whatsapp], ["Perfil", user.role === "admin" ? "Administrador" : "Usuário"]]} />
      <InfoCard title="Estudos" items={[["Objetivo", studyGoalLabel(user.study_goal)], ["Concurso alvo", user.target_contest], ["Cargo", user.desired_role], ["Nível", user.study_level], ["Sessões", String(user.sessoes_count)]]} />
      <InfoCard title="Acesso" items={[["Cadastro", new Date(user.created_at).toLocaleString("pt-BR")], ["Último login", user.last_login_at ? new Date(user.last_login_at).toLocaleString("pt-BR") : null], ["IP do último acesso", user.last_login_ip], ["Observações", user.admin_notes]]} />
    </div>
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">Histórico de auditoria</h2>{auditQuery.isLoading ? <div className="mt-4 space-y-2"><Skeleton className="h-14" /><Skeleton className="h-14" /></div> : (auditQuery.data ?? []).length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Sem registros de alteração.</p> : <div className="mt-4 space-y-2">{(auditQuery.data ?? []).map((entry) => <article key={entry.id} className="rounded-lg border border-border p-3 text-sm"><p className="font-medium">{entry.action}</p><p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString("pt-BR")}{entry.ip_address ? ` · IP ${entry.ip_address}` : ""}</p>{entry.details ? <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{entry.details}</pre> : null}</article>)}</div>}</section>
  </div>;
}

function InfoCard({ title, items }: { title: string; items: Array<[string, string | null | undefined]> }) {
  return <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">{title}</h2><dl className="mt-4 space-y-3 text-sm">{items.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words">{value || "—"}</dd></div>)}</dl></section>;
}
