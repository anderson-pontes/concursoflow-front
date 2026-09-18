import * as React from "react";
import { Check, ChevronDown, Pencil, Plus, Save, Settings2, Tags, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { atualizarClassificacaoAdmin, criarClassificacaoAdmin, listarClassificacoesAdmin, salvarClassificacaoVersao } from "@/services/editaisCatalogo";
import type { EditalVersaoCatalogo } from "@/types/editaisCatalogo";

type Props = { editalId: string; version: EditalVersaoCatalogo; editable: boolean };

export function EditalClassificationSection({ editalId, version, editable }: Props) {
  const qc = useQueryClient();
  const spheres = useQuery({ queryKey: ["admin-catalogo-classificacoes", "esfera"], queryFn: () => listarClassificacoesAdmin("esfera") });
  const areas = useQuery({ queryKey: ["admin-catalogo-classificacoes", "area"], queryFn: () => listarClassificacoesAdmin("area") });
  const [sphere, setSphere] = React.useState(version.classificacao.esfera?.chave ?? "none");
  const [selectedAreas, setSelectedAreas] = React.useState(version.classificacao.areas.map((item) => item.chave));
  const [year, setYear] = React.useState(version.classificacao.ano_edital?.toString() ?? "");
  const [source, setSource] = React.useState(version.classificacao.fonte_tipo ?? "manual_validado");
  const [sourceRef, setSourceRef] = React.useState(version.classificacao.fonte_ref ?? "");
  const [managerOpen, setManagerOpen] = React.useState(false);

  React.useEffect(() => {
    setSphere(version.classificacao.esfera?.chave ?? "none");
    setSelectedAreas(version.classificacao.areas.map((item) => item.chave));
    setYear(version.classificacao.ano_edital?.toString() ?? "");
    setSource(version.classificacao.fonte_tipo ?? "manual_validado");
    setSourceRef(version.classificacao.fonte_ref ?? "");
  }, [version]);

  const save = useMutation({
    mutationFn: () => salvarClassificacaoVersao(editalId, version.id, {
      esfera_chave: sphere === "none" ? null : sphere,
      area_chaves: selectedAreas,
      ano_edital: year ? Number(year) : null,
      fonte_tipo: sphere !== "none" || selectedAreas.length || year ? source : null,
      fonte_ref: sourceRef.trim() || null,
      expected_revision: version.classificacao.revision,
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-edital", editalId] });
      void qc.invalidateQueries({ queryKey: ["catalogo-editais", "public"] });
      toast.success("Classificação do catálogo salva.");
    },
    onError: () => toast.error("Não foi possível salvar. Atualize a página e tente novamente."),
  });
  const hasClassification = sphere !== "none" || selectedAreas.length > 0 || Boolean(year);

  return <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="catalog-classification-title">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 id="catalog-classification-title" className="flex items-center gap-2 font-semibold"><Tags className="h-4 w-4 text-primary" /> 3. Classificação para o catálogo</h2><p className="mt-1 text-xs text-muted-foreground">Metadados explícitos usados nos filtros. Nenhum valor é inferido do edital.</p></div><div className="flex items-center gap-2"><Button type="button" variant="outline" className="min-h-10 gap-2" onClick={() => setManagerOpen(true)}><Settings2 className="h-4 w-4" /> Gerenciar opções</Button>{!editable ? <Badge variant="secondary">Somente leitura</Badge> : null}</div></div>
    {!hasClassification ? <Alert className="mb-4"><AlertTitle>Descoberta limitada</AlertTitle><AlertDescription>Sem classificação, o edital continua visível na busca geral, mas não aparece nos filtros de esfera, área ou ano.</AlertDescription></Alert> : null}
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5"><Label htmlFor="catalog-sphere">Esfera</Label><Select value={sphere} onValueChange={setSphere} disabled={!editable || spheres.isLoading}><SelectTrigger id="catalog-sphere" className="min-h-11"><SelectValue placeholder="Não informada" /></SelectTrigger><SelectContent><SelectItem value="none">Não informada</SelectItem>{spheres.data?.map((item) => <SelectItem key={item.id} value={item.chave} disabled={!item.ativo}>{item.nome}{!item.ativo ? " (inativa)" : ""}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="catalog-year">Ano do edital</Label><Input id="catalog-year" type="number" min={1900} max={new Date().getFullYear() + 2} value={year} disabled={!editable} onChange={(event) => setYear(event.target.value)} placeholder="Ex.: 2026" /></div>
      <div className="space-y-1.5"><Label>Áreas</Label><Popover><PopoverTrigger asChild><Button type="button" variant="outline" disabled={!editable || areas.isLoading} className="min-h-11 w-full justify-between font-normal"><span className="truncate">{selectedAreas.length ? `${selectedAreas.length} selecionada${selectedAreas.length === 1 ? "" : "s"}` : "Nenhuma área"}</span><ChevronDown className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))]">{areas.data?.length ? <div className="max-h-60 space-y-1 overflow-y-auto">{areas.data.map((item) => { const checked = selectedAreas.includes(item.chave); return <Label key={item.id} className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-muted"><Checkbox checked={checked} disabled={!item.ativo && !checked} onCheckedChange={(next) => setSelectedAreas((current) => next ? [...current, item.chave].sort() : current.filter((key) => key !== item.chave))} /><span className="flex-1">{item.nome}</span>{checked ? <Check className="h-4 w-4 text-primary" /> : null}</Label>; })}</div> : <p className="p-3 text-sm text-muted-foreground">Nenhuma área foi cadastrada pela administração.</p>}</PopoverContent></Popover></div>
      <div className="space-y-1.5"><Label htmlFor="catalog-source">Fonte da classificação</Label><Select value={source} onValueChange={setSource} disabled={!editable || !hasClassification}><SelectTrigger id="catalog-source" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual_validado">Validação administrativa</SelectItem><SelectItem value="edital">Edital oficial</SelectItem><SelectItem value="ato_oficial">Ato oficial</SelectItem><SelectItem value="importacao_validada">Importação validada</SelectItem></SelectContent></Select></div>
      <div className="space-y-1.5 md:col-span-2"><Label htmlFor="catalog-source-ref">Referência da fonte {hasClassification ? <span aria-hidden="true" className="text-destructive">*</span> : null}</Label><Input id="catalog-source-ref" maxLength={500} required={hasClassification} aria-describedby={hasClassification && !sourceRef.trim() ? "catalog-source-ref-help" : undefined} aria-invalid={hasClassification && !sourceRef.trim()} value={sourceRef} disabled={!editable || !hasClassification} onChange={(event) => setSourceRef(event.target.value)} placeholder="Ex.: Edital oficial nº 01/2026" />{hasClassification && !sourceRef.trim() ? <p id="catalog-source-ref-help" className="text-xs text-destructive">Informe a referência usada para validar a classificação.</p> : null}</div>
    </div>
    {editable ? <div className="mt-4 flex justify-end"><Button type="button" className="min-h-11 gap-2" disabled={save.isPending || (hasClassification && !sourceRef.trim()) || (Boolean(year) && (Number(year) < 1900 || Number(year) > new Date().getFullYear() + 2))} onClick={() => save.mutate()}><Save className="h-4 w-4" />{save.isPending ? "Salvando…" : "Salvar classificação"}</Button></div> : <p className="mt-4 text-xs text-muted-foreground">Para alterar estes metadados, crie uma nova versão em rascunho.</p>}
    <TaxonomyManager open={managerOpen} onOpenChange={setManagerOpen} />
  </section>;
}

