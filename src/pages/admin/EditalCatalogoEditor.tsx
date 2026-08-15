import React from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, BookOpen, ExternalLink, FileSpreadsheet, FileText, Plus, Save, Send, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { EditalImportDialog } from "@/components/admin/editais/EditalImportDialog";
import { FileDropZone } from "@/components/concursos/FileDropZone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { atualizarEditalAdmin, criarVersaoRascunho, obterEditalAdmin, publicarVersao, salvarEstruturaVersao, uploadEditalAdmin } from "@/services/editaisCatalogo";
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
  const qc = useQueryClient();
  const [importOpen, setImportOpen] = React.useState(false);
  const [selectedCargoId, setSelectedCargoId] = React.useState<string | null>(null);
  const [pendingEditalFile, setPendingEditalFile] = React.useState<File | null>(null);
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

  const selectedCargo = cargos.find((cargo) => cargo.id === selectedCargoId) ?? null;
  const updateCargo = (next: EditalCargoCatalogo) => setCargos((items) => items.map((cargo) => cargo.id === next.id ? next : cargo));
  const addCargo = () => { const cargo = { id: newId(), nome: `Novo cargo ${cargos.length + 1}`, ordem: cargos.length + 1, disciplinas: [] }; setCargos((items) => [...items, cargo]); setSelectedCargoId(cargo.id); };
  const removeCargo = (cargoId: string) => { if (!window.confirm("Remover este cargo e todo o conteúdo dele?")) return; setCargos((items) => items.filter((cargo) => cargo.id !== cargoId).map((cargo, index) => ({ ...cargo, ordem: index + 1 }))); setSelectedCargoId((current) => current === cargoId ? null : current); };

  if (query.isLoading) return <div className="py-20 text-center text-sm text-muted-foreground" role="status">Carregando editor…</div>;
  if (query.isError || !edital || !versao) return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Não foi possível abrir este edital. <button className="font-semibold underline" onClick={() => void query.refetch()}>Tentar novamente</button></div>;

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div><Link to="/admin/editais" className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar aos concursos</Link><h1 className="text-2xl font-bold tracking-tight">{edital.nome}</h1><p className="mt-1 text-sm text-muted-foreground">Versão {versao.numero} · <span className="capitalize">{versao.status}</span></p></div>
        <div className="flex flex-wrap gap-2">{editable ? <><Button variant="outline" className="min-h-11 gap-2" onClick={() => setImportOpen(true)}><FileSpreadsheet className="h-4 w-4" /> Importar planilha</Button><Button variant="outline" className="min-h-11 gap-2" disabled={saveMutation.isPending || publishMutation.isPending} onClick={() => { const issue = structureIssue(cargos); if (issue) toast.error(issue); else saveMutation.mutate(); }}><Save className="h-4 w-4" /> {saveMutation.isPending ? "Salvando…" : "Salvar rascunho"}</Button><Button className="min-h-11 gap-2" disabled={publishMutation.isPending || saveMutation.isPending} onClick={() => { const issue = structureIssue(cargos, true); if (issue) { toast.error(issue); return; } if (window.confirm("Salvar e publicar esta versão? Depois de publicada ela não poderá ser alterada.")) publishMutation.mutate(); }}><Send className="h-4 w-4" /> {publishMutation.isPending ? "Salvando e publicando…" : "Publicar"}</Button></> : <Button className="min-h-11" disabled={draftMutation.isPending} onClick={() => draftMutation.mutate()}>{draftMutation.isPending ? "Criando…" : "Criar nova versão"}</Button>}</div>
      </header>

      {!editable ? <div className="rounded-xl border border-primary/30 bg-primary-muted p-4 text-sm text-foreground"><strong>Versão somente leitura.</strong> Crie uma nova versão para alterar o conteúdo publicado.</div> : null}

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-4"><h2 className="font-semibold">1. Dados do concurso</h2><p className="mt-1 text-xs text-muted-foreground">Estas informações ajudam o aluno a encontrar o concurso no catálogo.</p></div><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Nome *<input className={`${inputClass} mt-1.5`} disabled={!metadataEditable} value={meta.nome} onChange={(e) => setMeta((s) => ({ ...s, nome: e.target.value }))} /></label><label className="text-sm font-medium">Órgão *<input className={`${inputClass} mt-1.5`} disabled={!metadataEditable} value={meta.orgao} onChange={(e) => setMeta((s) => ({ ...s, orgao: e.target.value }))} /></label><label className="text-sm font-medium">Banca<input className={`${inputClass} mt-1.5`} disabled={!metadataEditable} value={meta.banca ?? ""} onChange={(e) => setMeta((s) => ({ ...s, banca: e.target.value || null }))} /></label><label className="text-sm font-medium">URL oficial<input type="url" className={`${inputClass} mt-1.5`} disabled={!metadataEditable} value={meta.url_oficial?.startsWith("/uploads/") ? "" : meta.url_oficial ?? ""} onChange={(e) => setMeta((s) => ({ ...s, url_oficial: e.target.value || null }))} placeholder="https://..." /></label></div>{editable && !metadataEditable ? <p className="mt-3 text-xs text-muted-foreground">Os dados gerais permanecem vinculados ao concurso já publicado. Nesta nova versão, altere apenas cargos, disciplinas e tópicos.</p> : null}</section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">2. Edital do concurso</h2><p className="mt-1 text-xs text-muted-foreground">Anexe o documento que serviu de base para cadastrar as disciplinas.</p></div>{edital.url_oficial ? <Button asChild variant="outline" className="min-h-11 gap-2"><a href={edital.url_oficial} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Abrir edital atual</a></Button> : null}</div>{metadataEditable ? <FileDropZone id="edit-catalogo-edital-file" label={edital.url_oficial ? "Substituir arquivo" : "Arquivo do edital"} description={edital.url_oficial ? "Selecionar outro edital" : "Anexar edital"} accept=".pdf,.docx,.png,.jpg,.jpeg" file={pendingEditalFile} onFileChange={setPendingEditalFile} icon={FileText} variant="aprov" hint="PDF, DOCX, PNG ou JPG · até 10 MB. O envio ocorre ao salvar." /> : !edital.url_oficial ? <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhum edital foi anexado a este concurso.</p> : null}</section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-4"><div><h2 className="font-semibold">3. Disciplinas do concurso</h2><p className="text-xs text-muted-foreground">{cargos.reduce((sum, cargo) => sum + cargo.disciplinas.length, 0)} disciplinas{cargos.length > 1 ? ` em ${cargos.length} cargos` : selectedCargo ? ` para ${selectedCargo.nome}` : ""}</p></div>{editable ? <Button variant="outline" className="min-h-11 gap-2" onClick={addCargo}><Plus /> Adicionar outro cargo</Button> : null}</div>
        {cargos.length > 1 ? <div className="grid min-h-[420px] lg:grid-cols-[280px_minmax(0,1fr)]"><nav className="border-b border-border bg-muted/30 p-3 lg:border-b-0 lg:border-r" aria-label="Cargos do concurso"><div className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">{cargos.map((cargo) => <button key={cargo.id} type="button" onClick={() => setSelectedCargoId(cargo.id)} className={cn("min-h-11 min-w-[220px] rounded-lg px-3 py-2 text-left text-sm transition lg:w-full lg:min-w-0", selectedCargoId === cargo.id ? "bg-card font-semibold text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-card hover:text-foreground")}><span className="block truncate">{cargo.nome}</span><span className="text-xs font-normal">{cargo.disciplinas.length} disciplinas</span></button>)}</div></nav><div className="min-w-0 p-4 sm:p-5">{selectedCargo ? <CargoEditor cargo={selectedCargo} editable={editable} allowRemove onChange={updateCargo} onRemove={() => removeCargo(selectedCargo.id)} /> : null}</div></div> : <div className="min-h-[320px] p-4 sm:p-5">{selectedCargo ? <CargoEditor cargo={selectedCargo} editable={editable} allowRemove={false} onChange={updateCargo} onRemove={() => removeCargo(selectedCargo.id)} /> : <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center"><BookOpen className="h-10 w-10 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">Adicione um cargo para começar a cadastrar as disciplinas.</p>{editable ? <Button className="mt-4 min-h-11" onClick={addCargo}><Plus /> Adicionar cargo principal</Button> : null}</div>}</div>}
      </section>

      <EditalImportDialog open={importOpen} onClose={() => setImportOpen(false)} editalId={id} versaoId={versao.id} />
    </div>
  );
}

