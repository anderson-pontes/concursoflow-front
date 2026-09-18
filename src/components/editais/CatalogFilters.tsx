import * as React from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { CatalogFacetOption, CatalogFacets, CatalogFilters as CatalogFiltersValue } from "@/types/editaisCatalogo";

type Props = {
  value: CatalogFiltersValue;
  facets?: CatalogFacets;
  loading?: boolean;
  onApply: (value: CatalogFiltersValue) => void;
  onClear: () => void;
};

const emptyFacets: CatalogFacets = { esferas: [], areas: [], anos: [] };

export function CatalogFilters({ value, facets = emptyFacets, loading, onApply, onClear }: Props) {
  const count = value.esfera.length + value.area.length + value.anoEdital.length;
  const remove = (dimension: keyof CatalogFiltersValue, raw: string | number) => {
    if (dimension === "anoEdital") onApply({ ...value, anoEdital: value.anoEdital.filter((item) => item !== Number(raw)) });
    else onApply({ ...value, [dimension]: value[dimension].filter((item) => item !== String(raw)) });
  };
  const chips = [
    ...value.esfera.map((key) => ({ dimension: "esfera" as const, key, label: optionLabel(facets.esferas, key) })),
    ...value.area.map((key) => ({ dimension: "area" as const, key, label: optionLabel(facets.areas, key) })),
    ...value.anoEdital.map((key) => ({ dimension: "anoEdital" as const, key, label: String(key) })),
  ];

  return <div className="mt-3 space-y-3">
    <div className="hidden flex-wrap items-center gap-2 lg:flex" aria-label="Filtros do catálogo">
      <DesktopFilter label="Esfera" options={facets.esferas} selected={value.esfera} loading={loading} onApply={(esfera) => onApply({ ...value, esfera })} />
      <DesktopFilter label="Área" options={facets.areas} selected={value.area} loading={loading} onApply={(area) => onApply({ ...value, area })} />
      <DesktopFilter label="Ano do edital" options={facets.anos} selected={value.anoEdital.map(String)} loading={loading} onApply={(years) => onApply({ ...value, anoEdital: years.map(Number) })} />
      {count ? <Button type="button" variant="ghost" className="min-h-10" onClick={onClear}>Limpar filtros</Button> : null}
    </div>
    <MobileFilters value={value} facets={facets} loading={loading} onApply={onApply} />
    {chips.length ? <div className="flex flex-wrap items-center gap-2" aria-label={`${count} filtros ativos`}>
      {chips.map((chip) => <Badge key={`${chip.dimension}-${chip.key}`} variant="secondary" className="min-h-9 gap-1.5 px-3">
        <span>{chip.label}</span>
        <button type="button" className="rounded-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Remover filtro ${chip.label}`} onClick={() => remove(chip.dimension, chip.key)}><X className="h-3.5 w-3.5" /></button>
      </Badge>)}
      <Button type="button" variant="ghost" className="min-h-9" onClick={onClear}>Limpar filtros</Button>
    </div> : null}
  </div>;
}

