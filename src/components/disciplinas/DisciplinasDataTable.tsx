import React from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3, Pencil, Trash2 } from "lucide-react";

import { DataTable } from "@/components/ui/DataTable";
import { getDisciplinaStatusLabel, getTopicosProgressFromCounts } from "@/components/disciplinas/disciplinaProgress";
import { fmtPontos } from "@/lib/disciplinas/pontos";
import type { Disciplina } from "@/lib/disciplinas/types";
import { cn } from "@/lib/utils";

export type DisciplinasDataTableProps = {
  disciplinas: Disciplina[];
  concursoId: string;
  onEdit: (d: Disciplina) => void;
  onToggleConcurso: (d: Disciplina) => void;
  onConfirmDelete: (d: Disciplina) => Promise<void>;
};

export function DisciplinasDataTable({
  disciplinas,
  concursoId,
  onEdit,
  onToggleConcurso,
  onConfirmDelete,
}: DisciplinasDataTableProps) {
  const columns = React.useMemo<ColumnDef<Disciplina>[]>(
    () => [
      {
        id: "nome",
        accessorKey: "nome",
        header: "Disciplina",
        cell: ({ row }) => (
          <Link
            to={`/disciplinas/${row.original.id}`}
            className="font-semibold text-primary-700 hover:underline dark:text-primary-400"
          >
            {row.original.nome}
          </Link>
        ),
      },
      {
        id: "peso",
        accessorFn: (d) => d.total_pontos ?? d.peso ?? 0,
        header: "Peso",
        cell: ({ row }) => (
          <span className="tabular-nums">{fmtPontos(row.original.total_pontos ?? row.original.peso)}</span>
        ),
      },
      {
        id: "prioridade",
        accessorFn: (d) => d.prioridade_calculada ?? 0,
        header: "Prioridade",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold tabular-nums">
            {row.original.prioridade_calculada ?? "—"}
          </span>
        ),
      },
      {
        id: "topicos",
        accessorFn: (d) => d.topicos_estudados ?? 0,
        header: "Tópicos",
        cell: ({ row }) => {
          const total = row.original.topicos_total ?? 0;
          const est = row.original.topicos_estudados ?? 0;
          return (
            <span className="tabular-nums text-muted-foreground">
              {est}/{total}
            </span>
          );
        },
      },
      {
        id: "progresso",
        accessorFn: (d) => {
          const stats = getTopicosProgressFromCounts(d.topicos_total ?? 0, d.topicos_estudados ?? 0);
          return d.dominio_medio_pct ?? stats.pct;
        },
        header: "Progresso",
        cell: ({ row }) => {
          const total = row.original.topicos_total ?? 0;
          const est = row.original.topicos_estudados ?? 0;
          const stats = getTopicosProgressFromCounts(total, est);
          const pct = row.original.dominio_medio_pct ?? stats.pct;
          return (
            <div className="flex min-w-[100px] items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorFn: (d) => getDisciplinaStatusLabel(getTopicosProgressFromCounts(d.topicos_total ?? 0, d.topicos_estudados ?? 0)).label,
        header: "Status",
        cell: ({ row }) => {
          const stats = getTopicosProgressFromCounts(row.original.topicos_total ?? 0, row.original.topicos_estudados ?? 0);
          const st = getDisciplinaStatusLabel(stats);
          return (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                st.kind === "concluida"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : st.kind === "em_progresso"
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {st.label}
            </span>
          );
        },
      },
      {
        id: "acoes",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => {
          const d = row.original;
          const linked = concursoId && d.concurso_ids.includes(concursoId);
          return (
            <div className="flex items-center gap-1">
              {concursoId ? (
                <button
                  type="button"
                  title={linked ? "Remover do concurso" : "Vincular ao concurso"}
                  onClick={() => onToggleConcurso(d)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-semibold",
                    linked
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40"
                      : "border border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {linked ? "No concurso" : "Vincular"}
                </button>
              ) : null}
              <button
                type="button"
                title="Editar"
                onClick={() => onEdit(d)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Excluir"
                onClick={() => {
                  if (window.confirm(`Excluir "${d.nome}"?`)) void onConfirmDelete(d);
                }}
                className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <Link
                to={`/disciplinas/${d.id}`}
                title="Dashboard"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        },
      },
    ],
    [concursoId, onConfirmDelete, onEdit, onToggleConcurso],
  );

  return (
    <DataTable
      data={disciplinas}
      columns={columns}
      searchColumnId="nome"
      searchPlaceholder="Filtrar na tabela…"
      emptyMessage="Nenhuma disciplina neste filtro."
    />
  );
}