function CargoEditor({ cargo, editable, allowRemove, onChange, onRemove }: { cargo: EditalCargoCatalogo; editable: boolean; allowRemove: boolean; onChange: (cargo: EditalCargoCatalogo) => void; onRemove: () => void }) {
  const addDisciplina = () => onChange({ ...cargo, disciplinas: [...cargo.disciplinas, { id: newId(), nome: `Nova disciplina ${cargo.disciplinas.length + 1}`, sigla: null, ordem: cargo.disciplinas.length + 1, topicos: [] }] });
  const updateDisciplina = (next: EditalDisciplinaCatalogo) => onChange({ ...cargo, disciplinas: cargo.disciplinas.map((disciplina) => disciplina.id === next.id ? next : disciplina) });
  return <div className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="min-w-0 flex-1 text-sm font-medium">Cargo<input className={`${inputClass} mt-1.5`} disabled={!editable} value={cargo.nome} onChange={(e) => onChange({ ...cargo, nome: e.target.value })} /></label>{editable && allowRemove ? <Button variant="ghost" className="min-h-11 text-destructive" onClick={onRemove}><Trash2 /> Remover cargo</Button> : null}</div><div className="flex items-center justify-between"><div><h3 className="font-semibold">Disciplinas cadastradas</h3><p className="text-xs text-muted-foreground">Adicione cada disciplina e os tópicos previstos no edital.</p></div>{editable ? <Button className="min-h-11" onClick={addDisciplina}><Plus /> Adicionar disciplina</Button> : null}</div><div className="space-y-3">{cargo.disciplinas.map((disciplina) => <DisciplinaEditor key={disciplina.id} disciplina={disciplina} editable={editable} onChange={updateDisciplina} onRemove={() => onChange({ ...cargo, disciplinas: cargo.disciplinas.filter((item) => item.id !== disciplina.id) })} />)}{!cargo.disciplinas.length ? <div className="rounded-lg border border-dashed border-border p-8 text-center"><BookOpen className="mx-auto h-8 w-8 text-primary" /><p className="mt-2 text-sm font-medium">Nenhuma disciplina cadastrada</p><p className="mt-1 text-xs text-muted-foreground">Comece pela primeira disciplina deste concurso.</p>{editable ? <Button variant="outline" className="mt-4 min-h-11" onClick={addDisciplina}><Plus /> Adicionar primeira disciplina</Button> : null}</div> : null}</div></div>;
}

