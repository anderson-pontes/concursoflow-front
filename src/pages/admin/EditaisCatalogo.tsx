import React from "react";
import { Archive, BookOpenCheck, ExternalLink, FilePlus2, Pencil, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { EditalCatalogoFormDialog } from "@/components/admin/editais/EditalCatalogoFormDialog";
import { Button } from "@/components/ui/button";
import { arquivarEdital, listarEditaisAdmin } from "@/services/editaisCatalogo";
import type { EditalStatus } from "@/types/editaisCatalogo";
import { cn } from "@/lib/utils";

const statusClass: Record<EditalStatus, string> = {
  rascunho: "bg-warning/15 text-warning",
  publicado: "bg-success/15 text-success",
  arquivado: "bg-muted text-muted-foreground",
};

export function EditaisCatalogo() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-editais", search, status],
    queryFn: () => listarEditaisAdmin(search, status),
  });
  const archiveMutation = useMutation({
    mutationFn: arquivarEdital,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-editais"] }); toast.success("Edital arquivado."); },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Concursos do catálogo</h1><p className="mt-1 text-sm text-muted-foreground">Cadastre o concurso, anexe o edital e organize as disciplinas que serão disponibilizadas aos alunos.</p></div>
        <Button className="min-h-11 gap-2 px-4" onClick={() => setCreateOpen(true)}><FilePlus2 className="h-4 w-4" /> Novo concurso</Button>
      </header>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1"><span className="sr-only">Buscar concursos</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" className="min-h-11 w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Buscar por concurso, órgão ou banca" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          <select aria-label="Filtrar por situação" className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todas as situações</option><option value="rascunho">Rascunho</option><option value="publicado">Publicado</option><option value="arquivado">Arquivado</option></select>
        </div>

        {query.isError ? <div role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Não foi possível carregar o catálogo. <button className="font-semibold underline" onClick={() => void query.refetch()}>Tentar novamente</button></div> : null}
        {query.isLoading ? <div className="py-16 text-center text-sm text-muted-foreground" role="status">Carregando editais…</div> : null}
        {!query.isLoading && !query.data?.length ? <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center"><BookOpenCheck className="h-10 w-10 text-primary" /><h2 className="mt-3 font-semibold">Nenhum concurso encontrado</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Cadastre o primeiro concurso ou ajuste os filtros da busca.</p></div> : null}

        {query.data?.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="p-3">Concurso</th><th className="p-3">Banca</th><th className="p-3">Versão</th><th className="p-3">Disciplinas</th><th className="p-3">Situação</th><th className="p-3 text-right">Ações</th></tr></thead><tbody>{query.data.map((edital) => <tr key={edital.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30"><td className="p-3"><strong className="block">{edital.nome}</strong><span className="text-xs text-muted-foreground">{edital.orgao}</span></td><td className="p-3">{edital.banca ?? "—"}</td><td className="p-3">{edital.versao_atual?.numero ?? "—"}</td><td className="p-3 text-muted-foreground">{edital.disciplinas_total ?? edital.versao_atual?.cargos.reduce((total, cargo) => total + cargo.disciplinas.length, 0) ?? 0} disciplinas{(edital.cargos_total ?? edital.versao_atual?.cargos.length ?? 0) > 1 ? ` em ${edital.cargos_total ?? edital.versao_atual?.cargos.length} cargos` : ""}</td><td className="p-3"><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", statusClass[edital.status])}>{edital.status}</span></td><td className="p-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-lg" title="Editar" aria-label={`Editar ${edital.nome}`} onClick={() => navigate(`/admin/editais/${edital.id}`)}><Pencil /></Button>{edital.url_oficial ? <Button asChild variant="ghost" size="icon-lg" title="Abrir edital"><a href={edital.url_oficial} target="_blank" rel="noreferrer" aria-label={`Abrir edital de ${edital.nome}`}><ExternalLink /></a></Button> : null}{edital.status !== "arquivado" ? <Button variant="ghost" size="icon-lg" title="Arquivar" aria-label={`Arquivar ${edital.nome}`} disabled={archiveMutation.isPending} onClick={() => { if (window.confirm(`Arquivar “${edital.nome}”? O conteúdo deixará de aparecer no catálogo.`)) archiveMutation.mutate(edital.id); }}><Archive /></Button> : null}</div></td></tr>)}</tbody></table></div> : null}
      </div>

      <EditalCatalogoFormDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(edital) => { setCreateOpen(false); void qc.invalidateQueries({ queryKey: ["admin-editais"] }); navigate(`/admin/editais/${edital.id}`); }} />
    </div>
  );
}
