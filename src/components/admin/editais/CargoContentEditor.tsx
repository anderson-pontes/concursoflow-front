import React from "react";
import { ArrowDown, ArrowUp, BookOpen, Check, ChevronDown, ChevronsDownUp, ChevronsUpDown, ListPlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { parseBulkTopics, reorderCatalogItems } from "@/lib/adminEditalEditor";
import { normalizeDisciplineName } from "@/lib/catalogDisciplineReuse";
import { DisciplineReuseDialog } from "@/components/admin/editais/DisciplineReuseDialog";
import type { EditalCargoCatalogo, EditalDisciplinaCatalogo } from "@/types/editaisCatalogo";

const newId = () => `novo-${Date.now()}-${Math.random().toString(36).slice(2)}`;

type ConfirmRequest = ReturnType<typeof useConfirmDialog>["requestConfirmation"];

export function CargoContentEditor({ cargo, sourceCargos, disciplineSuggestions, editable, allowRemove, onChange, onRemove, requestConfirmation }: { cargo: EditalCargoCatalogo; sourceCargos: EditalCargoCatalogo[]; disciplineSuggestions: string[]; editable: boolean; allowRemove: boolean; onChange: (cargo: EditalCargoCatalogo) => void; onRemove: () => void; requestConfirmation: ConfirmRequest }) {
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const visibleIds = new Set(cargo.disciplinas.filter((disciplina) => normalizeSearch(`${disciplina.nome} ${disciplina.sigla ?? ""} ${disciplina.topicos.map((item) => item.descricao).join(" ")}`).includes(normalizeSearch(search.trim()))).map((item) => item.id));
  const toggleDiscipline = (id: string, open: boolean) => setCollapsed((current) => {
    const next = new Set(current);
    if (open) next.delete(id); else next.add(id);
    return next;
  });
  const updateDisciplina = (next: EditalDisciplinaCatalogo) => onChange({ ...cargo, disciplinas: cargo.disciplinas.map((item) => item.id === next.id ? next : item) });
  const addDisciplina = () => {
    const normalized = name.trim();
    if (!normalized) return;
    if (cargo.disciplinas.some((item) => normalizeDisciplineName(item.nome) === normalizeDisciplineName(normalized))) { toast.error("Esta disciplina já está neste cargo."); return; }
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
    <div className="rounded-xl border border-border bg-muted/30 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="min-w-0 flex-1 text-sm font-medium">Cargo<Input className="mt-1.5 bg-background" disabled={!editable} value={cargo.nome} onChange={(event) => onChange({ ...cargo, nome: event.target.value })} /></label>{editable && allowRemove ? <Button variant="ghost" className="min-h-11 self-start text-destructive sm:self-auto" onClick={onRemove}><Trash2 /> Remover cargo</Button> : null}</div><div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{cargo.disciplinas.length} {cargo.disciplinas.length === 1 ? "disciplina" : "disciplinas"}</Badge><Badge variant="outline">{cargo.disciplinas.reduce((total, item) => total + item.topicos.length, 0)} tópicos</Badge></div></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">Disciplinas</h3><p className="mt-1 text-sm text-muted-foreground">Organize os tópicos de cada disciplina. As alterações são salvas pelo botão principal.</p></div>{editable && cargo.disciplinas.length ? <Button className="min-h-11 shrink-0 self-start" onClick={() => setAdding(true)}><Plus /> Adicionar disciplina</Button> : null}</div>
    <DisciplineReuseDialog cargo={cargo} sourceCargos={sourceCargos} editable={editable} onChange={(next) => { onChange(next); setSearch(""); }} />
    {cargo.disciplinas.length ? <div className="space-y-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative min-w-0 flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar disciplinas ou tópicos" className="min-h-11 pl-9 pr-12" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar disciplina ou tópico…" />{search ? <Button type="button" variant="ghost" size="icon-lg" className="absolute right-0 top-0" aria-label="Limpar busca de disciplinas" onClick={() => setSearch("")}><X /></Button> : null}</div><div className="grid grid-cols-2 gap-2 sm:flex"><Button variant="outline" className="h-auto min-h-11 min-w-0 gap-2 whitespace-normal sm:flex-none" onClick={() => setCollapsed(new Set())}><ChevronsUpDown /> Expandir todas</Button><Button variant="outline" className="h-auto min-h-11 min-w-0 gap-2 whitespace-normal sm:flex-none" onClick={() => setCollapsed(new Set(cargo.disciplinas.map((item) => item.id)))}><ChevronsDownUp /> Recolher todas</Button></div></div><p role="status" className="text-xs text-muted-foreground">{search.trim() ? `${visibleIds.size} de ${cargo.disciplinas.length} disciplinas encontradas` : "Use a busca para localizar disciplinas ou o texto de um tópico."}</p></div> : null}
    {adding ? <fieldset disabled={!editable} className="min-w-0 rounded-xl border border-primary/30 bg-primary-muted/30 p-3"><label className="text-xs font-medium">Buscar ou criar disciplina<div className="mt-1.5 flex flex-col gap-2 sm:flex-row"><Input autoFocus role="combobox" aria-expanded={matchingSuggestions.length > 0} aria-controls="discipline-suggestions" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addDisciplina(); } }} placeholder="Ex.: Direito Administrativo" /><Button disabled={!name.trim()} onClick={addDisciplina}><Check /> Adicionar</Button><Button variant="ghost" onClick={() => { setAdding(false); setName(""); }}><X /> Cancelar</Button></div></label><p className="mt-2 text-xs text-muted-foreground">Selecione um nome já usado neste edital ou crie uma nova disciplina sem sair do editor.</p>{matchingSuggestions.length ? <div id="discipline-suggestions" role="listbox" aria-label="Disciplinas existentes" className="mt-2 flex flex-wrap gap-1">{matchingSuggestions.map((suggestion) => <Button key={suggestion} type="button" variant="outline" size="sm" role="option" onClick={() => setName(suggestion)}>{suggestion}</Button>)}</div> : null}{normalizedSearch && currentNames.has(normalizedSearch) ? <Badge className="mt-2" variant="outline">Já cadastrada neste cargo</Badge> : null}</fieldset> : null}
    <div className="space-y-3">{cargo.disciplinas.map((disciplina, index) => <div key={disciplina.id} hidden={!visibleIds.has(disciplina.id)}><DisciplinaEditor disciplina={disciplina} editable={editable} open={!collapsed.has(disciplina.id)} setOpen={(open) => toggleDiscipline(disciplina.id, open)} onChange={updateDisciplina} onRemove={() => removeDisciplina(disciplina)} onMoveUp={() => onChange({ ...cargo, disciplinas: reorderCatalogItems(cargo.disciplinas, index, index - 1) })} onMoveDown={() => onChange({ ...cargo, disciplinas: reorderCatalogItems(cargo.disciplinas, index, index + 1) })} first={index === 0} last={index === cargo.disciplinas.length - 1} requestConfirmation={requestConfirmation} /></div>)}
      {cargo.disciplinas.length && !visibleIds.size ? <div className="rounded-xl border border-dashed border-border p-6 text-center"><Search className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-2 text-sm font-medium">Nenhuma disciplina ou tópico encontrado.</p><Button variant="outline" className="mt-3 min-h-11" onClick={() => setSearch("")}>Limpar busca</Button></div> : null}
      {!cargo.disciplinas.length ? <div className="rounded-lg border border-dashed border-border p-8 text-center"><BookOpen className="mx-auto h-8 w-8 text-primary" /><p className="mt-2 text-sm font-medium">Nenhuma disciplina adicionada</p><p className="mt-1 text-xs text-muted-foreground">Adicione as disciplinas que fazem parte do conteúdo programático deste edital.</p>{editable ? <Button variant="outline" className="mt-4 min-h-11" onClick={() => setAdding(true)}><Plus /> Adicionar disciplina</Button> : null}</div> : null}
    </div>
  </div>;
}

function DisciplinaEditor({ disciplina, editable, open, setOpen, onChange, onRemove, onMoveUp, onMoveDown, first, last, requestConfirmation }: { disciplina: EditalDisciplinaCatalogo; editable: boolean; open: boolean; setOpen: (open: boolean) => void; onChange: (disciplina: EditalDisciplinaCatalogo) => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void; first: boolean; last: boolean; requestConfirmation: ConfirmRequest }) {
  const contentId = React.useId();
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
    <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"><Button type="button" variant="ghost" className="h-auto min-h-11 min-w-0 flex-1 justify-start gap-3 whitespace-normal px-2 py-2 text-left" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(!open)}><ChevronDown className={cn("h-4 w-4 shrink-0 transition", !open && "-rotate-90")} /><span className="min-w-0"><strong className="block break-words text-sm">{disciplina.nome}</strong><span className="mt-1 block text-xs font-normal text-muted-foreground">{disciplina.topicos.length} tópicos{!disciplina.topicos.length ? " · Adicione o primeiro conteúdo" : ""}</span></span></Button>{editable ? <div className="flex shrink-0 items-center justify-end gap-1 border-t border-border pt-2 sm:border-0 sm:pt-0"><Button variant="ghost" size="icon-lg" disabled={first} title="Mover disciplina para cima" aria-label={`Mover ${disciplina.nome} para cima`} onClick={onMoveUp}><ArrowUp /></Button><Button variant="ghost" size="icon-lg" disabled={last} title="Mover disciplina para baixo" aria-label={`Mover ${disciplina.nome} para baixo`} onClick={onMoveDown}><ArrowDown /></Button><Button variant="ghost" size="icon-lg" title="Editar disciplina" aria-label={`Editar nome de ${disciplina.nome}`} onClick={() => { setOpen(true); setEditingName(true); }}><Pencil /></Button><Button variant="ghost" size="icon-lg" title="Remover disciplina" aria-label={`Remover ${disciplina.nome}`} onClick={onRemove}><Trash2 className="text-destructive" /></Button></div> : null}</div>
    <div id={contentId} hidden={!open} className="space-y-4 border-t border-border p-3 sm:p-4">
      {editingName ? <fieldset disabled={!editable} className="grid min-w-0 gap-3 sm:grid-cols-[1fr_120px_auto]"><label className="text-xs font-medium">Nome<Input autoFocus className="mt-1" value={disciplina.nome} onChange={(event) => onChange({ ...disciplina, nome: event.target.value })} /></label><label className="text-xs font-medium">Sigla<Input className="mt-1" value={disciplina.sigla ?? ""} onChange={(event) => onChange({ ...disciplina, sigla: event.target.value || null })} /></label><Button variant="outline" className="self-end" onClick={() => setEditingName(false)}><Check /> Concluir</Button></fieldset> : null}
      {disciplina.topicos.length ? <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold">Conteúdo programático</h4><span className="text-xs text-muted-foreground">Peso: importância do tópico no planejamento</span></div>{disciplina.topicos.map((topico, index) => <div key={topico.id} className="rounded-lg border border-border bg-muted/20 p-3"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-semibold text-muted-foreground">Tópico {index + 1}</span>{editable ? <div className="flex gap-1"><Button variant="ghost" size="icon-lg" disabled={index === 0} title="Mover tópico para cima" aria-label={`Mover tópico ${index + 1} para cima`} onClick={() => onChange({ ...disciplina, topicos: reorderCatalogItems(disciplina.topicos, index, index - 1) })}><ArrowUp /></Button><Button variant="ghost" size="icon-lg" disabled={index === disciplina.topicos.length - 1} title="Mover tópico para baixo" aria-label={`Mover tópico ${index + 1} para baixo`} onClick={() => onChange({ ...disciplina, topicos: reorderCatalogItems(disciplina.topicos, index, index + 1) })}><ArrowDown /></Button><Button variant="ghost" size="icon-lg" title="Remover tópico" aria-label={`Remover tópico ${index + 1}`} onClick={() => removeTopic(index)}><Trash2 className="text-destructive" /></Button></div> : null}</div><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_88px]"><Textarea aria-label={`Tópico ${index + 1}`} rows={2} className="min-h-20 resize-y bg-background" disabled={!editable} value={topico.descricao} onChange={(event) => onChange({ ...disciplina, topicos: disciplina.topicos.map((item) => item.id === topico.id ? { ...item, descricao: event.target.value } : item) })} /><label className="flex items-center gap-3 text-xs font-medium sm:block">Peso<Input className="w-24 bg-background sm:mt-1.5 sm:w-full" aria-label={`Peso do tópico ${index + 1}`} type="number" min={1} disabled={!editable} value={topico.peso} onChange={(event) => onChange({ ...disciplina, topicos: disciplina.topicos.map((item) => item.id === topico.id ? { ...item, peso: Math.max(1, Number(event.target.value) || 1) } : item) })} /></label></div></div>)}</div> : <div className="rounded-lg border border-dashed border-border p-5 text-center"><p className="text-sm font-medium">Nenhum conteúdo cadastrado nesta disciplina.</p><p className="mt-1 text-xs text-muted-foreground">Digite o primeiro tópico abaixo ou adicione vários em lote.</p></div>}
      {editable ? <><label className="block text-xs font-medium">Adicionar tópico rapidamente<div className="mt-1.5 flex flex-col gap-2 sm:flex-row"><Input value={quickTopic} onChange={(event) => setQuickTopic(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addQuickTopic(); } }} placeholder="Digite o conteúdo e pressione Enter" /><Button variant="outline" disabled={!quickTopic.trim()} onClick={addQuickTopic}><Plus /> Adicionar</Button></div><span className="mt-1 block font-normal text-muted-foreground">Após adicionar, o campo permanece pronto para o próximo tópico.</span></label><Button variant="ghost" className="min-h-11" aria-expanded={bulkOpen} onClick={() => { setBulkOpen((value) => !value); setBulkDraft(null); }}><ListPlus /> Adicionar conteúdo em lote</Button>
        {bulkOpen ? <div className="space-y-3 rounded-xl border border-primary/20 bg-primary-muted/30 p-4"><label className="block text-xs font-medium">Cole um tópico por linha<Textarea autoFocus rows={6} className="mt-1.5" value={bulkText} onChange={(event) => { setBulkText(event.target.value); setBulkDraft(null); }} placeholder={"1 Redes de computadores\n1.1 Modelo OSI\n1.2 TCP/IP"} /></label>{bulkDraft ? <div className="space-y-2"><p className="text-sm font-semibold">{bulkDraft.length} tópicos identificados</p>{bulkDraft.map((item, index) => <div key={index} className="flex gap-2"><Input aria-label={`Conteúdo em lote ${index + 1}`} value={item} onChange={(event) => setBulkDraft((current) => current?.map((value, itemIndex) => itemIndex === index ? event.target.value : value) ?? null)} /><Button variant="ghost" size="icon-lg" aria-label={`Excluir conteúdo em lote ${index + 1}`} onClick={() => setBulkDraft((current) => current?.filter((_, itemIndex) => itemIndex !== index) ?? null)}><Trash2 /></Button></div>)}</div> : null}<div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={() => { setBulkOpen(false); setBulkText(""); setBulkDraft(null); }}>Cancelar</Button>{bulkDraft ? <Button disabled={!bulkDraft.some((item) => item.trim())} onClick={addBulkTopics}>Confirmar {bulkDraft.filter((item) => item.trim()).length} tópicos</Button> : <Button disabled={!bulkText.trim()} onClick={prepareBulk}>Revisar tópicos</Button>}</div></div> : null}</> : null}
    </div>
  </article>;
}
