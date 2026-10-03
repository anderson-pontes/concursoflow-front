import React from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, BookOpen, ExternalLink, FileCheck2, FileSpreadsheet, FileText, ImageIcon, Plus, Save, Send, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { EditalImportDialog } from "@/components/admin/editais/EditalImportDialog";
import { EditalClassificationSection } from "@/components/admin/editais/EditalClassificationSection";
import { EditalScheduleSection, scheduleIssue } from "@/components/admin/editais/EditalScheduleSection";
import { salvarCronogramaVersao } from "@/services/editaisCatalogo";
import { FileDropZone } from "@/components/concursos/FileDropZone";
import { CatalogLogo } from "@/components/editais/CatalogLogo";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { CargoContentEditor } from "@/components/admin/editais/CargoContentEditor";
import { classificationDraft, classificationInput, classificationIssue } from "@/lib/adminEditalClassification";
import type { ClassificationDraft } from "@/lib/adminEditalClassification";
import { resolvePublicUrl } from "@/lib/publicUrl";
import { atualizarEditalAdmin, criarVersaoRascunho, obterEditalAdmin, publicarVersao, removerEditalAdmin, salvarClassificacaoVersao, salvarEstruturaVersao, uploadEditalAdmin, uploadLogoAdmin } from "@/services/editaisCatalogo";
import type { EditalCargoCatalogo, EditalCatalogoInput, EditalCronograma } from "@/types/editaisCatalogo";

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
  const [scheduleDraft, setScheduleDraft] = React.useState<{ versionId: string; value: EditalCronograma } | null>(null);
  const [classification, setClassification] = React.useState<{ versionId: string; value: ClassificationDraft; dirty: boolean } | null>(null);

  const query = useQuery({ queryKey: ["admin-edital", id], queryFn: () => obterEditalAdmin(id), enabled: Boolean(id) });
  const edital = query.data;
  const versao = edital?.versoes?.find((item) => item.status === "rascunho") ?? edital?.versao_atual ?? null;
  const editable = versao?.status === "rascunho";
  const metadataEditable = Boolean(editable && !edital?.versoes?.some((item) => item.status === "publicado"));
  const schedule: EditalCronograma = scheduleDraft && scheduleDraft.versionId === versao?.id ? scheduleDraft.value : {
    inicio_inscricoes: versao?.inicio_inscricoes ?? null,
    encerramento_inscricoes: versao?.encerramento_inscricoes ?? null,
    limite_pagamento: versao?.limite_pagamento ?? null,
    data_prova: versao?.data_prova ?? null,
  };
  const saveSchedule = async () => {
    if (!versao || scheduleDraft?.versionId !== versao.id) return;
    const issue = scheduleIssue(schedule);
    if (issue) throw new Error(issue);
    await salvarCronogramaVersao(id, versao.id, schedule);
  };
  // Preserve unsaved edits and an acknowledged revision until refetch catches up.
  // Once the server is current, its canonical fields become the clean baseline.
  const classificationValue = versao ? (
    classification?.versionId === versao.id && (classification.dirty || classification.value.revision > versao.classificacao.revision)
      ? classification.value
      : classificationDraft(versao)
  ) : null;
  const classificationDirty = classification?.versionId === versao?.id && classification?.dirty;
  const saveClassification = async () => {
    if (!versao || !classificationValue || !classificationDirty) return;
    const issue = classificationIssue(classificationValue);
    if (issue) throw new Error(issue);
    await salvarClassificacaoVersao(id, versao.id, classificationInput(classificationValue));
    // A later upload/publication failure must not replay the old revision.
    setClassification({ versionId: versao.id, value: { ...classificationValue, revision: classificationValue.revision + 1 }, dirty: false });
    void qc.invalidateQueries({ queryKey: ["catalogo-editais", "public"] });
  };

  React.useEffect(() => {
    if (!edital || !versao) return;
    setMeta({ nome: edital.nome, orgao: edital.orgao, banca: edital.banca, url_oficial: edital.url_oficial });
    setCargos(versao.cargos ?? []);
    setSelectedCargoId((current) => current && versao.cargos.some((cargo) => cargo.id === current) ? current : versao.cargos[0]?.id ?? null);
  }, [edital, versao]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!versao) throw new Error("Versão não encontrada");
      const dateIssue = scheduleIssue(schedule);
      if (dateIssue) throw new Error(dateIssue);
      if (classificationDirty && classificationValue) {
        const issue = classificationIssue(classificationValue);
        if (issue) throw new Error(issue);
      }
      if (metadataEditable) await atualizarEditalAdmin(id, meta);
      if (editable) await salvarEstruturaVersao(id, versao.id, cargos);
      await saveSchedule();
      if (pendingEditalFile) await uploadEditalAdmin(id, pendingEditalFile);
      await saveClassification();
      return obterEditalAdmin(id);
    },
    onSuccess: (updated) => { setPendingEditalFile(null); setScheduleDraft(null); qc.setQueryData(["admin-edital", id], updated); void qc.invalidateQueries({ queryKey: ["admin-editais"] }); void qc.invalidateQueries({ queryKey: ["catalogo-editais", "public"] }); void qc.invalidateQueries({ queryKey: ["avisos"] }); toast.success(editable ? "Rascunho salvo." : "Cronograma atualizado."); },
    onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível salvar o rascunho.")),
  });
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!versao) throw new Error("Versão não encontrada");
      const dateIssue = scheduleIssue(schedule);
      if (dateIssue) throw new Error(dateIssue);
      if (classificationDirty && classificationValue) {
        const issue = classificationIssue(classificationValue);
        if (issue) throw new Error(issue);
      }
      if (metadataEditable) await atualizarEditalAdmin(id, meta);
      await salvarEstruturaVersao(id, versao.id, cargos);
      await saveSchedule();
      if (pendingEditalFile) await uploadEditalAdmin(id, pendingEditalFile);
      await saveClassification();
      return publicarVersao(id, versao.id);
    },
    onSuccess: () => { setPendingEditalFile(null); setScheduleDraft(null); void qc.invalidateQueries({ queryKey: ["admin-edital", id] }); void qc.invalidateQueries({ queryKey: ["admin-editais"] }); void qc.invalidateQueries({ queryKey: ["catalogo-editais", "public"] }); void qc.invalidateQueries({ queryKey: ["catalogo-edital", "public"] }); void qc.invalidateQueries({ queryKey: ["avisos"] }); toast.success("Versão publicada no catálogo."); },
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
      setSelectedCargoId((current) => current === cargoId ? cargos.find((item) => item.id !== cargoId)?.id ?? null : current);
    });
  };

  if (query.isLoading) return <div className="py-20 text-center text-sm text-muted-foreground" role="status">Carregando editor…</div>;
  if (query.isError || !edital || !versao) return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Não foi possível abrir este edital. <button className="font-semibold underline" onClick={() => void query.refetch()}>Tentar novamente</button></div>;
  const totalDisciplines = cargos.reduce((total, cargo) => total + cargo.disciplinas.length, 0);
  const totalTopics = cargos.reduce((total, cargo) => total + cargo.disciplinas.reduce((sum, disciplina) => sum + disciplina.topicos.length, 0), 0);
  const editalDocumentUrl = resolvePublicUrl(edital.edital_url);
  const editalDocumentName = edital.edital_url?.split("/").pop()?.split("?")[0] || "Documento do edital";

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div><Link to="/admin/editais" className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar ao catálogo</Link><div className="flex items-center gap-3"><CatalogLogo src={edital.logo_url} orgao={edital.orgao} /><div><h1 className="text-2xl font-bold tracking-tight">{edital.nome}</h1><p className="mt-1 text-sm text-muted-foreground">Versão {versao.numero} · <span className="capitalize">{versao.status}</span></p></div></div></div>
        <div className="flex flex-wrap gap-2">{editable ? <><Button variant="outline" className="min-h-11 gap-2" onClick={() => setImportOpen(true)}><FileSpreadsheet className="h-4 w-4" /> Importar planilha</Button><Button variant="outline" className="min-h-11 gap-2" disabled={saveMutation.isPending || publishMutation.isPending || editalFileMutation.isPending || removeEditalMutation.isPending} onClick={() => { const issue = structureIssue(cargos); if (issue) toast.error(issue); else saveMutation.mutate(); }}><Save className="h-4 w-4" /> {saveMutation.isPending ? "Salvando…" : "Salvar rascunho"}</Button><Button className="min-h-11 gap-2" disabled={publishMutation.isPending || saveMutation.isPending || editalFileMutation.isPending || removeEditalMutation.isPending} onClick={() => { const issue = structureIssue(cargos, true); if (issue) { toast.error(issue); return; } void requestConfirmation({ title: "Publicar esta versão?", description: "O rascunho será salvo e disponibilizado no catálogo. Depois da publicação, esta versão ficará somente para leitura.", confirmLabel: "Salvar e publicar" }).then((confirmed) => { if (confirmed) publishMutation.mutate(); }); }}><Send className="h-4 w-4" /> {publishMutation.isPending ? "Salvando e publicando…" : "Publicar"}</Button></> : <Button className="min-h-11" disabled={draftMutation.isPending} onClick={() => draftMutation.mutate()}>{draftMutation.isPending ? "Criando…" : "Criar nova versão"}</Button>}</div>
        {!editable && versao.status === "publicado" ? <Button className="min-h-11 gap-2" disabled={!scheduleDraft || saveMutation.isPending || draftMutation.isPending || Boolean(scheduleIssue(schedule))} onClick={() => void requestConfirmation({ title: "Atualizar cronograma publicado?", description: "Os avisos automáticos dos concursos associados serão sincronizados com estas datas. Avisos manuais não serão alterados.", confirmLabel: "Salvar cronograma" }).then((confirmed) => { if (confirmed) saveMutation.mutate(); })}><Save className="h-4 w-4" />{saveMutation.isPending ? "Salvando…" : "Salvar cronograma"}</Button> : null}
      </header>

      {!editable ? <div className="rounded-xl border border-primary/30 bg-primary-muted p-4 text-sm text-foreground"><strong>Conteúdo somente leitura.</strong> Crie uma nova versão para alterar disciplinas e tópicos publicados. {versao.status === "publicado" ? "As datas podem ser atualizadas nas Informações gerais, sem alterar o conteúdo do aluno." : null}</div> : null}

      <nav className="flex gap-1 rounded-xl bg-muted p-1" aria-label="Seções do editor">
        <button type="button" className={cn("min-h-11 flex-1 rounded-lg px-4 text-sm font-semibold transition", activeTab === "geral" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")} aria-current={activeTab === "geral" ? "page" : undefined} onClick={() => setSearchParams({ tab: "geral" }, { replace: true })}>Informações gerais</button>
        <button type="button" className={cn("min-h-11 flex-1 rounded-lg px-4 text-sm font-semibold transition", activeTab === "conteudo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")} aria-current={activeTab === "conteudo" ? "page" : undefined} onClick={() => setSearchParams({ tab: "conteudo" }, { replace: true })}>Disciplinas e conteúdo</button>
      </nav>

      {activeTab === "geral" ? <>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm"><EditalScheduleSection value={schedule} onChange={(value) => setScheduleDraft({ versionId: versao.id, value })} disabled={versao.status === "arquivado" || saveMutation.isPending || publishMutation.isPending} published={versao.status === "publicado"} /></div>
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-4"><h2 className="font-semibold">Identidade do órgão</h2><p className="mt-1 text-xs text-muted-foreground">A logo facilita o reconhecimento do edital na busca e pode ser atualizada sem alterar a versão publicada.</p></div><div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]"><div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4"><CatalogLogo src={edital.logo_url} orgao={edital.orgao} size="lg" /><div className="min-w-0"><strong className="block truncate text-sm">{edital.orgao}</strong><span className="text-xs text-muted-foreground">Prévia no catálogo</span></div></div><div><FileDropZone id="edit-catalogo-logo-file" label={edital.logo_url ? "Substituir logo" : "Logo do órgão"} description="Selecionar imagem" accept=".png,.jpg,.jpeg,.webp" file={pendingLogoFile} onFileChange={setPendingLogoFile} icon={ImageIcon} variant="aprov" hint="PNG, JPG ou WEBP · até 2 MB · prefira imagem quadrada" />{pendingLogoFile ? <div className="mt-3 flex justify-end"><Button className="min-h-11" disabled={logoMutation.isPending} onClick={() => logoMutation.mutate()}>{logoMutation.isPending ? "Salvando logo…" : "Salvar logo"}</Button></div> : null}</div></div></section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-4"><h2 className="font-semibold">1. Dados do concurso</h2><p className="mt-1 text-xs text-muted-foreground">Estas informações ajudam o aluno a encontrar o concurso no catálogo.</p></div><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Nome *<input className={`${inputClass} mt-1.5`} disabled={!metadataEditable} value={meta.nome} onChange={(e) => setMeta((s) => ({ ...s, nome: e.target.value }))} /></label><label className="text-sm font-medium">Órgão *<input className={`${inputClass} mt-1.5`} disabled={!metadataEditable} value={meta.orgao} onChange={(e) => setMeta((s) => ({ ...s, orgao: e.target.value }))} /></label><label className="text-sm font-medium">Banca<input className={`${inputClass} mt-1.5`} disabled={!metadataEditable} value={meta.banca ?? ""} onChange={(e) => setMeta((s) => ({ ...s, banca: e.target.value || null }))} /></label><label className="text-sm font-medium">URL oficial<div className="mt-1.5 flex gap-2"><input type="url" className={inputClass} disabled={!metadataEditable} value={meta.url_oficial ?? ""} onChange={(e) => setMeta((s) => ({ ...s, url_oficial: e.target.value || null }))} placeholder="https://..." />{meta.url_oficial ? <Button asChild type="button" variant="outline" size="icon-lg" aria-label="Abrir URL oficial"><a href={meta.url_oficial} target="_blank" rel="noreferrer"><ExternalLink /></a></Button> : null}</div></label></div>{editable && !metadataEditable ? <p className="mt-3 text-xs text-muted-foreground">Os dados gerais permanecem vinculados ao concurso já publicado. Nesta nova versão, altere apenas cargos, disciplinas e tópicos.</p> : null}</section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="edital-document-title">
        <div className="mb-4"><h2 id="edital-document-title" className="font-semibold">2. Edital do concurso</h2><p className="mt-1 text-xs text-muted-foreground">Documento atualmente associado ao concurso e usado como referência para o conteúdo programático.</p></div>
        {editalDocumentUrl ? <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary-muted/30 p-4 sm:flex-row sm:items-center"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-sm"><FileCheck2 className="h-5 w-5" /></div><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{decodeURIComponent(editalDocumentName)}</strong><p className="mt-1 text-xs text-muted-foreground">Edital cadastrado e vinculado a este concurso.</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="min-h-11 gap-2"><a href={editalDocumentUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Abrir / visualizar</a></Button>{metadataEditable ? <Button variant="outline" className="min-h-11 gap-2 text-destructive hover:text-destructive" disabled={removeEditalMutation.isPending || saveMutation.isPending || publishMutation.isPending || editalFileMutation.isPending} onClick={() => void requestConfirmation({ title: "Remover edital?", description: "O documento será desvinculado deste concurso. Para cadastrar outro edital, confirme a remoção do atual.", confirmLabel: "Remover edital", variant: "destructive" }).then((confirmed) => { if (confirmed) removeEditalMutation.mutate(); })}><Trash2 /> {removeEditalMutation.isPending ? "Removendo…" : "Remover edital"}</Button> : null}</div></div> : <div className="rounded-xl border border-dashed border-border p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><FileText className="h-5 w-5" /></div><div className="flex-1"><strong className="text-sm">Nenhum edital cadastrado para este concurso.</strong><p className="mt-1 text-xs text-muted-foreground">Adicione um documento para manter a fonte oficial junto aos dados do concurso.</p></div></div>{metadataEditable ? <div className="mt-5 space-y-3"><FileDropZone id="edit-catalogo-edital-file" label="Cadastrar novo edital" description="Selecionar documento" accept=".pdf,.docx,.png,.jpg,.jpeg" file={pendingEditalFile} onFileChange={setPendingEditalFile} icon={FileText} variant="aprov" hint="PDF, DOCX, PNG ou JPG · até 10 MB" /><div className="flex justify-end"><Button className="min-h-11" disabled={!pendingEditalFile || editalFileMutation.isPending || removeEditalMutation.isPending || saveMutation.isPending || publishMutation.isPending} onClick={() => editalFileMutation.mutate()}>{editalFileMutation.isPending ? "Cadastrando edital…" : "Cadastrar edital"}</Button></div></div> : null}</div>}
        {editalFileMutation.isError || removeEditalMutation.isError ? <p role="alert" className="mt-3 text-sm text-destructive">Não foi possível concluir a operação. O estado anterior foi preservado.</p> : null}
      </section>

      {classificationValue ? <EditalClassificationSection value={classificationValue} onChange={(value) => setClassification({ versionId: versao.id, value, dirty: true })} editable={editable && !saveMutation.isPending && !publishMutation.isPending} /> : null}
      </> : null}

      {activeTab === "conteudo" ? <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4"><div><h2 className="font-semibold">Disciplinas e conteúdo</h2><p className="text-xs text-muted-foreground">{totalDisciplines} {totalDisciplines === 1 ? "disciplina" : "disciplinas"} · {totalTopics} {totalTopics === 1 ? "tópico" : "tópicos"}</p></div>{editable ? <Button variant="outline" className="min-h-11 gap-2" onClick={addCargo}><Plus /> Adicionar cargo</Button> : null}</div>
        {cargos.length > 1 ? <div className="grid min-h-[420px] grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)]"><nav className="min-w-0 border-b border-border bg-muted/30 p-3 xl:border-b-0 xl:border-r" aria-label="Cargos do concurso"><div className="flex gap-2 overflow-x-auto xl:block xl:space-y-1">{cargos.map((cargo) => <button key={cargo.id} type="button" onClick={() => setSelectedCargoId(cargo.id)} aria-current={selectedCargoId === cargo.id ? "true" : undefined} title={cargo.nome} className={cn("min-h-11 min-w-[220px] rounded-lg px-3 py-2 text-left text-sm transition xl:w-full xl:min-w-0", selectedCargoId === cargo.id ? "bg-card font-semibold text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-card hover:text-foreground")}><span className="block truncate">{cargo.nome}</span><span className="text-xs font-normal">{cargo.disciplinas.length} disciplinas</span></button>)}</div></nav><div className="min-w-0 p-4 sm:p-6">{selectedCargo ? <CargoContentEditor key={selectedCargo.id} cargo={selectedCargo} sourceCargos={cargos} disciplineSuggestions={disciplineSuggestions} editable={editable && !saveMutation.isPending && !publishMutation.isPending} allowRemove onChange={updateCargo} onRemove={() => removeCargo(selectedCargo.id)} requestConfirmation={requestConfirmation} /> : null}</div></div> : <div className="min-h-[320px] p-4 sm:p-5">{selectedCargo ? <CargoContentEditor key={selectedCargo.id} cargo={selectedCargo} sourceCargos={cargos} disciplineSuggestions={disciplineSuggestions} editable={editable && !saveMutation.isPending && !publishMutation.isPending} allowRemove={false} onChange={updateCargo} onRemove={() => removeCargo(selectedCargo.id)} requestConfirmation={requestConfirmation} /> : <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center"><BookOpen className="h-10 w-10 text-muted-foreground" /><p className="mt-3 font-medium">Nenhuma disciplina adicionada</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Adicione as disciplinas que fazem parte do conteúdo programático deste edital.</p>{editable ? <Button className="mt-4 min-h-11" onClick={addCargo}><Plus /> Adicionar cargo principal</Button> : null}</div>}</div>}
      </section>
      : null}

      <EditalImportDialog open={importOpen} onClose={() => setImportOpen(false)} editalId={id} versaoId={versao.id} />
      {confirmDialog}
    </div>
  );
}
