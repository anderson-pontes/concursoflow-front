import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DataTable } from "@/components/ui/DataTable";
import type { SessaoEstudoRow } from "@/lib/historico/types";
import { fmtMinutosEstudo } from "@/lib/calendario/format";

type Row = SessaoEstudoRow & { _disciplina: string };

type Props = {
  items: SessaoEstudoRow[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disciplinaMap: Map<string, string>;
};

export function HistoricoSessoesTable({
  items,
  total,
  page,
  pageSize,
  onPageChange,
  disciplinaMap,
}: Props) {
  const enriched = React.useMemo<Row[]>(
    () =>
      items.map((r) => ({
        ...r,
        _disciplina: disciplinaMap.get(r.disciplina_id) ?? r.disciplina_id.slice(0, 8),
      })),
    [items, disciplinaMap],
  );

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "disciplina",
        accessorFn: (r) => r._disciplina,
        header: "Disciplina",
      },
      {
        id: "data",
        accessorFn: (r) => r.data_referencia ?? r.inicio.slice(0, 10),
        header: "Data",
        cell: ({ getValue }) => {
          const v = String(getValue());
          try {
            return format(parseISO(v), "dd/MM/yyyy", { locale: ptBR });
          } catch {
            return v;
          }
        },
      },
      {
        accessorKey: "duracao_minutos",
        header: "Duração",
        cell: ({ getValue }) => fmtMinutosEstudo(Number(getValue())),
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: ({ getValue }) => <span className="capitalize">{String(getValue())}</span>,
      },
      {
        id: "questoes",
        accessorFn: (r) => r.questoes_acertos + r.questoes_erros + r.questoes_em_branco,
        header: "Questões",
      },
      {
        id: "rendimento",
        accessorFn: (r) => {
          const totalQ = r.questoes_acertos + r.questoes_erros + r.questoes_em_branco;
          return totalQ > 0 ? Math.round((r.questoes_acertos / totalQ) * 100) : null;
        },
        header: "Acertos",
        cell: ({ getValue }) => {
          const v = getValue() as number | null;
          return v != null ? `${v}%` : "—";
        },
      },
    ],
    [],
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      <DataTable
        data={enriched}
        columns={columns}
        searchColumnId="disciplina"
        searchPlaceholder="Buscar disciplina…"
        emptyMessage="Nenhuma sessão no período."
      />
      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} sessões · página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="min-h-11 rounded-lg border border-border px-4 py-2 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="min-h-11 rounded-lg border border-border px-4 py-2 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
