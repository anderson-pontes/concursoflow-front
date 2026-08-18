import { Info, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PageRow = { inicio: string; fim: string };

type DetailsProps = {
  material: string;
  comments: string;
  correct: number;
  wrong: number;
  blank: number;
  pages: PageRow[];
  scheduleReviews: boolean;
  reviewDays: number[];
  newReviewDay: string;
  onMaterialChange: (value: string) => void;
  onCommentsChange: (value: string) => void;
  onCorrectChange: (value: number) => void;
  onWrongChange: (value: number) => void;
  onBlankChange: (value: number) => void;
  onPagesChange: (rows: PageRow[]) => void;
  onReviewDaysChange: (days: number[]) => void;
  onNewReviewDayChange: (value: string) => void;
  onAddReviewDay: () => void;
};

export function RegistroDetalhesSection(props: DetailsProps) {
  const updatePage = (index: number, patch: Partial<PageRow>) => props.onPagesChange(props.pages.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Label>Material<Input value={props.material} onChange={(event) => props.onMaterialChange(event.target.value)} className="mt-1.5" placeholder="Ex.: Livro, PDF, apostila..." /></Label>
        <Label>Comentários<Input value={props.comments} onChange={(event) => props.onCommentsChange(event.target.value)} className="mt-1.5" placeholder="Observações sobre o estudo" /></Label>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-background p-3" aria-labelledby="registro-questoes">
          <h3 id="registro-questoes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Questões</h3>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[["Certas", props.correct, props.onCorrectChange], ["Erradas", props.wrong, props.onWrongChange], ["Em branco", props.blank, props.onBlankChange]].map(([label, value, onChange]) => (
              <Label key={String(label)} className="text-xs">{String(label)}<Input type="number" min={0} value={Number(value)} onChange={(event) => (onChange as (value: number) => void)(Number(event.target.value || 0))} className="mt-1 px-2" /></Label>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-border bg-background p-3" aria-labelledby="registro-paginas">
          <h3 id="registro-paginas" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Páginas</h3>
          {props.pages.map((row, index) => (
            <div key={index} className="mt-2 grid grid-cols-2 gap-2">
              <Input value={row.inicio} onChange={(event) => updatePage(index, { inicio: event.target.value })} placeholder="Início" aria-label={`Página inicial ${index + 1}`} />
              <Input value={row.fim} onChange={(event) => updatePage(index, { fim: event.target.value })} placeholder="Fim" aria-label={`Página final ${index + 1}`} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="mt-2 min-h-10" onClick={() => props.onPagesChange([...props.pages, { inicio: "", fim: "" }])}><Plus />Adicionar linha</Button>
        </section>
        <section className="rounded-xl border border-border bg-background p-3" aria-labelledby="registro-revisoes">
          <h3 id="registro-revisoes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revisões</h3>
          {props.scheduleReviews ? (
            <>
              <div className="mt-2 flex flex-wrap gap-2">
                {[...new Set(props.reviewDays)].sort((a, b) => a - b).map((day) => (
                  <span key={day} className="inline-flex min-h-10 items-center rounded-full border border-primary/20 bg-primary/10 pl-3 text-xs text-primary">D+{day}<button type="button" onClick={() => props.onReviewDaysChange(props.reviewDays.filter((item) => item !== day))} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/15" aria-label={`Remover dia ${day}`}><X className="h-3.5 w-3.5" /></button></span>
                ))}
              </div>
              <div className="mt-2 flex gap-2"><Input type="number" min={1} value={props.newReviewDay} onChange={(event) => props.onNewReviewDayChange(event.target.value)} placeholder="Dia" /><Button type="button" variant="outline" onClick={props.onAddReviewDay}>Adicionar</Button></div>
            </>
          ) : <p className="mt-2 text-xs text-muted-foreground">Ative “Programar revisões” para definir os dias.</p>}
        </section>
      </div>
    </>
  );
}

type OptionsProps = {
  completedTheory: boolean;
  countInPlan: boolean;
  scheduleReviews: boolean;
  saveAndNew: boolean;
  editing: boolean;
  onCompletedTheoryChange: (value: boolean) => void;
  onCountInPlanChange: (value: boolean) => void;
  onScheduleReviewsChange: (value: boolean) => void;
  onSaveAndNewChange: (value: boolean) => void;
};

export function RegistroOptionsSection(props: OptionsProps) {
  const options = [
    ["registro-teoria-finalizada", "Teoria finalizada", props.completedTheory, props.onCompletedTheoryChange],
    ["registro-contabilizar-planejamento", "Contabilizar no planejamento", props.countInPlan, props.onCountInPlanChange],
    ["registro-programar-revisoes", "Programar revisões", props.scheduleReviews, props.onScheduleReviewsChange],
  ] as const;
  return (
    <section className="mt-10 rounded-xl border border-border bg-muted/40 p-5 sm:p-6" aria-labelledby="registro-opcoes-titulo">
      <h3 id="registro-opcoes-titulo" className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Opções do registro</h3>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-10">
        {options.map(([id, label, checked, onChange]) => <div key={id} className="flex min-h-10 items-center gap-2.5"><Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} /><Label htmlFor={id} className="cursor-pointer font-normal">{label}{id.includes("contabilizar") ? <Info className="ml-1.5 inline h-3.5 w-3.5 text-muted-foreground" aria-hidden /> : null}</Label></div>)}
        {!props.editing ? <div className="flex min-h-10 items-center gap-2.5"><Checkbox id="registro-salvar-e-novo" checked={props.saveAndNew} onCheckedChange={(value) => props.onSaveAndNewChange(value === true)} /><Label htmlFor="registro-salvar-e-novo" className="cursor-pointer font-normal">Salvar e criar novo</Label></div> : null}
      </div>
    </section>
  );
}
