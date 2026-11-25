import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import type { StudyHistoryActivity, StudyHistoryFilters as Filters, StudyHistoryOrder } from "@/lib/historico/types";
import { api } from "@/services/api";

export type HistoryFilterValues = Omit<Filters, "concurso_id" | "disciplina_id" | "plano_id" | "busca">;

export const activityLabels: Record<StudyHistoryActivity, string> = {
  teoria: "Teoria", questoes: "Questões", revisao: "Revisão", livre: "Livre", pomodoro: "Pomodoro",
};

type Props = {
  text: string;
  onTextChange: (text: string) => void;
  filters: HistoryFilterValues;
  onChange: (patch: HistoryFilterValues) => void;
  order: StudyHistoryOrder;
  onOrderChange: (order: StudyHistoryOrder) => void;
  disciplinaId: string;
  onClear: () => void;
  onClearSearch: () => void;
  searching: boolean;
};

export function StudyHistoryFilters({ text, onTextChange, filters, onChange, order, onOrderChange, disciplinaId, onClear, onClearSearch, searching }: Props) {
  const [expanded, setExpanded] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const activeCount = Object.values(filters).filter(Boolean).length + Number(order === "antigos");
  const topics = useQuery({
    queryKey: ["topicos", disciplinaId, "historico-estudo"],
    queryFn: async ({ signal }) =>
      (await api.get<{ id: string; descricao: string }[]>(`/disciplinas/${disciplinaId}/topicos`, { signal })).data,
    enabled: expanded,
  });
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input ref={searchInput} type="search" value={text} maxLength={120} onChange={(event) => onTextChange(event.target.value)}
          placeholder="Buscar tópico ou comentário..." aria-label="Buscar tópico ou comentário"
          className="min-h-11 rounded-lg bg-card pl-9 pr-[4.5rem] focus-visible:border-primary [&::-webkit-search-cancel-button]:hidden" />
        {text && (
          <div className="absolute inset-y-0 right-0.5 flex items-center gap-0.5">
            {searching && <LoaderCircle className="size-4 motion-safe:animate-spin text-primary" role="status" aria-label="Buscando registros" />}
            <Button type="button" variant="ghost" size="icon" aria-label="Limpar pesquisa" className="size-10"
              onClick={() => { onClearSearch(); searchInput.current?.focus(); }}>
              <X aria-hidden />
            </Button>
          </div>
        )}
      </div>
      <details className="group rounded-lg border border-border bg-card" onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1">Filtros e ordenação</span>
          {activeCount > 0 && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{activeCount} {activeCount === 1 ? "ativo" : "ativos"}</span>}
          <ChevronDown className="size-4 shrink-0 text-muted-foreground motion-safe:transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="grid min-w-0 grid-cols-2 gap-2 border-t border-border p-3">
          <DatePicker aria-label="Data inicial" placeholder="De" value={filters.data_inicio} max={filters.data_fim}
            onValueChange={(value) => onChange({ data_inicio: value || undefined })} />
          <DatePicker aria-label="Data final" placeholder="Até" value={filters.data_fim} min={filters.data_inicio}
            onValueChange={(value) => onChange({ data_fim: value || undefined })} />
          <SelectField className="col-span-2 min-h-11 w-full" aria-label="Filtrar por tópico" value={filters.topico_id ?? ""}
            disabled={topics.isPending || topics.isError}
            onValueChange={(value) => onChange({ topico_id: value || undefined })}
            options={[{ value: "", label: "Todos os tópicos" }, ...(topics.data ?? []).map((topic) => ({ value: topic.id, label: topic.descricao }))]} />
          {topics.isError && <Button className="col-span-2 justify-self-start" size="sm" variant="ghost" onClick={() => void topics.refetch()}>Recarregar tópicos</Button>}
          <SelectField className="min-h-11 w-full" aria-label="Tipo de atividade" value={filters.tipo ?? ""}
            onValueChange={(value) => onChange({ tipo: (value || undefined) as StudyHistoryActivity | undefined })}
            options={[{ value: "", label: "Todas as atividades" }, ...Object.entries(activityLabels).map(([value, label]) => ({ value, label }))]} />
          <SelectField className="min-h-11 w-full" aria-label="Ordenação" value={order}
            onValueChange={(value) => onOrderChange(value === "antigos" ? "antigos" : "recentes")}
            options={[{ value: "recentes", label: "Mais recentes" }, { value: "antigos", label: "Mais antigos" }]} />
          <Button type="button" variant={filters.com_comentarios ? "secondary" : "outline"} aria-pressed={Boolean(filters.com_comentarios)}
            className="col-span-2 min-h-11 justify-self-start" onClick={() => onChange({ com_comentarios: !filters.com_comentarios || undefined })}>
            Somente com comentários
          </Button>
          {activeCount > 0 && <Button type="button" size="sm" variant="ghost" className="col-span-2 min-h-10 justify-self-start px-1" onClick={onClear}>Limpar filtros</Button>}
        </div>
      </details>
    </div>
  );
}
