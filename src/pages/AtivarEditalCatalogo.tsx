import React from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AtivacaoStepper } from "@/components/editais/AtivacaoStepper";
import { CatalogDetailsDialog } from "@/components/editais/CatalogDetailsDialog";
import { CatalogPagination } from "@/components/editais/CatalogPagination";
import { PublicCatalogResults } from "@/components/editais/PublicCatalogResults";
import { CatalogViewToggle, type CatalogViewMode } from "@/components/editais/CatalogViewToggle";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ativarEdital, obterEditalPublicado, paginarEditaisPublicados } from "@/services/editaisCatalogo";
import { useConcursoStore } from "@/stores/concursoStore";
import type { EditalCargoCatalogo } from "@/types/editaisCatalogo";

function makeIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `ativacao-${Date.now()}-${Math.random()}`;
}

export function AtivarEditalCatalogo() {
  const [step, setStep] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [page, setPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<CatalogViewMode>("cards");
  const [editalId, setEditalId] = React.useState<string | null>(null);
  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const [cargoId, setCargoId] = React.useState<string | null>(null);
  const [disciplinas, setDisciplinas] = React.useState<string[]>([]);
  const idempotencyKey = React.useRef(makeIdempotencyKey());
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setConcursoAtivoId = useConcursoStore((state) => state.setConcursoAtivoId);

  React.useEffect(() => setPage(1), [deferredSearch]);
  const listQuery = useQuery({ queryKey: ["catalogo-editais", deferredSearch, page], queryFn: () => paginarEditaisPublicados({ search: deferredSearch, page, pageSize: 8 }) });
  React.useEffect(() => {
    if (listQuery.data && page > Math.max(1, listQuery.data.total_pages)) setPage(Math.max(1, listQuery.data.total_pages));
  }, [listQuery.data, page]);
  const detailQuery = useQuery({ queryKey: ["catalogo-edital", editalId], queryFn: () => obterEditalPublicado(editalId!), enabled: Boolean(editalId) });
  const edital = detailQuery.data ?? listQuery.data?.items.find((item) => item.id === editalId) ?? null;
  const versao = edital?.versao_atual ?? null;
  const cargo = versao?.cargos.find((item) => item.id === cargoId) ?? null;

  React.useEffect(() => { titleRef.current?.focus(); }, [step]);

  const activation = useMutation({
    mutationFn: () => ativarEdital({ templateId: edital!.id, versionId: versao!.id, cargoId: cargo!.id, disciplinaIds: disciplinas, idempotencyKey: idempotencyKey.current }),
    onSuccess: async (result) => {
      setConcursoAtivoId(result.concurso_id);
      await Promise.all([qc.invalidateQueries({ queryKey: ["concursos"] }), qc.invalidateQueries({ queryKey: ["disciplinas"] })]);
      toast.success(`Plano ativado com ${result.disciplinas_criadas} disciplinas e ${result.topicos_criados} tópicos.`);
      navigate("/disciplinas");
    },
  });

  const selectEdital = (id: string) => { setEditalId(id); setCargoId(null); setDisciplinas([]); };
  const selectCargo = (next: EditalCargoCatalogo) => { setCargoId(next.id); setDisciplinas(next.disciplinas.map((item) => item.id)); };
  const canContinue = step === 1 ? Boolean(editalId) : step === 2 ? Boolean(cargoId) : step === 3 ? disciplinas.length > 0 : true;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-28 sm:pb-8">
      <header><Link to="/concursos" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar aos meus concursos</Link><h1 ref={titleRef} tabIndex={-1} className="mt-2 text-2xl font-bold tracking-tight outline-none">Ativar edital verticalizado</h1><p className="mt-1 text-sm text-muted-foreground">Escolha o conteúdo e receba seu plano pronto para estudar.</p></header>
      <AtivacaoStepper current={step} />

      <main className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        {step === 1 ? <section aria-labelledby="step-title"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="step-title" className="text-lg font-semibold">Qual edital você está estudando?</h2><p className="mt-1 text-sm text-muted-foreground">Consulte versões revisadas e publicadas pelo ClickEdital.</p></div><div className="flex flex-wrap items-center gap-3">{listQuery.data ? <span className="text-xs text-muted-foreground">{listQuery.data.total} edital{listQuery.data.total === 1 ? "" : "is"} disponível{listQuery.data.total === 1 ? "" : "is"}</span> : null}<CatalogViewToggle value={viewMode} onValueChange={setViewMode} /></div></div><label className="relative mt-5 block"><span className="sr-only">Buscar edital</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por concurso, órgão, banca ou cargo" className="min-h-11 w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>{listQuery.isLoading ? <p className="py-16 text-center text-sm text-muted-foreground" role="status">Carregando catálogo…</p> : null}{listQuery.isError ? <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Não foi possível carregar os editais. <button className="font-semibold underline" onClick={() => void listQuery.refetch()}>Tentar novamente</button></p> : null}{listQuery.data?.items.length ? <PublicCatalogResults items={listQuery.data.items} selectedId={editalId} viewMode={viewMode} onSelect={selectEdital} onViewDetails={setDetailsId} /> : null}{!listQuery.isLoading && !listQuery.data?.items.length ? <div className="py-14 text-center"><BookOpenCheck className="mx-auto h-10 w-10 text-muted-foreground" /><h3 className="mt-3 font-semibold">Nenhum edital encontrado</h3><p className="mt-1 text-sm text-muted-foreground">Tente outro termo ou cadastre seu concurso manualmente.</p><Button asChild variant="outline" className="mt-4 min-h-11"><Link to="/concursos?novo=manual">Cadastrar manualmente</Link></Button></div> : null}{listQuery.data?.items.length ? <div className="mt-5"><CatalogPagination page={listQuery.data.page} totalPages={listQuery.data.total_pages} total={listQuery.data.total} onPageChange={setPage} /></div> : null}</section> : null}

        {step === 2 ? <section aria-labelledby="step-title"><h2 id="step-title" className="text-lg font-semibold">Escolha seu cargo ou especialidade</h2><p className="mt-1 text-sm text-muted-foreground">{edital?.nome}</p>{detailQuery.isLoading ? <p className="py-16 text-center text-sm text-muted-foreground" role="status">Carregando cargos…</p> : null}{detailQuery.isError ? <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">Não foi possível carregar os cargos.</p> : null}<div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Cargo do edital">{versao?.cargos.map((item) => <button key={item.id} type="button" role="radio" aria-checked={cargoId === item.id} onClick={() => selectCargo(item)} className={cn("min-h-24 rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", cargoId === item.id ? "border-primary bg-primary-muted ring-1 ring-primary" : "border-border hover:border-primary/50")}><strong className="block">{item.nome}</strong><span className="mt-2 block text-sm text-muted-foreground">{item.disciplinas.length} disciplinas · {item.disciplinas.reduce((sum, disc) => sum + (disc.topicos_total ?? disc.topicos.length), 0)} tópicos</span></button>)}</div></section> : null}

        {step === 3 && cargo ? <section aria-labelledby="step-title"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 id="step-title" className="text-lg font-semibold">Escolha as disciplinas</h2><p className="mt-1 text-sm text-muted-foreground">Todas começam selecionadas. Você poderá ajustar depois.</p></div><Button variant="outline" className="min-h-11" onClick={() => setDisciplinas(disciplinas.length === cargo.disciplinas.length ? [] : cargo.disciplinas.map((item) => item.id))}>{disciplinas.length === cargo.disciplinas.length ? "Desmarcar todas" : "Selecionar todas"}</Button></div><div className="mt-5 space-y-2">{cargo.disciplinas.map((disciplina) => { const checked = disciplinas.includes(disciplina.id); return <label key={disciplina.id} className={cn("flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-4", checked ? "border-primary/50 bg-primary-muted" : "border-border hover:bg-muted/30")}><Checkbox checked={checked} onCheckedChange={() => setDisciplinas((items) => checked ? items.filter((id) => id !== disciplina.id) : [...items, disciplina.id])} /><span className="min-w-0 flex-1"><strong className="block">{disciplina.nome}</strong><span className="text-xs text-muted-foreground">{disciplina.topicos_total ?? disciplina.topicos.length} tópicos{disciplina.sigla ? ` · ${disciplina.sigla}` : ""}</span></span></label>; })}</div><p className="mt-4 text-sm font-medium" aria-live="polite">{disciplinas.length} de {cargo.disciplinas.length} disciplinas selecionadas</p>{!disciplinas.length ? <p role="alert" className="mt-2 text-sm text-destructive">Selecione pelo menos uma disciplina para continuar.</p> : null}</section> : null}

        {step === 4 && edital && cargo ? <section aria-labelledby="step-title"><h2 id="step-title" className="text-lg font-semibold">Revise seu novo plano</h2><p className="mt-1 text-sm text-muted-foreground">Nada será alterado nos seus concursos atuais.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><Summary label="Edital" value={edital.nome} /><Summary label="Cargo" value={cargo.nome} /><Summary label="Conteúdo" value={`${disciplinas.length} disciplinas · ${cargo.disciplinas.filter((item) => disciplinas.includes(item.id)).reduce((sum, item) => sum + (item.topicos_total ?? item.topicos.length), 0)} tópicos`} /></div><div className="mt-5 rounded-xl border border-border"><ul className="divide-y divide-border">{cargo.disciplinas.filter((item) => disciplinas.includes(item.id)).map((item) => <li key={item.id} className="flex items-center gap-3 p-3 text-sm"><CheckCircle2 className="h-4 w-4 text-success" /><span className="flex-1 font-medium">{item.nome}</span><span className="text-xs text-muted-foreground">{item.topicos_total ?? item.topicos.length} tópicos</span></li>)}</ul></div>{activation.isError ? <div role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Não foi possível ativar o plano. Sua seleção foi mantida; tente novamente.</div> : null}</section> : null}
      </main>

      <CatalogDetailsDialog editalId={detailsId} scope="public" open={Boolean(detailsId)} onOpenChange={(open) => { if (!open) setDetailsId(null); }} />

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3"><Button variant="outline" className="min-h-11" disabled={step === 1 || activation.isPending} onClick={() => setStep((value) => Math.max(1, value - 1))}><ArrowLeft /> Voltar</Button>{step < 4 ? <Button className="min-h-11" disabled={!canContinue || (step === 1 && detailQuery.isLoading)} onClick={() => setStep((value) => Math.min(4, value + 1))}>Continuar <ArrowRight /></Button> : <Button className="min-h-11 px-5" disabled={activation.isPending} onClick={() => activation.mutate()}>{activation.isPending ? "Criando seu plano…" : "Criar e ativar plano"}</Button>}</div></footer>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-muted/30 p-4"><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span><strong className="mt-1 block text-sm">{value}</strong></div>; }
