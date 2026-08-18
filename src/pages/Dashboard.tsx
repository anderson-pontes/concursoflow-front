import React from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookOpenCheck, CheckCircle2, Flame, Play, RefreshCw, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "@/services/api";
import { DashboardKpis, DashboardWeeklySchedule } from "@/components/dashboard/DashboardOverview";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { CalendarioMensalWidget } from "@/components/calendario/CalendarioMensalWidget";
import { BannerSemConcurso } from "@/components/dashboard/BannerSemConcurso";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { DIAS, diaAbrev, blocoDurationMinutes, fmtBlocoMinutos, getTipo, getTipoDot } from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import type { Disciplina } from "@/lib/disciplinas/types";
import { cn } from "@/lib/utils";
import { useConcursoAtivoId } from "@/stores/concursoStore";
import { Button } from "@/components/ui/button";

type DashboardResumo = {
  horas_hoje: number;
  meta_horas: number;
  horas_semana: number;
  sessoes_semana: number;
  questoes_semana: number;
  rendimento_medio: number;
  avisos_proximos: number;
  flashcards_para_revisar: number;
  streak_dias?: number;
  taxa_cumprimento_mes?: number;
  minutos_planejados_mes?: number;
  minutos_realizados_mes?: number;
};

type RevisoesPendentes = {
  total: number;
  items: Array<{
    disciplina_id: string;
    disciplina_nome: string;
    topico_id: string;
    topico_nome: string;
    data_prevista: string;
    dias_atraso: number;
  }>;
};

type HeatmapData = {
  date: string;
  count: number;
  minutes?: number;
};

type Aviso = {
  id: string;
  titulo: string;
  data_vencimento: string;
  prioridade: string;
};

type Concurso = {
  id: string;
  nome: string;
  orgao: string;
  cargo: string | null;
  data_prova: string | null;
};

type ProximoEstudo = {
  item_id: string;
  concurso_id: string;
  disciplina_id: string;
  disciplina_nome: string;
  topico_id: string | null;
  topico_nome: string | null;
  data: string;
  duracao_minutos: number;
  sessoes_recentes: number;
};

function fmtHoras(h: number): string {
  if (h <= 0) return "0 min";
  const totalMin = Math.round(h * 60);
  if (totalMin < 60) return `${totalMin} min`;
  const hrs = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return min > 0 ? `${hrs}h ${min}min` : `${hrs}h`;
}

function fmtMinutos(min: number): string {
  return fmtBlocoMinutos(min);
}

