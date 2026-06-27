import React from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/services/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { ProximasAtividades } from "@/components/dashboard/ProximasAtividades";
import { BannerSemConcurso } from "@/components/dashboard/BannerSemConcurso";
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
};

function fmtHoras(h: number): string {
  if (h <= 0) return "0 min";
  const totalMin = Math.round(h * 60);
  if (totalMin < 60) return `${totalMin} min`;
  const hrs = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return min > 0 ? `${hrs}h ${min}min` : `${hrs}h`;
}

type HeatmapData = {
  date: string;
  count: number;
};

type Bloco = {
  id: string;
  disciplina_id: string;
  dia_semana: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
  hora_inicio: string;
  hora_fim: string;
  tipo: string;
};

type Disciplina = {
  id: string;
  nome: string;
};

export function Dashboard() {
  const concursoAtivoId = useConcursoAtivoId();

  const { data: resumo } = useQuery({
    queryKey: ["dashboard-resumo"],
    queryFn: async () => (await api.get("/dashboard/resumo")).data as DashboardResumo,
  });

  const { data: heatmap } = useQuery({
    queryKey: ["dashboard-heatmap"],
    queryFn: async () => (await api.get("/dashboard/heatmap")).data as HeatmapData[],
  });

  const { data: disciplinas } = useQuery({
    queryKey: ["disciplinas-all"],
    queryFn: async () => (await api.get("/disciplinas")).data as Disciplina[],
  });

  const { data: disciplinasDoConcurso } = useQuery({
    queryKey: ["disciplinas-do-concurso", concursoAtivoId ?? null],
    enabled: Boolean(concursoAtivoId),
    queryFn: async () =>
      (await api.get("/disciplinas", { params: { concurso_id: concursoAtivoId } })).data as Disciplina[],
  });

  const { data: blocosRaw } = useQuery({
    queryKey: ["cronograma-blocos", concursoAtivoId ?? null],
    queryFn: async () => (await api.get("/cronograma/blocos")).data as Bloco[],
  });

  const blocos = React.useMemo(() => {
    if (!blocosRaw) return undefined;
    if (!concursoAtivoId || !disciplinasDoConcurso) return blocosRaw;
    const ids = new Set(disciplinasDoConcurso.map((d) => d.id));
    return blocosRaw.filter((b) => ids.has(b.disciplina_id));
  }, [blocosRaw, concursoAtivoId, disciplinasDoConcurso]);

  const atividadesHoje = React.useMemo(() => {
    if (!blocos || !disciplinas) return [];
    const mapDisc = new Map(disciplinas.map((d) => [d.id, d.nome]));
    const days: Bloco["dia_semana"][] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    const hoje = days[new Date().getDay()];

    return blocos
      .filter((b) => b.dia_semana === hoje)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
      .slice(0, 8)
      .map((b) => {
        const tipo = b.tipo.toLowerCase();
        const normalizedTipo = tipo.includes("quest") || tipo.includes("exerc") ? "exercicio" : tipo.includes("revis") ? "revisao" : "estudo";
        return {
          id: b.id,
          disciplina: mapDisc.get(b.disciplina_id) ?? "Disciplina",
          horario: `${b.hora_inicio} - ${b.hora_fim}`,
          tipo: normalizedTipo as "estudo" | "exercicio" | "revisao",
        };
      });
  }, [blocos, disciplinas]);

  return (
    <div>
      {!concursoAtivoId ? <BannerSemConcurso /> : null}
      <h1 className="mb-0.5 text-lg font-medium text-neutral-800 dark:text-neutral-100">Dashboard</h1>
      <p className="mb-5 text-xs text-neutral-400">KPIs e atividade recente</p>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard
          label="Horas hoje"
          value={fmtHoras(resumo?.horas_hoje ?? 0)}
          sub={`Meta: ${fmtHoras(resumo?.meta_horas ?? 4)}`}
          progress={
            resumo && resumo.meta_horas > 0
              ? Math.max(0, Math.min(100, Math.round((resumo.horas_hoje / resumo.meta_horas) * 100)))
              : 0
          }
          badge={`${
            resumo && resumo.meta_horas > 0
              ? Math.max(0, Math.min(100, Math.round((resumo.horas_hoje / resumo.meta_horas) * 100)))
              : 0
          }% da meta`}
          badgeVariant="amber"
        />
        <KpiCard
          label="Horas na semana"
          value={fmtHoras(resumo?.horas_semana ?? 0)}
          sub="Últimos 7 dias"
          badgeVariant="amber"
        />
        <KpiCard
          label="Sessões"
          value={`${resumo?.sessoes_semana ?? 0}`}
          sub="Esta semana"
          badgeVariant="amber"
        />
        <KpiCard
          label="Questões semana"
          value={`${resumo?.questoes_semana ?? 0}`}
          sub="Registros de treino"
          badge={(resumo?.questoes_semana ?? 0) > 0 ? "Com dados" : "Sem dados"}
          badgeVariant={(resumo?.questoes_semana ?? 0) > 0 ? "green" : "amber"}
        />
        <KpiCard
          label="Rendimento médio"
          value={`${(resumo?.rendimento_medio ?? 0).toFixed(1)}%`}
          sub="Média no período"
          badge={(resumo?.rendimento_medio ?? 0) > 0 ? "Com dados" : "Sem dados"}
          badgeVariant={(resumo?.rendimento_medio ?? 0) > 0 ? "green" : "amber"}
        />
        <KpiCard
          label="Avisos próximos"
          value={`${resumo?.avisos_proximos ?? 0}`}
          sub="Próximos 7 dias"
          badge={(resumo?.avisos_proximos ?? 0) > 0 ? "Atenção" : "Em dia"}
          badgeVariant={(resumo?.avisos_proximos ?? 0) > 0 ? "amber" : "green"}
        />
        <KpiCard
          label="Flashcards"
          value={`${resumo?.flashcards_para_revisar ?? 0}`}
          sub="Para revisar hoje"
          badge={(resumo?.flashcards_para_revisar ?? 0) > 0 ? "Pendente" : "Em dia"}
          badgeVariant={(resumo?.flashcards_para_revisar ?? 0) > 0 ? "amber" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <HeatmapCard data={heatmap ?? []} />
        <ProximasAtividades atividades={atividadesHoje} />
      </div>
    </div>
  );
}

