import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";

import { HistoricoAgregadoChart } from "@/components/historico/HistoricoAgregadoChart";
import { HistoricoFiltros } from "@/components/historico/HistoricoFiltros";
import { HistoricoResumoCards } from "@/components/historico/HistoricoResumoCards";
import { HistoricoSessoesTable } from "@/components/historico/HistoricoSessoesTable";
import { useHistoricoAgregado, useHistoricoSessoes } from "@/hooks/useHistoricoEstudos";
import type { HistoricoFilters } from "@/lib/historico/types";
import { api } from "@/services/api";
import { useConcursoAtivoId } from "@/stores/concursoStore";

function defaultRange() {
  const fim = new Date();
  const inicio = subDays(fim, 30);
  return {
    dataInicio: format(inicio, "yyyy-MM-dd"),
    dataFim: format(fim, "yyyy-MM-dd"),
  };
}

export function HistoricoEstudos() {
  const concursoAtivoId = useConcursoAtivoId();
  const range = defaultRange();
  const [filters, setFilters] = React.useState<HistoricoFilters>({
    ...range,
    page: 1,
    pageSize: 20,
    concursoId: concursoAtivoId ?? undefined,
  });
  const [agruparPor, setAgruparPor] = React.useState("dia");

  React.useEffect(() => {
    setFilters((f) => ({ ...f, concursoId: concursoAtivoId ?? undefined, page: 1 }));
  }, [concursoAtivoId]);

  const { data: sessoesData, isLoading } = useHistoricoSessoes(filters);
  const { data: agregado } = useHistoricoAgregado({
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
    agruparPor,
    concursoId: concursoAtivoId,
  });

  const { data: disciplinas = [] } = useQuery({
    queryKey: ["disciplinas", "historico", concursoAtivoId ?? null],
    queryFn: async () => {
      const rows = (await api.get("/disciplinas", {
        params: concursoAtivoId ? { concurso_id: concursoAtivoId } : {},
      })).data as Array<{ id: string; nome: string }>;
      return rows;
    },
  });

  const discMap = React.useMemo(() => new Map(disciplinas.map((d) => [d.id, d.nome])), [disciplinas]);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Histórico de estudos</h1>
        <p className="text-sm text-muted-foreground">Sessões registradas e tempo agregado</p>
      </div>

      <HistoricoFiltros
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        disciplinas={disciplinas}
      />

      <HistoricoResumoCards resumo={sessoesData?.resumo} />

      <HistoricoAgregadoChart
        serie={agregado?.serie ?? []}
        agruparPor={agruparPor}
        onAgruparChange={setAgruparPor}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando sessões…</p>
      ) : (
        <HistoricoSessoesTable
          items={sessoesData?.items ?? []}
          total={sessoesData?.total ?? 0}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          disciplinaMap={discMap}
        />
      )}
    </div>
  );
}
