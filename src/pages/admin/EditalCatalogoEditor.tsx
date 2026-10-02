import React from "react";
import { isAxiosError } from "axios";
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, Check, ChevronDown, ExternalLink, FileCheck2, FileSpreadsheet, FileText, ImageIcon, ListPlus, Pencil, Plus, Save, Send, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { EditalImportDialog } from "@/components/admin/editais/EditalImportDialog";
import { EditalClassificationSection } from "@/components/admin/editais/EditalClassificationSection";
import { FileDropZone } from "@/components/concursos/FileDropZone";
import { CatalogLogo } from "@/components/editais/CatalogLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { parseBulkTopics, reorderCatalogItems } from "@/lib/adminEditalEditor";
import { resolvePublicUrl } from "@/lib/publicUrl";
import { atualizarEditalAdmin, criarVersaoRascunho, obterEditalAdmin, publicarVersao, removerEditalAdmin, salvarEstruturaVersao, uploadEditalAdmin, uploadLogoAdmin } from "@/services/editaisCatalogo";
import type { EditalCargoCatalogo, EditalCatalogoInput, EditalDisciplinaCatalogo } from "@/types/editaisCatalogo";

const inputClass = "min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";
const newId = () => `novo-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function apiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as { loc?: unknown[]; msg?: string };
        const field = row.loc?.filter((part) => part !== "body").join(" → ");
        return row.msg ? `${field ? `${field}: ` : ""}${row.msg}` : null;
      })
      .filter(Boolean);
    if (messages.length) return messages.join("; ");
  }
  return fallback;
}

function structureIssue(cargos: EditalCargoCatalogo[], publishing = false): string | null {
  if (!cargos.length) return publishing ? "Adicione pelo menos um cargo antes de publicar." : "Adicione um cargo para salvar a estrutura.";
  for (const cargo of cargos) {
    if (!cargo.nome.trim()) return "Informe o nome de todos os cargos.";
    if (publishing && !cargo.disciplinas.length) return `Adicione uma disciplina ao cargo ${cargo.nome}.`;
    for (const disciplina of cargo.disciplinas) {
      if (!disciplina.nome.trim()) return `Informe o nome de todas as disciplinas de ${cargo.nome}.`;
      if (disciplina.topicos.some((topico) => !topico.descricao.trim())) return `Preencha ou remova os tópicos vazios de ${disciplina.nome}.`;
      if (publishing && !disciplina.topicos.length) return `Adicione pelo menos um tópico à disciplina ${disciplina.nome}.`;
    }
  }
  return null;
}

export function EditalCatalogoEditor() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "geral" ? "geral" : "conteudo";
  const qc = useQueryClient();
  const { requestConfirmation, confirmDialog } = useConfirmDialog();
  const [importOpen, setImportOpen] = React.useState(false);
  const [selectedCargoId, setSelectedCargoId] = React.useState<string | null>(null);
  const [pendingEditalFile, setPendingEditalFile] = React.useState<File | null>(null);
  const [pendingLogoFile, setPendingLogoFile] = React.useState<File | null>(null);
  const [meta, setMeta] = React.useState<EditalCatalogoInput>({ nome: "", orgao: "", banca: null, url_oficial: null });
  const [cargos, setCargos] = React.useState<EditalCargoCatalogo[]>([]);

  const query = useQuery({ queryKey: ["admin-edital", id], queryFn: () => obterEditalAdmin(id), enabled: Boolean(id) });
  const edital = query.data;
  const versao = edital?.versoes?.find((item) => item.status === "rascunho") ?? edital?.versao_atual ?? null;
  const editable = versao?.status === "rascunho";
  const metadataEditable = Boolean(editable && !edital?.versoes?.some((item) => item.status === "publicado"));

  React.useEffect(() => {
    if (!edital || !versao) return;
    setMeta({ nome: edital.nome, orgao: edital.orgao, banca: edital.banca, url_oficial: edital.url_oficial });
    setCargos(versao.cargos ?? []);
    setSelectedCargoId((current) => current && versao.cargos.some((cargo) => cargo.id === current) ? current : versao.cargos[0]?.id ?? null);
  }, [edital, versao]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!versao) throw new Error("Versão não encontrada");
      if (metadataEditable) await atualizarEditalAdmin(id, meta);
      await salvarEstruturaVersao(id, versao.id, cargos);
      if (pendingEditalFile) return uploadEditalAdmin(id, pendingEditalFile);
      return obterEditalAdmin(id);
    },
    onSuccess: () => { setPendingEditalFile(null); void qc.invalidateQueries({ queryKey: ["admin-edital", id] }); void qc.invalidateQueries({ queryKey: ["admin-editais"] }); toast.success("Rascunho salvo."); },
    onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível salvar o rascunho.")),
  });
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!versao) throw new Error("Versão não encontrada");
      if (metadataEditable) await atualizarEditalAdmin(id, meta);
      await salvarEstruturaVersao(id, versao.id, cargos);
      if (pendingEditalFile) await uploadEditalAdmin(id, pendingEditalFile);
      return publicarVersao(id, versao.id);
    },
    onSuccess: () => { setPendingEditalFile(null); void qc.invalidateQueries({ queryKey: ["admin-edital", id] }); void qc.invalidateQueries({ queryKey: ["admin-editais"] }); toast.success("Versão publicada no catálogo."); },
    onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível salvar e publicar esta versão.")),
  });
  const draftMutation = useMutation({
    mutationFn: () => criarVersaoRascunho(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-edital", id] }); toast.success("Nova versão em rascunho criada."); },
  });
  const logoMutation = useMutation({
    mutationFn: () => {
      if (!pendingLogoFile) throw new Error("Selecione uma logo");
      return uploadLogoAdmin(id, pendingLogoFile);
    },
    onSuccess: () => {
      setPendingLogoFile(null);
      void qc.invalidateQueries({ queryKey: ["admin-edital", id] });
      void qc.invalidateQueries({ queryKey: ["admin-editais"] });
      toast.success("Logo do órgão atualizada.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível salvar a logo.")),
  });
  const editalFileMutation = useMutation({
    mutationFn: () => {
      if (!pendingEditalFile) throw new Error("Selecione o arquivo do edital");
      return uploadEditalAdmin(id, pendingEditalFile);
    },
    onSuccess: (updated) => {
      setPendingEditalFile(null);
      qc.setQueryData(["admin-edital", id], (current: typeof edital) => current ? {
        ...current,
        ...updated,
        versoes: current.versoes,
        versao_atual: current.versao_atual,
      } : updated);
      void qc.invalidateQueries({ queryKey: ["admin-edital", id] });
      void qc.invalidateQueries({ queryKey: ["admin-editais"] });
      toast.success("Edital cadastrado com sucesso.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível cadastrar o edital.")),
  });
  const removeEditalMutation = useMutation({
    mutationFn: () => removerEditalAdmin(id),
    onSuccess: (updated) => {
      setPendingEditalFile(null);
      qc.setQueryData(["admin-edital", id], (current: typeof edital) => current ? {
        ...current,
        ...updated,
        versoes: current.versoes,
        versao_atual: current.versao_atual,
      } : updated);
      void qc.invalidateQueries({ queryKey: ["admin-edital", id] });
      void qc.invalidateQueries({ queryKey: ["admin-editais"] });
      toast.success("Edital removido com sucesso.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível remover o edital.")),
  });

  const selectedCargo = cargos.find((cargo) => cargo.id === selectedCargoId) ?? null;
  const disciplineSuggestions = Array.from(
    new Map(
      cargos
        .flatMap((cargo) => cargo.disciplinas)
        .filter((disciplina) => disciplina.nome.trim())
        .map((disciplina) => [disciplina.nome.trim().toLocaleLowerCase("pt-BR"), disciplina.nome.trim()]),
    ).values(),
  ).sort((left, right) => left.localeCompare(right, "pt-BR"));
  const updateCargo = (next: EditalCargoCatalogo) => setCargos((items) => items.map((cargo) => cargo.id === next.id ? next : cargo));
  const addCargo = () => { const cargo = { id: newId(), nome: `Novo cargo ${cargos.length + 1}`, ordem: cargos.length + 1, disciplinas: [] }; setCargos((items) => [...items, cargo]); setSelectedCargoId(cargo.id); };
  const removeCargo = (cargoId: string) => {
    const cargo = cargos.find((item) => item.id === cargoId);
    void requestConfirmation({
      title: "Remover cargo?",
      description: `O cargo “${cargo?.nome ?? "selecionado"}” e todas as suas disciplinas e tópicos serão removidos deste rascunho.`,
      confirmLabel: "Remover cargo",
      variant: "destructive",
    }).then((confirmed) => {
      if (!confirmed) return;
      setCargos((items) => items.filter((item) => item.id !== cargoId).map((item, index) => ({ ...item, ordem: index + 1 })));
      setSelectedCargoId((current) => current === cargoId ? null : current);
    });
  };

  if (query.isLoading) return <div className="py-20 text-center text-sm text-muted-foreground" role="status">Carregando editor…</div>;
  if (query.isError || !edital || !versao) return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Não foi possível abrir este edital. <button className="font-semibold underline" onClick={() => void query.refetch()}>Tentar novamente</button></div>;
  const editalDocumentUrl = resolvePublicUrl(edital.edital_url);
  const editalDocumentName = edital.edital_url?.split("/").pop()?.split("?")[0] || "Documento do edital";

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div><Link to="/admin/editais" className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar ao catálogo</Link><div className="flex items-center gap-3"><CatalogLogo src={edital.logo_url} orgao={edital.orgao} /><div><h1 className="text-2xl font-bold tracking-tight">{edital.nome}</h1><p className="mt-1 text-sm text-muted-foreground">Versão {versao.numero} · <span className="capitalize">{versao.status}</span></p></div></div></div>
        <div className="flex flex-wrap gap-2">{editable ? <><Button variant="outline" className="min-h-11 gap-2" onClick={() => setImportOpen(true)}><FileSpreadsheet className="h-4 w-4" /> Importar planilha</Button><Button variant="outline" className="min-h-11 gap-2" disabled={saveMutation.isPending || publishMutation.isPending || editalFileMutation.isPending || removeEditalMutation.isPending} onClick={() => { const issue = structureIssue(cargos); if (issue) toast.error(issue); else saveMutation.mutate(); }}><Save className="h-4 w-4" /> {saveMutation.isPending ? "Salvando…" : "Salvar rascunho"}</Button><Button className="min-h-11 gap-2" disabled={publishMutation.isPending || saveMutation.isPending || editalFileMutation.isPending || removeEditalMutation.isPending} onClick={() => { const issue = structureIssue(cargos, true); if (issue) { toast.error(issue); return; } void requestConfirmation({ title: "Publicar esta versão?", description: "O rascunho será salvo e disponibilizado no catálogo. Depois da publicação, esta versão ficará somente para leitura.", confirmLabel: "Salvar e publicar" }).then((confirmed) => { if (confirmed) publishMutation.mutate(); }); }}><Send className="h-4 w-4" /> {publishMutation.isPending ? "Salvando e publicando…" : "Publicar"}</Button></> : <Button className="min-h-11" disabled={draftMutation.isPending} onClick={() => draftMutation.mutate()}>{draftMutation.isPending ? "Criando…" : "Criar nova versão"}</Button>}</div>
      </header>

      {!editable ? <div className="rounded-xl border border-primary/30 bg-primary-muted p-4 text-sm text-foreground"><strong>Versão somente leitura.</strong> Crie uma nova versão para alterar o conteúdo publicado.</div> : null}

      <nav className="flex gap-1 rounded-xl bg-muted p-1" aria-label="Seções do editor">
        <button type="button" className={cn("min-h-11 flex-1 rounded-lg px-4 text-sm font-semibold transition", activeTab === "geral" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")} aria-current={activeTab === "geral" ? "page" : undefined} onClick={() => setSearchParams({ tab: "geral" }, { replace: true })}>Informações gerais</button>
        <button type="button" className={cn("min-h-11 flex-1 rounded-lg px-4 text-sm font-semibold transition", activeTab === "conteudo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")} aria-current={activeTab === "conteudo" ? "page" : undefined} onClick={() => setSearchParams({ tab: "conteudo" }, { replace: true })}>Disciplinas e conteúdo</button>
      </nav>

      {activeTab === "geral" ? <>
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-4"><h2 className="font-semibold">Identidade do órgão</h2><p className="mt-1 text-xs text-muted-foreground">A logo facilita o reconhecimento do edital na busca e pode ser atualizada sem alterar a versão publicada.</p></div><div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]"><div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4"><CatalogLogo src={edital.logo_url} orgao={edital.orgao} size="lg" /><div className="min-w-0"><strong className="block truncate text-sm">{edital.orgao}</strong><span className="text-xs text-muted-foreground">Prévia no catálogo</span></div></div><div><FileDropZone id="edit-catalogo-logo-file" label={edital.logo_url ? "Substituir logo" : "Logo do órgão"} description="Selecionar imagem" accept=".png,.jpg,.jpeg,.webp" file={pendingLogoFile} onFileChange={setPendingLogoFile} icon={ImageIcon} variant="aprov" hint="PNG, JPG ou WEBP · até 2 MB · prefira imagem quadrada" />{pendingLogoFile ? <div className="mt-3 flex justify-end"><Button className="min-h-11" disabled={logoMutation.isPending} onClick={() => logoMutation.mutate()}>{logoMutation.isPending ? "Salvando logo…" : "Salvar logo"}</Button></div> : null}</div></div></section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-4"><h2 className="font-semibold">1. Dados do concurso</h2><p className="mt-1 text-xs text-muted-foreground">Estas informações ajudam o aluno a encontrar o concurso no catálogo.</p></div><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Nome *<input className={`${inputClass} mt-1.5`} disabled={!metadataEditable} value={meta.nome} onChange={(e) => setMeta((s) => ({ ...s, nome: e.target.value }))} /></label><label className="text-sm font-medium">Órgão *<input className={`${inputClass} mt-1.5`} disabled={!metadataEditable} value={meta.orgao} onChange={(e) => setMeta((s) => ({ ...s, orgao: e.target.value }))} /></label><label className="text-sm font-medium">Banca<input className={`${inputClass} mt-1.5`} disabled={!metadataEditable} value={meta.banca ?? ""} onChange={(e) => setMeta((s) => ({ ...s, banca: e.target.value || null }))} /></label><label className="text-sm font-medium">URL oficial<div className="mt-1.5 flex gap-2"><input type="url" className={inputClass} disabled={!metadataEditable} value={meta.url_oficial ?? ""} onChange={(e) => setMeta((s) => ({ ...s, url_oficial: e.target.value || null }))} placeholder="https://..." />{meta.url_oficial ? <Button asChild type="button" variant="outline" size="icon-lg" aria-label="Abrir URL oficial"><a href={meta.url_oficial} target="_blank" rel="noreferrer"><ExternalLink /></a></Button> : null}</div></label></div>{editable && !metadataEditable ? <p className="mt-3 text-xs text-muted-foreground">Os dados gerais permanecem vinculados ao concurso já publicado. Nesta nova versão, altere apenas cargos, disciplinas e tópicos.</p> : null}</section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="edital-document-title">
        <div className="mb-4"><h2 id="edital-document-title" className="font-semibold">2. Edital do concurso</h2><p className="mt-1 text-xs text-muted-foreground">Documento atualmente associado ao concurso e usado como referência para o conteúdo programático.</p></div>
        {editalDocumentUrl ? <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary-muted/30 p-4 sm:flex-row sm:items-center"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-sm"><FileCheck2 className="h-5 w-5" /></div><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{decodeURIComponent(editalDocumentName)}</strong><p className="mt-1 text-xs text-muted-foreground">Edital cadastrado e vinculado a este concurso.</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="min-h-11 gap-2"><a href={editalDocumentUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Abrir / visualizar</a></Button>{metadataEditable ? <Button variant="outline" className="min-h-11 gap-2 text-destructive hover:text-destructive" disabled={removeEditalMutation.isPending || saveMutation.isPending || publishMutation.isPending || editalFileMutation.isPending} onClick={() => void requestConfirmation({ title: "Remover edital?", description: "O documento será desvinculado deste concurso. Para cadastrar outro edital, confirme a remoção do atual.", confirmLabel: "Remover edital", variant: "destructive" }).then((confirmed) => { if (confirmed) removeEditalMutation.mutate(); })}><Trash2 /> {removeEditalMutation.isPending ? "Removendo…" : "Remover edital"}</Button> : null}</div></div> : <div className="rounded-xl border border-dashed border-border p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><FileText className="h-5 w-5" /></div><div className="flex-1"><strong className="text-sm">Nenhum edital cadastrado para este concurso.</strong><p className="mt-1 text-xs text-muted-foreground">Adicione um documento para manter a fonte oficial junto aos dados do concurso.</p></div></div>{metadataEditable ? <div className="mt-5 space-y-3"><FileDropZone id="edit-catalogo-edital-file" label="Cadastrar novo edital" description="Selecionar documento" accept=".pdf,.docx,.png,.jpg,.jpeg" file={pendingEditalFile} onFileChange={setPendingEditalFile} icon={FileText} variant="aprov" hint="PDF, DOCX, PNG ou JPG · até 10 MB" /><div className="flex justify-end"><Button className="min-h-11" disabled={!pendingEditalFile || editalFileMutation.isPending || removeEditalMutation.isPending || saveMutation.isPending || publishMutation.isPending} onClick={() => editalFileMutation.mutate()}>{editalFileMutation.isPending ? "Cadastrando edital…" : "Cadastrar edital"}</Button></div></div> : null}</div>}
        {editalFileMutation.isError || removeEditalMutation.isError ? <p role="alert" className="mt-3 text-sm text-destructive">Não foi possível concluir a operação. O estado anterior foi preservado.</p> : null}
      </section>

      <EditalClassificationSection editalId={id} version={versao} editable={editable} />
      </> : null}

      {activeTab === "conteudo" ? <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4"><div><h2 className="font-semibold">Disciplinas e conteúdo</h2><p className="text-xs text-muted-foreground">{cargos.reduce((sum, cargo) => sum + cargo.disciplinas.length, 0)} disciplinas · {cargos.reduce((sum, cargo) => sum + cargo.disciplinas.reduce((subtotal, disciplina) => subtotal + disciplina.topicos.length, 0), 0)} tópicos</p></div>{editable ? <Button variant="outline" className="min-h-11 gap-2" onClick={addCargo}><Plus /> Adicionar cargo</Button> : null}</div>
        {cargos.length > 1 ? <div className="grid min-h-[420px] lg:grid-cols-[280px_minmax(0,1fr)]"><nav className="border-b border-border bg-muted/30 p-3 lg:border-b-0 lg:border-r" aria-label="Cargos do concurso"><div className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">{cargos.map((cargo) => <button key={cargo.id} type="button" onClick={() => setSelectedCargoId(cargo.id)} className={cn("min-h-11 min-w-[220px] rounded-lg px-3 py-2 text-left text-sm transition lg:w-full lg:min-w-0", selectedCargoId === cargo.id ? "bg-card font-semibold text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-card hover:text-foreground")}><span className="block truncate">{cargo.nome}</span><span className="text-xs font-normal">{cargo.disciplinas.length} disciplinas</span></button>)}</div></nav><div className="min-w-0 p-4 sm:p-5">{selectedCargo ? <CargoEditor cargo={selectedCargo} disciplineSuggestions={disciplineSuggestions} editable={editable} allowRemove onChange={updateCargo} onRemove={() => removeCargo(selectedCargo.id)} requestConfirmation={requestConfirmation} /> : null}</div></div> : <div className="min-h-[320px] p-4 sm:p-5">{selectedCargo ? <CargoEditor cargo={selectedCargo} disciplineSuggestions={disciplineSuggestions} editable={editable} allowRemove={false} onChange={updateCargo} onRemove={() => removeCargo(selectedCargo.id)} requestConfirmation={requestConfirmation} /> : <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center"><BookOpen className="h-10 w-10 text-muted-foreground" /><p className="mt-3 font-medium">Nenhuma disciplina adicionada</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Adicione as disciplinas que fazem parte do conteúdo programático deste edital.</p>{editable ? <Button className="mt-4 min-h-11" onClick={addCargo}><Plus /> Adicionar cargo principal</Button> : null}</div>}</div>}
      </section>
      : null}

      <EditalImportDialog open={importOpen} onClose={() => setImportOpen(false)} editalId={id} versaoId={versao.id} />
      {confirmDialog}
    </div>
  );
}

type ConfirmRequest = ReturnType<typeof useConfirmDialog>["requestConfirmation"];

function CargoEditor({ cargo, disciplineSuggestions, editable, allowRemove, onChange, onRemove, requestConfirmation }: { cargo: EditalCargoCatalogo; disciplineSuggestions: string[]; editable: boolean; allowRemove: boolean; onChange: (cargo: EditalCargoCatalogo) => void; onRemove: () => void; requestConfirmation: ConfirmRequest }) {
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const updateDisciplina = (next: EditalDisciplinaCatalogo) => onChange({ ...cargo, disciplinas: cargo.disciplinas.map((item) => item.id === next.id ? next : item) });
  const addDisciplina = () => {
    const normalized = name.trim();
    if (!normalized) return;
    if (cargo.disciplinas.some((item) => item.nome.trim().toLocaleLowerCase("pt-BR") === normalized.toLocaleLowerCase("pt-BR"))) { toast.error("Esta disciplina já está neste cargo."); return; }
    onChange({ ...cargo, disciplinas: [...cargo.disciplinas, { id: newId(), nome: normalized, sigla: null, ordem: cargo.disciplinas.length + 1, topicos: [] }] });
    setName("");
    toast.success("Disciplina adicionada.");
  };
  const removeDisciplina = (disciplina: EditalDisciplinaCatalogo) => void requestConfirmation({ title: "Remover disciplina?", description: `A disciplina “${disciplina.nome}” e seus ${disciplina.topicos.length} tópicos serão removidos deste edital.`, confirmLabel: "Remover disciplina", variant: "destructive" }).then((confirmed) => {
    if (!confirmed) return;
    onChange({ ...cargo, disciplinas: cargo.disciplinas.filter((item) => item.id !== disciplina.id).map((item, index) => ({ ...item, ordem: index + 1 })) });
    toast.success("Disciplina removida.");
  });
  const normalizedSearch = name.trim().toLocaleLowerCase("pt-BR");
  const currentNames = new Set(cargo.disciplinas.map((item) => item.nome.trim().toLocaleLowerCase("pt-BR")));
  const matchingSuggestions = disciplineSuggestions
    .filter((suggestion) => !currentNames.has(suggestion.toLocaleLowerCase("pt-BR")))
    .filter((suggestion) => !normalizedSearch || suggestion.toLocaleLowerCase("pt-BR").includes(normalizedSearch))
    .slice(0, 6);
  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="min-w-0 flex-1 text-sm font-medium">Cargo<Input className="mt-1.5" disabled={!editable} value={cargo.nome} onChange={(event) => onChange({ ...cargo, nome: event.target.value })} /></label>{editable && allowRemove ? <Button variant="ghost" className="min-h-11 text-destructive" onClick={onRemove}><Trash2 /> Remover cargo</Button> : null}</div>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Disciplinas</h3><p className="text-xs text-muted-foreground">Expanda uma disciplina para gerenciar seus conteúdos.</p></div>{editable ? <Button className="min-h-11" onClick={() => setAdding(true)}><Plus /> Adicionar disciplina</Button> : null}</div>
    {adding ? <div className="rounded-xl border border-primary/30 bg-primary-muted/30 p-3"><label className="text-xs font-medium">Buscar ou criar disciplina<div className="mt-1.5 flex flex-col gap-2 sm:flex-row"><Input autoFocus role="combobox" aria-expanded={matchingSuggestions.length > 0} aria-controls="discipline-suggestions" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addDisciplina(); } }} placeholder="Ex.: Direito Administrativo" /><Button disabled={!name.trim()} onClick={addDisciplina}><Check /> Adicionar</Button><Button variant="ghost" onClick={() => { setAdding(false); setName(""); }}><X /> Cancelar</Button></div></label><p className="mt-2 text-xs text-muted-foreground">Selecione um nome já usado neste edital ou crie uma nova disciplina sem sair do editor.</p>{matchingSuggestions.length ? <div id="discipline-suggestions" role="listbox" aria-label="Disciplinas existentes" className="mt-2 flex flex-wrap gap-1">{matchingSuggestions.map((suggestion) => <Button key={suggestion} type="button" variant="outline" size="sm" role="option" onClick={() => setName(suggestion)}>{suggestion}</Button>)}</div> : null}{normalizedSearch && currentNames.has(normalizedSearch) ? <Badge className="mt-2" variant="outline">Já cadastrada neste cargo</Badge> : null}</div> : null}
    <div className="space-y-3">{cargo.disciplinas.map((disciplina, index) => <DisciplinaEditor key={disciplina.id} disciplina={disciplina} editable={editable} onChange={updateDisciplina} onRemove={() => removeDisciplina(disciplina)} onMoveUp={() => onChange({ ...cargo, disciplinas: reorderCatalogItems(cargo.disciplinas, index, index - 1) })} onMoveDown={() => onChange({ ...cargo, disciplinas: reorderCatalogItems(cargo.disciplinas, index, index + 1) })} first={index === 0} last={index === cargo.disciplinas.length - 1} requestConfirmation={requestConfirmation} />)}
      {!cargo.disciplinas.length ? <div className="rounded-lg border border-dashed border-border p-8 text-center"><BookOpen className="mx-auto h-8 w-8 text-primary" /><p className="mt-2 text-sm font-medium">Nenhuma disciplina adicionada</p><p className="mt-1 text-xs text-muted-foreground">Adicione as disciplinas que fazem parte do conteúdo programático deste edital.</p>{editable ? <Button variant="outline" className="mt-4 min-h-11" onClick={() => setAdding(true)}><Plus /> Adicionar disciplina</Button> : null}</div> : null}
    </div>
  </div>;
}

function DisciplinaEditor({ disciplina, editable, onChange, onRemove, onMoveUp, onMoveDown, first, last, requestConfirmation }: { disciplina: EditalDisciplinaCatalogo; editable: boolean; onChange: (disciplina: EditalDisciplinaCatalogo) => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void; first: boolean; last: boolean; requestConfirmation: ConfirmRequest }) {
  const [open, setOpen] = React.useState(true);
  const [editingName, setEditingName] = React.useState(false);
  const [quickTopic, setQuickTopic] = React.useState("");
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkText, setBulkText] = React.useState("");
  const [bulkDraft, setBulkDraft] = React.useState<string[] | null>(null);
  const addQuickTopic = () => {
    const description = quickTopic.trim();
    if (!description) return;
    if (disciplina.topicos.some((item) => item.descricao.trim().toLocaleLowerCase("pt-BR") === description.toLocaleLowerCase("pt-BR"))) { toast.error("Este tópico já foi adicionado."); return; }
    onChange({ ...disciplina, topicos: [...disciplina.topicos, { id: newId(), descricao: description, ordem: disciplina.topicos.length + 1, peso: 1 }] });
    setQuickTopic("");
  };
  const removeTopic = (index: number) => void requestConfirmation({ title: "Remover conteúdo?", description: `O tópico “${disciplina.topicos[index].descricao}” será removido desta disciplina.`, confirmLabel: "Remover conteúdo", variant: "destructive" }).then((confirmed) => {
    if (!confirmed) return;
    onChange({ ...disciplina, topicos: disciplina.topicos.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, ordem: itemIndex + 1 })) });
    toast.success("Conteúdo removido.");
  });
  const prepareBulk = () => setBulkDraft(parseBulkTopics(bulkText, disciplina.topicos.map((item) => item.descricao)));
  const addBulkTopics = () => {
    const topics = (bulkDraft ?? []).map((item) => item.trim()).filter(Boolean);
    if (!topics.length) return;
    onChange({ ...disciplina, topicos: [...disciplina.topicos, ...topics.map((descricao, index) => ({ id: newId(), descricao, ordem: disciplina.topicos.length + index + 1, peso: 1 }))] });
    setBulkText(""); setBulkDraft(null); setBulkOpen(false); toast.success(`${topics.length} conteúdos adicionados.`);
  };
  return <article className="rounded-xl border border-border bg-background/40">
    <div className="flex items-center gap-1 p-3"><button type="button" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={open} onClick={() => setOpen((value) => !value)}><ChevronDown className={cn("h-4 w-4 shrink-0 transition", !open && "-rotate-90")} /><span className="min-w-0"><strong className="block truncate">{disciplina.nome}</strong><span className="text-xs text-muted-foreground">{disciplina.topicos.length} tópicos</span></span></button>{editable ? <><Button variant="ghost" size="icon-lg" disabled={first} aria-label={`Mover ${disciplina.nome} para cima`} onClick={onMoveUp}><ArrowUp /></Button><Button variant="ghost" size="icon-lg" disabled={last} aria-label={`Mover ${disciplina.nome} para baixo`} onClick={onMoveDown}><ArrowDown /></Button><Button variant="ghost" size="icon-lg" aria-label={`Editar nome de ${disciplina.nome}`} onClick={() => { setOpen(true); setEditingName(true); }}><Pencil /></Button><Button variant="ghost" size="icon-lg" aria-label={`Remover ${disciplina.nome}`} onClick={onRemove}><Trash2 className="text-destructive" /></Button></> : null}</div>
    {open ? <div className="space-y-4 border-t border-border p-4">
      {editingName ? <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]"><label className="text-xs font-medium">Nome<Input autoFocus className="mt-1" value={disciplina.nome} onChange={(event) => onChange({ ...disciplina, nome: event.target.value })} /></label><label className="text-xs font-medium">Sigla<Input className="mt-1" value={disciplina.sigla ?? ""} onChange={(event) => onChange({ ...disciplina, sigla: event.target.value || null })} /></label><Button variant="outline" className="self-end" onClick={() => setEditingName(false)}><Check /> Concluir</Button></div> : null}
      {disciplina.topicos.length ? <div className="space-y-2">{disciplina.topicos.map((topico, index) => <div key={topico.id} className="grid gap-2 rounded-lg border border-border p-2 sm:grid-cols-[32px_minmax(0,1fr)_72px_132px] sm:items-center sm:border-0 sm:p-0"><span className="hidden text-center text-xs text-muted-foreground sm:block">{index + 1}</span><Input aria-label={`Tópico ${index + 1}`} disabled={!editable} value={topico.descricao} onChange={(event) => onChange({ ...disciplina, topicos: disciplina.topicos.map((item) => item.id === topico.id ? { ...item, descricao: event.target.value } : item) })} /><Input aria-label={`Peso do tópico ${index + 1}`} type="number" min={1} disabled={!editable} value={topico.peso} onChange={(event) => onChange({ ...disciplina, topicos: disciplina.topicos.map((item) => item.id === topico.id ? { ...item, peso: Math.max(1, Number(event.target.value) || 1) } : item) })} />{editable ? <div className="flex justify-end"><Button variant="ghost" size="icon-lg" disabled={index === 0} aria-label={`Mover tópico ${index + 1} para cima`} onClick={() => onChange({ ...disciplina, topicos: reorderCatalogItems(disciplina.topicos, index, index - 1) })}><ArrowUp /></Button><Button variant="ghost" size="icon-lg" disabled={index === disciplina.topicos.length - 1} aria-label={`Mover tópico ${index + 1} para baixo`} onClick={() => onChange({ ...disciplina, topicos: reorderCatalogItems(disciplina.topicos, index, index + 1) })}><ArrowDown /></Button><Button variant="ghost" size="icon-lg" aria-label={`Remover tópico ${index + 1}`} onClick={() => removeTopic(index)}><Trash2 className="text-destructive" /></Button></div> : null}</div>)}</div> : <div className="rounded-lg border border-dashed border-border p-5 text-center"><p className="text-sm font-medium">Nenhum conteúdo cadastrado nesta disciplina.</p><p className="mt-1 text-xs text-muted-foreground">Digite o primeiro tópico abaixo ou adicione vários em lote.</p></div>}
      {editable ? <><label className="block text-xs font-medium">Adicionar tópico rapidamente<div className="mt-1.5 flex gap-2"><Input value={quickTopic} onChange={(event) => setQuickTopic(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addQuickTopic(); } }} placeholder="Digite o conteúdo e pressione Enter" /><Button variant="outline" disabled={!quickTopic.trim()} onClick={addQuickTopic}><Plus /> Adicionar</Button></div><span className="mt-1 block font-normal text-muted-foreground">Após adicionar, o campo permanece pronto para o próximo tópico.</span></label><Button variant="ghost" className="min-h-11" aria-expanded={bulkOpen} onClick={() => { setBulkOpen((value) => !value); setBulkDraft(null); }}><ListPlus /> Adicionar conteúdo em lote</Button>
        {bulkOpen ? <div className="space-y-3 rounded-xl border border-primary/20 bg-primary-muted/30 p-4"><label className="block text-xs font-medium">Cole um tópico por linha<textarea autoFocus rows={6} className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={bulkText} onChange={(event) => { setBulkText(event.target.value); setBulkDraft(null); }} placeholder={"1 Redes de computadores\n1.1 Modelo OSI\n1.2 TCP/IP"} /></label>{bulkDraft ? <div className="space-y-2"><p className="text-sm font-semibold">{bulkDraft.length} tópicos identificados</p>{bulkDraft.map((item, index) => <div key={`${index}-${item}`} className="flex gap-2"><Input aria-label={`Conteúdo em lote ${index + 1}`} value={item} onChange={(event) => setBulkDraft((current) => current?.map((value, itemIndex) => itemIndex === index ? event.target.value : value) ?? null)} /><Button variant="ghost" size="icon-lg" aria-label={`Excluir conteúdo em lote ${index + 1}`} onClick={() => setBulkDraft((current) => current?.filter((_, itemIndex) => itemIndex !== index) ?? null)}><Trash2 /></Button></div>)}</div> : null}<div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={() => { setBulkOpen(false); setBulkText(""); setBulkDraft(null); }}>Cancelar</Button>{bulkDraft ? <Button disabled={!bulkDraft.some((item) => item.trim())} onClick={addBulkTopics}>Confirmar {bulkDraft.filter((item) => item.trim()).length} tópicos</Button> : <Button disabled={!bulkText.trim()} onClick={prepareBulk}>Revisar tópicos</Button>}</div></div> : null}</> : null}
    </div> : null}
  </article>;
}