function DesktopFilter({ label, options, selected, loading, onApply }: { label: string; options: CatalogFacetOption[]; selected: string[]; loading?: boolean; onApply: (value: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(selected);
  const changeOpen = (next: boolean) => { setOpen(next); if (next) setDraft(selected); };
  return <Popover open={open} onOpenChange={changeOpen}>
    <PopoverTrigger asChild><Button type="button" variant="outline" className="min-h-10 gap-2">{label}{selected.length ? <Badge className="h-5 min-w-5 justify-center px-1.5">{selected.length}</Badge> : null}<ChevronDown className="h-4 w-4" /></Button></PopoverTrigger>
    <PopoverContent align="start" className="w-80 p-0">
      <div className="p-3"><strong className="text-sm">Filtrar por {label.toLocaleLowerCase("pt-BR")}</strong><p className="mt-1 text-xs text-muted-foreground">Selecione uma ou mais opções.</p></div><Separator />
      <OptionList options={options} selected={draft} loading={loading} onChange={setDraft} />
      <Separator /><div className="flex justify-end gap-2 p-3"><Button type="button" variant="ghost" className="min-h-10" onClick={() => changeOpen(false)}>Cancelar</Button><Button type="button" className="min-h-10" onClick={() => { onApply(draft); setOpen(false); }}>Aplicar</Button></div>
    </PopoverContent>
  </Popover>;
}

function MobileFilters({ value, facets = emptyFacets, loading, onApply }: Omit<Props, "onClear">) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const count = value.esfera.length + value.area.length + value.anoEdital.length;
  const changeOpen = (next: boolean) => { setOpen(next); if (next) setDraft(value); };
  return <div className="lg:hidden"><Sheet open={open} onOpenChange={changeOpen}>
    <SheetTrigger asChild><Button type="button" variant="outline" className="min-h-11 w-full justify-between"><span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filtros</span>{count ? <Badge>{count}</Badge> : null}</Button></SheetTrigger>
    <SheetContent side="bottom" className="flex max-h-[88dvh] flex-col p-0">
      <SheetHeader className="border-b border-border px-5 py-4 text-left"><SheetTitle>Filtrar editais</SheetTitle><SheetDescription>Combine esfera, área e ano do edital.</SheetDescription></SheetHeader>
      <ScrollArea className="min-h-0 flex-1 px-5"><div className="space-y-6 py-5">
        <MobileGroup label="Esfera" options={facets.esferas} selected={draft.esfera} loading={loading} onChange={(esfera) => setDraft((state) => ({ ...state, esfera }))} />
        <MobileGroup label="Área" options={facets.areas} selected={draft.area} loading={loading} onChange={(area) => setDraft((state) => ({ ...state, area }))} />
        <MobileGroup label="Ano do edital" options={facets.anos} selected={draft.anoEdital.map(String)} loading={loading} onChange={(items) => setDraft((state) => ({ ...state, anoEdital: items.map(Number) }))} />
      </div></ScrollArea>
      <SheetFooter className="border-t border-border p-4"><Button type="button" variant="outline" className="min-h-11" onClick={() => setDraft({ esfera: [], area: [], anoEdital: [] })}>Limpar</Button><Button type="button" className="min-h-11" onClick={() => { onApply(draft); setOpen(false); }}>Aplicar filtros</Button></SheetFooter>
    </SheetContent>
  </Sheet></div>;
}

function MobileGroup(props: { label: string; options: CatalogFacetOption[]; selected: string[]; loading?: boolean; onChange: (value: string[]) => void }) {
  return <fieldset><legend className="mb-2 font-semibold">{props.label}</legend><OptionList {...props} /></fieldset>;
}

function OptionList({ options, selected, loading, onChange }: { options: CatalogFacetOption[]; selected: string[]; loading?: boolean; onChange: (value: string[]) => void }) {
  if (loading) return <p className="p-4 text-sm text-muted-foreground" role="status">Carregando opções…</p>;
  if (!options.length) return <p className="p-4 text-sm text-muted-foreground">Nenhuma opção cadastrada.</p>;
  return <ScrollArea className="max-h-64"><div className="space-y-1 p-2">{options.map((option) => {
    const key = String(option.chave); const checked = selected.includes(key); const disabled = !checked && (!option.ativo || option.count === 0);
    return <Label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(next) => onChange(next ? [...selected, key].sort() : selected.filter((item) => item !== key))} />
      <span className="min-w-0 flex-1">{option.nome}</span><span className="text-xs text-muted-foreground">{option.count}</span>
    </Label>;
  })}</div></ScrollArea>;
}

function optionLabel(options: CatalogFacetOption[], key: string | number) {
  return options.find((item) => String(item.chave) === String(key))?.nome ?? String(key);
}
