import { BookOpenCheck, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { CatalogLogo } from "@/components/editais/CatalogLogo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { obterEditalAdmin, obterEditalPublicado } from "@/services/editaisCatalogo";
import type { EditalStatus } from "@/types/editaisCatalogo";

const statusClass: Record<EditalStatus, string> = {
  rascunho: "bg-warning/15 text-warning",
  publicado: "bg-success/15 text-success",
  arquivado: "bg-muted text-muted-foreground",
};

type CatalogDetailsDialogProps = {
  editalId: string | null;
  scope: "admin" | "public";
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CatalogDetailsDialog({ editalId, scope, open, onOpenChange }: CatalogDetailsDialogProps) {
  const query = useQuery({
    queryKey: [scope === "admin" ? "admin-edital-detalhes" : "catalogo-edital", editalId],
    queryFn: () => scope === "admin" ? obterEditalAdmin(editalId!) : obterEditalPublicado(editalId!),
    enabled: open && Boolean(editalId),
  });
  const edital = query.data;
  const versao = edital?.versao_atual;
  const cargos = versao?.cargos ?? [];
  const disciplinas = cargos.reduce((total, cargo) => total + cargo.disciplinas.length, 0);
  const topicos = cargos.reduce((total, cargo) => total + cargo.disciplinas.reduce((sum, disciplina) => sum + (disciplina.topicos_total ?? disciplina.topicos.length), 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto p-0">
        {query.isLoading ? <div className="px-6 py-20 text-center text-sm text-muted-foreground" role="status">Carregando detalhes do edital…</div> : null}
        {query.isError ? <div className="m-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">Não foi possível carregar os detalhes. <button type="button" className="font-semibold underline" onClick={() => void query.refetch()}>Tentar novamente</button></div> : null}
        {edital ? <>
          <DialogHeader className="border-b border-border px-6 py-5 pr-16">
            <div className="flex items-start gap-4"><CatalogLogo src={edital.logo_url} orgao={edital.orgao} size="lg" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", statusClass[edital.status])}>{edital.status}</span>{versao ? <span className="rounded-full bg-primary-muted px-2.5 py-1 text-xs font-semibold text-primary">Versão {versao.numero}</span> : null}</div><DialogTitle className="mt-3 text-xl leading-snug">{edital.nome}</DialogTitle><DialogDescription className="mt-1">{edital.orgao}{edital.banca ? ` · ${edital.banca}` : ""}</DialogDescription></div></div>
          </DialogHeader>

          <div className="space-y-6 px-6 pb-6">
            <dl className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-4"><Metric label="Cargos" value={cargos.length} /><Metric label="Disciplinas" value={disciplinas} /><Metric label="Tópicos" value={topicos} /><Metric label="Versões" value={edital.versoes?.length ?? 0} /></dl>

            <dl className="grid gap-3 rounded-xl border border-border p-4 text-sm sm:grid-cols-2"><div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data da prova</dt><dd className="mt-1 font-semibold">{formatDate(versao?.data_prova) ?? "Não informada"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Publicação da versão</dt><dd className="mt-1 font-semibold">{formatDate(versao?.publicada_em ?? versao?.published_at) ?? "Ainda não publicada"}</dd></div></dl>

            {edital.versoes?.length ? <section aria-labelledby="versoes-title"><h3 id="versoes-title" className="text-sm font-semibold">Histórico de versões</h3><div className="mt-2 flex flex-wrap gap-2">{[...edital.versoes].sort((a, b) => Number(b.numero) - Number(a.numero)).map((item) => <span key={item.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs"><strong>Versão {item.numero}</strong><span className="ml-1 capitalize text-muted-foreground">· {item.status}</span></span>)}</div></section> : null}

            <section aria-labelledby="conteudo-title"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="conteudo-title" className="font-semibold">Conteúdo verticalizado</h3><p className="mt-0.5 text-sm text-muted-foreground">Abra uma disciplina para consultar todos os tópicos.</p></div>{edital.url_oficial ? <Button asChild variant="outline" className="min-h-10"><a href={edital.url_oficial} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Abrir edital</a></Button> : null}</div>
              {cargos.length ? <div className="mt-4 space-y-4">{cargos.map((cargo) => <article key={cargo.id} className="rounded-xl border border-border"><div className="border-b border-border bg-muted/30 px-4 py-3"><h4 className="font-semibold">{cargo.nome}</h4><p className="text-xs text-muted-foreground">{cargo.especialidade ? `${cargo.especialidade} · ` : ""}{cargo.disciplinas.length} disciplina{cargo.disciplinas.length === 1 ? "" : "s"}</p></div><div className="divide-y divide-border">{cargo.disciplinas.map((disciplina) => <details key={disciplina.id} className="group px-4 py-3"><summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span>{disciplina.nome}{disciplina.sigla ? <small className="ml-2 text-muted-foreground">{disciplina.sigla}</small> : null}</span><span className="text-xs font-normal text-muted-foreground">{disciplina.topicos_total ?? disciplina.topicos.length} tópicos</span></summary>{disciplina.topicos.length ? <ol className="mt-2 space-y-1 border-l-2 border-primary/20 pl-4 text-sm text-muted-foreground">{[...disciplina.topicos].sort((a, b) => a.ordem - b.ordem).map((topico) => <li key={topico.id} className="flex items-start gap-2"><span className="text-xs font-semibold text-primary">{topico.ordem}.</span><span className="flex-1">{topico.descricao}</span><span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">Peso {topico.peso}</span></li>)}</ol> : <p className="mt-2 text-sm text-muted-foreground">Os tópicos desta disciplina não estão disponíveis.</p>}</details>)}</div></article>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-border px-6 py-10 text-center"><BookOpenCheck className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Esta versão ainda não possui conteúdo cadastrado.</p></div>}
            </section>
          </div>
        </> : null}
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-border bg-muted/30 p-3 text-center"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-bold">{value}</dd></div>;
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}
