import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  approveUser,
  blockUser,
  deleteUser,
  fetchUserAudit,
  fetchUserDetail,
  rejectUser,
  resendUserEmail,
  resetUserPassword,
  unblockUser,
} from "@/services/adminUsers";
import {
  STATUS_BADGE_CLASS,
  statusLabel,
  studyGoalLabel,
  subscriptionStatusLabel,
  type UserStatus,
} from "@/types/userManagement";
import { cn } from "@/lib/utils";

export function UsuarioDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reason, setReason] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => fetchUserDetail(id!),
    enabled: Boolean(id),
  });

  const { data: audit = [] } = useQuery({
    queryKey: ["admin-user-audit", id],
    queryFn: () => fetchUserAudit(id!),
    enabled: Boolean(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-user", id] });
    qc.invalidateQueries({ queryKey: ["admin-user-audit", id] });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["admin-users-dashboard"] });
  };

  const approveMut = useMutation({
    mutationFn: () => approveUser(id!),
    onSuccess: () => {
      toast.success("Usuário aprovado");
      invalidate();
    },
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectUser(id!, reason),
    onSuccess: () => {
      toast.success("Usuário reprovado");
      invalidate();
    },
  });

  const blockMut = useMutation({
    mutationFn: () => blockUser(id!, reason),
    onSuccess: () => {
      toast.success("Usuário bloqueado");
      invalidate();
    },
  });

  const unblockMut = useMutation({
    mutationFn: () => unblockUser(id!),
    onSuccess: () => {
      toast.success("Usuário desbloqueado");
      invalidate();
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteUser(id!),
    onSuccess: () => {
      toast.success("Usuário removido");
      navigate("/admin/usuarios");
    },
  });

  const resetMut = useMutation({
    mutationFn: () => resetUserPassword(id!, newPassword),
    onSuccess: () => {
      toast.success("Senha redefinida");
      setNewPassword("");
    },
  });

  const resendMut = useMutation({
    mutationFn: () => resendUserEmail(id!),
    onSuccess: () => toast.success("E-mail reenviado"),
  });

  if (isLoading || !user) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/admin/usuarios" className="inline-flex min-h-11 items-center text-sm text-primary hover:underline">
          ← Voltar
        </Link>
        <h2 className="text-lg font-semibold">{user.name}</h2>
        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_BADGE_CLASS[user.status as UserStatus])}>
          {statusLabel(user.status)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-semibold">Dados pessoais</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-muted-foreground">E-mail</dt><dd>{user.email}</dd></div>
            <div><dt className="text-muted-foreground">CPF</dt><dd>{user.cpf ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Telefone</dt><dd>{user.phone ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">WhatsApp</dt><dd>{user.whatsapp ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Perfil</dt><dd>{user.role}</dd></div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-semibold">Dados de estudo</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Objetivo</dt><dd>{studyGoalLabel(user.study_goal)}</dd></div>
            <div><dt className="text-muted-foreground">Concurso alvo</dt><dd>{user.target_contest ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Cargo</dt><dd>{user.desired_role ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Sessões</dt><dd>{user.sessoes_count}</dd></div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-semibold">Acesso</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Cadastro</dt><dd>{new Date(user.created_at).toLocaleString("pt-BR")}</dd></div>
            <div><dt className="text-muted-foreground">Último login</dt><dd>{user.last_login_at ? new Date(user.last_login_at).toLocaleString("pt-BR") : "—"}</dd></div>
            <div><dt className="text-muted-foreground">IP último acesso</dt><dd>{user.last_login_ip ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Observações</dt><dd>{user.admin_notes ?? "—"}</dd></div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-semibold">Assinatura</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{subscriptionStatusLabel(user.subscription_status)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {user.subscription_cancel_at_period_end ? "Acesso até" : "Vencimento"}
              </dt>
              <dd>
                {user.subscription_current_period_end
                  ? new Date(user.subscription_current_period_end).toLocaleDateString("pt-BR")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Renovação automática</dt>
              <dd>{user.subscription_cancel_at_period_end ? "Cancelada" : "Ativa"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-semibold">Ações</h3>
          <textarea
            className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Motivo (reprovação/bloqueio)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {user.status === "pendente" ? (
              <button type="button" className="min-h-11 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90" onClick={() => approveMut.mutate()}>
                Aprovar
              </button>
            ) : null}
            {user.status === "pendente" ? (
              <button type="button" className="min-h-11 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted/80" onClick={() => rejectMut.mutate()}>
                Reprovar
              </button>
            ) : null}
            {user.status !== "bloqueado" ? (
              <button type="button" className="min-h-11 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90" onClick={() => blockMut.mutate()}>
                Bloquear
              </button>
            ) : (
              <button type="button" className="min-h-11 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-700" onClick={() => unblockMut.mutate()}>
                Desbloquear
              </button>
            )}
            <button type="button" className="min-h-11 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted" onClick={() => resendMut.mutate()}>
              Reenviar e-mail
            </button>
            <button type="button" className="min-h-11 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10" onClick={() => deleteMut.mutate()}>
              Excluir
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Nova senha forte"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button type="button" className="min-h-11 shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-700" onClick={() => resetMut.mutate()}>
              Resetar senha
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h3 className="text-sm font-semibold">Histórico de auditoria</h3>
        <div className="mt-3 space-y-2">
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem registros.</p>
          ) : (
            audit.map((a) => (
              <div key={a.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                <div className="font-medium">{a.action}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("pt-BR")}
                  {a.ip_address ? ` · IP ${a.ip_address}` : ""}
                </div>
                {a.details ? <pre className="mt-1 whitespace-pre-wrap text-xs">{a.details}</pre> : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
