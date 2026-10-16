import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, CalendarClock, ChevronDown, Circle, FileSearch, Grid2X2, ListTree, Search, Target, Trophy } from "lucide-react";
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
import { DisciplineColorIndicator } from "@/components/disciplinas/DisciplineColorIndicator";
import { disciplineColorStyle } from "@/components/disciplinas/DisciplineColorIndicator";
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
  const display = params.get("layout") === "cards" ? "cards" : "table";
  const grouped = params.get("agrupar") === "1";

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
  const setDisplay = (nextDisplay: "table" | "cards") => updateParam("layout", nextDisplay === "table" ? undefined : nextDisplay, true);
  const setGrouped = (nextGrouped: boolean) => updateParam("agrupar", nextGrouped ? "1" : undefined, true);
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
  const indicators = first.indicadores ?? { estudados: 0, revisoes_pendentes: 0, topicos_prioritarios: 0 };

  return <><section ref={setContentNode} aria-labelledby="edital-verticalizado-title" className="space-y-4">
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary-50/70 via-card to-card dark:from-primary/10"><CardHeader className="space-y-5 pb-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><CardTitle id="edital-verticalizado-title" className="text-2xl">Edital verticalizado</CardTitle><p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">Acompanhe seu domínio, identifique prioridades e avance no edital.</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="capitalize">Concurso {first.concurso.status}</Badge><div className="flex rounded-lg border bg-card p-1" aria-label="Visualização"><Button type="button" variant={display === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setDisplay("table")} aria-pressed={display === "table"}><ListTree aria-hidden="true" />Tabela</Button><Button type="button" variant={display === "cards" ? "secondary" : "ghost"} size="sm" onClick={() => setDisplay("cards")} aria-pressed={display === "cards"}><Grid2X2 aria-hidden="true" />Cards</Button></div></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><IndicatorCard icon={Trophy} tone="indigo" label="Progresso do edital" value={`${first.progresso_global.percentual}%`} detail={first.progresso_global.texto} progress={first.progresso_global.percentual} /><IndicatorCard icon={BookOpen} tone="cyan" label="Tópicos estudados" value={String(indicators.estudados)} detail="Com atividade no recorte atual" /><IndicatorCard icon={CalendarClock} tone="amber" label="Revisões pendentes" value={String(indicators.revisoes_pendentes)} detail="Vencidas ou previstas para hoje" /><IndicatorCard icon={Target} tone="violet" label="Tópicos prioritários" value={String(indicators.topicos_prioritarios)} detail="Com revisão atrasada ou sem atividade" /></div></CardHeader></Card>
    <Card><CardContent className="space-y-4 p-4 sm:p-5"><form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(searchDraft.trim().replace(/\s+/g, " ")); }}><div className="relative flex-1"><Label htmlFor="edital-search" className="sr-only">Buscar tópico no edital</Label><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input id="edital-search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Ex.: princípios constitucionais" className="pl-9" /></div><Button type="submit">Buscar</Button></form><EditalDiscoveryFilters disciplines={first.disciplinas.map((item) => ({ id: item.id, nome: item.nome }))} value={appliedFilters} appliedSearch={appliedSearch} onApply={applyFilters} onRemoveSearch={() => { setSearchDraft(""); setAppliedSearch(""); }} onClear={clearFilters} /><div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><p aria-live="polite" className="text-sm text-muted-foreground"><strong className="text-foreground">{first.page.result_count}</strong> tópicos encontrados</p><Button type="button" variant={grouped ? "secondary" : "outline"} size="sm" onClick={() => setGrouped(!grouped)} aria-pressed={grouped}><ListTree aria-hidden="true" />{grouped ? "Agrupado por disciplina" : "Agrupar por disciplina"}</Button></div></CardContent></Card>
    {noDisciplines ? <EmptyState title="Nenhuma disciplina neste concurso" description="Vincule disciplinas e tópicos ao concurso para visualizar o edital verticalizado." /> : noTopics ? <EmptyState title="Disciplinas sem tópicos" description="Cadastre tópicos nas disciplinas vinculadas para acompanhar o progresso do edital." /> : items.length === 0 ? <EmptyState title="Nenhum tópico encontrado" description="Ajuste a busca ou limpe os filtros para ampliar os resultados." action={<Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>} /> : grouped ? <DisciplineGroups items={items} display={display} actionProps={actionProps} expanded={expanded} onExpand={(id) => updateParam("expandida", expanded === id ? undefined : id, true)} /> : display === "cards" || !isDesktop ? <TopicCards items={items} expanded={expanded} onExpand={(id) => updateParam("expandida", expanded === id ? undefined : id, true)} actionProps={actionProps} /> : <DesktopTable items={items} actionProps={actionProps} />}
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
  return <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b bg-slate-100 text-xs uppercase tracking-wide text-muted-foreground dark:bg-muted/50"><tr><th className="min-w-[290px] px-5 py-3">Tópico</th><th className="px-3 py-3">Situação</th><th className="px-3 py-3">Domínio</th><th className="px-3 py-3">Última atividade</th><th className="px-3 py-3">Próxima revisão</th><th className="px-3 py-3">Atenção</th><th className="px-4 py-3"><span className="sr-only">Ações</span></th></tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.id} className="align-middle transition-colors hover:bg-primary-50/50 dark:hover:bg-primary/10"><td className="max-w-xl px-5 py-4"><TopicIdentity item={item} /></td><td className="px-3 py-4"><StatusBadge status={item.status} /></td><td className="px-3 py-4"><DomainIndicator domain={item.dominio} /></td><td className="px-3 py-4"><DateLabel value={item.ultima_atividade_em} emptyLabel="Nenhuma atividade registrada" /></td><td className="px-3 py-4"><ReviewLabel item={item} /></td><td className="max-w-[180px] px-3 py-4"><AttentionReasons item={item} /></td><td className="px-4 py-4"><EditalTopicActions item={item} {...actionProps} /></td></tr>)}</tbody></table></div></Card>;
}

