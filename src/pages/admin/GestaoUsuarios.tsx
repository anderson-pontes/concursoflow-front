import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { CriarUsuarioModal } from "@/components/admin/CriarUsuarioModal";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { fetchUsers, fetchUsersDashboard } from "@/services/adminUsers";
import {
  STATUS_BADGE_CLASS,
  STUDY_GOAL_OPTIONS,
  USER_STATUS_OPTIONS,
  statusLabel,
  studyGoalLabel,
  subscriptionStatusLabel,
  type UserStatus,
} from "@/types/userManagement";
import { cn } from "@/lib/utils";

export function GestaoUsuarios() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [subscriptionStatus, setSubscriptionStatus] = React.useState("");
  const [studyGoal, setStudyGoal] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const qc = useQueryClient();

  const { data: dashboard } = useQuery({
    queryKey: ["admin-users-dashboard"],
    queryFn: fetchUsersDashboard,
  });

  const { data: list, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, status, subscriptionStatus, studyGoal],
    queryFn: () =>
      fetchUsers({
        page,
        page_size: 15,
        search: search || undefined,
        status: status || undefined,
        subscription_status: subscriptionStatus || undefined,
        study_goal: studyGoal || undefined,
      }),
  });

  const totalPages = list ? Math.max(1, Math.ceil(list.total / list.page_size)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Gestão de Usuários</h2>
          <p className="text-sm text-muted-foreground">Assinaturas, bloqueio e administração de contas.</p>
        </div>
        <button
          type="button"
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          onClick={() => setCreateOpen(true)}
        >
          + Criar usuário
        </button>
      </div>

      <CriarUsuarioModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["admin-users"] });
          qc.invalidateQueries({ queryKey: ["admin-users-dashboard"] });
        }}
      />

      {dashboard ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Total" value={String(dashboard.total)} sub="usuários" />
          <KpiCard label="Pendentes" value={String(dashboard.pendentes)} sub="aguardando" badgeVariant="amber" badge="!" />
          <KpiCard label="Ativos" value={String(dashboard.ativos)} sub="liberados" badgeVariant="green" badge="OK" />
          <KpiCard label="Bloqueados" value={String(dashboard.bloqueados)} sub="suspensos" />
          <KpiCard label="Novos hoje" value={String(dashboard.novos_hoje)} sub="cadastros" />
          <KpiCard label="Novos mês" value={String(dashboard.novos_mes)} sub="cadastros" />
        </div>
      ) : null}

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-border/40 bg-background px-3 py-2 text-sm"
            placeholder="Nome, e-mail ou CPF"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="rounded-md border border-border/40 bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os status</option>
            {USER_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-border/40 bg-background px-3 py-2 text-sm"
            value={subscriptionStatus}
            onChange={(e) => {
              setSubscriptionStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Toda assinatura</option>
            <option value="active">Ativa</option>
            <option value="past_due">Pgto. pendente</option>
            <option value="canceled">Cancelada</option>
            <option value="unpaid">Não paga</option>
            <option value="incomplete">Incompleta</option>
          </select>
          <select
            className="rounded-md border border-border/40 bg-background px-3 py-2 text-sm"
            value={studyGoal}
            onChange={(e) => {
              setStudyGoal(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os objetivos</option>
            {STUDY_GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/40 text-xs text-muted-foreground">
                <th className="py-2 pr-2">Nome</th>
                <th className="py-2 pr-2">E-mail</th>
                <th className="py-2 pr-2">CPF</th>
                <th className="py-2 pr-2">Objetivo</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Assinatura</th>
                <th className="py-2 pr-2">Vencimento</th>
                <th className="py-2 pr-2">Cadastro</th>
                <th className="py-2 pr-2">Último acesso</th>
                <th className="py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : (
                (list?.items ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-border/20">
                    <td className="py-2 pr-2 font-medium">{u.name}</td>
                    <td className="py-2 pr-2">{u.email}</td>
                    <td className="py-2 pr-2">{u.cpf ?? "—"}</td>
                    <td className="py-2 pr-2">{studyGoalLabel(u.study_goal)}</td>
                    <td className="py-2 pr-2">
                      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_BADGE_CLASS[u.status as UserStatus])}>
                        {statusLabel(u.status)}
                      </span>
                    </td>
                    <td className="py-2 pr-2">{subscriptionStatusLabel(u.subscription_status)}</td>
                    <td className="py-2 pr-2">
                      {u.subscription_current_period_end
                        ? new Date(u.subscription_current_period_end).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="py-2 pr-2">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2 pr-2">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="py-2">
                      <Link to={`/admin/usuarios/${u.id}`} className="text-primary-600 hover:underline">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{list?.total ?? 0} registro(s)</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-border/40 px-3 py-1 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="rounded border border-border/40 px-3 py-1 disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
