import React from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/services/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { ProximasAtividades } from "@/components/dashboard/ProximasAtividades";
import { BannerSemPlano } from "@/components/dashboard/BannerSemPlano";
import { usePlanoAtivo } from "@/stores/planoStore";

type DashboardResumo = {
  horas_hoje: number;
  meta_horas: number;
  questoes_semana: number;
  rendimento_medio: number;
  avisos_proximos: number;
  flashcards_para_revisar: number;
};

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
  const planoAtivo = usePlanoAtivo();
  const planoIdParam = planoAtivo?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(planoAtivo.id) ? planoAtivo.id : undefined;

  const { data: resumo } = useQuery({
    queryKey: ["dashboard-resumo", planoIdParam ?? null],
    queryFn: async () =>
      (
        await api.get("/dashboard/resumo", {
          params: { plano_id: planoIdParam ?? undefined },
        })
      ).data as DashboardResumo,
  });

  const { data: heatmap } = useQuery({
    queryKey: ["dashboard-heatmap", planoIdParam ?? null],
    queryFn: async () =>
      (
        await api.get("/dashboard/heatmap", {
          params: { plano_id: planoIdParam ?? undefined },
        })
      ).data as HeatmapData[],
  });

  const { data: disciplinas } = useQuery({
    queryKey: ["disciplinas-all"],
    queryFn: async () => (await api.get("/disciplinas")).data as Disciplina[],
  });

  const { data: blocos } = useQuery({
    queryKey: ["cronograma-blocos", planoIdParam ?? null],
    queryFn: async () =>
      (
        await api.get("/cronograma/blocos", {
          params: { plano_id: planoIdParam ?? undefined },
        })
      ).data as Bloco[],
  });

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
      {!planoAtivo ? <BannerSemPlano /> : null}
      <h1 className="mb-0.5 text-lg font-medium text-neutral-800 dark:text-neutral-100">Dashboard</h1>
      <p className="mb-5 text-xs text-neutral-400">KPIs e atividade recente</p>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Horas hoje"
          value={`${resumo?.horas_hoje ?? 0}h`}
          sub={`Meta: ${resumo?.meta_horas ?? 4}h`}
          progress={
            resumo && resumo.meta_horas > 0 ? Math.max(0, Math.min(100, Math.round((resumo.horas_hoje / resumo.meta_horas) * 100))) : 0
          }
          badge={`${
            resumo && resumo.meta_horas > 0 ? Math.max(0, Math.min(100, Math.round((resumo.horas_hoje / resumo.meta_horas) * 100))) : 0
          }% da meta`}
          badgeVariant="amber"
        />
        <KpiCard
          label="Questões semana"
          value={`${resumo?.questoes_semana ?? 0}`}
          sub="Registros de treino"
          badge={(resumo?.questoes_semana ?? 0) > 0 ? "Com dados" : "Sem dados"}
          badgeVariant="amber"
        />
        <KpiCard
          label="Rendimento médio"
          value={`${resumo?.rendimento_medio?.toFixed(1) ?? "0.0"}%`}
          sub="Média no período"
          badge={(resumo?.rendimento_medio ?? 0) > 0 ? "Com dados" : "Sem dados"}
          badgeVariant="amber"
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

