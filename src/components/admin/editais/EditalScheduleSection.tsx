import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import type { EditalCronograma } from "@/types/editaisCatalogo";

export const scheduleFields = {
  inicio_inscricoes: "Início das inscrições",
  encerramento_inscricoes: "Encerramento das inscrições",
  limite_pagamento: "Limite para pagamento",
  data_prova: "Data da prova",
} as const;

export function scheduleIssue(value: EditalCronograma) {
  return value.inicio_inscricoes && value.encerramento_inscricoes && value.encerramento_inscricoes < value.inicio_inscricoes
    ? "O encerramento das inscrições deve ser igual ou posterior ao início." : null;
}

export function EditalScheduleSection({ value, onChange, disabled = false, published = false }: {
  value: EditalCronograma;
  onChange: (value: EditalCronograma) => void;
  disabled?: boolean;
  published?: boolean;
}) {
  return <section className="space-y-4" aria-labelledby="edital-cronograma-title">
    <div><h2 id="edital-cronograma-title" className="font-semibold">Cronograma do Edital</h2>
      <p className="mt-1 text-sm text-muted-foreground">Todas as datas são opcionais. {published ? "Ao salvar, os avisos automáticos dos alunos serão atualizados; avisos manuais serão preservados." : "Os avisos serão criados para o aluno ao adicionar o edital publicado ao seu concurso."}</p></div>
    <div className="grid gap-4 sm:grid-cols-2">{Object.entries(scheduleFields).map(([key, label]) => {
      const field = key as keyof EditalCronograma;
      return <div key={field} className="min-w-0 space-y-1.5"><Label htmlFor={`cronograma-${field}`}>{label}<span className="ml-1 font-normal text-muted-foreground">(opcional)</span></Label>
        <DatePicker id={`cronograma-${field}`} aria-label={label} value={value[field] ?? ""} disabled={disabled}
          showMonthYearSelectors min="1900-01-01" max="2100-12-31"
          defaultMonth={format(new Date(), "yyyy-MM-dd")}
          onValueChange={(date) => onChange({ ...value, [field]: date || null })} /></div>;
    })}</div>
    {scheduleIssue(value) ? <p role="alert" className="text-sm text-destructive">{scheduleIssue(value)}</p> : null}
  </section>;
}
