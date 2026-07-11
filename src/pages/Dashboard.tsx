import React from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CheckCircle2, Flame, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "@/services/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { CalendarioMensalWidget } from "@/components/calendario/CalendarioMensalWidget";
import { BannerSemConcurso } from "@/components/dashboard/BannerSemConcurso";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { DIAS, diaAbrev, blocoDurationMinutes, fmtBlocoMinutos, getTipo } from "@/lib/cronograma/constants";
import type { Bloco } from "@/lib/cronograma/types";
import type { Disciplina } from "@/lib/disciplinas/types";
import { cn } from "@/lib/utils";
import { useConcursoAtivoId } from "@/stores/concursoStore";

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
      .filter((d) => (d.dominio_medio_pct ?? 0) > 0 || (d.topicos_total ?? 0) > 0)
      .sort((a, b) => (b.dominio_medio_pct ?? 0) - (a.dominio_medio_pct ?? 0))
      .slice(0, 8);
  }, [disciplinas]);

  const hoje = new Date();
  const calendarioAno = hoje.getFullYear();
  const calendarioMes = hoje.getMonth() + 1;

  return (
    <div className="space-y-6 pb-8">
      {!concursoAtivoId ? <BannerSemConcurso /> : null}

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

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
            <Calendar className="h-4 w-4" />
            Cronograma da semana
          </h2>
          <Link to="/cronograma" className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
            Ver completo
          </Link>
        </div>
        <div className="-mx-1 overflow-x-auto pb-1" role="region" aria-label="Cronograma da semana">
          <div className="grid min-w-[320px] grid-cols-7 gap-1.5">
          {DIAS.map((dia) => {
            const items = blocosSemana?.[dia] ?? [];
            const isHoje = dia === diaHoje;
            return (
              <div
                key={dia}
                className={cn(
                  "min-h-[72px] rounded-lg border p-1.5",
                  isHoje ? "border-primary-400 bg-primary-50/50 dark:border-primary-600 dark:bg-primary-950/20" : "border-border/60",
                )}
              >
                <p className={cn("mb-1 text-[9px] font-bold uppercase", isHoje ? "text-primary-700 dark:text-primary-300" : "text-muted-foreground")}>
                  {diaAbrev[dia]}
                </p>
                <div className="space-y-0.5">
                  {items.slice(0, 2).map((b) => (
                    <div key={b.id} className="truncate rounded bg-background/80 px-1 py-0.5 text-[8px] leading-tight text-card-foreground">
                      <span className="font-semibold">{discMap.get(b.disciplina_id)?.split(" ")[0]}</span>
                      {b.topico_nome ? <span className="block truncate text-muted-foreground">{b.topico_nome}</span> : null}
                    </div>
                  ))}
                  {items.length > 2 ? (
                    <p className="text-[8px] text-muted-foreground">+{items.length - 2}</p>
                  ) : items.length === 0 ? (
                    <p className="text-[8px] text-muted-foreground/60">—</p>
                  ) : null}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard
          label="Horas hoje"
          value={fmtHoras(resumo?.horas_hoje ?? 0)}
          sub={`Meta: ${fmtHoras(resumo?.meta_horas ?? 4)}`}
          progress={
            resumo && resumo.meta_horas > 0
              ? Math.max(0, Math.min(100, Math.round((resumo.horas_hoje / resumo.meta_horas) * 100)))
              : 0
          }
          badgeVariant="amber"
        />
        <KpiCard label="Horas na semana" value={fmtHoras(resumo?.horas_semana ?? 0)} sub="Últimos 7 dias" badgeVariant="amber" />
        <KpiCard
          label="Sequência"
          value={`${resumo?.streak_dias ?? 0} dias`}
          sub="Dias consecutivos"
          badge={(resumo?.streak_dias ?? 0) > 0 ? "Em dia" : "Comece hoje"}
          badgeVariant={(resumo?.streak_dias ?? 0) > 0 ? "green" : "amber"}
        />
        <KpiCard label="Sessões" value={`${resumo?.sessoes_semana ?? 0}`} sub="Esta semana" badgeVariant="amber" />
        <KpiCard
          label="Rendimento"
          value={`${(resumo?.rendimento_medio ?? 0).toFixed(1)}%`}
          sub="Média no período"
          badgeVariant={(resumo?.rendimento_medio ?? 0) > 0 ? "green" : "amber"}
        />
        <KpiCard
          label="Flashcards"
          value={`${resumo?.flashcards_para_revisar ?? 0}`}
          sub="Para revisar"
          badgeVariant={(resumo?.flashcards_para_revisar ?? 0) > 0 ? "amber" : "green"}
        />
        <KpiCard
          label="Cumprimento mês"
          value={`${(resumo?.taxa_cumprimento_mes ?? 0).toFixed(0)}%`}
          sub={`${fmtMinutos(resumo?.minutos_realizados_mes ?? 0)} de ${fmtMinutos(resumo?.minutos_planejados_mes ?? 0)}`}
          badgeVariant={(resumo?.taxa_cumprimento_mes ?? 0) >= 80 ? "green" : "amber"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <HeatmapCard data={heatmap ?? []} />
          <CalendarioMensalWidget ano={calendarioAno} mes={calendarioMes} concursoId={concursoAtivoId} />

          {progressoDisciplinas.length > 0 ? (
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-card-foreground">Progresso por disciplina</h2>
              <p className="mb-3 text-xs text-muted-foreground">Domínio médio dos assuntos (1–5)</p>
              <div className="space-y-3">
                {progressoDisciplinas.map((d) => {
                  const pct = d.dominio_medio_pct ?? 0;
                  return (
                    <div key={d.id}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <Link to={`/disciplinas/${d.id}`} className="truncate font-medium text-card-foreground hover:underline">
                          {d.nome}
                        </Link>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{pct}%</span>
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
                    <button
                      key={bloco.id}
                      type="button"
                      onClick={() => {
                        setRegistroPrefill({ disciplinaId: bloco.disciplina_id, topicoId: bloco.topico_id });
                        setRegistroOpen(true);
                      }}
                      className="flex min-h-11 w-full items-start gap-2 rounded-lg border border-border bg-background p-2.5 text-left transition hover:border-primary-300 hover:bg-primary-50/30 dark:hover:bg-primary-950/20"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-card-foreground">{disciplina}</p>
                        {bloco.topico_nome ? (
                          <p className="truncate text-[10px] text-muted-foreground">{bloco.topico_nome}</p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="text-[10px] tabular-nums text-muted-foreground">{fmtMinutos(minutos)}</span>
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", badge.cls)}>{badge.label}</span>
                        </div>
                      </div>
                    </button>
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
              <Link to="/avisos" className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
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
                    <p className="text-[10px] text-muted-foreground">
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
        defaultTopicos={
          registroPrefill?.topicoId
            ? [{ id: registroPrefill.topicoId, nome: "" }]
            : null
        }
      />
    </div>
  );
}