function TopicCards({ items, expanded, onExpand, actionProps }: { items: TopicoEditalItem[]; expanded: string | null; onExpand: (id: string) => void; actionProps: ActionProps }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <TopicCard key={item.id} item={item} expanded={expanded === item.id} onExpand={() => onExpand(item.id)} actionProps={actionProps} />)}</div>;
}

function DisciplineGroups({ items, display, expanded, onExpand, actionProps }: { items: TopicoEditalItem[]; display: "table" | "cards"; expanded: string | null; onExpand: (id: string) => void; actionProps: ActionProps }) {
  const groups = items.reduce<Map<string, TopicoEditalItem[]>>((result, item) => { result.set(item.disciplina_id, [...(result.get(item.disciplina_id) ?? []), item]); return result; }, new Map());
  return <div className="space-y-4">{[...groups.values()].map((group) => { const first = group[0]!; const studied = group.filter((item) => !item.nunca_estudado).length; const percent = Math.round((studied / group.length) * 100); return <Card key={first.disciplina_id} className="overflow-hidden"><details open><summary className="cursor-pointer list-none border-b bg-surface-muted/60 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><DisciplineColorIndicator disciplinaId={first.disciplina_id} /><div><h2 className="font-semibold">{first.disciplina_nome}</h2><p className="text-xs text-muted-foreground">{studied} de {group.length} tópicos estudados neste recorte</p></div></div><div className="flex items-center gap-2"><span className="text-sm font-semibold text-primary">{percent}%</span><ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground" /></div></div><Progress value={percent} className="mt-3 h-1.5" /></summary>{display === "table" ? <DesktopTable items={group} actionProps={actionProps} /> : <div className="p-3"><TopicCards items={group} expanded={expanded} onExpand={onExpand} actionProps={actionProps} /></div>}</details></Card>; })}</div>;
}

