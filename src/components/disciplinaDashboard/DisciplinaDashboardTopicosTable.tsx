import React from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Circle,
  Eye,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { TopicosModal } from "@/components/disciplinas/TopicosModal";
import { DominioPicker } from "@/components/disciplinas/DominioPicker";
import type { RegistroDefaultTopico } from "@/components/estudos/RegistroEstudoModal";
import { fmtTempoTopico } from "@/lib/disciplinaDashboard/format";
import { prioridadeAssunto, revisaoChip } from "@/lib/topicos/prioridade";
import { cn } from "@/lib/utils";
import type { DisciplinaDashboardResponse, DisciplinaDashboardTopicoRow } from "@/types/disciplinaDashboard";

type ToggleConcluidoMutation = UseMutationResult<
  void,
  Error,
  { topicoId: string; concluido: boolean },
  unknown
>;

type CriarTopicosMutation = UseMutationResult<void, Error, string[], unknown>;

type ExcluirTopicoMutation = UseMutationResult<void, Error, string, unknown>;

type ReordenarTopicosMutation = UseMutationResult<void, Error, string[], unknown>;

type AtualizarTopicoMutation = UseMutationResult<
  void,
  Error,
  { topicoId: string; patch: { peso?: number; dominio?: number } },
  unknown
>;

export type DisciplinaDashboardTopicosTableProps = {
  disciplinaId: string;
  data: DisciplinaDashboardResponse | undefined;
  isLoading: boolean;
  isDemoMode: boolean;
  topicosModalOpen: boolean;
  onTopicosModalOpenChange: (open: boolean) => void;
  menuRow: string | null;
  onMenuRowChange: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  toggleConcluido: ToggleConcluidoMutation;
  criarTopicos: CriarTopicosMutation;
  excluirTopico: ExcluirTopicoMutation;
  reordenarTopicos: ReordenarTopicosMutation;
  atualizarTopico: AtualizarTopicoMutation;
  onDemoToast: () => void;
  onDetalhesTopico: (topico: { id: string; descricao: string }) => void;
  onRegistroTopico: (prefill: RegistroDefaultTopico[]) => void;
  onEditTopico: (topico: { id: string; descricao: string }) => void;
  highlightedTopicoId?: string | null;
};

