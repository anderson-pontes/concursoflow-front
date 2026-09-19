import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronDown, FileSearch, Search } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EditalDiscoveryFilters, editalSortOptions, type EditalAppliedFilters } from "@/components/disciplinas/EditalDiscoveryFilters";
import { EditalTopicActions } from "@/components/disciplinas/EditalTopicActions";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { useEditalVerticalizado } from "@/hooks/useEditalVerticalizado";
import { usePomodoroConfigSync } from "@/hooks/usePomodoroConfigSync";
import { resolvePersistedFocusMinutes } from "@/lib/pomodoro/duration";
import type { EditalConsulta, EditalSort, TopicoEditalItem, TopicoStatus } from "@/types/editalVerticalizado";

const statusLabels: Record<TopicoStatus, string> = { nao_iniciado: "Não iniciado", em_andamento: "Em andamento", revisao: "Em revisão", dominado: "Dominado" };
const reasonLabels = { REVISAO_ATRASADA: "Revisão atrasada", NUNCA_ESTUDADO: "Tópico ainda não estudado" } as const;
export function EditalVerticalizadoOverview({ concursoId }: { concursoId: string }) {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [contentNode, setContentNode] = React.useState<HTMLElement | null>(null);
  const isDesktop = useContainerMinWidth(contentNode, 1024);
  const { query: pomodoroConfig } = usePomodoroConfigSync();
  const durationMinutes = pomodoroConfig.data
    ? resolvePersistedFocusMinutes(pomodoroConfig.data.focus_hours, pomodoroConfig.data.focus_minutes)
    : null;
  const [registerItem, setRegisterItem] = React.useState<TopicoEditalItem | null>(null);
  const returnState = location.state as { editalContestId?: string; editalSearch?: string; editalScrollY?: number; editalFocusId?: string; editalPageCount?: number } | null;
  const initialContextMismatch = Boolean(returnState?.editalContestId && returnState.editalContestId !== concursoId);
  const [contextReady, setContextReady] = React.useState(!initialContextMismatch);
  const restoredSearch = initialContextMismatch ? "" : (returnState?.editalSearch ?? "");
  const [searchDraft, setSearchDraft] = React.useState(restoredSearch);
  const [appliedSearch, setAppliedSearch] = React.useState(restoredSearch);
  const previousContestId = React.useRef(concursoId);
  const status = parseStatus(params.get("status"));
  const domain = parseDomain(params.get("dominio"));
  const disciplineIds = React.useMemo(
    () => contextReady ? [...new Set(params.getAll("disciplina"))].sort() : [],
    [contextReady, params],
  );
  const sort = parseSort(params.get("sort"));
  const neverStudied = params.get("nunca") === "1";
  const overdue = params.get("atrasada") === "1";
  const expanded = contextReady ? params.get("expandida") : null;

  const query = React.useMemo<EditalConsulta>(() => ({
    search: appliedSearch || undefined,
    disciplina_ids: disciplineIds,
    status: status === "todos" ? [] : [status],
    dominios: domain === "todos" ? [] : [Number(domain)],
    nunca_estudado: neverStudied || undefined,
    revisao_atrasada: overdue || undefined,
    sort,
    limit: 30,
  }), [appliedSearch, disciplineIds, domain, neverStudied, overdue, sort, status]);
  const edital = useEditalVerticalizado(concursoId, query);
  const first = edital.data?.pages[0];
  const items = edital.data?.pages.flatMap((page) => page.items) ?? [];

  const updateParam = (key: string, value?: string, replace = false) => {
    const next = new URLSearchParams(params);
    if (!value || value === "todos" || value === "ordem_edital") next.delete(key); else next.set(key, value);
    setParams(next, { replace });
  };
  const appliedFilters: EditalAppliedFilters = { disciplineIds, status, domain, neverStudied, overdue, sort };
  const applyFilters = (nextFilters: EditalAppliedFilters) => {
    const next = new URLSearchParams(params);
    next.delete("disciplina");
    [...new Set(nextFilters.disciplineIds)].sort().slice(0, 20).forEach((id) => next.append("disciplina", id));
    setClosedParam(next, "status", nextFilters.status, "todos");
    setClosedParam(next, "dominio", nextFilters.domain, "todos");
    setClosedParam(next, "sort", nextFilters.sort, "ordem_edital");
    setClosedParam(next, "nunca", nextFilters.neverStudied ? "1" : undefined);
    setClosedParam(next, "atrasada", nextFilters.overdue ? "1" : undefined);
    next.delete("expandida");
    setParams(next);
  };
  const clearFilters = () => {
    setSearchDraft("");
    setAppliedSearch("");
    const next = new URLSearchParams(params);
    ["status", "dominio", "disciplina", "sort", "nunca", "atrasada", "expandida"].forEach((key) => next.delete(key));
    setParams(next);
  };

  React.useEffect(() => {
    if (contextReady && previousContestId.current === concursoId) return;
    previousContestId.current = concursoId;
    setSearchDraft("");
    setAppliedSearch("");
    const next = new URLSearchParams(params);
    next.delete("disciplina");
    next.delete("expandida");
    setParams(next, { replace: true });
    const currentUserState = { ...(window.history.state?.usr ?? {}) };
    delete currentUserState.editalSearch;
    delete currentUserState.editalPageCount;
    delete currentUserState.editalScrollY;
    delete currentUserState.editalFocusId;
    window.history.replaceState({ ...window.history.state, usr: currentUserState }, "");
    setContextReady(true);
  }, [concursoId, contextReady, params, setParams]);

  React.useEffect(() => {
    if (returnState?.editalScrollY === undefined) return;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: returnState.editalScrollY, behavior: "auto" });
      document.querySelector<HTMLElement>(`[data-edital-topic="${returnState.editalFocusId ?? ""}"]`)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [returnState?.editalFocusId, returnState?.editalScrollY, items.length]);

  React.useEffect(() => {
    window.history.replaceState(
      { ...window.history.state, usr: { ...(window.history.state?.usr ?? {}), editalContestId: concursoId, editalSearch: appliedSearch, editalPageCount: edital.data?.pages.length ?? 1 } },
      "",
    );
  }, [appliedSearch, concursoId, edital.data?.pages.length]);

  React.useEffect(() => {
    if (!returnState?.editalPageCount || !edital.hasNextPage || edital.isFetchingNextPage) return;
    if ((edital.data?.pages.length ?? 0) < returnState.editalPageCount) void edital.fetchNextPage();
  }, [edital, returnState?.editalPageCount]);

  if (edital.isLoading) return <EditalLoading />;
  if (edital.isError) return <section role="alert" className="rounded-xl border border-destructive/30 bg-card p-8 text-center"><AlertCircle className="mx-auto h-8 w-8 text-destructive" /><h2 className="mt-3 font-semibold">Não foi possível carregar o edital</h2><p className="mt-1 text-sm text-muted-foreground">Os dados anteriores foram ocultados para não misturar concursos.</p><Button className="mt-5" onClick={() => void edital.refetch()}>Tentar novamente</Button></section>;
  if (!first) return null;

  const noDisciplines = first.disciplinas.length === 0;
  const noTopics = !noDisciplines && first.progresso_global.total === 0;
  const returnTo = `${location.pathname}${location.search}`;

  const actionProps = {
    concursoId,
    concursoStatus: first.concurso.status,
    durationMinutes,
    returnTo,
    returnState: { editalContestId: concursoId, editalSearch: appliedSearch, editalPageCount: edital.data?.pages.length ?? 1 },
    onRegister: setRegisterItem,
  };

  return <><section ref={setContentNode} aria-labelledby="edital-verticalizado-title" className="space-y-4">
    <Card><CardHeader className="space-y-4 pb-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle id="edital-verticalizado-title">Edital verticalizado</CardTitle><p className="mt-1 text-sm text-muted-foreground">Encontre o próximo tópico com base no seu progresso e nas revisões auditáveis.</p></div><Badge variant="outline" className="w-fit capitalize">Concurso {first.concurso.status}</Badge></div><div aria-label={first.progresso_global.texto} className="space-y-2"><div className="flex items-center justify-between gap-4 text-sm"><span className="font-medium">Progresso global</span><strong>{first.progresso_global.percentual}%</strong></div><Progress value={first.progresso_global.percentual} className="h-2" /><p className="text-xs text-muted-foreground">{first.progresso_global.texto}</p></div></CardHeader></Card>
    <Card><CardContent className="space-y-4 p-4"><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(searchDraft.trim().replace(/\s+/g, " ")); }}><div className="relative flex-1"><Label htmlFor="edital-search" className="sr-only">Buscar tópico no edital</Label><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input id="edital-search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Ex.: princípios constitucionais" className="pl-9" /></div><Button type="submit">Buscar</Button></form><EditalDiscoveryFilters disciplines={first.disciplinas.map((item) => ({ id: item.id, nome: item.nome }))} value={appliedFilters} appliedSearch={appliedSearch} onApply={applyFilters} onRemoveSearch={() => { setSearchDraft(""); setAppliedSearch(""); }} onClear={clearFilters} /></CardContent></Card>
    {noDisciplines ? <EmptyState title="Nenhuma disciplina neste concurso" description="Vincule disciplinas e tópicos ao concurso para visualizar o edital verticalizado." /> : noTopics ? <EmptyState title="Disciplinas sem tópicos" description="Cadastre tópicos nas disciplinas vinculadas para acompanhar o progresso do edital." /> : items.length === 0 ? <EmptyState title="Nenhum tópico encontrado" description="Ajuste a busca ou limpe os filtros para ampliar os resultados." action={<Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>} /> : isDesktop ? <DesktopTable items={items} actionProps={actionProps} /> : <MobileCards items={items} expanded={expanded} onExpand={(id) => updateParam("expandida", expanded === id ? undefined : id, true)} actionProps={actionProps} />}
    {items.length > 0 ? <div className="flex flex-col items-center gap-2"><p aria-live="polite" className="text-sm text-muted-foreground">{items.length} de {first.page.result_count} tópicos exibidos</p>{edital.hasNextPage ? <Button variant="outline" disabled={edital.isFetchingNextPage} onClick={() => void edital.fetchNextPage()}>{edital.isFetchingNextPage ? "Carregando…" : "Carregar mais"}</Button> : null}</div> : null}
  </section><RegistroEstudoModal
    open={Boolean(registerItem)}
    onClose={() => setRegisterItem(null)}
    defaultConcursoId={concursoId}
    defaultDisciplinaId={registerItem?.disciplina_id}
    defaultTopicos={registerItem ? [{ id: registerItem.id, nome: registerItem.descricao }] : []}
    defaultDuracaoSegundos={durationMinutes ? durationMinutes * 60 : null}
    onSaved={() => {
      setRegisterItem(null);
      void qc.invalidateQueries({ queryKey: ["edital-verticalizado", concursoId] });
      void qc.invalidateQueries({ queryKey: ["revisoes", concursoId] });
    }}
  /></>;
}