function TaxonomyManager({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [key, setKey] = React.useState("");
  const [editing, setEditing] = React.useState<{ id: string; name: string; order: number } | null>(null);
  const areas = useQuery({ queryKey: ["admin-catalogo-classificacoes", "area"], queryFn: () => listarClassificacoesAdmin("area"), enabled: open });
  const spheres = useQuery({ queryKey: ["admin-catalogo-classificacoes", "esfera"], queryFn: () => listarClassificacoesAdmin("esfera"), enabled: open });
  const create = useMutation({
    mutationFn: () => criarClassificacaoAdmin({ dimensao: "area", chave: key, nome: name }),
    onSuccess: () => { setName(""); setKey(""); void qc.invalidateQueries({ queryKey: ["admin-catalogo-classificacoes"] }); toast.success("Área cadastrada."); },
    onError: () => toast.error("Revise a chave e o nome da área."),
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { nome?: string; ordem?: number; ativo?: boolean } }) => atualizarClassificacaoAdmin(id, input),
    onSuccess: () => { setEditing(null); void qc.invalidateQueries({ queryKey: ["admin-catalogo-classificacoes"] }); },
    onError: () => toast.error("Não foi possível atualizar a opção."),
  });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Opções de classificação</DialogTitle><DialogDescription>Cadastre áreas e controle quais opções podem ser atribuídas a novos rascunhos. As chaves são imutáveis.</DialogDescription></DialogHeader>
    <section className="rounded-xl border border-border p-4"><h3 className="font-semibold">Nova área</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><Label htmlFor="new-area-name">Nome</Label><Input id="new-area-name" value={name} maxLength={100} onChange={(event) => { setName(event.target.value); if (!key) setKey(slug(event.target.value)); }} placeholder="Tecnologia da Informação" /></div><div><Label htmlFor="new-area-key">Chave estável</Label><Input id="new-area-key" value={key} maxLength={64} onChange={(event) => setKey(slug(event.target.value))} placeholder="tecnologia-da-informacao" /></div></div><Button type="button" className="mt-3 min-h-10 gap-2" disabled={!name.trim() || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(key) || create.isPending} onClick={() => create.mutate()}><Plus className="h-4 w-4" /> Cadastrar área</Button></section>
    <TaxonomyList title="Esferas" items={spheres.data ?? []} pending={update.isPending} editing={editing} onEdit={setEditing} onCancelEdit={() => setEditing(null)} onSaveEdit={(id, nome, ordem) => update.mutate({ id, input: { nome, ordem } })} onToggle={(id, ativo) => update.mutate({ id, input: { ativo } })} />
    <TaxonomyList title="Áreas" items={areas.data ?? []} pending={update.isPending} editing={editing} onEdit={setEditing} onCancelEdit={() => setEditing(null)} onSaveEdit={(id, nome, ordem) => update.mutate({ id, input: { nome, ordem } })} onToggle={(id, ativo) => update.mutate({ id, input: { ativo } })} />
  </DialogContent></Dialog>;
}