function DisciplinaEditor({ disciplina, editable, onChange, onRemove }: { disciplina: EditalDisciplinaCatalogo; editable: boolean; onChange: (disciplina: EditalDisciplinaCatalogo) => void; onRemove: () => void }) {
  const [open, setOpen] = React.useState(true);
  const addTopico = () => onChange({ ...disciplina, topicos: [...disciplina.topicos, { id: newId(), descricao: "", ordem: disciplina.topicos.length + 1, peso: 1 }] });
  return <article className="rounded-xl border border-border"><div className="flex items-center gap-2 p-3"><button type="button" className="min-h-11 min-w-0 flex-1 text-left" aria-expanded={open} onClick={() => setOpen((value) => !value)}><strong className="block truncate">{disciplina.nome}</strong><span className="text-xs text-muted-foreground">{disciplina.topicos.length} tópicos</span></button>{editable ? <Button variant="ghost" size="icon-lg" aria-label={`Remover ${disciplina.nome}`} onClick={onRemove}><Trash2 className="text-destructive" /></Button> : null}</div>{open ? <div className="space-y-4 border-t border-border p-4"><div className="grid gap-3 sm:grid-cols-[1fr_120px]"><label className="text-xs font-medium">Nome<input className={`${inputClass} mt-1`} disabled={!editable} value={disciplina.nome} onChange={(e) => onChange({ ...disciplina, nome: e.target.value })} /></label><label className="text-xs font-medium">Sigla<input className={`${inputClass} mt-1`} disabled={!editable} value={disciplina.sigla ?? ""} onChange={(e) => onChange({ ...disciplina, sigla: e.target.value || null })} /></label></div><div className="space-y-2">{disciplina.topicos.map((topico, index) => <div key={topico.id} className="grid grid-cols-[32px_minmax(0,1fr)_76px_40px] items-center gap-2"><span className="text-center text-xs text-muted-foreground">{index + 1}</span><input aria-label={`Tópico ${index + 1}`} className={inputClass} disabled={!editable} value={topico.descricao} onChange={(e) => onChange({ ...disciplina, topicos: disciplina.topicos.map((item) => item.id === topico.id ? { ...item, descricao: e.target.value } : item) })} /><input aria-label={`Peso do tópico ${index + 1}`} type="number" min={1} className={inputClass} disabled={!editable} value={topico.peso} onChange={(e) => onChange({ ...disciplina, topicos: disciplina.topicos.map((item) => item.id === topico.id ? { ...item, peso: Number(e.target.value) } : item) })} />{editable ? <Button variant="ghost" size="icon-lg" aria-label={`Remover tópico ${index + 1}`} onClick={() => onChange({ ...disciplina, topicos: disciplina.topicos.filter((item) => item.id !== topico.id) })}><Trash2 className="text-destructive" /></Button> : <span />}</div>)}</div>{editable ? <Button variant="outline" className="min-h-11" onClick={addTopico}><Plus /> Tópico</Button> : null}</div> : null}</article>;
}
