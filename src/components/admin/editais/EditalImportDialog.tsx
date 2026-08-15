import React from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { FileDropZone } from "@/components/concursos/FileDropZone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { importarVerticalizacao } from "@/services/editaisCatalogo";
import type { ImportacaoResumo } from "@/types/editaisCatalogo";

type Props = { open: boolean; onClose: () => void; editalId: string; versaoId: string };

export function EditalImportDialog({ open, onClose, editalId, versaoId }: Props) {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<ImportacaoResumo | null>(null);
  const qc = useQueryClient();

  React.useEffect(() => {
    if (!open) { setFile(null); setPreview(null); }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (aplicar: boolean) => {
      if (!file) throw new Error("Selecione uma planilha.");
      return importarVerticalizacao(editalId, versaoId, file, aplicar);
    },
    onSuccess: (result, aplicar) => {
      setPreview(result);
      if (aplicar) {
        void qc.invalidateQueries({ queryKey: ["admin-edital", editalId] });
        toast.success("Verticalização importada no rascunho.");
        onClose();
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value && !mutation.isPending) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar verticalização</DialogTitle>
          <DialogDescription>
            Envie CSV ou XLSX com cargo, disciplina, tópico, ordens e peso. A prévia não altera o rascunho.
          </DialogDescription>
        </DialogHeader>

        <FileDropZone
          id="edital-importacao"
          label="Arquivo da verticalização"
          description="Selecione ou arraste a planilha"
          hint="CSV ou XLSX"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          file={file}
          onFileChange={(next) => { setFile(next); setPreview(null); }}
          icon={FileSpreadsheet}
          disabled={mutation.isPending}
          variant="aprov"
        />

        <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          Cabeçalhos: <code>cargo</code>, <code>disciplina</code>, <code>topico</code>, <code>ordem_disciplina</code>, <code>ordem_topico</code> e <code>peso_topico</code>.
        </div>

        {mutation.isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            Não foi possível validar o arquivo. Confira o formato e tente novamente.
          </p>
        ) : null}

        {preview ? (
          <section className="space-y-3" aria-live="polite">
            <div className="flex items-center gap-2">
              {preview.valido ? <CheckCircle2 className="h-5 w-5 text-success" /> : <AlertCircle className="h-5 w-5 text-destructive" />}
              <h3 className="font-semibold">{preview.valido ? "Arquivo válido" : "Ajustes necessários"}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["Cargos", preview.cargos], ["Disciplinas", preview.disciplinas], ["Tópicos", preview.topicos], ["Ignoradas", preview.linhas_ignoradas]].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-border bg-card p-3 text-center">
                  <strong className="block text-lg tabular-nums">{value}</strong><span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            {preview.erros.length ? (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-destructive/30">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-muted"><tr><th className="p-2">Linha</th><th className="p-2">Campo</th><th className="p-2">Erro</th></tr></thead>
                  <tbody>{preview.erros.map((erro, index) => <tr key={`${erro.linha}-${index}`} className="border-t border-border"><td className="p-2">{erro.linha ?? "—"}</td><td className="p-2">{erro.campo ?? "—"}</td><td className="p-2">{erro.mensagem}</td></tr>)}</tbody>
                </table>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button type="button" variant="outline" className="min-h-11" disabled={!file || mutation.isPending} onClick={() => mutation.mutate(false)}>
            {mutation.isPending ? "Validando…" : "Validar e visualizar"}
          </Button>
          <Button type="button" className="min-h-11" disabled={!preview?.valido || mutation.isPending} onClick={() => mutation.mutate(true)}>
            Aplicar ao rascunho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
