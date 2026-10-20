import React from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, BookOpen, Link2, ListChecks, Target } from "lucide-react";
import { api } from "@/services/api";
import { computeConcursoCardStatsFromKpis, kpiToProgressRowDisplay } from "@/lib/concursoProgressStorage";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DisciplinaDashboardKpis, DisciplinaDashboardResponse } from "@/types/disciplinaDashboard";
export function ConcursoProgressoTab({ concurso }: { concurso: { id: string } }) {
  const navigate = useNavigate();
  const cid = concurso.id;

  const { data: apiDisciplinas = [], isLoading: loadingDisc, isError: disciplinasError } = useQuery({
    queryKey: ["concurso-disciplinas-progress", cid],
    queryFn: async () =>
      (await api.get(`/concursos/${cid}/disciplinas`)).data as Array<{ id: string; nome: string }>,
  });

  const disciplinaIds = React.useMemo(() => apiDisciplinas.map((d) => d.id).sort(), [apiDisciplinas]);

  const rows = React.useMemo(
    () =>
      apiDisciplinas.map((d) => ({
        key: d.id,
        nome: d.nome,
        disciplinaId: d.id,
        source: "plano" as const,
      })),
    [apiDisciplinas],
  );

  const dashboardQueries = useQueries({
    queries: disciplinaIds.map((disciplinaId) => ({
      queryKey: ["disciplina-dashboard", disciplinaId, "live"],
      queryFn: async () =>
        (await api.get(`/disciplinas/${disciplinaId}/dashboard`)).data as DisciplinaDashboardResponse,
      staleTime: 60_000,
      enabled: disciplinaIds.length > 0,
    })),
  });

  const kpiByDisciplinaId = React.useMemo(() => {
    const m = new Map<string, DisciplinaDashboardKpis>();
    disciplinaIds.forEach((id, i) => {
      const row = dashboardQueries[i];
      if (row?.data?.kpis) m.set(id, row.data.kpis);
    });
    return m;
  }, [disciplinaIds, dashboardQueries]);

  const queryByDisciplinaId = React.useMemo(() => {
    const m = new Map<string, (typeof dashboardQueries)[number]>();
    disciplinaIds.forEach((id, i) => {
      m.set(id, dashboardQueries[i]);
    });
    return m;
  }, [disciplinaIds, dashboardQueries]);

  const progressoKpisLoading =
    disciplinaIds.length > 0 &&
    disciplinaIds.some((id) => {
      const q = queryByDisciplinaId.get(id);
      return Boolean(q?.isPending || q?.isLoading);
    });

  const progressTotals = React.useMemo(() => {
    if (disciplinaIds.length === 0) return null;
    if (progressoKpisLoading) return null;
    return computeConcursoCardStatsFromKpis(rows, kpiByDisciplinaId);
  }, [disciplinaIds.length, progressoKpisLoading, rows, kpiByDisciplinaId]);


  const failed = dashboardQueries.some(query => query.isError);
  const totalsReady = !progressoKpisLoading && !failed && kpiByDisciplinaId.size === disciplinaIds.length;
  if (loadingDisc) return <div role="status" className="space-y-3"><p className="text-sm text-muted-foreground">Carregando disciplinas…</p>{[0,1,2].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>;
  if (disciplinasError) return <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar as disciplinas vinculadas. Tente novamente mais tarde.</p>;
  if (apiDisciplinas.length === 0) return <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
    <BookOpen className="mx-auto size-9 text-primary" aria-hidden /><h3 className="mt-3 font-semibold">Nenhuma disciplina vinculada</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Vincule disciplinas para acompanhar os estudos e as questões deste concurso.</p>
    <Link to="/disciplinas" className={cn(buttonVariants({variant:"outline"}),"mt-4")}><Link2 className="size-4" />Gerenciar disciplinas</Link>
  </div>;

  return <div className="space-y-5">
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h3 className="font-semibold">Sua preparação</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Desempenho nas questões das disciplinas vinculadas.</p></div>
        <Link to="/disciplinas" className={buttonVariants({variant:"outline",size:"sm"})}><Link2 className="size-4" />Editar vínculos</Link>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2">
        {[
          {label:"Disciplinas",tone:"indigo",value:apiDisciplinas.length,Icon:BookOpen},
          {label:"Questões",tone:"blue",value:totalsReady ? progressTotals?.questoesTotal ?? 0 : "Indisponível",Icon:ListChecks},
          {label:"Acerto médio",tone:"green",value:totalsReady && progressTotals ? progressTotals.questoesTotal > 0 ? `${progressTotals.acertoMedioPct}%` : "Sem questões" : "Indisponível",Icon:Target},
        ].map(({label,value,Icon,tone})=><div key={label} className={`concurso-soft-card concurso-tone-${tone} min-w-0 rounded-lg border p-2.5 sm:p-3`}><dt className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground [overflow-wrap:anywhere]"><Icon className="size-4 text-[var(--concurso-ink)]" aria-hidden />{label}</dt><dd className="mt-2 text-sm font-semibold tabular-nums [overflow-wrap:anywhere]">{progressoKpisLoading && label!=="Disciplinas" ? "Carregando…" : value}</dd></div>)}
      </dl>
    </section>
    {failed && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">Não foi possível carregar todos os indicadores. As métricas indisponíveis não entram no resumo.</p>}
    {totalsReady && progressTotals?.questoesTotal===0 && <p className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">Nenhuma questão resolvida ainda. O aproveitamento aparecerá conforme você registrar estudos e resolver questões.</p>}
    <ul className="space-y-3" aria-label="Desempenho por disciplina">
      {rows.map(row => {
        const query=queryByDisciplinaId.get(row.disciplinaId), kpi=kpiByDisciplinaId.get(row.disciplinaId);
        const loading=Boolean(query?.isPending||query?.isLoading), unavailable=!loading&&!kpi;
        const display=kpiToProgressRowDisplay(kpi), hasQuestions=!!kpi&&display.questoes>0;
        return <li key={row.key}><button type="button" onClick={()=>navigate(`/disciplinas/${row.disciplinaId}`)} className="concurso-soft-card concurso-tone-indigo w-full min-w-0 rounded-xl border p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex items-start gap-3"><span className="min-w-0 flex-1 text-sm font-semibold leading-relaxed [overflow-wrap:anywhere]">{row.nome}</span><ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden /></div>
          <div className="my-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{loading ? "Carregando indicadores…" : unavailable ? "Indicadores indisponíveis" : hasQuestions ? `${display.questoes} questões resolvidas` : "Nenhuma questão resolvida ainda"}</span>
            {hasQuestions && <span className={cn("rounded-full px-2 py-1 font-semibold tabular-nums",display.pct>=70?"bg-success/10 text-success-text":display.pct>=40?"bg-warning/10 text-warning-foreground":"bg-primary/10 text-primary")}>{display.pct}% de acerto</span>}
          </div>
          {hasQuestions&&<Progress value={display.pct} aria-label={`Aproveitamento em ${row.nome}`} aria-valuenow={display.pct} aria-valuetext={`${display.pct}% de acerto`} className="h-1.5" />}
        </button></li>;
      })}
    </ul>
  </div>;
}