type TaxonomyItem = { id: string; chave: string; nome: string; ordem: number; ativo: boolean };

function TaxonomyList({ title, items, pending, editing, onEdit, onCancelEdit, onSaveEdit, onToggle }: { title: string; items: TaxonomyItem[]; pending: boolean; editing: { id: string; name: string; order: number } | null; onEdit: (value: { id: string; name: string; order: number }) => void; onCancelEdit: () => void; onSaveEdit: (id: string, nome: string, ordem: number) => void; onToggle: (id: string, ativo: boolean) => void }) {
  return <section><h3 className="mb-2 font-semibold">{title}</h3>{items.length ? <div className="divide-y divide-border rounded-xl border border-border">{items.map((item) => editing?.id === item.id ? <div key={item.id} className="grid gap-3 p-3 sm:grid-cols-[1fr_7rem_auto]"><div><Label htmlFor={`taxonomy-name-${item.id}`}>Rótulo</Label><Input id={`taxonomy-name-${item.id}`} value={editing.name} maxLength={title === "Esferas" ? 80 : 100} onChange={(event) => onEdit({ ...editing, name: event.target.value })} /></div><div><Label htmlFor={`taxonomy-order-${item.id}`}>Ordem</Label><Input id={`taxonomy-order-${item.id}`} type="number" min={0} max={32767} value={editing.order} onChange={(event) => onEdit({ ...editing, order: Number(event.target.value) })} /></div><div className="flex items-end gap-1"><Button type="button" size="icon" aria-label={`Salvar ${item.nome}`} disabled={pending || !editing.name.trim()} onClick={() => onSaveEdit(item.id, editing.name.trim(), editing.order)}><Save className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label="Cancelar edição" onClick={onCancelEdit}><X className="h-4 w-4" /></Button></div></div> : <div key={item.id} className="flex min-h-12 items-center gap-2 px-3"><div className="min-w-0 flex-1"><strong className="block text-sm">{item.nome}</strong><code className="text-xs text-muted-foreground">{item.chave}</code></div><Button type="button" size="icon" variant="ghost" aria-label={`Editar ${item.nome}`} disabled={pending} onClick={() => onEdit({ id: item.id, name: item.nome, order: item.ordem })}><Pencil className="h-4 w-4" /></Button><Label htmlFor={`taxonomy-${item.id}`} className="text-xs text-muted-foreground">{item.ativo ? "Ativa" : "Inativa"}</Label><Switch id={`taxonomy-${item.id}`} checked={item.ativo} disabled={pending} onCheckedChange={(ativo) => onToggle(item.id, ativo)} /></div>)}</div> : <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhuma opção cadastrada.</p>}</section>;
}

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}
