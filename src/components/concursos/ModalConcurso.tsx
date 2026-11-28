import React from "react";
import { Archive, Check, CircleCheck, ClipboardList, FolderOpen, Loader2, PlusCircle, Trophy, X } from "lucide-react";

import { CreatableSelect } from "@/components/concursos/CreatableSelect";
import { DocumentUploadCard, type DocumentKind, type DocumentStatus } from "@/components/concursos/DocumentUploadCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { isEncerradoStatus } from "@/lib/concursos/utils";
import { cn } from "@/lib/utils";

export type ConcursoFormInput = {
  nome: string;
  orgao: string;
  cargo: string | null;
  banca: string | null;
  data_prova: string | null;
  status: string | null;
  logo_file: File | null;
  edital_file: File | null;
};

export type ConcursoSaveFeedback = {
  kind?: DocumentKind;
  file?: File | null;
  message: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  editing: boolean;
  input: ConcursoFormInput;
  baseline: ConcursoFormInput;
  setInput: React.Dispatch<React.SetStateAction<ConcursoFormInput>>;
  onSubmit: () => void;
  isPending: boolean;
  uploading: DocumentKind | null;
  storedUrls: Record<DocumentKind, string | null>;
  error: ConcursoSaveFeedback | null;
  orgaoSuggestions: string[];
};

const fieldClass = "h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-base outline-none placeholder:text-muted-foreground hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50 sm:text-sm";
const labelClass = "mb-1 block text-sm font-medium";
const indigoSurfaceClass = "border border-white/15 border-t-white/25 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-md shadow-indigo-700/25";

function FieldLabel({ id, children, required }: { id: string; children: React.ReactNode; required?: boolean }) {
  return <label htmlFor={id} className={labelClass}>{children}{required ? <span className="text-primary" aria-hidden> *</span> : <span className="font-normal text-muted-foreground"> (opcional)</span>}</label>;
}

