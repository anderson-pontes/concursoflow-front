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
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          <h1 className="text-xl font-semibold">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground">Assinaturas, bloqueio e administração de contas.</p>
        </div>
        <Button
          type="button"
          size="lg"
          onClick={() => setCreateOpen(true)}
        >
          + Criar usuário
        </Button>
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

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Input
            aria-label="Buscar usuários por nome, e-mail ou CPF"
            placeholder="Nome, e-mail ou CPF"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: "", label: "Todos os status" }, ...USER_STATUS_OPTIONS]} />
          <SelectField value={subscriptionStatus} onValueChange={(value) => { setSubscriptionStatus(value); setPage(1); }} options={[{ value: "", label: "Toda assinatura" }, { value: "active", label: "Ativa" }, { value: "past_due", label: "Pgto. pendente" }, { value: "canceled", label: "Cancelada" }, { value: "unpaid", label: "Não paga" }, { value: "incomplete", label: "Incompleta" }]} />
          <SelectField value={studyGoal} onValueChange={(value) => { setStudyGoal(value); setPage(1); }} options={[{ value: "", label: "Todos os objetivos" }, ...STUDY_GOAL_OPTIONS]} />
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
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
                  <tr key={u.id} className="border-b border-border/50">
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
                      <Link to={`/admin/usuarios/${u.id}`} className="inline-flex min-h-11 items-center text-primary hover:underline">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3 md:hidden" aria-live="polite">
          {isLoading ? (
            <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
              Carregando usuários...
            </div>
          ) : (list?.items ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado com os filtros atuais.
            </div>
          ) : (
            (list?.items ?? []).map((u) => (
              <article key={u.id} className="rounded-xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-foreground">{u.name}</h2>
                    <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <span className={cn("shrink-0 rounded px-2 py-1 text-xs font-medium", STATUS_BADGE_CLASS[u.status as UserStatus])}>
                    {statusLabel(u.status)}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Objetivo</dt>
                    <dd className="mt-0.5 font-medium">{studyGoalLabel(u.study_goal)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Assinatura</dt>
                    <dd className="mt-0.5 font-medium">{subscriptionStatusLabel(u.subscription_status)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Cadastro</dt>
                    <dd className="mt-0.5">{new Date(u.created_at).toLocaleDateString("pt-BR")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Último acesso</dt>
                    <dd className="mt-0.5">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("pt-BR") : "—"}</dd>
                  </div>
                </dl>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to={`/admin/usuarios/${u.id}`}>Ver detalhes</Link>
                </Button>
              </article>
            ))
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">{list?.total ?? 0} registro(s)</span>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="flex min-h-11 items-center px-1">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
