import type { HistoricoFilters } from "@/lib/historico/types";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";

type Props = {
  filters: HistoricoFilters;
  onChange: (patch: Partial<HistoricoFilters>) => void;
  disciplinas: Array<{ id: string; nome: string }>;
};

export function HistoricoFiltros({ filters, onChange, disciplinas }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1 text-xs">
        <Label className="text-xs text-muted-foreground">De</Label>
        <DatePicker
          aria-label="Data inicial"
          value={filters.dataInicio}
          onValueChange={(value) => onChange({ dataInicio: value, page: 1 })}
        />
      </div>
      <div className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-muted-foreground">Até</span>
        <DatePicker
          aria-label="Data final"
          value={filters.dataFim}
          onValueChange={(value) => onChange({ dataFim: value, page: 1 })}
        />
      </div>
      <label className="flex min-w-[160px] flex-col gap-1 text-xs">
        <span className="font-medium text-muted-foreground">Disciplina</span>
        <SelectField value={filters.disciplinaId ?? ""} onValueChange={(value) => onChange({ disciplinaId: value || undefined, page: 1 })} options={[{ value: "", label: "Todas" }, ...disciplinas.map((d) => ({ value: d.id, label: d.nome }))]} />
      </label>
      <label className="flex min-w-[120px] flex-col gap-1 text-xs">
        <span className="font-medium text-muted-foreground">Tipo</span>
        <SelectField value={filters.tipo ?? ""} onValueChange={(value) => onChange({ tipo: value || undefined, page: 1 })} options={[{ value: "", label: "Todos" }, { value: "pomodoro", label: "Pomodoro" }, { value: "livre", label: "Livre" }]} />
      </label>
    </div>
  );
}
