import React from "react";
import { Archive, BookOpenCheck, ExternalLink, Eye, FilePlus2, Pencil, Search, SlidersHorizontal } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { EditalCatalogoFormDialog } from "@/components/admin/editais/EditalCatalogoFormDialog";
import { CatalogDetailsDialog } from "@/components/editais/CatalogDetailsDialog";
import { CatalogLogo } from "@/components/editais/CatalogLogo";
import { CatalogPagination } from "@/components/editais/CatalogPagination";
import { CatalogViewToggle, type CatalogViewMode } from "@/components/editais/CatalogViewToggle";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { arquivarEdital, paginarEditaisAdmin } from "@/services/editaisCatalogo";
import type { EditalStatus } from "@/types/editaisCatalogo";

const statusClass: Record<EditalStatus, string> = {
  rascunho: "bg-warning/15 text-warning",
  publicado: "bg-success/15 text-success",
  arquivado: "bg-muted text-muted-foreground",
};

export function EditaisCatalogo() {
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<CatalogViewMode>("table");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = React.useState<CardEdital | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  React.useEffect(() => setPage(1), [deferredSearch, status]);
  const query = useQuery({
    queryKey: ["admin-editais", deferredSearch, status, page],
    queryFn: () => paginarEditaisAdmin({ search: deferredSearch, status, page, pageSize: 10 }),
  });
  const archiveMutation = useMutation({
    mutationFn: arquivarEdital,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-editais"] }); toast.success("Edital arquivado."); },
  });
  React.useEffect(() => {
    if (query.data && page > Math.max(1, query.data.total_pages)) setPage(Math.max(1, query.data.total_pages));
  }, [page, query.data]);
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Administração do conteúdo</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Catálogo de editais</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Organize concursos, documentos, cargos e disciplinas antes de disponibilizá-los aos alunos.</p></div>
        <Button className="min-h-11 gap-2 px-4" onClick={() => setCreateOpen(true)}><FilePlus2 className="h-4 w-4" /> Novo edital</Button>
      </header>

      <section className="rounded-2xl border border-border bg-card shadow-sm" aria-labelledby="catalogo-admin-title">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1"><span className="sr-only">Buscar no catálogo</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="search" className="pl-9" placeholder="Buscar por concurso, órgão, banca ou cargo" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <div className="flex min-w-56 items-center gap-2"><SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><Select value={status || "todos"} onValueChange={(value) => setStatus(value === "todos" ? "" : value)}><SelectTrigger aria-label="Filtrar por situação"><SelectValue placeholder="Todas as situações" /></SelectTrigger><SelectContent><SelectItem value="todos">Todas as situações</SelectItem><SelectItem value="rascunho">Rascunhos</SelectItem><SelectItem value="publicado">Publicados</SelectItem><SelectItem value="arquivado">Arquivados</SelectItem></SelectContent></Select></div>
            <CatalogViewToggle value={viewMode} onValueChange={setViewMode} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span id="catalogo-admin-title">{query.data ? `${query.data.total} edital${query.data.total === 1 ? "" : "is"} no resultado` : "Consultando catálogo…"}</span>{search || status ? <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setSearch(""); setStatus(""); }}>Limpar filtros</button> : null}</div>
        </div>

        {query.isError ? <Alert variant="destructive" className="m-4 w-auto"><AlertDescription>Não foi possível carregar o catálogo. <button className="font-semibold underline" onClick={() => void query.refetch()}>Tentar novamente</button></AlertDescription></Alert> : null}
        {query.isLoading ? <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Carregando editais"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div> : null}
        {!query.isLoading && !items.length ? <div className="m-4 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center"><BookOpenCheck className="h-10 w-10 text-primary" /><h2 className="mt-3 font-semibold">Nenhum edital encontrado</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">{search || status ? "Tente remover filtros ou pesquisar outro termo." : "Cadastre o primeiro edital para começar seu catálogo."}</p></div> : null}

        {items.length ? <>{viewMode === "table" ? <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead><tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground"><th className="p-4">Edital</th><th className="p-4">Banca</th><th className="p-4">Conteúdo</th><th className="p-4">Situação</th><th className="p-4">Atualização</th><th className="p-4 text-right">Ações</th></tr></thead><tbody>{items.map((edital) => <EditalRow key={edital.id} edital={edital} onDetails={() => setDetailsId(edital.id)} onEdit={() => navigate(`/admin/editais/${edital.id}`)} onArchive={() => setArchiveTarget(edital)} archivePending={archiveMutation.isPending} />)}</tbody></table></div> : <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((edital) => <EditalCard key={edital.id} edital={edital} onDetails={() => setDetailsId(edital.id)} onEdit={() => navigate(`/admin/editais/${edital.id}`)} onArchive={() => setArchiveTarget(edital)} archivePending={archiveMutation.isPending} />)}</div>}<div className="border-t border-border p-4 sm:p-5"><CatalogPagination page={query.data?.page ?? 1} totalPages={query.data?.total_pages ?? 0} total={query.data?.total ?? 0} onPageChange={setPage} /></div></> : null}
      </section>

      <EditalCatalogoFormDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(edital) => { setCreateOpen(false); void qc.invalidateQueries({ queryKey: ["admin-editais"] }); navigate(`/admin/editais/${edital.id}`); }} />
      <CatalogDetailsDialog editalId={detailsId} scope="admin" open={Boolean(detailsId)} onOpenChange={(open) => { if (!open) setDetailsId(null); }} />
      <AlertDialog open={Boolean(archiveTarget)} onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Arquivar edital?</AlertDialogTitle><AlertDialogDescription>“{archiveTarget?.nome}” deixará de aparecer no catálogo dos alunos. O histórico continuará preservado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={archiveMutation.isPending} onClick={() => { if (archiveTarget) archiveMutation.mutate(archiveTarget.id, { onSuccess: () => setArchiveTarget(null) }); }}>Arquivar edital</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

type CardEdital = Awaited<ReturnType<typeof paginarEditaisAdmin>>["items"][number];

function EditalRow({ edital, onDetails, onEdit, onArchive, archivePending }: { edital: CardEdital; onDetails: () => void; onEdit: () => void; onArchive: () => void; archivePending: boolean }) {
  const disciplinas = edital.disciplinas_total ?? edital.versao_atual?.cargos.reduce((total, cargo) => total + cargo.disciplinas.length, 0) ?? 0;
  const cargos = edital.cargos_total ?? edital.versao_atual?.cargos.length ?? 0;
  return <tr className="border-b border-border/70 last:border-0 hover:bg-muted/20"><td className="p-4"><div className="flex items-center gap-3"><CatalogLogo src={edital.logo_url} orgao={edital.orgao} size="sm" /><div className="min-w-0"><strong className="block max-w-sm truncate">{edital.nome}</strong><span className="text-xs text-muted-foreground">{edital.orgao}</span></div></div></td><td className="p-4">{edital.banca ?? "—"}</td><td className="p-4"><strong className="block text-sm">{disciplinas} disciplinas</strong><span className="text-xs text-muted-foreground">{cargos} cargo{cargos === 1 ? "" : "s"} · versão {edital.versao_atual?.numero ?? "—"}</span></td><td className="p-4"><Badge variant="outline" className={cn("capitalize", statusClass[edital.status])}>{edital.status}</Badge></td><td className="p-4 text-xs text-muted-foreground">{edital.atualizado_em ? new Date(edital.atualizado_em).toLocaleDateString("pt-BR") : "—"}</td><td className="p-4"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-lg" title="Ver detalhes" aria-label={`Ver detalhes de ${edital.nome}`} onClick={onDetails}><Eye /></Button><Button variant="ghost" size="icon-lg" title="Editar" aria-label={`Editar ${edital.nome}`} onClick={onEdit}><Pencil /></Button>{edital.url_oficial ? <Button asChild variant="ghost" size="icon-lg" title="Abrir edital"><a href={edital.url_oficial} target="_blank" rel="noreferrer" aria-label={`Abrir edital de ${edital.nome}`}><ExternalLink /></a></Button> : null}{edital.status !== "arquivado" ? <Button variant="ghost" size="icon-lg" title="Arquivar" aria-label={`Arquivar ${edital.nome}`} disabled={archivePending} onClick={onArchive}><Archive /></Button> : null}</div></td></tr>;
}

function EditalCard({ edital, onDetails, onEdit, onArchive, archivePending }: { edital: CardEdital; onDetails: () => void; onEdit: () => void; onArchive: () => void; archivePending: boolean }) {
  const disciplinas = edital.disciplinas_total ?? edital.versao_atual?.cargos.reduce((total, cargo) => total + cargo.disciplinas.length, 0) ?? 0;
  const cargos = edital.cargos_total ?? edital.versao_atual?.cargos.length ?? 0;
  return <Card className="flex min-h-64 flex-col gap-0 p-4 transition-shadow hover:shadow-md"><div className="flex items-start gap-4"><CatalogLogo src={edital.logo_url} orgao={edital.orgao} size="lg" /><div className="min-w-0 flex-1"><strong className="block leading-snug">{edital.nome}</strong><p className="mt-1 text-xs text-muted-foreground">{edital.orgao}{edital.banca ? ` · ${edital.banca}` : ""}</p></div><Badge variant="outline" className={cn("capitalize", statusClass[edital.status])}>{edital.status}</Badge></div><dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/30 p-3 text-xs"><div><dt className="text-muted-foreground">Conteúdo</dt><dd className="mt-0.5 font-semibold text-foreground">{disciplinas} disciplinas</dd></div><div><dt className="text-muted-foreground">Estrutura</dt><dd className="mt-0.5 font-semibold text-foreground">{cargos} cargo{cargos === 1 ? "" : "s"}</dd></div></dl><div className="mt-auto flex flex-wrap items-center justify-end gap-1 border-t border-border pt-3"><Button variant="ghost" className="min-h-10" onClick={onDetails}><Eye className="h-4 w-4" /> Ver detalhes</Button><Button variant="outline" className="min-h-10" onClick={onEdit}><Pencil className="h-4 w-4" /> Gerenciar</Button>{edital.url_oficial ? <Button asChild variant="ghost" size="icon-lg"><a href={edital.url_oficial} target="_blank" rel="noreferrer" aria-label={`Abrir edital de ${edital.nome}`}><ExternalLink /></a></Button> : null}{edital.status !== "arquivado" ? <Button variant="ghost" size="icon-lg" aria-label={`Arquivar ${edital.nome}`} disabled={archivePending} onClick={onArchive}><Archive /></Button> : null}</div></Card>;
}
