import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UsersRound } from "lucide-react";

import { UserActionsMenu } from "@/components/admin/UserActionsMenu";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchUsers, fetchUsersDashboard } from "@/services/adminUsers";
import { STATUS_BADGE_CLASS, STUDY_GOAL_OPTIONS, USER_STATUS_OPTIONS, statusLabel, studyGoalLabel, type UserStatus } from "@/types/userManagement";

const PAGE_SIZE = 15;

export function GestaoUsuarios() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [studyGoal, setStudyGoal] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({ queryKey: ["admin-users-dashboard"], queryFn: fetchUsersDashboard });
  const usersQuery = useQuery({
    queryKey: ["admin-users", page, search, status, studyGoal],
    queryFn: () => fetchUsers({ page, page_size: PAGE_SIZE, search: search || undefined, status: status || undefined, study_goal: studyGoal || undefined }),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-users-dashboard"] });
  };
  const totalPages = Math.max(1, Math.ceil((usersQuery.data?.total ?? 0) / PAGE_SIZE));
  const items = usersQuery.data?.items ?? [];

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight">Gestão de Usuários</h1><p className="mt-1 text-sm text-muted-foreground">Crie contas, controle acessos e mantenha os dados dos usuários.</p></div>
      <Button size="lg" onClick={() => setFormOpen(true)}><Plus />Novo usuário</Button>
    </div>
    <UserFormDialog open={formOpen} onOpenChange={setFormOpen} onSaved={refresh} />
    {dashboardQuery.data ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Total" value={String(dashboardQuery.data.total)} sub="contas cadastradas" />
      <KpiCard label="Ativos" value={String(dashboardQuery.data.ativos)} sub="com acesso" badge="OK" badgeVariant="green" />
      <KpiCard label="Pendentes" value={String(dashboardQuery.data.pendentes)} sub="aguardando liberação" badge="!" badgeVariant="amber" />
      <KpiCard label="Bloqueados" value={String(dashboardQuery.data.bloqueados)} sub="sem acesso" />
    </div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>}
    <section className="rounded-xl border border-border bg-card shadow-sm" aria-label="Lista de usuários">
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(16rem,1fr)_13rem_13rem]">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" aria-label="Buscar usuários por nome, e-mail ou CPF" placeholder="Buscar por nome, e-mail ou CPF" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
        <SelectField value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "", label: "Todos os status" }, ...USER_STATUS_OPTIONS]} />
        <SelectField value={studyGoal} onValueChange={(v) => { setStudyGoal(v); setPage(1); }} options={[{ value: "", label: "Todos os objetivos" }, ...STUDY_GOAL_OPTIONS]} />
      </div>
      {usersQuery.isError ? <div className="p-4"><EmptyState title="Não foi possível carregar os usuários" description="Verifique a conexão e tente novamente." action={<Button variant="outline" onClick={() => usersQuery.refetch()}>Tentar novamente</Button>} /></div> : usersQuery.isLoading ? <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div> : items.length === 0 ? <div className="p-4"><EmptyState icon={UsersRound} title="Nenhum usuário encontrado com os filtros atuais." description="Ajuste os filtros ou crie uma nova conta manualmente." action={<Button onClick={() => setFormOpen(true)}><Plus />Novo usuário</Button>} /></div> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[820px] text-left text-sm"><thead><tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground"><th className="px-4 py-3 font-medium">Usuário</th><th className="px-4 py-3 font-medium">Perfil</th><th className="px-4 py-3 font-medium">Objetivo</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Cadastro</th><th className="px-4 py-3 font-medium">Último acesso</th><th className="w-16 px-4 py-3"><span className="sr-only">Ações</span></th></tr></thead><tbody>{items.map((user) => <tr key={user.id} className="border-b border-border/70 last:border-0 hover:bg-muted/20"><td className="px-4 py-3"><p className="font-medium text-foreground">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></td><td className="px-4 py-3">{user.role === "admin" ? "Administrador" : "Usuário"}</td><td className="px-4 py-3">{studyGoalLabel(user.study_goal)}</td><td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_BADGE_CLASS[user.status as UserStatus])}>{statusLabel(user.status)}</span></td><td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString("pt-BR")}</td><td className="px-4 py-3">{user.last_login_at ? new Date(user.last_login_at).toLocaleString("pt-BR") : "—"}</td><td className="px-4 py-2"><UserActionsMenu user={user} onChanged={refresh} /></td></tr>)}</tbody></table></div>
        <div className="space-y-3 p-4 md:hidden">{items.map((user) => <article key={user.id} className="rounded-xl border border-border bg-background p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold">{user.name}</h2><p className="truncate text-sm text-muted-foreground">{user.email}</p></div><UserActionsMenu user={user} onChanged={refresh} /></div><div className="mt-4 flex flex-wrap gap-2"><span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_BADGE_CLASS[user.status as UserStatus])}>{statusLabel(user.status)}</span><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{user.role === "admin" ? "Administrador" : "Usuário"}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Objetivo</dt><dd>{studyGoalLabel(user.study_goal)}</dd></div><div><dt className="text-xs text-muted-foreground">Cadastro</dt><dd>{new Date(user.created_at).toLocaleDateString("pt-BR")}</dd></div></dl></article>)}</div>
      </>}
      <footer className="flex flex-col gap-3 border-t border-border p-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-muted-foreground"><strong className="text-foreground">{usersQuery.data?.total ?? 0}</strong> usuário(s)</p><div className="flex items-center justify-between gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button><span aria-live="polite">Página {page} de {totalPages}</span><Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button></div></footer>
    </section>
  </div>;
}
