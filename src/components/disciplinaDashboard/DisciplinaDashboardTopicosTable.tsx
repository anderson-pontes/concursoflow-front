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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SortableTopicRow } from "./SortableTopicRow";
import "./topics.css";
import { SelectField } from "@/components/ui/select-field";


import { TopicosModal } from "@/components/disciplinas/TopicosModal";

import type { RegistroDefaultTopico } from "@/components/estudos/RegistroEstudoModal";



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

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function DisciplinaDashboardTopicosTable({
  disciplinaId,
  data,
  isLoading,
  isDemoMode,
  topicosModalOpen,
  onTopicosModalOpenChange,
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
  const [filtro, setFiltro] = React.useState<"todos" | "pendentes" | "concluidos" | "nunca" | "baixo" | "revisao">("todos");

  const [search, setSearch] = React.useState("");
  const [dominio, setDominio] = React.useState("todos");
  const [mode, setMode] = React.useState<"summary" | "complete">(() => {
    try { return localStorage.getItem("cf-disciplina-topics-view") === "complete" ? "complete" : "summary"; }
    catch { return "summary"; }
  });
  const changeMode = (next: "summary" | "complete") => {
    setMode(next);
    try { localStorage.setItem("cf-disciplina-topics-view", next); } catch { /* Storage can be unavailable. */ }
  };
  const total = data?.topicos.length ?? 0;
  const completed = data?.topicos.filter(row => row.concluido_edital).length ?? 0;
  const progress = total ? Math.round(completed / total * 100) : 0;


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

  const visibleRows = React.useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    return orderedRows.filter((row) => {
      if (!normalize(row.descricao).includes(normalize(search.trim()))) return false;
      if (dominio !== "todos" && row.dominio !== Number(dominio)) return false;
      if (filtro === "pendentes") return !row.concluido_edital;
      if (filtro === "concluidos") return row.concluido_edital;
      if (filtro === "nunca") return row.sessoes_count === 0;
      if (filtro === "baixo") return row.certas + row.erradas + row.em_branco > 0 && row.aproveitamento_pct < 60;
      if (filtro === "revisao") return Boolean(row.proxima_revisao_em && row.proxima_revisao_em <= hoje);
      return true;
    });
  }, [orderedRows, filtro, search, dominio]);

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
    <section className="min-w-0 rounded-2xl border border-border bg-card shadow-sm">
      <div className="space-y-4 border-b border-border p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Edital verticalizado</h2>
            <p className="mt-1 text-sm text-muted-foreground">{total} tópicos · {completed} concluídos</p>
          </div>
          <div className="discipline-progress study-tone-violet w-full space-y-2 rounded-xl border p-3 sm:max-w-sm">
            <div className="flex items-baseline justify-between gap-2">
              <strong className="text-xl font-semibold tabular-nums">{progress}% <span className="text-xs font-medium">concluído</span></strong>
              <span className="text-xs text-muted-foreground">{total - completed} pendentes</span>
            </div>
            <Progress value={progress} className="h-2.5" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso dos tópicos" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-0 flex-1 basis-56">
            <span className="sr-only">Buscar tópico</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tópico..." className="pl-9 focus-visible:border-primary focus-visible:ring-primary" />
          </label>
          <div role="group" aria-label="Visualização dos tópicos" className="discipline-view-switch flex rounded-lg bg-muted p-1">
            <Button variant={mode === "summary" ? "secondary" : "ghost"} size="sm" aria-pressed={mode === "summary"} onClick={() => changeMode("summary")}>Resumido</Button>
            <Button variant={mode === "complete" ? "secondary" : "ghost"} size="sm" aria-pressed={mode === "complete"} onClick={() => changeMode("complete")}>Completo</Button>
          </div>
          <Button disabled={isDemoMode} onClick={() => onTopicosModalOpenChange(true)}><Plus className="mr-2 h-4 w-4" />Adicionar tópicos</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="min-w-0 text-xs font-medium text-muted-foreground">Situação
            <SelectField aria-label="Situação" value={filtro} onValueChange={value => setFiltro(value as typeof filtro)} className="mt-1 w-full" options={[{value:"todos",label:"Todos"},{value:"pendentes",label:"Pendentes"},{value:"concluidos",label:"Concluídos"},{value:"nunca",label:"Nunca estudados"},{value:"baixo",label:"Baixo desempenho"},{value:"revisao",label:"Revisão atrasada"}]} />
          </label>
          <label className="min-w-0 text-xs font-medium text-muted-foreground">Domínio
            <SelectField aria-label="Domínio" value={dominio} onValueChange={setDominio} className="mt-1 w-full" options={[{value:"todos",label:"Todos os níveis"},{value:"1",label:"Nunca vi"},{value:"2",label:"Pouco domínio"},{value:"3",label:"Domínio médio"},{value:"4",label:"Bom domínio"},{value:"5",label:"Domínio total"}]} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">{visibleRows.length} tópicos encontrados · Arraste pela alça para ordenar ou use espaço e as setas no teclado.</p>
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

      {isLoading && <p role="status" className="p-6 text-sm text-muted-foreground">Carregando tópicos...</p>}
      <div className="topic-table-scroll">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className={`topic-table ${mode === "complete" ? "topic-table-complete" : ""}`} aria-label="Tópicos da disciplina">
            <thead><tr>
              <th scope="col"><span className="sr-only">Ordenar e concluir</span></th>
              <th scope="col" className="topic-name">Tópico</th>
              <th scope="col">Peso</th><th scope="col">Domínio</th><th scope="col">Prioridade</th>
              {mode === "complete" && <><th scope="col">Certas</th><th scope="col">Erradas</th><th scope="col">Branco</th></>}
              <th scope="col">Aproveitamento</th><th scope="col">Tempo</th>
              {mode === "complete" && <th scope="col">Páginas</th>}
              <th scope="col"><span className="sr-only">Ações</span></th>
            </tr></thead>
            <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
              <tbody>
                {visibleRows.map((row) => (
                  <SortableTopicRow
                    key={row.id}
                    row={row}
                    isDemoMode={isDemoMode}
                    complete={mode === "complete"}
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
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Nenhum tópico cadastrado. Adicione o primeiro acima.
          </p>
        ) : null}
        {!isLoading && data && data.topicos.length > 0 && visibleRows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">Nenhum tópico corresponde a este filtro.</p>
        ) : null}
      </div>
    </section>
  );
}
