import React from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { EditalSort, TopicoStatus } from "@/types/editalVerticalizado";

export type EditalAppliedFilters = {
  disciplineIds: string[];
  status: TopicoStatus | "todos";
  domain: string;
  neverStudied: boolean;
  overdue: boolean;
  sort: EditalSort;
};

type DisciplineOption = { id: string; nome: string };

const statusOptions: Array<{ value: TopicoStatus | "todos"; label: string }> = [
  { value: "todos", label: "Todas" },
  { value: "nao_iniciado", label: "Não iniciado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "revisao", label: "Em revisão" },
  { value: "dominado", label: "Dominado" },
];

export const editalSortOptions: Array<{ value: EditalSort; label: string }> = [
  { value: "ordem_edital", label: "Ordem do edital" },
  { value: "atencao", label: "Precisa de atenção" },
  { value: "prioridade_desc", label: "Maior prioridade" },
  { value: "dominio_asc", label: "Menor domínio" },
  { value: "ultima_atividade_desc", label: "Atividade mais recente" },
  { value: "proxima_revisao_asc", label: "Próxima revisão" },
];

export function EditalDiscoveryFilters({
  disciplines,
  value,
  appliedSearch,
  onApply,
  onRemoveSearch,
  onClear,
  searchControl,
  resultSummary,
  resultActions,
}: {
  disciplines: DisciplineOption[];
  value: EditalAppliedFilters;
  appliedSearch: string;
  onApply: (next: EditalAppliedFilters) => void;
  onRemoveSearch: () => void;
  onClear: () => void;
  searchControl?: React.ReactNode;
  resultSummary?: React.ReactNode;
  resultActions?: React.ReactNode;
}) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const filterCount = value.disciplineIds.length
    + Number(value.status !== "todos")
    + Number(value.domain !== "todos")
    + Number(value.neverStudied)
    + Number(value.overdue);
  const disciplineById = React.useMemo(
    () => new Map(disciplines.map((discipline) => [discipline.id, discipline.nome])),
    [disciplines],
  );

  const openSheet = (open: boolean) => {
    if (open) setDraft(value);
    setSheetOpen(open);
  };

  return (
    <div className="min-w-0 space-y-2">
      <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      {searchControl}
      <div role="group" aria-label="Filtros desktop" className="hidden items-end gap-2 lg:flex">
        <DisciplinePopover
          disciplines={disciplines}
          selected={value.disciplineIds}
          onApply={(disciplineIds) => onApply({ ...value, disciplineIds })}
        />
        <SingleSelect
          label="Situação"
          compact
          value={value.status}
          options={statusOptions}
          onChange={(status) => onApply({ ...value, status: status as EditalAppliedFilters["status"] })}
        />
        <AdvancedFilters value={value} filterCount={filterCount} onApply={onApply} />
      </div>
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5 sm:gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
        {resultSummary}
      <div role="group" aria-label="Filtros mobile" className="shrink-0 lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={openSheet}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="min-h-11 justify-center gap-1.5 px-2 sm:px-3">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filtros{filterCount ? ` (${filterCount})` : ""}
            </Button>
          </SheetTrigger>
          <SheetContent className="flex w-full max-w-md flex-col p-0" aria-describedby="edital-filter-description">
            <SheetHeader className="border-b px-5 pb-4 pt-6 text-left">
              <SheetTitle>Filtrar edital</SheetTitle>
              <SheetDescription id="edital-filter-description">
                Refine os tópicos sem perder o contexto do concurso.
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <CheckboxGroup
                label="Disciplinas"
                options={disciplines.map((discipline) => ({ value: discipline.id, label: discipline.nome }))}
                selected={draft.disciplineIds}
                onChange={(disciplineIds) => setDraft((current) => ({ ...current, disciplineIds }))}
              />
              <SingleSelect
                label="Situação"
                value={draft.status}
                options={statusOptions}
                onChange={(status) => setDraft((current) => ({ ...current, status: status as EditalAppliedFilters["status"] }))}
              />
              <SingleSelect
                label="Domínio"
                value={draft.domain}
                options={[
                  { value: "todos", label: "Todos" },
                  ...[1, 2, 3, 4, 5].map((domain) => ({ value: String(domain), label: `${domain} de 5` })),
                ]}
                onChange={(domain) => setDraft((current) => ({ ...current, domain }))}
              />
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Atenção</legend>
                <CheckRow label="Nunca estudados" checked={draft.neverStudied} onChange={(neverStudied) => setDraft((current) => ({ ...current, neverStudied }))} />
                <CheckRow label="Revisão atrasada" checked={draft.overdue} onChange={(overdue) => setDraft((current) => ({ ...current, overdue }))} />
              </fieldset>
              <SingleSelect
                label="Ordenar por"
                value={draft.sort}
                options={editalSortOptions}
                onChange={(sort) => setDraft((current) => ({ ...current, sort: sort as EditalSort }))}
              />
            </div>
            <SheetFooter className="border-t px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <Button type="button" variant="ghost" onClick={() => setSheetOpen(false)}>Cancelar</Button>
              <Button type="button" onClick={() => { onApply(draft); setSheetOpen(false); }}>Aplicar filtros</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      {resultActions ? <div className="min-w-0 justify-self-end">{resultActions}</div> : null}
      </div>

      {(appliedSearch || filterCount > 0 || value.sort !== "ordem_edital") ? (
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados">
          {appliedSearch ? <FilterChip label={`Busca: ${appliedSearch}`} onRemove={onRemoveSearch} /> : null}
          {value.disciplineIds.map((id) => (
            <FilterChip key={id} label={disciplineById.get(id) ?? "Disciplina"} onRemove={() => onApply({ ...value, disciplineIds: value.disciplineIds.filter((item) => item !== id) })} />
          ))}
          {value.status !== "todos" ? <FilterChip label={statusOptions.find((item) => item.value === value.status)?.label ?? value.status} onRemove={() => onApply({ ...value, status: "todos" })} /> : null}
          {value.domain !== "todos" ? <FilterChip label={`Domínio ${value.domain}/5`} onRemove={() => onApply({ ...value, domain: "todos" })} /> : null}
          {value.neverStudied ? <FilterChip label="Nunca estudados" onRemove={() => onApply({ ...value, neverStudied: false })} /> : null}
          {value.overdue ? <FilterChip label="Revisão atrasada" onRemove={() => onApply({ ...value, overdue: false })} /> : null}
          {value.sort !== "ordem_edital" ? <FilterChip label={editalSortOptions.find((item) => item.value === value.sort)?.label ?? value.sort} onRemove={() => onApply({ ...value, sort: "ordem_edital" })} /> : null}
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>Limpar filtros</Button>
        </div>
      ) : null}
    </div>
  );
}