function ConcursoForm({ onClose, editing, input, baseline, setInput, onSubmit, isPending, uploading, storedUrls, error, orgaoSuggestions }: Omit<Props, "open">) {
  const [attempted, setAttempted] = React.useState(false);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const [checkingFiles, setCheckingFiles] = React.useState({ logo: false, edital: false });
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const previousFocus = React.useRef<HTMLElement | null>(null);
  const discardFocus = React.useRef<HTMLElement | null>(null);
  const isDirty = (Object.keys(input) as (keyof ConcursoFormInput)[]).some((key) => input[key] !== baseline[key]);
  const nomeInvalid = attempted && !input.nome.trim();
  const orgaoInvalid = attempted && !input.orgao.trim();
  const closed = isEncerradoStatus(input.status ?? "");
  const submitDisabled = isPending || checkingFiles.logo || checkingFiles.edital;
  const today = new Date();
  const year = today.getFullYear();
  const examYear = Number(input.data_prova?.slice(0, 4)) || year;
  const activeUploadError = error?.kind && error.file === input[`${error.kind}_file`] ? error : null;

  React.useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function fitViewport() {
      const dialog = dialogRef.current;
      if (!viewport || !dialog) return;
      if (viewport.scale !== 1) {
        dialog.style.removeProperty("--concurso-viewport-height");
        dialog.style.removeProperty("--concurso-viewport-top");
        return;
      }
      dialog.style.setProperty("--concurso-viewport-height", `${viewport.height}px`);
      dialog.style.setProperty("--concurso-viewport-top", `${viewport.offsetTop}px`);
      const focused = document.activeElement;
      const body = scrollRef.current;
      if (viewport.width < 640 && (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) && body?.contains(focused)) {
        const fieldBounds = focused.getBoundingClientRect();
        const bodyBounds = body.getBoundingClientRect();
        if (fieldBounds.bottom > bodyBounds.bottom || fieldBounds.top < bodyBounds.top) focused.scrollIntoView({ block: "nearest" });
      }
    }

    fitViewport();
    viewport.addEventListener("resize", fitViewport);
    viewport.addEventListener("scroll", fitViewport);
    return () => {
      viewport.removeEventListener("resize", fitViewport);
      viewport.removeEventListener("scroll", fitViewport);
    };
  }, []);

  function change<K extends keyof ConcursoFormInput>(key: K, value: ConcursoFormInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function requestClose() {
    if (isPending) return;
    if (isDirty) {
      discardFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setConfirmDiscard(true);
    } else onClose();
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled) return;
    if (editing && !isDirty) {
      onClose();
      return;
    }
    setAttempted(true);
    const firstInvalid = !input.nome.trim() ? "concurso-nome" : !input.orgao.trim() ? "concurso-orgao" : null;
    if (firstInvalid) {
      event.currentTarget.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus();
      return;
    }
    onSubmit();
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) requestClose(); }}>
        <DialogContent
          ref={dialogRef}
          hideClose
          onEscapeKeyDown={(event) => {
            if (event.target instanceof HTMLElement && event.target.matches('[role="combobox"][aria-expanded="true"]')) event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            dialogRef.current?.querySelector<HTMLElement>("header h2")?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = previousFocus.current?.isConnected ? previousFocus.current : document.querySelector<HTMLElement>("main h1");
            if (target && !target.matches("button, a, input, [tabindex]")) target.tabIndex = -1;
            target?.focus();
          }}
          className="flex h-[var(--concurso-viewport-height,100dvh)] max-h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none bg-card p-0 shadow-[var(--shadow-xl)] max-sm:top-[var(--concurso-viewport-top,0px)] max-sm:translate-y-0 sm:h-auto sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-[56rem] sm:rounded-[22px] sm:p-0"
        >
          <header className="flex shrink-0 items-start gap-3.5 border-b border-border bg-gradient-to-br from-primary-muted/60 via-card to-card px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", indigoSurfaceClass)}>
              <Trophy size={23} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 self-center">
              <DialogTitle tabIndex={-1} className="text-xl font-bold outline-none">{editing ? "Editar concurso" : "Novo concurso"}</DialogTitle>
              <DialogDescription className="mt-1">{editing ? "Atualize as informações e os documentos do concurso." : "Organize sua preparação e comece seu planejamento."}</DialogDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Fechar cadastro" title="Fechar cadastro" className="size-11 shrink-0" disabled={isPending} onClick={requestClose}><X aria-hidden /></Button>
          </header>

          <form noValidate className="flex min-h-0 flex-1 flex-col" aria-busy={isPending} onSubmit={submit}>
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:thin] sm:px-6">
              <section aria-labelledby="concurso-info" className="space-y-3">
                <h2 id="concurso-info" className="flex items-center gap-2 text-sm font-semibold"><ClipboardList className="size-4 text-primary" aria-hidden />Informações do concurso</h2>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-x-4">
                  <div className="min-w-0 sm:col-span-2">
                    <FieldLabel id="concurso-nome" required>Nome do concurso</FieldLabel>
                    <input id="concurso-nome" className={cn(fieldClass, nomeInvalid && "border-destructive")} value={input.nome} disabled={isPending} required
                      aria-invalid={nomeInvalid || undefined} aria-describedby={nomeInvalid ? "concurso-nome-erro" : undefined}
                      placeholder="Ex.: Receita Federal — Pré-edital" onChange={(event) => change("nome", event.target.value)} />
                    {nomeInvalid ? <p id="concurso-nome-erro" role="alert" className="mt-1 text-sm text-destructive">Informe o nome do concurso.</p> : null}
                  </div>
                  <CreatableSelect id="concurso-orgao" label="Órgão" required appearance="aprov" value={input.orgao} onChange={(value) => change("orgao", value)}
                    suggestions={orgaoSuggestions} placeholder="Ex.: Receita Federal" disabled={isPending} error={orgaoInvalid ? "Informe o órgão." : undefined} />
                  <div className="min-w-0">
                    <FieldLabel id="concurso-banca">Banca organizadora</FieldLabel>
                    <input id="concurso-banca" className={fieldClass} value={input.banca ?? ""} disabled={isPending} onChange={(event) => change("banca", event.target.value || null)} placeholder="Ex.: FGV" />
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <FieldLabel id="concurso-cargo">Cargo</FieldLabel>
                    <textarea id="concurso-cargo" rows={2} className={cn(fieldClass, "block h-auto min-h-11 max-h-28 resize-none py-2.5 [field-sizing:content] [overflow-wrap:anywhere]")}
                      value={input.cargo ?? ""} disabled={isPending} placeholder="Ex.: Auditor-Fiscal da Receita Federal do Brasil"
                      onChange={(event) => change("cargo", event.target.value.replace(/[\r\n]+/g, " ") || null)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }} />
                  </div>
                  <div className="min-w-0">
                    <FieldLabel id="concurso-data-prova">Data da prova</FieldLabel>
                    <DatePicker id="concurso-data-prova" disabled={isPending} value={input.data_prova ?? ""} showMonthYearSelectors placeholder="Selecionar data"
                      min={`${Math.min(1900, examYear)}-01-01`} max={`${Math.max(year + 25, examYear)}-12-31`}
                      defaultMonth={`${year}-${String(today.getMonth() + 1).padStart(2, "0")}-01`}
                      className="[&>button:first-of-type]:rounded-xl"
                      aria-describedby="concurso-data-ajuda" onValueChange={(value) => change("data_prova", value || null)} />
                    <p id="concurso-data-ajuda" className="mt-1.5 text-xs text-muted-foreground">Deixe em branco caso a data da prova ainda não tenha sido divulgada.</p>
                  </div>
                  <fieldset className="min-w-0" disabled={isPending}>
                    <legend className={labelClass}>Status do concurso</legend>
                    <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1">
                      {[
                        { label: "Ativo", checked: !closed, value: "ativo", Icon: CircleCheck, selected: "border-[color-mix(in_srgb,var(--success-text)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-[var(--success-text)]" },
                        { label: "Encerrado", checked: closed, value: "realizado", Icon: Archive, selected: "border-border bg-card text-foreground" },
                      ].map(({ label, checked, value, Icon, selected }) => (
                        <label key={value} className={cn("relative flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent px-1.5 text-sm text-muted-foreground hover:bg-muted focus-within:ring-2 focus-within:ring-ring", checked && cn("font-semibold shadow-[var(--shadow-sm)]", selected))}>
                          <input type="radio" name="concurso-status" className="sr-only" value={value} checked={checked} onChange={() => change("status", value)} />
                          <Icon size={15} aria-hidden />{label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </section>

              <section aria-labelledby="concurso-documentos" className="space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <div>
                    <h2 id="concurso-documentos" className="flex items-center gap-2 text-sm font-semibold"><FolderOpen className="size-4 text-primary" aria-hidden />Documentos do concurso</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Adicione a logo do órgão e o edital para centralizar seus materiais.</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Opcional</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["logo", "edital"] as const).map((kind) => {
                    const key = `${kind}_file` as const;
                    const file = input[key];
                    const uploadError = activeUploadError?.kind === kind ? activeUploadError.message : undefined;
                    const status: DocumentStatus | undefined = uploading === kind ? "uploading" : uploadError ? "error" : file && file === baseline[key] ? "uploaded" : undefined;
                    return <DocumentUploadCard key={kind} kind={kind} file={file} onFileChange={(value) => change(key, value ?? baseline[key])}
                      onValidationChange={(checking) => setCheckingFiles((current) => ({ ...current, [kind]: checking }))}
                      storedUrl={storedUrls[kind]} disabled={isPending} status={status} uploadError={uploadError} />;
                  })}
                </div>
              </section>
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border bg-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:py-3.5">
              {error ? <p role="alert" className="w-full text-sm text-destructive">{error.kind ? "O concurso foi salvo. Confira os documentos e salve novamente." : error.message}</p> : null}
              <p className="text-xs text-muted-foreground">* Campos obrigatórios</p>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" className="min-h-11 rounded-xl" disabled={isPending} onClick={requestClose}>Cancelar</Button>
                <Button type="submit" disabled={submitDisabled} className={cn(indigoSurfaceClass, "min-h-11 rounded-xl px-4 hover:from-indigo-700 hover:to-indigo-900")}>
                  {isPending ? <><Loader2 className="motion-safe:animate-spin" aria-hidden />Salvando…</> : editing ? <><Check aria-hidden />Salvar alterações</> : <><PlusCircle aria-hidden />Criar concurso</>}
                </Button>
              </div>
            </footer>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent className="motion-reduce:animate-none" onCloseAutoFocus={(event) => {
          event.preventDefault();
          discardFocus.current?.focus();
        }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>As informações e os arquivos ainda não salvos serão descartados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Continuar editando</AlertDialogCancel>
            <AlertDialogAction className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onClose}>Descartar alterações</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ModalConcurso({ open, ...props }: Props) {
  return open ? <ConcursoForm {...props} /> : null;
}
