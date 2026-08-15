import React from "react";
import { FileText } from "lucide-react";
import { isAxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";

import { FileDropZone } from "@/components/concursos/FileDropZone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { criarEditalAdmin } from "@/services/editaisCatalogo";
import type { EditalCatalogo, EditalCatalogoInitialInput } from "@/types/editaisCatalogo";

const EMPTY: EditalCatalogoInitialInput = { nome: "", orgao: "", banca: null, url_oficial: null, cargo_nome: "", arquivo: null };
const inputClass = "min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function errorMessage(error: unknown) {
  if (!isAxiosError(error)) return "Não foi possível criar o concurso.";
  const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
  return typeof detail === "string" ? detail : "Não foi possível criar o concurso.";
}

export function EditalCatalogoFormDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (edital: EditalCatalogo) => void }) {
  const [values, setValues] = React.useState(EMPTY);
  React.useEffect(() => { if (open) setValues(EMPTY); }, [open]);
  const mutation = useMutation({ mutationFn: criarEditalAdmin, onSuccess: onCreated });

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value && !mutation.isPending) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Novo concurso no catálogo</DialogTitle><DialogDescription>Cadastre os dados principais, anexe o edital e informe o primeiro cargo. Depois você adicionará as disciplinas.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(values); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium sm:col-span-2">Nome do concurso *<input autoFocus required className={`${inputClass} mt-1.5`} value={values.nome} onChange={(e) => setValues((s) => ({ ...s, nome: e.target.value }))} placeholder="Ex.: Concurso Nacional Unificado 2026" /></label>
            <label className="block text-sm font-medium">Órgão *<input required className={`${inputClass} mt-1.5`} value={values.orgao} onChange={(e) => setValues((s) => ({ ...s, orgao: e.target.value }))} placeholder="Ex.: Ministério da Gestão" /></label>
            <label className="block text-sm font-medium">Banca<input className={`${inputClass} mt-1.5`} value={values.banca ?? ""} onChange={(e) => setValues((s) => ({ ...s, banca: e.target.value || null }))} placeholder="Ex.: FGV" /></label>
            <label className="block text-sm font-medium sm:col-span-2">Cargo principal *<input required className={`${inputClass} mt-1.5`} value={values.cargo_nome} onChange={(e) => setValues((s) => ({ ...s, cargo_nome: e.target.value }))} placeholder="Ex.: Analista Administrativo" /><span className="mt-1 block text-xs font-normal text-muted-foreground">Se o concurso tiver outros cargos, você poderá adicioná-los depois.</span></label>
          </div>
          <FileDropZone id="catalogo-edital-file" label="Arquivo do edital" description="Anexar edital" accept=".pdf,.docx,.png,.jpg,.jpeg" file={values.arquivo} onFileChange={(arquivo) => setValues((s) => ({ ...s, arquivo }))} icon={FileText} variant="aprov" hint="PDF, DOCX, PNG ou JPG · até 10 MB" />
          <label className="block text-sm font-medium">Ou informe a URL oficial<input type="url" className={`${inputClass} mt-1.5`} value={values.url_oficial ?? ""} onChange={(e) => setValues((s) => ({ ...s, url_oficial: e.target.value || null }))} placeholder="https://..." /></label>
          {mutation.isError ? <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{errorMessage(mutation.error)}</p> : null}
          <div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" className="min-h-11" onClick={onClose}>Cancelar</Button><Button type="submit" className="min-h-11" disabled={mutation.isPending || !values.nome.trim() || !values.orgao.trim() || !values.cargo_nome.trim()}>{mutation.isPending ? "Criando…" : "Criar e adicionar disciplinas"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
