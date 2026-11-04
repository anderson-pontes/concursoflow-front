import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download, FileUp, Loader2, Pencil, Upload } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogPagination } from "@/components/editais/CatalogPagination";
import { cn } from "@/lib/utils";
import { confirmImport, correctImportField, downloadImportReport, downloadImportTemplate, getImportContract, getImportHistory, getImportRows, getImportSession, uploadImport, validateImport } from "@/services/documentImport";
import type { ImportIssue, ImportRow, ImportSession } from "@/services/documentImport";

const STEPS = ["Upload", "Validação", "Prévia", "Correções", "Confirmação"];
const LIMIT_BYTES = 10 * 1024 * 1024;
const STATUS_LABELS: Record<string, string> = { validando: "Em validação", invalido: "Com inconsistências", validado: "Validado", aplicado: "Importado em rascunho", falhou: "Falha na importação" };

function PlannedOperations({ metadata }: { metadata: Record<string, unknown> }) {
  const plan = metadata.plan;
  if (!plan || typeof plan !== "object" || !("operacoes" in plan) || !Array.isArray(plan.operacoes)) return null;
  const operations = plan.operacoes.filter((item): item is { acao: string; quantidade: number } => !!item && typeof item === "object" && typeof item.acao === "string" && typeof item.quantidade === "number");
  return <ul className="space-y-2 text-sm" aria-label="Operações previstas">{operations.map(item => <li key={item.acao} className="flex items-center justify-between gap-3"><span>{item.acao}</span><Badge variant="secondary">{item.quantidade}</Badge></li>)}</ul>;
}

function message(error: unknown) {
  if (isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (error.response?.status === 409) return "Os dados mudaram. Reabra a importação para conferir a revisão atual.";
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação. Tente novamente.";
}

function FieldEditor({ row, disabled, onSave }: { row: ImportRow; disabled: boolean; onSave: (field: string, value: string) => Promise<void> }) {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [value, setValue] = React.useState("");
  return <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(row.data).map(([field, received]) => <div key={field} className="min-w-0 space-y-1">
    <dt className="text-xs font-medium text-muted-foreground">{field}</dt>
    <dd className="flex min-w-0 items-start gap-2">
      {editing === field ? <form className="min-w-0 flex-1 space-y-2" onSubmit={async event => { event.preventDefault(); try { await onSave(field, value); setEditing(null); } catch { /* The mutation displays the backend error and preserves this correction. */ } }}>
        <label className="sr-only" htmlFor={`correction-${row.id}-${field}`}>Corrigir {field} na linha {row.line}</label>
        <Input id={`correction-${row.id}-${field}`} value={value} onChange={event => setValue(event.target.value)} disabled={disabled} autoFocus />
        <div className="flex flex-wrap gap-2"><Button type="submit" size="sm" disabled={disabled}>Salvar campo</Button><Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)} disabled={disabled}>Cancelar</Button></div>
      </form> : <><span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm">{received || "—"}</span>{!(field === "campo" && ["01", "02", "03", "10"].includes(row.section)) && !(row.section === "01" && row.data.campo === "documento_codigo") && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Corrigir ${field} na linha ${row.line}`} disabled={disabled} onClick={() => { setEditing(field); setValue(received); }}><Pencil className="h-3.5 w-3.5" /></Button>}</>}
    </dd>
  </div>)}</dl>;
}

function GlobalIssues({ issues }: { issues: ImportIssue[] }) {
  if (!issues.length) return null;
  return <section className="space-y-3 rounded-xl border border-destructive/50 bg-card p-4" aria-label="Problemas gerais do documento">
    <h2 className="font-semibold">Problemas gerais do documento</h2>
    <p className="text-sm text-muted-foreground">Campos obrigatórios ausentes precisam ser incluídos no documento. Corrija o arquivo e use “Substituir documento” para enviá-lo novamente.</p>
    <ul className="space-y-2">{issues.map((issue, index) => <li key={`${issue.section}-${issue.field}-${index}`} className="space-y-1 rounded-lg bg-destructive/10 p-3 text-sm">
      <p className="font-medium text-destructive">Seção {issue.section} · Linha {issue.line} · {issue.field}</p>
      <p>{issue.message}</p><p className="break-words">Recebido: {issue.value || "(vazio)"}</p><p className="text-muted-foreground">Correção esperada: {issue.expected}</p>
    </li>)}</ul>
  </section>;
}