function SortableRow({
  row,
  isDemoMode,
  menuRow,
  onMenuRowChange,
  menuRef,
  toggleConcluido,
  excluirTopico,
  atualizarTopico,
  onDetalhesTopico,
  onRegistroTopico,
  onEditTopico,
  highlighted,
}: {
  row: DisciplinaDashboardTopicoRow;
  isDemoMode: boolean;
  menuRow: string | null;
  onMenuRowChange: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  toggleConcluido: ToggleConcluidoMutation;
  excluirTopico: ExcluirTopicoMutation;
  atualizarTopico: AtualizarTopicoMutation;
  onDetalhesTopico: (topico: { id: string; descricao: string }) => void;
  onRegistroTopico: (prefill: RegistroDefaultTopico[]) => void;
  onEditTopico: (topico: { id: string; descricao: string }) => void;
  highlighted?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: isDemoMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const rev = revisaoChip(row.dominio, row.ultima_revisao_em, row.intervalo_idx);
  const prio = prioridadeAssunto(row.peso, row.dominio);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      data-topico-id={row.id}
      className={cn(
        "border-b border-slate-100 transition hover:bg-slate-50/80 dark:border-neutral-800 dark:hover:bg-neutral-900/40",
        highlighted && "bg-primary-50 ring-2 ring-inset ring-primary-400 dark:bg-primary-950/30 dark:ring-primary-500",
      )}
    >
      <td className="w-8 px-2 py-3">
        {!isDemoMode ? (
          <button
            type="button"
            className="cursor-grab touch-none rounded p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing dark:hover:text-neutral-300"
            aria-label="Arrastar para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
      </td>
      <td className="px-2 py-3 text-center">
        <button
          type="button"
          role="checkbox"
          aria-checked={row.concluido_edital}
          disabled={toggleConcluido.isPending || isDemoMode}
          title={isDemoMode ? "Indisponível no modo demonstração" : undefined}
          onClick={() => toggleConcluido.mutate({ topicoId: row.id, concluido: !row.concluido_edital })}
          className={cn(
            "mx-auto flex h-6 w-6 items-center justify-center rounded-md border-2 transition",
            row.concluido_edital
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-300 bg-white dark:border-neutral-600 dark:bg-neutral-900",
          )}
        >
          {row.concluido_edital ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
        </button>
      </td>
      <td className="max-w-[200px] px-3 py-3 font-medium text-slate-900 dark:text-neutral-100">
        <span className="line-clamp-2">{row.descricao}</span>
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min={1}
          max={99}
          disabled={isDemoMode || atualizarTopico.isPending}
          defaultValue={row.peso}
          key={`peso-${row.id}-${row.peso}`}
          onBlur={(e) => {
            const v = Math.max(1, parseInt(e.target.value, 10) || 1);
            if (v !== row.peso) atualizarTopico.mutate({ topicoId: row.id, patch: { peso: v } });
          }}
          className="w-12 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-center text-xs tabular-nums dark:border-neutral-600 dark:bg-neutral-900"
        />
      </td>
      <td className="px-2 py-3">
        <DominioPicker
          value={row.dominio}
          size="sm"
          disabled={isDemoMode || atualizarTopico.isPending}
          onChange={(v) => {
            if (v !== row.dominio) atualizarTopico.mutate({ topicoId: row.id, patch: { dominio: v } });
          }}
        />
      </td>
      <td className="px-2 py-3 text-center">
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-neutral-300">{prio}</span>
        {rev.variant !== "none" ? (
          <span
            className={cn(
              "mt-0.5 block rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
              rev.variant === "overdue"
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
            )}
          >
            {rev.label}
          </span>
        ) : null}
      </td>
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="h-3.5 w-3.5" aria-hidden />
          {row.certas}
        </span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center gap-1 font-medium text-rose-500 dark:text-rose-400">
          <X className="h-3.5 w-3.5" aria-hidden />
          {row.erradas}
        </span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="inline-flex items-center gap-1 font-medium text-slate-400">
          <Circle className="h-3.5 w-3.5" aria-hidden />
          {row.em_branco}
        </span>
      </td>
      <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-neutral-200">
        {row.aproveitamento_pct}%
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-slate-600 dark:text-neutral-300">
        {fmtTempoTopico(row.tempo_estudo_minutos)}
      </td>
      <td className="px-3 py-3 text-center tabular-nums text-slate-700 dark:text-neutral-200">
        {(row.paginas_lidas ?? 0) > 0 ? (row.paginas_lidas ?? 0).toLocaleString("pt-BR") : "—"}
      </td>
      <td className="relative px-2 py-3">
        <div ref={menuRow === row.id ? menuRef : undefined}>
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800"
            aria-label="Ações do tópico"
            disabled={isDemoMode}
            onClick={() => onMenuRowChange(menuRow === row.id ? null : row.id)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuRow === row.id ? (
            <div className="absolute right-2 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-900">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-neutral-800"
                onClick={() => {
                  onMenuRowChange(null);
                  onDetalhesTopico({ id: row.id, descricao: row.descricao });
                }}
              >
                <Eye className="h-3.5 w-3.5" />
                Ver registros de estudo
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-neutral-800"
                onClick={() => {
                  onMenuRowChange(null);
                  onRegistroTopico([{ id: row.id, nome: row.descricao }]);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Novo registro neste tópico
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-neutral-800"
                onClick={() => {
                  onMenuRowChange(null);
                  onEditTopico({ id: row.id, descricao: row.descricao });
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Renomear
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                onClick={() => {
                  onMenuRowChange(null);
                  if (window.confirm("Excluir este tópico?")) excluirTopico.mutate(row.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </button>
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function DisciplinaDashboardTopicosTable({
  disciplinaId,
  data,
  isLoading,
  isDemoMode,
  topicosModalOpen,
  onTopicosModalOpenChange,
  menuRow,
  onMenuRowChange,
  menuRef,
  toggleConcluido,
  criarTopicos,
  excluirTopico,
  reordenarTopicos,
  atualizarTopico,
  onDemoToast,
  onDetalhesTopico,
  onRegistroTopico,
  onEditTopico,
  highlightedTopicoId,
}: DisciplinaDashboardTopicosTableProps) {
  const [localOrder, setLocalOrder] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (data?.topicos) {
      setLocalOrder(data.topicos.map((t) => t.id));
    }
  }, [data?.topicos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const orderedRows = React.useMemo(() => {
    if (!data?.topicos) return [];
    const byId = new Map(data.topicos.map((t) => [t.id, t]));
    return localOrder.map((id) => byId.get(id)).filter(Boolean) as DisciplinaDashboardTopicoRow[];
  }, [data?.topicos, localOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localOrder.indexOf(String(active.id));
    const newIndex = localOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(localOrder, oldIndex, newIndex);
    setLocalOrder(next);
    reordenarTopicos.mutate(next);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-card">
      <div className="border-b border-slate-100 px-6 py-4 dark:border-neutral-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">Edital verticalizado</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">
          Arraste para ordenar · peso e domínio definem a prioridade no cronograma
        </p>
      </div>

      <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
        <button
          type="button"
          disabled={isDemoMode}
          onClick={() => onTopicosModalOpenChange(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Adicionar tópicos
        </button>
      </div>

      <TopicosModal
        open={topicosModalOpen}
        onClose={() => onTopicosModalOpenChange(false)}
        disciplinaId={disciplinaId}
        disabled={isDemoMode}
        onSave={async (topicos) => {
          if (isDemoMode) {
            onDemoToast();
            throw new Error("DEMO_MODE");
          }
          await criarTopicos.mutateAsync(topicos);
        }}
      />

      <div className="overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400">
                <th className="w-8 px-2 py-3" scope="col" />
                <th className="w-12 px-2 py-3 text-center" scope="col">
                  <span className="sr-only">Concluído</span>
                </th>
                <th className="px-3 py-3" scope="col">
                  Tópico
                </th>
                <th className="px-2 py-3 text-center" scope="col">
                  Peso
                </th>
                <th className="px-2 py-3" scope="col">
                  Domínio
                </th>
                <th className="px-2 py-3 text-center" scope="col">
                  Prior.
                </th>
                <th className="px-3 py-3 text-center" scope="col">
                  Certas
                </th>
                <th className="px-3 py-3 text-center" scope="col">
                  Erradas
                </th>
                <th className="px-3 py-3 text-center" scope="col">
                  Branco
                </th>
                <th className="px-3 py-3 text-center" scope="col">
                  Aprov.
                </th>
                <th className="px-3 py-3 text-center" scope="col">
                  Tempo
                </th>
                <th className="px-3 py-3 text-center" scope="col">
                  Págs
                </th>
                <th className="w-14 px-2 py-3" scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
              <tbody>
                {orderedRows.map((row) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    isDemoMode={isDemoMode}
                    menuRow={menuRow}
                    onMenuRowChange={onMenuRowChange}
                    menuRef={menuRef}
                    toggleConcluido={toggleConcluido}
                    excluirTopico={excluirTopico}
                    atualizarTopico={atualizarTopico}
                    onDetalhesTopico={onDetalhesTopico}
                    onRegistroTopico={onRegistroTopico}
                    onEditTopico={onEditTopico}
                    highlighted={highlightedTopicoId === row.id}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
        {!isLoading && data && data.topicos.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            Nenhum tópico cadastrado. Adicione o primeiro acima.
          </p>
        ) : null}
      </div>
    </section>
  );
}
