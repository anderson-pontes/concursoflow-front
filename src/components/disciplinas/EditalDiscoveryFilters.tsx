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
}: {
  disciplines: DisciplineOption[];
  value: EditalAppliedFilters;
  appliedSearch: string;
  onApply: (next: EditalAppliedFilters) => void;
  onRemoveSearch: () => void;
  onClear: () => void;
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
    <div className="space-y-3">
      <div className="hidden grid-cols-4 gap-3 lg:grid">
        <DisciplinePopover
          disciplines={disciplines}
          selected={value.disciplineIds}
          onApply={(disciplineIds) => onApply({ ...value, disciplineIds })}
        />
        <SingleSelect
          label="Situação"
          value={value.status}
          options={statusOptions}
          onChange={(status) => onApply({ ...value, status: status as EditalAppliedFilters["status"] })}
        />
        <AttentionPopover
          neverStudied={value.neverStudied}
          overdue={value.overdue}
          onApply={(attention) => onApply({ ...value, ...attention })}
        />
        <SingleSelect
          label="Ordenar por"
          value={value.sort}
          options={editalSortOptions}
          onChange={(sort) => onApply({ ...value, sort: sort as EditalSort })}
        />
        <SingleSelect
          label="Domínio"
          value={value.domain}
          options={[
            { value: "todos", label: "Todos" },
            ...[1, 2, 3, 4, 5].map((domain) => ({ value: String(domain), label: `${domain} de 5` })),
          ]}
          onChange={(domain) => onApply({ ...value, domain })}
        />
      </div>

      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={openSheet}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-center">
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

function DisciplinePopover({ disciplines, selected, onApply }: { disciplines: DisciplineOption[]; selected: string[]; onApply: (ids: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(selected);
  const changeOpen = (next: boolean) => { if (next) setDraft(selected); setOpen(next); };
  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <div className="space-y-1.5">
        <Label>Disciplina</Label>
        <PopoverTrigger asChild><Button type="button" variant="outline" className="w-full justify-between font-normal">{selected.length ? `${selected.length} selecionada(s)` : "Todas"}<SlidersHorizontal className="h-4 w-4" aria-hidden="true" /></Button></PopoverTrigger>
      </div>
      <PopoverContent align="start" className="w-80">
        <CheckboxGroup label="Selecionar disciplinas" options={disciplines.map((item) => ({ value: item.id, label: item.nome }))} selected={draft} onChange={setDraft} />
        <div className="flex justify-end gap-2 border-t pt-2"><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button><Button type="button" size="sm" onClick={() => { onApply(draft); setOpen(false); }}>Aplicar</Button></div>
      </PopoverContent>
    </Popover>
  );
}

function AttentionPopover({ neverStudied, overdue, onApply }: { neverStudied: boolean; overdue: boolean; onApply: (value: Pick<EditalAppliedFilters, "neverStudied" | "overdue">) => void }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({ neverStudied, overdue });
  const count = Number(neverStudied) + Number(overdue);
  const changeOpen = (next: boolean) => { if (next) setDraft({ neverStudied, overdue }); setOpen(next); };
  return <Popover open={open} onOpenChange={changeOpen}><div className="space-y-1.5"><Label>Atenção</Label><PopoverTrigger asChild><Button type="button" variant="outline" className="w-full justify-between font-normal">{count ? `${count} selecionado(s)` : "Todas"}<SlidersHorizontal className="h-4 w-4" aria-hidden="true" /></Button></PopoverTrigger></div><PopoverContent align="start"><fieldset className="space-y-3"><legend className="sr-only">Filtros de atenção</legend><CheckRow label="Nunca estudados" checked={draft.neverStudied} onChange={(value) => setDraft((current) => ({ ...current, neverStudied: value }))} /><CheckRow label="Revisão atrasada" checked={draft.overdue} onChange={(value) => setDraft((current) => ({ ...current, overdue: value }))} /></fieldset><div className="flex justify-end gap-2 border-t pt-2"><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button><Button type="button" size="sm" onClick={() => { onApply(draft); setOpen(false); }}>Aplicar</Button></div></PopoverContent></Popover>;
}

function CheckboxGroup({ label, options, selected, onChange }: { label: string; options: Array<{ value: string; label: string }>; selected: string[]; onChange: (values: string[]) => void }) {
  return <fieldset className="space-y-2"><legend className="text-sm font-medium">{label}</legend><div className="max-h-60 space-y-1 overflow-y-auto pr-1">{options.map((option) => <CheckRow key={option.value} label={option.label} checked={selected.includes(option.value)} onChange={(checked) => onChange(checked ? [...selected, option.value].sort() : selected.filter((item) => item !== option.value))} />)}</div></fieldset>;
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm hover:bg-muted"><Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} /><span>{label}</span></label>;
}

function SingleSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  const id = `edital-filter-${label.toLowerCase().replaceAll(" ", "-")}`;
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <Button type="button" variant="secondary" size="sm" className="max-w-full gap-1.5" onClick={onRemove} aria-label={`Remover filtro ${label}`}><span className="truncate">{label}</span><X className="h-3.5 w-3.5" aria-hidden="true" /></Button>;
}
