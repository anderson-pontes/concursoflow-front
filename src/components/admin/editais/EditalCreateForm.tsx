import React from "react";
import { isAxiosError } from "axios";
import { FileText, ImageIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { FileDropZone } from "@/components/concursos/FileDropZone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { criarEditalAdmin } from "@/services/editaisCatalogo";
import type { EditalCatalogo, EditalCatalogoInitialInput } from "@/types/editaisCatalogo";

const EMPTY: EditalCatalogoInitialInput = { nome: "", orgao: "", banca: null, url_oficial: null, cargo_nome: "", arquivo: null, logo: null };

function errorMessage(error: unknown) {
  if (!isAxiosError(error)) return "Não foi possível criar o edital.";
  const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
  return typeof detail === "string" ? detail : "Não foi possível criar o edital.";
}

export function EditalCreateForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (edital: EditalCatalogo) => void }) {
  const [values, setValues] = React.useState(EMPTY);
  const mutation = useMutation({ mutationFn: criarEditalAdmin, onSuccess: onCreated });

  return (
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); mutation.mutate(values); }}>
      <section className="space-y-4" aria-labelledby="novo-edital-dados">
        <div>
          <h2 id="novo-edital-dados" className="font-semibold">Informações do concurso</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre os dados essenciais. Disciplinas e conteúdos serão organizados no editor em seguida.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium md:col-span-2">Nome do edital *<Input autoFocus required className="mt-1.5" value={values.nome} onChange={(event) => setValues((state) => ({ ...state, nome: event.target.value }))} placeholder="Ex.: Concurso Nacional Unificado 2026" /></label>
          <label className="text-sm font-medium">Órgão *<Input required className="mt-1.5" value={values.orgao} onChange={(event) => setValues((state) => ({ ...state, orgao: event.target.value }))} placeholder="Ex.: Ministério da Gestão" /></label>
          <label className="text-sm font-medium">Banca<Input className="mt-1.5" value={values.banca ?? ""} onChange={(event) => setValues((state) => ({ ...state, banca: event.target.value || null }))} placeholder="Ex.: FGV" /></label>
          <label className="text-sm font-medium md:col-span-2">Cargo principal *<Input required className="mt-1.5" value={values.cargo_nome} onChange={(event) => setValues((state) => ({ ...state, cargo_nome: event.target.value }))} placeholder="Ex.: Analista Administrativo" /><span className="mt-1 block text-xs font-normal text-muted-foreground">Outros cargos podem ser adicionados no editor sem sair do edital.</span></label>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Arquivos do edital">
        <FileDropZone id="catalogo-logo-file" label="Logo do órgão" description="Selecionar logo" accept=".png,.jpg,.jpeg,.webp" file={values.logo} onFileChange={(logo) => setValues((state) => ({ ...state, logo }))} icon={ImageIcon} variant="aprov" hint="PNG, JPG ou WEBP · até 2 MB" />
        <FileDropZone id="catalogo-edital-file" label="Arquivo do edital" description="Anexar edital" accept=".pdf,.docx,.png,.jpg,.jpeg" file={values.arquivo} onFileChange={(arquivo) => setValues((state) => ({ ...state, arquivo }))} icon={FileText} variant="aprov" hint="PDF, DOCX, PNG ou JPG · até 10 MB" />
      </section>

      <label className="block text-sm font-medium">URL oficial do edital<Input type="url" className="mt-1.5" value={values.url_oficial ?? ""} onChange={(event) => setValues((state) => ({ ...state, url_oficial: event.target.value || null }))} placeholder="https://..." /></label>
      {mutation.isError ? <Alert variant="destructive"><AlertDescription>{errorMessage(mutation.error)} Seus dados foram preservados para nova tentativa.</AlertDescription></Alert> : null}
      <div className="-mx-5 flex flex-col-reverse gap-2 border-t border-border px-5 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="min-h-11" disabled={mutation.isPending} onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="min-h-11" disabled={mutation.isPending || !values.nome.trim() || !values.orgao.trim() || !values.cargo_nome.trim()}>{mutation.isPending ? "Criando edital…" : "Criar e organizar conteúdo"}</Button>
      </div>
    </form>
  );
}