function TopicCard({ item, expanded, onExpand, actionProps }: { item: TopicoEditalItem; expanded: boolean; onExpand: () => void; actionProps: ActionProps }) {
  return <Card className="overflow-hidden border-l-4" style={disciplineColorStyle(item.disciplina_id)}><button type="button" aria-expanded={expanded} onClick={onExpand} className="flex min-h-20 w-full items-start gap-3 rounded-xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><div className="min-w-0 flex-1"><TopicIdentity item={item} /><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={item.status} /><DomainIndicator domain={item.dominio} compact />{item.revisao_atrasada || item.nunca_estudado ? <Badge className="bg-warning-100 text-warning-800 dark:bg-warning/20 dark:text-warning-foreground">Atenção</Badge> : null}</div></div><ChevronDown aria-hidden="true" className={`mt-1 h-5 w-5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} /></button>{expanded ? <CardContent className="space-y-4 border-t pt-4"><dl className="grid grid-cols-2 gap-3 text-sm"><Metric label="Domínio" value={`${item.dominio}/5`} /><Metric label="Peso" value={String(item.peso)} /><Metric label="Última atividade" value={formatDate(item.ultima_atividade_em)} /><Metric label="Próxima revisão" value={formatDate(item.proxima_revisao_em)} /></dl><AttentionReasons item={item} /><EditalTopicActions item={item} {...actionProps} /></CardContent> : null}</Card>;
}

function TopicIdentity({ item }: { item: TopicoEditalItem }) { return <div className="min-w-0"><span className="flex items-center gap-2 text-xs text-muted-foreground"><DisciplineColorIndicator disciplinaId={item.disciplina_id} shape="dot" />{item.disciplina_nome}</span><strong className="mt-1 block break-words leading-snug">{item.descricao}</strong></div>; }
function StatusBadge({ status }: { status: TopicoStatus }) { const styles: Record<TopicoStatus, string> = { nao_iniciado: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200", em_andamento: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200", revisao: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200", dominado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" }; return <Badge className={styles[status]}>{statusLabels[status]}</Badge>; }
function DomainIndicator({ domain, compact = false }: { domain: number; compact?: boolean }) { const color = domain <= 1 ? "text-rose-500" : domain === 2 ? "text-amber-500" : domain === 3 ? "text-cyan-600" : domain === 4 ? "text-indigo-600" : "text-emerald-600"; return <span className="inline-flex items-center gap-1" title={`Domínio ${domain} de 5`} aria-label={`Domínio ${domain} de 5`}>{[1, 2, 3, 4, 5].map((level) => level <= domain ? <Circle key={level} className={`h-2.5 w-2.5 fill-current ${color}`} /> : <Circle key={level} className="h-2.5 w-2.5 text-muted-foreground/30" />)}{compact ? null : <span className="ml-1 text-xs font-semibold">{domain}/5</span>}</span>; }
function DateLabel({ value, emptyLabel }: { value: string | null; emptyLabel: string }) { return value ? <span>{formatDate(value)}</span> : <span title={emptyLabel} className="text-muted-foreground">—</span>; }
function ReviewLabel({ item }: { item: TopicoEditalItem }) { if (!item.proxima_revisao_em) return <span title="Nenhuma revisão programada" className="text-muted-foreground">—</span>; const tone = item.revisao_atrasada ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"; return <Badge className={tone}>{item.revisao_atrasada ? "Vencida" : formatDate(item.proxima_revisao_em)}</Badge>; }
function IndicatorCard({ icon: Icon, tone, label, value, detail, progress }: { icon: typeof Trophy; tone: "indigo" | "cyan" | "amber" | "violet"; label: string; value: string; detail: string; progress?: number }) { const tones = { indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200", cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200", amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200", violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200" }; return <div className="rounded-xl border bg-card/90 p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight">{value}</p></div><span className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon className="h-5 w-5" aria-hidden="true" /></span></div>{progress !== undefined ? <Progress value={progress} className="mt-3 h-1.5" /> : null}<p className="mt-2 text-xs text-muted-foreground">{detail}</p></div>; }

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