type ActionProps = Omit<React.ComponentProps<typeof EditalTopicActions>, "item">;

function DesktopTable({ items, actionProps }: { items: TopicoEditalItem[]; actionProps: ActionProps }) {
  return <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Tópico</th><th className="px-3 py-3">Situação</th><th className="px-3 py-3">Domínio</th><th className="px-3 py-3">Última atividade</th><th className="px-3 py-3">Próxima revisão</th><th className="px-3 py-3">Atenção</th><th className="px-3 py-3"><span className="sr-only">Ações</span></th></tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.id}><td className="max-w-md px-4 py-4"><span className="block text-xs text-muted-foreground">{item.disciplina_nome}</span><strong>{item.descricao}</strong></td><td className="px-3 py-4"><Badge variant="outline">{statusLabels[item.status]}</Badge></td><td className="px-3 py-4">{item.dominio}/5</td><td className="px-3 py-4">{formatDate(item.ultima_atividade_em)}</td><td className="px-3 py-4">{formatDate(item.proxima_revisao_em)}</td><td className="px-3 py-4"><AttentionReasons item={item} /></td><td className="px-3 py-4"><EditalTopicActions item={item} {...actionProps} /></td></tr>)}</tbody></table></div></Card>;
}

function MobileCards({ items, expanded, onExpand, actionProps }: { items: TopicoEditalItem[]; expanded: string | null; onExpand: (id: string) => void; actionProps: ActionProps }) {
  return <div className="space-y-3">{items.map((item) => { const open = expanded === item.id; return <Card key={item.id}><button type="button" aria-expanded={open} onClick={() => onExpand(item.id)} className="flex min-h-14 w-full items-start gap-3 rounded-xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><div className="min-w-0 flex-1"><span className="text-xs text-muted-foreground">{item.disciplina_nome}</span><strong className="mt-1 block">{item.descricao}</strong><div className="mt-2 flex flex-wrap gap-2"><Badge variant="outline">{statusLabels[item.status]}</Badge>{item.revisao_atrasada || item.nunca_estudado ? <Badge variant="secondary">Precisa de atenção</Badge> : null}</div></div><ChevronDown aria-hidden="true" className={`mt-1 h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} /></button>{open ? <CardContent className="space-y-4 border-t pt-4"><dl className="grid grid-cols-2 gap-3 text-sm"><Metric label="Domínio" value={`${item.dominio}/5`} /><Metric label="Peso" value={String(item.peso)} /><Metric label="Última atividade" value={formatDate(item.ultima_atividade_em)} /><Metric label="Próxima revisão" value={formatDate(item.proxima_revisao_em)} /></dl><AttentionReasons item={item} /><EditalTopicActions item={item} {...actionProps} /></CardContent> : null}</Card>; })}</div>;
}

function AttentionReasons({ item }: { item: TopicoEditalItem }) { if (!item.razoes_atencao.length) return <span className="text-sm text-muted-foreground">Sem sinalizações</span>; return <ul aria-label="Motivos de atenção" className="space-y-1 text-xs">{item.razoes_atencao.map((reason) => <li key={reason} className="flex items-start gap-1.5"><AlertCircle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />{reason === "PESO_DOMINIO" ? `Prioridade ${item.prioridade}, calculada pelo peso ${item.peso} e domínio ${item.dominio}` : reasonLabels[reason]}{reason === "REVISAO_ATRASADA" && item.dias_atraso ? ` (${item.dias_atraso} dias)` : ""}</li>)}</ul>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>; }
function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) { return <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center"><FileSearch className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">{title}</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>; }
function EditalLoading() { return <div role="status" aria-label="Carregando edital verticalizado" className="space-y-4"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>; }
function formatDate(value: string | null) { if (!value) return "Não disponível"; const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value; return new Date(normalized).toLocaleDateString("pt-BR"); }
function parseStatus(value: string | null): TopicoStatus | "todos" { return value && value in statusLabels ? value as TopicoStatus : "todos"; }
function parseDomain(value: string | null) { return value && ["1", "2", "3", "4", "5"].includes(value) ? value : "todos"; }
function parseSort(value: string | null): EditalSort { return editalSortOptions.some((item) => item.value === value) ? value as EditalSort : "ordem_edital"; }
function setClosedParam(params: URLSearchParams, key: string, value?: string, defaultValue?: string) { if (!value || value === defaultValue) params.delete(key); else params.set(key, value); }
function useContainerMinWidth(element: HTMLElement | null, minWidth: number) { const [matches, setMatches] = React.useState(false); React.useLayoutEffect(() => { if (!element) return; const update = () => setMatches(element.getBoundingClientRect().width >= minWidth); update(); const frame = window.requestAnimationFrame(update); window.addEventListener("resize", update); const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update); observer?.observe(element); return () => { window.cancelAnimationFrame(frame); window.removeEventListener("resize", update); observer?.disconnect(); }; }, [element, minWidth]); return matches; }
