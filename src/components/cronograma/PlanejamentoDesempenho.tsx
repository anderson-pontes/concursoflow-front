import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DashboardKpis } from "@/components/dashboard/DashboardOverview";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { WeeklyGoalCard } from "@/components/dashboard/DashboardPrimary";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/services/api";
import type { PlanejamentoResumo } from "@/lib/cronograma/types";

type DashboardResumo = { horas_hoje: number; meta_horas: number; horas_semana: number; sessoes_semana: number; rendimento_medio: number; flashcards_para_revisar: number; streak_dias?: number; taxa_cumprimento_mes?: number; minutos_planejados_mes?: number; minutos_realizados_mes?: number };
export function PlanejamentoDesempenho({ concursoId, resumo, onRegistro }: { concursoId: string; resumo?: PlanejamentoResumo; onRegistro: () => void }) {
  const dashboard = useQuery({ queryKey: ["dashboard-resumo", concursoId], queryFn: async () => (await api.get("/dashboard/resumo", { params: { concurso_id: concursoId } })).data as DashboardResumo });
  const heatmap = useQuery({ queryKey: ["dashboard-heatmap", concursoId], queryFn: async () => (await api.get("/dashboard/heatmap", { params: { concurso_id: concursoId } })).data as { date: string; count: number; minutes?: number }[] });
  if (dashboard.isLoading) return <Skeleton className="h-52 rounded-xl" />;
  return <div className="space-y-4">{dashboard.isError ? <div role="alert" className="rounded-xl border border-border bg-card p-4"><p>Não foi possível carregar o desempenho.</p><Button variant="outline" onClick={() => void dashboard.refetch()}>Tentar novamente</Button></div> : <><DashboardKpis summary={dashboard.data} /><WeeklyGoalCard hours={dashboard.data?.horas_semana ?? 0} goalHours={(dashboard.data?.meta_horas ?? 0) * 7} questions={resumo?.questoes_total ?? 0} isError={false} onRetry={() => void dashboard.refetch()} /></>}
    {resumo && <section className="rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">Desempenho em questões</h2><dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">{[["Resolvidas", resumo.questoes_total], ["Acertos", resumo.acertos], ["Erros", resumo.erros], ["Aproveitamento", `${resumo.rendimento_pct.toFixed(1)}%`]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl></section>}
    {dashboard.data?.sessoes_semana === 0 && <EmptyState title="Nenhum estudo registrado nesta semana" description="Horários planejados não contam como estudo realizado. Registre uma sessão ou use o cronômetro para acompanhar sua evolução." action={<Button onClick={onRegistro}>Registrar estudo</Button>} />}
    {heatmap.isError ? <p role="alert" className="text-sm text-muted-foreground">Não foi possível carregar a constância.</p> : heatmap.data && <HeatmapCard data={heatmap.data} />}
    <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/dashboard">Abrir painel completo</Link></Button><Button asChild variant="outline"><Link to="/estudos/historico">Histórico de estudos</Link></Button><Button asChild variant="outline"><Link to="/revisoes">Revisões</Link></Button><Button asChild variant="outline"><Link to="/disciplinas">Acompanhamento do edital</Link></Button></div>
  </div>;
}