export function DocumentImport() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const sessionId = params.get("sessao");
  const [step, setStep] = React.useState(sessionId ? 2 : 0);
  const [file, setFile] = React.useState<File | null>(null);
  const [officialFile, setOfficialFile] = React.useState<File | null>(null);
  const [uploadError, setUploadError] = React.useState("");
  const [section, setSection] = React.useState("02");
  const [page, setPage] = React.useState(1);
  const [historyPage, setHistoryPage] = React.useState(1);
  const [confirmed, setConfirmed] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const contract = useQuery({ queryKey: ["document-import-contract"], queryFn: getImportContract });
  const history = useQuery({ queryKey: ["document-import-history", historyPage], queryFn: () => getImportHistory(historyPage) });
  const current = useQuery({ queryKey: ["document-import", sessionId], queryFn: () => getImportSession(sessionId!), enabled: Boolean(sessionId) });
  const rows = useQuery({ queryKey: ["document-import-rows", sessionId, section, page, current.data?.revision], queryFn: () => getImportRows(sessionId!, section, page), enabled: Boolean(sessionId) && (step === 2 || step === 3) });
  const session = current.data;
  const globalIssues = Array.isArray(session?.metadata_json.issues) ? session.metadata_json.issues as ImportIssue[] : [];
  React.useEffect(() => setConfirmed(false), [sessionId, session?.revision]);
  const sections = Object.entries(contract.data?.sections ?? {});
  const applied = session?.status === "aplicado";
  const canApply = session?.status === "validado" && session.summary.erros === 0;
  const acceptSession = (value: ImportSession) => {
    queryClient.setQueryData(["document-import", value.id], value);
    setConfirmed(false);
    void queryClient.invalidateQueries({ queryKey: ["document-import-history"] });
  };
  const upload = useMutation({ mutationFn: () => uploadImport(file!, officialFile), onSuccess: value => { acceptSession(value); setParams({ sessao: value.id }); setStep(1); setPage(1); }, onError: error => setUploadError(message(error)) });
  const correction = useMutation({ mutationFn: ({ row, field, value }: { row: ImportRow; field: string; value: string }) => correctImportField(session!.id, row.id, session!.revision, field, value), onSuccess: acceptSession, onError: error => toast.error(message(error)) });
  const validation = useMutation({ mutationFn: () => validateImport(session!.id, session!.revision), onSuccess: value => { acceptSession(value); toast.success(value.summary.erros ? "Validação concluída. Confira as inconsistências." : "Correções validadas."); }, onError: error => toast.error(message(error)) });
  const apply = useMutation({ mutationFn: () => confirmImport(session!.id, session!.revision), onSuccess: value => { acceptSession(value); void queryClient.invalidateQueries({ queryKey: ["admin-editais"] }); toast.success("Importação concluída. O edital está em rascunho."); }, onError: error => toast.error(message(error)) });
  const busy = upload.isPending || correction.isPending || validation.isPending || apply.isPending;

  function chooseFile(candidate: File | null, official = false) {
    setUploadError("");
    if (candidate && (!/\.(docx|pdf)$/i.test(candidate.name) || candidate.size > LIMIT_BYTES || candidate.size === 0)) {
      setUploadError("Envie um DOCX ou PDF não vazio de até 10 MB.");
      if (official) setOfficialFile(null); else setFile(null);
      return;
    }
    if (official) setOfficialFile(candidate); else setFile(candidate);
  }
  async function download(action: () => Promise<void>) {
    setDownloading(true);
    try { await action(); } catch (error) { toast.error(message(error)); } finally { setDownloading(false); }
  }
  function changeSection(value: string) { setSection(value); setPage(1); }

  return <div className="min-w-0 space-y-6 pb-10">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">Concursos</p><h1 className="text-2xl font-bold tracking-tight">Importação por Documento</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Envie o modelo estruturado, confira os dados e confirme o cadastro em rascunho.</p></div><Button variant="outline" asChild><Link to="/admin/editais">Catálogo de editais</Link></Button></header>
    <nav aria-label="Etapas da importação"><ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">{STEPS.map((label, index) => <li key={label}><button type="button" aria-current={step === index ? "step" : undefined} disabled={busy || (index > 0 && !session)} onClick={() => setStep(index)} className={cn("flex min-h-11 w-full items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", step === index ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{index + 1}</span>{label}</button></li>)}</ol></nav>
    {(contract.isError || current.isError) && <Alert variant="destructive"><AlertDescription>{message(contract.error ?? current.error)}</AlertDescription></Alert>}
    {current.isFetching && !session && <p role="status" className="text-sm text-muted-foreground">Carregando importação…</p>}

    {step === 0 && <section className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-6" aria-label="Envio do documento">
      <div><h2 className="text-lg font-semibold">Prepare seu documento</h2><p className="mt-1 text-sm text-muted-foreground">Use {contract.data?.version ?? "CLICKEDITAL-IMPORT-V1"}. Preserve os cabeçalhos, os códigos e as referências. Datas: DD/MM/AAAA. Horários: HH:MM. Deixe informações ausentes em branco.</p></div>
      <div className="flex flex-wrap gap-2">{(["docx", "pdf"] as const).map(format => <Button key={format} type="button" variant="outline" disabled={downloading} onClick={() => void download(() => downloadImportTemplate(format))}><Download className="mr-2 h-4 w-4" />Modelo {format.toUpperCase()}</Button>)}<Button type="button" variant="ghost" disabled={downloading} onClick={() => void download(() => downloadImportTemplate("docx", true))}>Exemplo preenchido</Button></div>
      <div className="relative rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center focus-within:ring-2 focus-within:ring-ring" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy) chooseFile(event.dataTransfer.files[0] ?? null); }}>
        <Upload className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden /><label htmlFor="document-import-file" className="block font-medium">Arraste o documento ou selecione um arquivo</label><p id="document-import-guidance" className="mt-1 text-sm text-muted-foreground">DOCX ou PDF do modelo oficial, até 10 MB. PDFs precisam ter texto selecionável.</p>
        <Input id="document-import-file" type="file" accept=".docx,.pdf" disabled={busy} aria-describedby="document-import-guidance" className="mx-auto mt-4 max-w-md" onChange={event => chooseFile(event.target.files?.[0] ?? null)} />
        {file && <p className="mt-3 break-all text-sm">Selecionado: {file.name}</p>}
      </div>
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="document-import-official">Edital oficial como anexo separado (opcional)</label><Input id="document-import-official" type="file" accept=".docx,.pdf" disabled={busy} onChange={event => chooseFile(event.target.files?.[0] ?? null, true)} /><p className="text-xs text-muted-foreground">O edital oficial será vinculado ao cadastro, sem extração de dados deste anexo.</p></div>
      {uploadError && <Alert variant="destructive"><AlertDescription>{uploadError}</AlertDescription></Alert>}
      <Button type="button" disabled={!file || busy || contract.isError} onClick={() => { setUploadError(""); upload.mutate(); }}>{upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}{upload.isPending ? "Validando documento…" : "Enviar e validar"}</Button>
    </section>}

    {session && step > 0 && <>
      <div className="flex flex-wrap items-center gap-3"><Badge variant="outline" className={applied || canApply ? "border-success/30 bg-success/10 text-success-text" : "border-warning/30 bg-warning/10 text-warning-foreground"}>{STATUS_LABELS[session.status] ?? session.status}</Badge><span className="break-all text-xs text-muted-foreground">{session.document_key} · revisão {session.revision}</span><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setStep(0)}>Substituir documento</Button></div>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">{([['cargos', 'Cargos'], ['disciplinas', 'Disciplinas distintas'], ['relacoes', 'Relações'], ['topicos', 'Tópicos']] as const).map(([key, label]) => <div key={key} className="rounded-xl border border-border bg-card p-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-bold tabular-nums">{session.summary[key]}</dd></div>)}</dl>
      {(step === 1 || step === 3) && <GlobalIssues issues={globalIssues} />}
      {step === 1 && <section className="space-y-4 rounded-xl border border-border bg-card p-5" aria-label="Resultado da validação"><h2 className="text-lg font-semibold">Validação do documento</h2><p className="text-sm">{session.summary.erros > 0 ? `${session.summary.erros} inconsistência(s) precisam de correção antes da confirmação.` : "Documento validado. Confira os dados e os relacionamentos na prévia."}</p><p className="text-sm text-muted-foreground">A prévia ainda não cria registros no catálogo.</p><div className="flex flex-wrap gap-2"><Button onClick={() => setStep(2)}>Conferir prévia</Button>{session.summary.erros > 0 && <Button variant="outline" onClick={() => setStep(3)}>Corrigir inconsistências</Button>}</div></section>}
      {(step === 2 || step === 3) && <section className="min-w-0 space-y-4" aria-label={step === 3 ? "Correções" : "Prévia dos dados"}>
        <div><h2 className="text-lg font-semibold">{step === 3 ? "Corrija os campos e confira a validação" : "Inspecione os dados por seção"}</h2><p className="mt-1 text-sm text-muted-foreground">{step === 3 ? "Cada correção preserva o valor original, o responsável e a revisão. Salve um campo por vez." : "Confira cargos, disciplinas, tópicos e vínculos explícitos antes de confirmar."}</p></div>
        {step === 3 && <p className="text-xs text-muted-foreground">Os identificadores fixos da coluna campo não podem ser editados. Para alterar documento_codigo, substitua o documento.</p>}
        {session.status === "validando" && <Alert><AlertDescription>Há correções ainda não validadas. Os problemas exibidos podem estar desatualizados. Valide as correções antes de confirmar o cadastro.</AlertDescription></Alert>}
        <Tabs value={section} onValueChange={changeSection}>
        <TabsList aria-label="Seções do documento" className="h-auto w-full flex-wrap justify-start gap-1">{sections.map(([key, value]) => <TabsTrigger key={key} value={key} className="flex-none whitespace-normal text-left">{key} · {value.title}</TabsTrigger>)}</TabsList>
        <TabsContent value={section} className="min-w-0 space-y-4">
        {rows.isFetching && <p role="status" className="text-sm text-muted-foreground">Carregando linhas…</p>}
        {rows.isError && <Alert variant="destructive"><AlertDescription>{message(rows.error)}</AlertDescription></Alert>}
        {!rows.isFetching && rows.data?.items.length === 0 && <p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">Nenhum registro nesta seção.</p>}
        <div className="space-y-3">{rows.data?.items.map(row => <article key={row.id} className={cn("min-w-0 space-y-3 rounded-xl border bg-card p-4", row.issues.length ? "border-destructive/50" : "border-border")}><h3 className="text-xs font-semibold text-muted-foreground">Seção {row.section} · Linha {row.line}</h3>
          {step === 3 && !applied ? <FieldEditor row={row} disabled={busy} onSave={async (field, value) => { await correction.mutateAsync({ row, field, value }); }} /> : <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(row.data).map(([field, value]) => <div key={field} className="min-w-0"><dt className="text-xs text-muted-foreground">{field}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value || "—"}</dd></div>)}</dl>}
          {row.issues.length > 0 && <ul className="space-y-2" aria-label={`Problemas na linha ${row.line}`}>{row.issues.map((issue, index) => <li key={`${issue.field}-${index}`} className="rounded-md bg-destructive/10 p-3 text-sm"><p className="font-medium text-destructive">{issue.field}: {issue.message}</p><p className="mt-1 break-words">Recebido: {issue.value || "(vazio)"}</p><p className="mt-1 text-muted-foreground">Correção esperada: {issue.expected}</p></li>)}</ul>}
        </article>)}</div>
        {rows.data && <CatalogPagination page={page} totalPages={Math.ceil(rows.data.total / rows.data.page_size)} total={rows.data.total} itemLabel="registro" ariaLabel="Paginação da prévia" onPageChange={setPage} />}
        </TabsContent>
        </Tabs>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => setStep(step === 2 ? 3 : 2)}>{step === 2 ? "Abrir correções" : "Voltar à prévia"}</Button>{!applied && <Button variant="outline" disabled={busy} onClick={() => validation.mutate()}>{validation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Validar correções</Button>}<Button disabled={busy} onClick={() => { setConfirmed(false); setStep(4); }}>Conferir plano de cadastro</Button></div>
      </section>}
      {step === 4 && <section className="space-y-5 rounded-xl border border-border bg-card p-5" aria-label="Confirmação administrativa"><h2 className="text-lg font-semibold">{applied ? "Importação concluída" : "Plano de cadastro"}</h2>
        {applied ? <><p className="flex items-center gap-2 text-sm text-success-text"><CheckCircle2 className="h-5 w-5" />O edital foi importado em rascunho.</p><p className="text-sm text-muted-foreground">Revise os dados no editor antes de publicar no catálogo.</p></> : <><p className="text-sm">A prévia contém {session.summary.cargos} cargo(s), {session.summary.disciplinas} disciplina(s) distinta(s), {session.summary.relacoes} relação(ões), {session.summary.topicos} tópico(s), {session.summary.eventos} evento(s) e {session.summary.anexos} anexo(s). O cadastro permanecerá em rascunho.</p><PlannedOperations metadata={session.metadata_json} /><p className="text-sm text-muted-foreground">Referências e registros existentes serão conferidos novamente antes da persistência. Disciplinas compartilhadas terão identidade explícita e registros por cargo conforme o catálogo.</p>
          {!canApply && <Alert variant="destructive"><AlertDescription>Resolva todas as inconsistências para confirmar esta importação.</AlertDescription></Alert>}
          <label className="flex min-h-11 items-start gap-3 rounded-lg border border-border p-3 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={confirmed} disabled={!canApply || busy} onChange={event => setConfirmed(event.target.checked)} /><span>Conferi a prévia e os relacionamentos e confirmo o cadastro desta revisão em rascunho.</span></label>
          <Button disabled={!canApply || !confirmed || busy} onClick={() => apply.mutate()}>{apply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar cadastro</Button></>}
        <div className="flex flex-wrap gap-2">{applied && session.edital_id && <Button asChild><Link to={`/admin/editais/${session.edital_id}/editar`}>Conferir edital no editor</Link></Button>}<Button variant="outline" disabled={downloading} onClick={() => void download(() => downloadImportReport(session.id))}><Download className="mr-2 h-4 w-4" />Exportar relatório</Button></div>
        {session.report && <details className="min-w-0"><summary className="cursor-pointer text-sm font-medium">Ver relatório da operação</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-xs">{JSON.stringify(session.report, null, 2)}</pre></details>}
      </section>}
    </>}
    <section className="space-y-3 border-t border-border pt-5" aria-label="Histórico de importações"><h2 className="text-lg font-semibold">Histórico de importações</h2>{history.isLoading && <p role="status" className="text-sm text-muted-foreground">Carregando histórico…</p>}{history.isError && <p role="alert" className="text-sm text-destructive">{message(history.error)}</p>}{history.data?.items.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma importação registrada.</p>}<ul className="space-y-2">{history.data?.items.map(item => <li key={item.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-all text-sm font-medium">{item.document_key}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("pt-BR")} · {STATUS_LABELS[item.status] ?? item.status}</p></div><Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => { setParams({ sessao: item.id }); setStep(item.status === "aplicado" ? 4 : 2); setPage(1); setConfirmed(false); }}>Abrir importação</Button></li>)}</ul>{history.data && <CatalogPagination page={historyPage} totalPages={Math.ceil(history.data.total / 10)} total={history.data.total} itemLabel="importação" ariaLabel="Paginação do histórico" onPageChange={setHistoryPage} />}</section>
  </div>;
}