function AdvancedFilters({ value, filterCount, onApply }: { value: EditalAppliedFilters; filterCount: number; onApply: (next: EditalAppliedFilters) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="min-h-11 gap-2">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtros{filterCount ? ` (${filterCount})` : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Atenção</legend>
          <CheckRow label="Nunca estudados" checked={value.neverStudied} onChange={(neverStudied) => onApply({ ...value, neverStudied })} />
          <CheckRow label="Revisão atrasada" checked={value.overdue} onChange={(overdue) => onApply({ ...value, overdue })} />
        </fieldset>
        <SingleSelect label="Domínio" value={value.domain} options={[{ value: "todos", label: "Todos" }, ...[1, 2, 3, 4, 5].map((domain) => ({ value: String(domain), label: `${domain} de 5` }))]} onChange={(domain) => onApply({ ...value, domain })} />
        <SingleSelect label="Ordenar por" value={value.sort} options={editalSortOptions} onChange={(sort) => onApply({ ...value, sort: sort as EditalSort })} />
      </PopoverContent>
    </Popover>
  );
}

function DisciplinePopover({ disciplines, selected, onApply }: { disciplines: DisciplineOption[]; selected: string[]; onApply: (ids: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(selected);
  const changeOpen = (next: boolean) => { if (next) setDraft(selected); setOpen(next); };
  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <div className="min-w-0">
        <PopoverTrigger asChild><Button type="button" variant="outline" aria-label="Filtrar por disciplina" className="min-h-11 w-full justify-between font-normal">{selected.length ? `${selected.length} disciplina(s)` : "Disciplina"}<SlidersHorizontal className="h-4 w-4" aria-hidden="true" /></Button></PopoverTrigger>
      </div>
      <PopoverContent align="start" className="w-80">
        <CheckboxGroup label="Selecionar disciplinas" options={disciplines.map((item) => ({ value: item.id, label: item.nome }))} selected={draft} onChange={setDraft} />
        <div className="flex justify-end gap-2 border-t pt-2"><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button><Button type="button" size="sm" onClick={() => { onApply(draft); setOpen(false); }}>Aplicar</Button></div>
      </PopoverContent>
    </Popover>
  );
}

function CheckboxGroup({ label, options, selected, onChange }: { label: string; options: Array<{ value: string; label: string }>; selected: string[]; onChange: (values: string[]) => void }) {
  return <fieldset className="space-y-2"><legend className="text-sm font-medium">{label}</legend><div className="max-h-60 space-y-1 overflow-y-auto pr-1">{options.map((option) => <CheckRow key={option.value} label={option.label} checked={selected.includes(option.value)} onChange={(checked) => onChange(checked ? [...selected, option.value].sort() : selected.filter((item) => item !== option.value))} />)}</div></fieldset>;
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm hover:bg-muted"><Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} /><span>{label}</span></label>;
}

function SingleSelect({ label, value, options, onChange, compact = false }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void; compact?: boolean }) {
  const id = React.useId();
  return <div className="min-w-0 space-y-1.5"><Label htmlFor={id} className={compact ? "sr-only" : undefined}>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger id={id} className="min-h-11"><SelectValue />{compact && value === "todos" ? <span className="sr-only">as situações</span> : null}</SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{compact && option.value === "todos" ? "Todas as situações" : option.label}</SelectItem>)}</SelectContent></Select></div>;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <Button type="button" variant="secondary" size="sm" className="min-h-11 max-w-full gap-1.5 sm:min-h-9" onClick={onRemove} aria-label={`Remover filtro ${label}`}><span className="truncate">{label}</span><X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /></Button>;
}
