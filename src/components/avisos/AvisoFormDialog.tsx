import { useRef, useState, type FormEvent } from "react";
import { Bell, CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { erroVigencia, type AvisoPeriodo } from "@/lib/avisoVigencia";

export type AvisoFormValues = AvisoPeriodo & {
  concurso_id: string;
  titulo: string;
  tipo: string;
  descricao: string;
  data_vencimento: string;
};

export const AVISO_TIPO_OPTIONS = [
  { value: "inscricao", label: "Inscrição" },
  { value: "prova", label: "Prova" },
  { value: "resultado", label: "Resultado" },
  { value: "pagamento", label: "Pagamento" },
  { value: "outro", label: "Outro" },
] as const;

export function emptyAvisoForm(hoje: string, concursoId = ""): AvisoFormValues {
  return { concurso_id: concursoId, titulo: "", tipo: "inscricao", descricao: "", data_vencimento: "", data_inicio: hoje, data_fim: "" };
}

export function tipoLabel(tipo: string) {
  return AVISO_TIPO_OPTIONS.find((item) => item.value === tipo.toLowerCase())?.label ?? tipo;
}

type Props = {
  mode: "create" | "edit" | "view";
  initialValues: AvisoFormValues;
  concursos: { id: string; nome: string }[];
  oficial?: boolean;
  onClose: () => void;
  onSubmit: (values: AvisoFormValues) => Promise<void>;
  isPending: boolean;
};

export function AvisoFormDialog({ mode, initialValues, concursos, oficial, onClose, onSubmit, isPending }: Props) {
  const [values, setValues] = useState(initialValues);
  const [attempted, setAttempted] = useState(false);
  const submitting = useRef(false);
  const closing = useRef(false);
  const { requestConfirmation, confirmDialog } = useConfirmDialog();
  const readOnly = mode === "view";
  const disabled = isPending || readOnly;
  const periodError = erroVigencia(values);
  const showPeriodError = Boolean(periodError) && (attempted || Boolean(values.data_inicio && values.data_fim));
  const titleError = attempted && !values.titulo.trim();
  const setField = (field: keyof AvisoFormValues, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const title = mode === "create" ? "Novo aviso" : readOnly ? "Detalhes do aviso" : "Editar aviso";

  async function close() {
    if (submitting.current || isPending || closing.current) return;
    if (!readOnly && JSON.stringify(values) !== JSON.stringify(initialValues)) {
      closing.current = true;
      const discard = await requestConfirmation({
        title: "Descartar alterações?",
        description: "As alterações deste aviso ainda não foram salvas.",
        confirmLabel: "Descartar",
        cancelLabel: "Continuar editando",
        variant: "destructive",
      });
      closing.current = false;
      if (!discard) return;
    }
    onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || disabled) return;
    setAttempted(true);
    if (!values.titulo.trim() || periodError) return;
    submitting.current = true;
    try {
      await onSubmit({ ...values, titulo: values.titulo.trim(), descricao: values.descricao.trim() });
    } finally {
      submitting.current = false;
    }
  }

  return <Dialog open onOpenChange={(open) => { if (!open) void close(); }}>
    <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-3xl min-w-0 flex-col gap-0 overflow-hidden rounded-xl p-0">
      <header className="flex shrink-0 items-start gap-3 border-b px-4 py-4 pr-12 sm:px-6">
        <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><Bell className="size-5" aria-hidden /></span>
        <div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mt-1">{readOnly ? "Consulte o evento e o período de exibição." : "Configure o evento e a vigência do lembrete."}</DialogDescription>
        </div>
      </header>
      <form className="flex min-h-0 min-w-0 flex-col" onSubmit={submit} noValidate aria-busy={isPending}>
        <div className="min-h-0 min-w-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="aviso-concurso" className="text-sm font-medium">Concurso</label>
              <SelectField id="aviso-concurso" disabled={disabled || oficial} value={values.concurso_id} onValueChange={(value) => setField("concurso_id", value)}
                options={[{ value: "", label: "Sem concurso" }, ...concursos.map((item) => ({ value: item.id, label: item.nome }))]} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="aviso-tipo" className="text-sm font-medium">Tipo</label>
              <SelectField id="aviso-tipo" disabled={disabled} value={values.tipo} onValueChange={(value) => setField("tipo", value)}
                options={[...(!AVISO_TIPO_OPTIONS.some((item) => item.value === values.tipo) ? [{ value: values.tipo, label: tipoLabel(values.tipo) }] : []), ...AVISO_TIPO_OPTIONS]} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="aviso-titulo" className="text-sm font-medium">Título *</label>
            <Input id="aviso-titulo" required maxLength={200} aria-invalid={titleError} aria-describedby={titleError ? "aviso-titulo-erro" : undefined} disabled={disabled} value={values.titulo} onChange={(event) => setField("titulo", event.target.value)} placeholder="Ex.: Inscrições abertas para o concurso" />
            {titleError && <p id="aviso-titulo-erro" role="alert" className="text-sm text-destructive">Informe o título do aviso.</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="aviso-evento" className="text-sm font-medium">Data do evento <span className="font-normal text-muted-foreground">({oficial ? "do edital" : "opcional"})</span></label>
            <DatePicker id="aviso-evento" aria-label="Data do evento" disabled={disabled || oficial} value={values.data_vencimento} onValueChange={(value) => setField("data_vencimento", value)} />
            <p className="text-xs text-muted-foreground">{oficial ? "A data oficial é sincronizada com o edital." : "Informe o dia da prova, da inscrição ou de outro prazo real."}</p>
          </div>
          <fieldset className="min-w-0 space-y-2 rounded-lg border bg-muted/20 p-3" aria-describedby="aviso-vigencia-ajuda">
            <legend className="flex items-center gap-2 px-1 text-sm font-semibold"><CalendarDays className="size-4 text-primary" aria-hidden />Período de exibição</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <label htmlFor="aviso-inicio" className="text-sm font-medium">Data de início *</label>
                <DatePicker id="aviso-inicio" aria-label="Data de início" disabled={disabled} value={values.data_inicio} onValueChange={(value) => setField("data_inicio", value)} />
              </div>
              <div className="min-w-0 space-y-1.5">
                <label htmlFor="aviso-fim" className="text-sm font-medium">Data de término *</label>
                <DatePicker id="aviso-fim" aria-label="Data de término" disabled={disabled} min={values.data_inicio} defaultMonth={values.data_inicio} value={values.data_fim} onValueChange={(value) => setField("data_fim", value)} />
              </div>
            </div>
            {showPeriodError && <p role="alert" className="text-sm text-destructive">{periodError}</p>}
            <p id="aviso-vigencia-ajuda" className="text-xs text-muted-foreground">O lembrete fica ativo durante todo o período, incluindo o dia de término.</p>
          </fieldset>
          <div className="space-y-1.5">
            <label htmlFor="aviso-descricao" className="text-sm font-medium">Descrição <span className="font-normal text-muted-foreground">(opcional)</span></label>
            <Textarea id="aviso-descricao" disabled={disabled} value={values.descricao} onChange={(event) => setField("descricao", event.target.value)} placeholder="Adicione detalhes sobre o aviso…" />
          </div>
        </div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t px-4 py-3 sm:px-6">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => void close()}>{readOnly ? "Fechar" : "Cancelar"}</Button>
          {!readOnly && <Button type="submit" disabled={isPending}>{mode === "create" && !isPending && <Plus />}{isPending ? "Salvando…" : mode === "create" ? "Criar aviso" : "Salvar alterações"}</Button>}
        </footer>
      </form>
      {confirmDialog}
    </DialogContent>
  </Dialog>;
}
