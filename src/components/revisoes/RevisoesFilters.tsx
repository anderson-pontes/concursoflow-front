import React from "react";
import { Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type RevisoesFilterValues = {
  disciplinaId: string;
  dataInicio: string;
  dataFim: string;
};

type Props = {
  values: RevisoesFilterValues;
  disciplinas: Array<{ id: string; nome: string }>;
  onChange: (values: RevisoesFilterValues) => void;
};

function FilterFields({ values, disciplinas, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="revisoes-disciplina">Disciplina</Label>
        <SelectField
          id="revisoes-disciplina"
          value={values.disciplinaId}
          onValueChange={(disciplinaId) => onChange({ ...values, disciplinaId })}
          options={[
            { value: "", label: "Todas as disciplinas" },
            ...disciplinas.map((item) => ({ value: item.id, label: item.nome })),
          ]}
          aria-label="Filtrar revisões por disciplina"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="revisoes-inicio">De</Label>
        <DatePicker
          id="revisoes-inicio"
          value={values.dataInicio}
          onValueChange={(dataInicio) => onChange({ ...values, dataInicio })}
          aria-label="Data inicial"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="revisoes-fim">Até</Label>
        <DatePicker
          id="revisoes-fim"
          value={values.dataFim}
          min={values.dataInicio || undefined}
          onValueChange={(dataFim) => onChange({ ...values, dataFim })}
          aria-label="Data final"
        />
      </div>
    </div>
  );
}

export function RevisoesFilters(props: Props) {
  const activeCount = Object.values(props.values).filter(Boolean).length;
  const emptyValues = { disciplinaId: "", dataInicio: "", dataFim: "" };
  const [draft, setDraft] = React.useState(props.values);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setDraft(props.values), [props.values]);

  return (
    <>
      <div className="hidden rounded-xl border border-border bg-card p-4 md:block">
        <FilterFields {...props} />
        {activeCount > 0 ? (
          <div className="mt-3 flex justify-end">
            <Button type="button" variant="ghost" onClick={() => props.onChange(emptyValues)}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </div>

      <div className="md:hidden">
        <Sheet open={open} onOpenChange={(next) => {
          setOpen(next);
          if (next) setDraft(props.values);
        }}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="min-h-11 w-full justify-between">
              <span className="inline-flex items-center gap-2">
                <Filter className="size-4" aria-hidden="true" />
                Filtros
              </span>
              {activeCount > 0 ? <span aria-label={`${activeCount} filtros ativos`}>{activeCount}</span> : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filtrar revisões</SheetTitle>
              <SheetDescription>Refine a fila por disciplina e período.</SheetDescription>
            </SheetHeader>
            <div className="py-5">
              <FilterFields values={draft} disciplinas={props.disciplinas} onChange={setDraft} />
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setDraft(emptyValues)}>
                Limpar
              </Button>
              <SheetClose asChild>
                <Button type="button" onClick={() => props.onChange(draft)}>Aplicar filtros</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
