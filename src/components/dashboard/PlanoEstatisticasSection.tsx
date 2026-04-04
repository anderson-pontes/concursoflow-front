import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Layers, CreditCard, AlarmClock, Filter, Sparkles } from "lucide-react";

import { api } from "@/services/api";
import { cn } from "@/lib/utils";

export type DashboardEstatisticas = {
  total_questoes: number;
  questoes_certas: number;
  rendimento_pct: number;
  total_topicos: number;
  topicos_estudados: number;
  flashcards_total: number;
  flashcards_para_revisar: number;
  flashcards_criados_periodo: number;
  periodo_inicio: string;
  periodo_fim: string;
  periodo_label: string;
};

type PlanoDisciplinaRow = {
  id: string;
  disciplina_id: string;
  nome: string;
};

type Props = {
  planoId: string;
};

const MESES = [
  { v: 1, l: "Janeiro" },
  { v: 2, l: "Fevereiro" },
  { v: 3, l: "Março" },
  { v: 4, l: "Abril" },
  { v: 5, l: "Maio" },
  { v: 6, l: "Junho" },
  { v: 7, l: "Julho" },
  { v: 8, l: "Agosto" },
  { v: 9, l: "Setembro" },
  { v: 10, l: "Outubro" },
  { v: 11, l: "Novembro" },
  { v: 12, l: "Dezembro" },
];

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  footer,
  blobClass,
  iconBoxClass,
  iconClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subtitle: string;
  footer?: React.ReactNode;
  blobClass: string;
  iconBoxClass: string;
  iconClass: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.12] blur-2xl transition-opacity group-hover:opacity-20",
          blobClass,
        )}
      />
      <div className="relative flex items-start gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconBoxClass)}>
          <Icon className={cn("h-5 w-5", iconClass)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold tabular-nums tracking-tight text-card-foreground">
            {value}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          {footer ? <div className="mt-2 text-[11px] text-muted-foreground/80">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function PlanoEstatisticasSection({ planoId }: Props) {
  const [disciplinaId, setDisciplinaId] = React.useState("");
  const [ano, setAno] = React.useState("");
  const [mes, setMes] = React.useState("");

  React.useEffect(() => {
    if (!ano) setMes("");
  }, [ano]);

  const { data: planoDisciplinas } = useQuery({
    queryKey: ["plano-disciplinas-dashboard", planoId],
    queryFn: async () =>
      (await api.get(`/planos/${planoId}/disciplinas`)).data as PlanoDisciplinaRow[],
    enabled: Boolean(planoId),
  });

  const anoNum = ano ? Number(ano) : undefined;
  const mesNum = mes && ano ? Number(mes) : undefined;

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["dashboard-estatisticas", planoId, disciplinaId || null, anoNum ?? null, mesNum ?? null],
    queryFn: async () => {
      const params: Record<string, string | number> = { plano_id: planoId };
      if (disciplinaId) params.disciplina_id = disciplinaId;
      if (anoNum != null) params.ano = anoNum;
      if (mesNum != null) params.mes = mesNum;
      return (await api.get("/dashboard/estatisticas", { params })).data as DashboardEstatisticas;
    },
    enabled: Boolean(planoId),
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - i);

  const topicProgress =
    stats && stats.total_topicos > 0
      ? Math.round((stats.topicos_estudados / stats.total_topicos) * 100)
      : 0;

  return (
    <section className="mb-6 rounded-2xl border border-border/60 bg-gradient-to-br from-muted/40 via-card to-card p-5 shadow-sm dark:from-muted/20">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-card-foreground">Desempenho do plano</h2>
            <p className="text-xs text-muted-foreground">
              Questões, tópicos e flashcards das disciplinas do seu plano
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2">
          <Filter className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
          <select
            className="max-w-[160px] rounded-lg border border-transparent bg-transparent py-1 text-xs font-medium text-card-foreground outline-none focus:ring-1 focus:ring-primary-500"
            value={disciplinaId}
            onChange={(e) => setDisciplinaId(e.target.value)}
            aria-label="Disciplina"
          >
            <option value="">Todas as disciplinas</option>
            {(planoDisciplinas ?? []).map((d) => (
              <option key={d.id} value={d.disciplina_id}>
                {d.nome}
              </option>
            ))}
          </select>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <select
            className="rounded-lg border border-transparent bg-transparent py-1 text-xs font-medium text-card-foreground outline-none focus:ring-1 focus:ring-primary-500"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            aria-label="Ano"
          >
            <option value="">Todo o período</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
          <select
            className="max-w-[130px] rounded-lg border border-transparent bg-transparent py-1 text-xs font-medium text-card-foreground outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-40"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            disabled={!ano}
            aria-label="Mês"
          >
            <option value="">Ano inteiro</option>
            {MESES.map((m) => (
              <option key={m.v} value={String(m.v)}>
                {m.l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isError ? (
        <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-800 dark:bg-danger-950/30 dark:text-danger-300">
          Não foi possível carregar as estatísticas.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[132px] animate-pulse rounded-2xl border border-border/60 bg-muted/50"
            />
          ))
        ) : (
          <>
            <StatCard
              icon={ClipboardList}
              title="Questões realizadas"
              value={stats.total_questoes.toLocaleString("pt-BR")}
              subtitle={`${stats.questoes_certas.toLocaleString("pt-BR")} acertos · ${stats.rendimento_pct.toFixed(1)}% de aproveitamento`}
              footer={`Período: ${stats.periodo_label}`}
              blobClass="bg-indigo-500"
              iconBoxClass="bg-indigo-500/15"
              iconClass="text-indigo-600 dark:text-indigo-400"
            />
            <StatCard
              icon={Layers}
              title="Tópicos do plano"
              value={`${stats.topicos_estudados} / ${stats.total_topicos}`}
              subtitle={
                stats.total_topicos > 0
                  ? `${topicProgress}% marcados como estudados`
                  : "Nenhum tópico no plano neste escopo"
              }
              footer={
                stats.total_topicos > 0 ? (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${topicProgress}%` }}
                    />
                  </div>
                ) : undefined
              }
              blobClass="bg-emerald-500"
              iconBoxClass="bg-emerald-500/15"
              iconClass="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              icon={CreditCard}
              title="Flashcards cadastrados"
              value={stats.flashcards_total.toLocaleString("pt-BR")}
              subtitle="Baralhos vinculados a este plano"
              footer={
                stats.flashcards_criados_periodo > 0
                  ? `${stats.flashcards_criados_periodo} novo(s) no período selecionado`
                  : ano
                    ? "Nenhum card novo neste período"
                    : undefined
              }
              blobClass="bg-violet-500"
              iconBoxClass="bg-violet-500/15"
              iconClass="text-violet-600 dark:text-violet-400"
            />
            <StatCard
              icon={AlarmClock}
              title="Para revisar"
              value={stats.flashcards_para_revisar.toLocaleString("pt-BR")}
              subtitle="Cartões com revisão até o fim do período filtrado"
              footer={stats.periodo_label !== "Todo o período" ? `Referência: ${stats.periodo_fim}` : "Referência: hoje"}
              blobClass="bg-amber-500"
              iconBoxClass="bg-amber-500/15"
              iconClass="text-amber-600 dark:text-amber-400"
            />
          </>
        )}
      </div>
    </section>
  );
}
