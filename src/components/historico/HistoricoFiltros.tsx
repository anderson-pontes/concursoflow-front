import type { HistoricoFilters } from "@/lib/historico/types";

type Props = {
  filters: HistoricoFilters;
  onChange: (patch: Partial<HistoricoFilters>) => void;
  disciplinas: Array<{ id: string; nome: string }>;
};

export function HistoricoFiltros({ filters, onChange, disciplinas }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-muted-foreground">De</span>
        <input
          type="date"
          value={filters.dataInicio}
          onChange={(e) => onChange({ dataInicio: e.target.value, page: 1 })}
          className="min-h-11 rounded-lg border border-border bg-background px-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-muted-foreground">Até</span>
        <input
          type="date"
          value={filters.dataFim}
          onChange={(e) => onChange({ dataFim: e.target.value, page: 1 })}
          className="min-h-11 rounded-lg border border-border bg-background px-2 text-sm"
        />
      </label>
      <label className="flex min-w-[160px] flex-col gap-1 text-xs">
        <span className="font-medium text-muted-foreground">Disciplina</span>
        <select
          value={filters.disciplinaId ?? ""}
          onChange={(e) => onChange({ disciplinaId: e.target.value || undefined, page: 1 })}
          className="min-h-11 rounded-lg border border-border bg-background px-2 text-sm"
        >
          <option value="">Todas</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[120px] flex-col gap-1 text-xs">
        <span className="font-medium text-muted-foreground">Tipo</span>
        <select
          value={filters.tipo ?? ""}
          onChange={(e) => onChange({ tipo: e.target.value || undefined, page: 1 })}
          className="min-h-11 rounded-lg border border-border bg-background px-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="pomodoro">Pomodoro</option>
          <option value="livre">Livre</option>
        </select>
      </label>
    </div>
  );
}
