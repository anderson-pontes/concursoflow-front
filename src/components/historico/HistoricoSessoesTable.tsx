import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { History } from "lucide-react";
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

  if (items.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Nenhuma sessão encontrada"
        description="Ajuste os filtros ou registre um estudo para começar a construir seu histórico."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="hidden md:block">
        <DataTable
          data={enriched}
          columns={columns}
          searchColumnId="disciplina"
          searchPlaceholder="Buscar disciplina…"
          emptyMessage="Nenhuma sessão no período."
        />
      </div>
      <ul className="space-y-3 md:hidden" aria-label="Sessões de estudo">
        {enriched.map((row) => {
          const questions = row.questoes_acertos + row.questoes_erros + row.questoes_em_branco;
          const performance = questions > 0 ? Math.round((row.questoes_acertos / questions) * 100) : null;
          const date = row.data_referencia ?? row.inicio.slice(0, 10);
          return (
            <li key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-card-foreground">{row._disciplina}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{row.tipo}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format(parseISO(date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div><dt className="text-xs text-muted-foreground">Duração</dt><dd className="mt-1 text-sm font-semibold">{fmtMinutosEstudo(row.duracao_minutos)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Questões</dt><dd className="mt-1 text-sm font-semibold">{questions}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Acertos</dt><dd className="mt-1 text-sm font-semibold">{performance != null ? `${performance}%` : "—"}</dd></div>
              </dl>
            </li>
          );
        })}
      </ul>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} sessões · página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
