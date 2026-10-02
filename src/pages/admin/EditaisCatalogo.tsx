import React from "react";
import { Archive, BookOpenCheck, ExternalLink, Eye, MoreHorizontal, Pencil, Plus, Search, Settings2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { CatalogDetailsDialog } from "@/components/editais/CatalogDetailsDialog";
import { CatalogLogo } from "@/components/editais/CatalogLogo";
import { CatalogPagination } from "@/components/editais/CatalogPagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { arquivarEdital, paginarEditaisAdmin } from "@/services/editaisCatalogo";
import type { EditalCatalogo, EditalStatus } from "@/types/editaisCatalogo";

const statusClass: Record<EditalStatus, string> = { rascunho: "bg-warning/15 text-warning", publicado: "bg-success/15 text-success", arquivado: "bg-muted text-muted-foreground" };
type Filters = { search: string; orgao: string; cargo: string; ano: string; status: string };
const EMPTY_FILTERS: Filters = { search: "", orgao: "", cargo: "", ano: "", status: "" };

function editalMetrics(edital: EditalCatalogo) {
  const versao = edital.versao_atual;
  const cargos = edital.cargos_total ?? versao?.cargos.length ?? 0;
  const disciplinas = edital.disciplinas_total ?? versao?.cargos.reduce((sum, cargo) => sum + cargo.disciplinas.length, 0) ?? 0;
  const topicos = versao?.cargos.reduce((sum, cargo) => sum + cargo.disciplinas.reduce((subtotal, disciplina) => subtotal + (disciplina.topicos_total ?? disciplina.topicos.length), 0), 0) ?? 0;
  return { cargos, disciplinas, topicos, ano: versao?.classificacao.ano_edital ?? versao?.data_prova?.slice(0, 4) ?? "—" };
}

function quantityLabel(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function EditaisCatalogo() {
  const [filters, setFilters] = React.useState(EMPTY_FILTERS);
  const deferred = React.useDeferredValue(filters);
  const [page, setPage] = React.useState(1);
  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = React.useState<EditalCatalogo | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasFilters = Object.values(filters).some(Boolean);
  React.useEffect(() => setPage(1), [deferred]);
  const query = useQuery({ queryKey: ["admin-editais", deferred, page], queryFn: () => paginarEditaisAdmin({ search: deferred.search.trim(), orgao: deferred.orgao.trim(), cargo: deferred.cargo.trim(), ano: deferred.ano ? Number(deferred.ano) : null, status: deferred.status, page, pageSize: 15 }) });
  const archiveMutation = useMutation({ mutationFn: arquivarEdital, onSuccess: () => { setArchiveTarget(null); void queryClient.invalidateQueries({ queryKey: ["admin-editais"] }); toast.success("Edital arquivado."); }, onError: () => toast.error("Não foi possível arquivar o edital.") });
  React.useEffect(() => { if (query.data && page > Math.max(1, query.data.total_pages)) setPage(Math.max(1, query.data.total_pages)); }, [page, query.data]);
  const items = query.data?.items ?? [];

  return <div className="space-y-5 pb-10">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Catálogo de Editais</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Gerencie editais, disciplinas e conteúdos programáticos disponíveis na plataforma.</p></div><Button className="min-h-11 shrink-0 gap-2" onClick={() => navigate("/admin/editais/novo")}><Plus className="h-4 w-4" /> Novo edital</Button></header>
    <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="Filtros do catálogo">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_1fr_1fr_130px_170px_auto]">
        <label className="relative"><span className="sr-only">Buscar por nome</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="search" className="pl-9" placeholder="Buscar por nome do edital" value={filters.search} onChange={(event) => setFilters((state) => ({ ...state, search: event.target.value }))} /></label>
        <Input aria-label="Filtrar por órgão" placeholder="Órgão" value={filters.orgao} onChange={(event) => setFilters((state) => ({ ...state, orgao: event.target.value }))} />
        <Input aria-label="Filtrar por cargo" placeholder="Cargo" value={filters.cargo} onChange={(event) => setFilters((state) => ({ ...state, cargo: event.target.value }))} />
        <Input aria-label="Filtrar por ano" inputMode="numeric" maxLength={4} placeholder="Ano" value={filters.ano} onChange={(event) => setFilters((state) => ({ ...state, ano: event.target.value.replace(/\D/g, "").slice(0, 4) }))} />
        <Select value={filters.status || "todos"} onValueChange={(value) => setFilters((state) => ({ ...state, status: value === "todos" ? "" : value }))}><SelectTrigger aria-label="Filtrar por situação"><SelectValue placeholder="Todas as situações" /></SelectTrigger><SelectContent><SelectItem value="todos">Todas as situações</SelectItem><SelectItem value="rascunho">Rascunhos</SelectItem><SelectItem value="publicado">Publicados</SelectItem><SelectItem value="arquivado">Arquivados</SelectItem></SelectContent></Select>
        <Button variant="ghost" className="min-h-11" disabled={!hasFilters} onClick={() => setFilters(EMPTY_FILTERS)}>Limpar</Button>
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">{query.data ? `${quantityLabel(query.data.total, "edital", "editais")} encontrado${query.data.total === 1 ? "" : "s"}` : "Consultando catálogo…"}</p>
    </section>
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label="Editais cadastrados">
      {query.isError ? <Alert variant="destructive" className="m-4 w-auto"><AlertDescription>Não foi possível carregar o catálogo. <button className="font-semibold underline" onClick={() => void query.refetch()}>Tentar novamente</button></AlertDescription></Alert> : null}
      {query.isLoading ? <div className="space-y-2 p-4" role="status" aria-label="Carregando editais"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : null}
      {!query.isLoading && !items.length ? <div className="m-4 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center"><BookOpenCheck className="h-10 w-10 text-primary" /><h2 className="mt-3 font-semibold">Nenhum edital encontrado</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">{hasFilters ? "Ajuste ou limpe os filtros para ampliar a busca." : "Cadastre o primeiro edital para começar seu catálogo."}</p>{!hasFilters ? <Button className="mt-4" onClick={() => navigate("/admin/editais/novo")}><Plus /> Novo edital</Button> : null}</div> : null}
      {items.length ? <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[1040px] text-left text-sm"><thead><tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-4 py-3">Edital</th><th className="px-4 py-3">Cargo</th><th className="px-4 py-3">Ano</th><th className="px-4 py-3">Conteúdo</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ações</th></tr></thead><tbody>{items.map((edital) => <EditalRow key={edital.id} edital={edital} onDetails={() => setDetailsId(edital.id)} onManage={() => navigate(`/admin/editais/${edital.id}/editar?tab=conteudo`)} onEdit={() => navigate(`/admin/editais/${edital.id}/editar?tab=geral`)} onArchive={() => setArchiveTarget(edital)} />)}</tbody></table></div><div className="divide-y divide-border lg:hidden">{items.map((edital) => <EditalMobileCard key={edital.id} edital={edital} onDetails={() => setDetailsId(edital.id)} onManage={() => navigate(`/admin/editais/${edital.id}/editar?tab=conteudo`)} onEdit={() => navigate(`/admin/editais/${edital.id}/editar?tab=geral`)} onArchive={() => setArchiveTarget(edital)} />)}</div><div className="border-t border-border p-4"><CatalogPagination page={query.data?.page ?? 1} totalPages={query.data?.total_pages ?? 0} total={query.data?.total ?? 0} onPageChange={setPage} /></div></> : null}
    </section>
    <CatalogDetailsDialog editalId={detailsId} scope="admin" open={Boolean(detailsId)} onOpenChange={(open) => { if (!open) setDetailsId(null); }} />
    <AlertDialog open={Boolean(archiveTarget)} onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Arquivar edital?</AlertDialogTitle><AlertDialogDescription>“{archiveTarget?.nome}” deixará de aparecer no catálogo dos alunos. O histórico será preservado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={archiveMutation.isPending} onClick={() => archiveTarget && archiveMutation.mutate(archiveTarget.id)}>{archiveMutation.isPending ? "Arquivando…" : "Arquivar edital"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

type RowProps = { edital: EditalCatalogo; onDetails: () => void; onManage: () => void; onEdit: () => void; onArchive: () => void };
function SecondaryActions({ edital, onDetails, onEdit, onArchive }: Pick<RowProps, "edital" | "onDetails" | "onEdit" | "onArchive">) { return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-lg" aria-label={`Mais ações para ${edital.nome}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={onDetails}><Eye /> Ver detalhes</DropdownMenuItem><DropdownMenuItem onSelect={onEdit}><Pencil /> Editar informações</DropdownMenuItem>{edital.edital_url ? <DropdownMenuItem asChild><a href={edital.edital_url} target="_blank" rel="noreferrer"><ExternalLink /> Abrir edital</a></DropdownMenuItem> : null}{edital.status !== "arquivado" ? <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={onArchive}><Archive /> Arquivar</DropdownMenuItem></> : null}</DropdownMenuContent></DropdownMenu>; }
function EditalRow({ edital, onDetails, onManage, onEdit, onArchive }: RowProps) { const metrics = editalMetrics(edital); const cargos = edital.versao_atual?.cargos.map((cargo) => cargo.nome).join(", ") || "—"; return <tr className="border-b border-border/70 last:border-0 hover:bg-muted/20"><td className="px-4 py-3"><div className="flex items-center gap-3"><CatalogLogo src={edital.logo_url} orgao={edital.orgao} size="sm" /><div className="min-w-0"><strong className="block max-w-xs truncate">{edital.nome}</strong><span className="text-xs text-muted-foreground">{edital.orgao}</span></div></div></td><td className="max-w-56 truncate px-4 py-3" title={cargos}>{cargos}</td><td className="px-4 py-3">{metrics.ano}</td><td className="px-4 py-3"><strong>{quantityLabel(metrics.disciplinas, "disciplina", "disciplinas")}</strong><span className="block text-xs text-muted-foreground">{quantityLabel(metrics.topicos, "tópico", "tópicos")} · {quantityLabel(metrics.cargos, "cargo", "cargos")}</span></td><td className="px-4 py-3"><Badge variant="outline" className={cn("capitalize", statusClass[edital.status])}>{edital.status}</Badge></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Button className="min-h-10 gap-2" onClick={onManage}><Settings2 className="h-4 w-4" /> Gerenciar</Button><Button variant="ghost" className="min-h-10" onClick={onEdit}>Editar</Button><SecondaryActions edital={edital} onDetails={onDetails} onEdit={onEdit} onArchive={onArchive} /></div></td></tr>; }
function EditalMobileCard({ edital, onDetails, onManage, onEdit, onArchive }: RowProps) { const metrics = editalMetrics(edital); return <article className="space-y-3 p-4"><div className="flex items-start gap-3"><CatalogLogo src={edital.logo_url} orgao={edital.orgao} size="sm" /><div className="min-w-0 flex-1"><strong className="block leading-snug">{edital.nome}</strong><p className="mt-0.5 text-xs text-muted-foreground">{edital.orgao} · {metrics.ano}</p></div><Badge variant="outline" className={cn("capitalize", statusClass[edital.status])}>{edital.status}</Badge></div><p className="text-sm">{quantityLabel(metrics.disciplinas, "disciplina", "disciplinas")} · {quantityLabel(metrics.topicos, "tópico", "tópicos")} · {quantityLabel(metrics.cargos, "cargo", "cargos")}</p><div className="flex items-center gap-2"><Button className="min-h-11 flex-1" onClick={onManage}>Gerenciar</Button><Button variant="outline" className="min-h-11" onClick={onEdit}>Editar</Button><SecondaryActions edital={edital} onDetails={onDetails} onEdit={onEdit} onArchive={onArchive} /></div></article>; }