export function Dashboard() {
  const concursoAtivoId = useConcursoAtivoId();
  const [registroOpen, setRegistroOpen] = React.useState(false);
  const [registroPrefill, setRegistroPrefill] = React.useState<{
    disciplinaId: string;
    topicoId?: string | null;
  } | null>(null);

  const { data: resumo } = useQuery({
    queryKey: ["dashboard-resumo", concursoAtivoId ?? null],
    queryFn: async () =>
      (
        await api.get("/dashboard/resumo", {
          params: concursoAtivoId ? { concurso_id: concursoAtivoId } : {},
        })
      ).data as DashboardResumo,
  });

  const { data: heatmap } = useQuery({
    queryKey: ["dashboard-heatmap"],
    queryFn: async () => (await api.get("/dashboard/heatmap")).data as HeatmapData[],
  });

  const { data: concursos = [] } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as Concurso[],
  });

  const concursoAtivo = React.useMemo(
    () => concursos.find((c) => c.id === concursoAtivoId) ?? null,
    [concursos, concursoAtivoId],
  );

  const { data: proximoEstudo, isLoading: loadingProximo } = useQuery({
    queryKey: ["dashboard", "proximo-estudo", concursoAtivoId],
    queryFn: async () => (await api.get<ProximoEstudo | null>("/dashboard/proximo-estudo", { params: { concurso_id: concursoAtivoId } })).data,
    enabled: Boolean(concursoAtivoId),
  });
  const { data: revisoesPendentes } = useQuery({
    queryKey: ["dashboard", "revisoes-pendentes", concursoAtivoId],
    queryFn: async () => (await api.get<RevisoesPendentes>("/dashboard/revisoes-pendentes", { params: { concurso_id: concursoAtivoId } })).data,
    enabled: Boolean(concursoAtivoId),
  });

  const diasParaProva = React.useMemo(() => {
    if (!concursoAtivo?.data_prova) return null;
    const prova = parseISO(concursoAtivo.data_prova);
    return differenceInCalendarDays(prova, new Date());
  }, [concursoAtivo]);

  const { data: disciplinas } = useQuery({
    queryKey: ["disciplinas", "dashboard", concursoAtivoId ?? null],
    queryFn: async () =>
      (
        await api.get("/disciplinas", {
          params: {
            include_topicos_stats: true,
            ...(concursoAtivoId ? { concurso_id: concursoAtivoId } : {}),
          },
        })
      ).data as Disciplina[],
  });

  const { data: blocosRaw } = useQuery({
    queryKey: ["cronograma-blocos", concursoAtivoId ?? null],
    queryFn: async () =>
      (
        await api.get("/cronograma/blocos", {
          params: concursoAtivoId ? { concurso_id: concursoAtivoId } : {},
        })
      ).data as Bloco[],
  });

  const { data: avisos = [] } = useQuery({
    queryKey: ["avisos-proximos"],
    queryFn: async () => (await api.get("/avisos/proximos", { params: { dias: 7 } })).data as Aviso[],
  });

  const discMap = React.useMemo(
    () => new Map((disciplinas ?? []).map((d) => [d.id, d.nome])),
    [disciplinas],
  );

  const jsDay = new Date().getDay();
  const diaHoje = (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as Bloco["dia_semana"][])[jsDay];

  const blocosSemana = React.useMemo(() => {
    if (!blocosRaw) return undefined;
    const ids = concursoAtivoId ? new Set((disciplinas ?? []).map((d) => d.id)) : null;
    const filtered = ids ? blocosRaw.filter((b) => ids.has(b.disciplina_id)) : blocosRaw;
    const map = Object.fromEntries(DIAS.map((d) => [d, [] as Bloco[]])) as Record<Bloco["dia_semana"], Bloco[]>;
    for (const b of filtered) map[b.dia_semana]?.push(b);
    for (const d of DIAS) map[d] = [...map[d]].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    return map;
  }, [blocosRaw, disciplinas, concursoAtivoId]);

  const planoHoje = React.useMemo(() => {
    if (!blocosSemana) return [];
    return (blocosSemana[diaHoje] ?? []).map((b) => ({
      bloco: b,
      disciplina: discMap.get(b.disciplina_id) ?? "Disciplina",
      minutos: blocoDurationMinutes(b.hora_inicio, b.hora_fim),
    }));
  }, [blocosSemana, diaHoje, discMap]);

  const progressoDisciplinas = React.useMemo(() => {
    return (disciplinas ?? [])
      .filter((d) => (d.topicos_total ?? 0) > 0)
      .map((d) => {
        const total = d.topicos_total ?? 0;
        const estudados = d.topicos_estudados ?? 0;
        const pct = total > 0 ? Math.round((estudados / total) * 100) : 0;
        return { d, pct };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8)
      .map((x) => x.d);
  }, [disciplinas]);

  const hoje = new Date();
  const calendarioAno = hoje.getFullYear();
  const calendarioMes = hoje.getMonth() + 1;

  return (
    <div className="space-y-6 pb-8">
      {!concursoAtivoId ? <BannerSemConcurso /> : null}

      {concursoAtivoId ? (
        <section className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary-muted to-card p-5 shadow-sm" aria-labelledby="proximo-estudo-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Próxima ação</p>
              <h2 id="proximo-estudo-title" className="mt-1 text-lg font-bold text-card-foreground">
                {loadingProximo ? "Buscando seu próximo estudo…" : proximoEstudo ? proximoEstudo.disciplina_nome : "Planejamento concluído por enquanto"}
              </h2>
              {proximoEstudo ? <p className="mt-1 text-sm text-muted-foreground">{proximoEstudo.topico_nome ? `${proximoEstudo.topico_nome} · ` : ""}{format(parseISO(proximoEstudo.data), "dd 'de' MMMM", { locale: ptBR })} · {proximoEstudo.duracao_minutos} min</p> : !loadingProximo ? <p className="mt-1 text-sm text-muted-foreground">Crie ou ajuste o cronograma para receber uma próxima recomendação.</p> : null}
            </div>
            {proximoEstudo ? <div className="flex flex-wrap gap-2"><Button asChild><Link to={`/pomodoro?disciplina=${proximoEstudo.disciplina_id}`}><Play /> Iniciar estudo</Link></Button><Button type="button" variant="outline" onClick={() => { setRegistroPrefill({ disciplinaId: proximoEstudo.disciplina_id, topicoId: proximoEstudo.topico_id }); setRegistroOpen(true); }}>Registrar manualmente</Button><Button asChild variant="outline"><Link to={`/planos/${concursoAtivoId}/replanejar`}><RefreshCw /> Replanejar</Link></Button></div> : <ButtonLink />}
          </div>
        </section>
      ) : null}

      {concursoAtivoId ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="meta-semanal-title">
            <div className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /><h2 id="meta-semanal-title" className="font-semibold">Meta semanal</h2></div>
            {(() => { const goal = Math.max((resumo?.meta_horas ?? 0) * 7, 0); const current = resumo?.horas_semana ?? 0; const percent = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0; return <><div className="mt-4 flex items-end justify-between gap-3"><div><strong className="text-2xl">{fmtHoras(current)}</strong><span className="ml-2 text-sm text-muted-foreground">de {fmtHoras(goal)}</span></div><span className="text-sm font-semibold text-primary">{percent}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} /></div><p className="mt-3 text-sm text-muted-foreground">{resumo?.questoes_semana ?? 0} questões respondidas nos últimos 7 dias.</p></>; })()}
          </section>
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="revisoes-pendentes-title">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-primary" /><h2 id="revisoes-pendentes-title" className="font-semibold">Revisões pendentes</h2></div><span className="rounded-full bg-primary-muted px-2.5 py-1 text-xs font-semibold text-primary">{revisoesPendentes?.total ?? 0}</span></div>
            {revisoesPendentes?.items.length ? <ul className="mt-3 divide-y divide-border">{revisoesPendentes.items.slice(0, 3).map((item) => <li key={item.topico_id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.topico_nome}</strong><span className="text-xs text-muted-foreground">{item.disciplina_nome}{item.dias_atraso > 0 ? ` · ${item.dias_atraso} dia(s) em atraso` : " · revisar hoje"}</span></div><Link to={`/disciplinas/${item.disciplina_id}?topico=${item.topico_id}`} className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted">Revisar</Link></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">Nenhuma revisão atrasada no concurso ativo.</p>}
          </section>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Painel</h1>
          <p className="text-sm text-muted-foreground">Seu plano de estudos em um só lugar</p>
        </div>
        {diasParaProva != null ? (
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold",
              diasParaProva <= 30
                ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                : "border-border bg-card text-card-foreground",
            )}
          >
            <Target className="h-4 w-4" />
            {diasParaProva > 0
              ? `${diasParaProva} dias para a prova`
              : diasParaProva === 0
                ? "Prova é hoje!"
                : `Prova há ${Math.abs(diasParaProva)} dias`}
            {concursoAtivo?.data_prova ? (
              <span className="text-xs font-normal text-muted-foreground">
                ({format(parseISO(concursoAtivo.data_prova), "dd MMM yyyy", { locale: ptBR })})
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <DashboardWeeklySchedule schedule={blocosSemana} today={diaHoje} disciplineNames={discMap} />
      <DashboardKpis summary={resumo} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <HeatmapCard data={heatmap ?? []} />
          <CalendarioMensalWidget ano={calendarioAno} mes={calendarioMes} concursoId={concursoAtivoId} />

          {progressoDisciplinas.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-card-foreground">Progresso por disciplina</h2>
              <p className="mb-3 text-xs text-muted-foreground">Tópicos concluídos no edital (status dominado)</p>
              <div className="space-y-3">
                {progressoDisciplinas.map((d) => {
                  const total = d.topicos_total ?? 0;
                  const estudados = d.topicos_estudados ?? 0;
                  const pct = total > 0 ? Math.round((estudados / total) * 100) : 0;
                  return (
                    <div key={d.id}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <Link to={`/disciplinas/${d.id}`} className="truncate font-medium text-card-foreground hover:underline">
                          {d.nome}
                        </Link>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {estudados}/{total} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Plano de hoje
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">Sessões do cronograma para {diaAbrev[diaHoje]}</p>
            <div className="space-y-2">
              {planoHoje.length === 0 ? (
                <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">Sem blocos para hoje.</p>
              ) : (
                planoHoje.map(({ bloco, disciplina, minutos }) => {
                  const badge = getTipo(bloco.tipo);
                  return (
                    <Button
                      key={bloco.id}
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setRegistroPrefill({ disciplinaId: bloco.disciplina_id, topicoId: bloco.topico_id });
                        setRegistroOpen(true);
                      }}
                      className="h-auto min-h-11 w-full items-start justify-start whitespace-normal p-2.5 text-left hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", getTipoDot(bloco.tipo))} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-card-foreground">{disciplina}</p>
                        {bloco.topico_nome ? (
                          <p className="truncate text-xs text-muted-foreground">{bloco.topico_nome}</p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {bloco.hora_inicio}–{bloco.hora_fim} · {fmtMinutos(minutos)}
                          </span>
                          <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-semibold", badge.cls)}>{badge.label}</span>
                        </div>
                      </div>
                    </Button>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                <Flame className="h-4 w-4 text-amber-500" />
                Avisos próximos
              </h2>
              <Link to="/avisos" className="inline-flex min-h-10 items-center text-xs font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            {avisos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum aviso nos próximos 7 dias.</p>
            ) : (
              <ul className="space-y-2">
                {avisos.slice(0, 5).map((a) => (
                  <li key={a.id} className="rounded-lg bg-muted/40 px-2.5 py-2 text-xs">
                    <p className="font-medium text-card-foreground">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(a.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <RegistroEstudoModal
        open={registroOpen}
        onClose={() => {
          setRegistroOpen(false);
          setRegistroPrefill(null);
        }}
        defaultDisciplinaId={registroPrefill?.disciplinaId ?? null}
        defaultConcursoId={concursoAtivoId}
        defaultTopicos={
          registroPrefill?.topicoId
            ? [{ id: registroPrefill.topicoId, nome: "" }]
            : null
        }
      />
    </div>
  );
}

function ButtonLink() { return <Button asChild><Link to="/planos/novo">Criar plano guiado</Link></Button>; }
