import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { BookOpen, Calendar, Clock, ListChecks, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import { CronogramaContextState } from "@/components/cronograma/CronogramaContextState";
import { CronogramaModoSelectorModal, type CronogramaModo } from "@/components/cronograma/CronogramaModoSelectorModal";
import { GerarCronogramaAutoModal } from "@/components/cronograma/GerarCronogramaAutoModal";
import { CronogramaRemoverDialog, type RemoverScope } from "@/components/cronograma/CronogramaRemoverDialog";
import { CronogramaSidebar } from "@/components/cronograma/CronogramaSidebar";
import { CronogramaWeekGrid } from "@/components/cronograma/CronogramaWeekGrid";
import { CronogramaBlocoCard } from "@/components/cronograma/CronogramaBlocoCard";
import { PlanejamentoManualDialog } from "@/components/cronograma/PlanejamentoManualDialog";
import { AdicionarDisciplinasDialog } from "@/components/cronograma/AdicionarDisciplinasDialog";
import { DistribuicaoDialog } from "@/components/cronograma/DistribuicaoDialog";
import { AtividadeDialog, RemoverDisciplinaDialog, type ActivityPayload } from "@/components/cronograma/AtividadeDialog";
import { PlanejamentoDisciplinas, formatStudyMinutes } from "@/components/cronograma/PlanejamentoDisciplinas";
import { PlanejamentoDesempenho } from "@/components/cronograma/PlanejamentoDesempenho";
import { CalendarioMesToolbar } from "@/components/calendario/CalendarioMesToolbar";
import { CalendarioMensalGrid } from "@/components/calendario/CalendarioMensalGrid";
import { CalendarioDiaDetalheDialog } from "@/components/calendario/CalendarioDiaDetalheDialog";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCalendarioMensal } from "@/hooks/useCalendarioMensal";
import { DIAS, diaAbrev } from "@/lib/cronograma/constants";
import { filtrarDisciplinasDoConcursoAtivo } from "@/lib/cronograma/disciplinasConcurso";
import { invalidateCronogramaQueries } from "@/lib/cronograma/invalidateQueries";
import { hojeISO, fmtDateBR, type Bloco, type DisciplinaOption, type Planejamento, type PlanejamentoForm, type PlanejamentoResumo, type DistribuicaoForm, type FormState } from "@/lib/cronograma/types";
import { api } from "@/services/api";
import { useConcursoAtivoId, useConcursoContextError, useConcursoContextResolved } from "@/stores/concursoStore";

function errorMessage(error: unknown) {
  if (isAxiosError(error) && typeof error.response?.data?.detail === "string") return error.response.data.detail;
  return "Não foi possível salvar. Tente novamente.";
}
function dateForDay(day: Bloco["dia_semana"], base = hojeISO()) {
  const date = new Date(`${base}T12:00:00`);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7 + DIAS.indexOf(day));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const EMPTY_IDS: string[] = [];

export function Cronograma() {
  const qc = useQueryClient();
  const concursoId = useConcursoAtivoId();
  const resolved = useConcursoContextResolved();
  const contextError = useConcursoContextError();
  const enabled = resolved && Boolean(concursoId);
  const [tab, setTab] = React.useState("calendario");
  const [view, setView] = React.useState("semana");
  const [weekBase, setWeekBase] = React.useState(hojeISO());
  const [month, setMonth] = React.useState(() => ({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 }));
  const [filter, setFilter] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [modeOpen, setModeOpen] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);
  const [autoOpen, setAutoOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [distributionIds, setDistributionIds] = React.useState<string[] | null>(null);
  const [activity, setActivity] = React.useState<{ bloco?: Bloco; initialValues?: Partial<FormState>; date: string; duplicate?: boolean } | null>(null);
  const [remove, setRemove] = React.useState<{ bloco: Bloco; date: string } | null>(null);
  const [removeDiscipline, setRemoveDiscipline] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [registro, setRegistro] = React.useState<{ bloco?: Bloco; date?: string } | null>(null);

  const planQuery = useQuery({ queryKey: ["cronograma-planejamento", concursoId], queryFn: async () => (await api.get("/cronograma/planejamento", { params: { concurso_id: concursoId } })).data as Planejamento | null, enabled });
  const plano = planQuery.data;
  const catalogQuery = useQuery({ queryKey: ["disciplinas", "catalog", null], queryFn: async () => (await api.get("/disciplinas")).data as DisciplinaOption[], enabled });
  const disciplinas = React.useMemo(() => filtrarDisciplinasDoConcursoAtivo(catalogQuery.data ?? [], concursoId), [catalogQuery.data, concursoId]);
  const blocosQuery = useQuery({ queryKey: ["cronograma-blocos", concursoId], queryFn: async () => (await api.get("/cronograma/blocos", { params: { concurso_id: concursoId } })).data as Bloco[], enabled });
  const resumoQuery = useQuery({ queryKey: ["cronograma-resumo", plano?.id, weekBase], queryFn: async () => (await api.get(`/cronograma/planejamento/${plano!.id}/resumo`, { params: { semana: weekBase } })).data as PlanejamentoResumo, enabled: enabled && Boolean(plano?.id) });
  const activitiesQuery = useQuery({ queryKey: ["cronograma-atividades", plano?.id, weekBase], queryFn: async () => (await api.get(`/cronograma/planejamento/${plano!.id}/atividades`, { params: { inicio: dateForDay("seg", weekBase), fim: dateForDay("dom", weekBase) } })).data as Bloco[], enabled: enabled && Boolean(plano?.id) });
  const contests = useQuery({ queryKey: ["concursos"], queryFn: async () => (await api.get("/concursos")).data as { id: string; nome: string; cargo?: string | null }[], enabled });
  const contest = contests.data?.find(c => c.id === concursoId);
  const calendar = useCalendarioMensal(month.ano, month.mes, concursoId, enabled && view === "mes");
  const blocos = React.useMemo(() => (blocosQuery.data ?? []).filter(b => !plano || b.cronograma_id === plano.id || !b.cronograma_id), [blocosQuery.data, plano]);
  const names = new Map((catalogQuery.data ?? []).map(d => [d.id, d.nome]));
  const discName = (id: string) => names.get(id) ?? plano?.disciplinas.find(d => d.disciplina_id === id)?.nome ?? "Conteúdo indisponível";
  const scopedDisciplines = React.useMemo(() => disciplinas.filter(d => plano?.disciplinas.some(p => p.disciplina_id === d.id)), [disciplinas, plano]);
  const planValues = React.useMemo(() => plano ? { nome: plano.nome, cargo: plano.cargo, data_inicio: plano.data_inicio, data_fim: plano.data_fim, dias_disponiveis: plano.dias_disponiveis } : undefined, [plano]);
  const refresh = () => invalidateCronogramaQueries(qc);
  const onError = (err: unknown) => toast.error(errorMessage(err));
  const savedPlan = (data: Planejamento) => { qc.setQueryData(["cronograma-planejamento", concursoId], data); refresh(); };
  const planMutation = useMutation({ mutationFn: async (form: PlanejamentoForm) => (configOpen && plano ? await api.patch(`/cronograma/planejamento/${plano.id}`, form) : await api.post("/cronograma/planejamento", { ...form, concurso_id: concursoId, cargo: form.cargo || contest?.cargo || null })).data as Planejamento, onSuccess: data => { savedPlan(data); setManualOpen(false); setConfigOpen(false); setTab("disciplinas"); toast.success("Cronograma salvo. Agora organize suas disciplinas."); }, onError });
  const addMutation = useMutation({ mutationFn: async (ids: string[]) => (await api.post(`/cronograma/planejamento/${plano!.id}/disciplinas`, { disciplina_ids: ids })).data as Planejamento, onSuccess: data => { savedPlan(data); setAddOpen(false); toast.success("Disciplinas adicionadas ao cronograma."); }, onError });
  const orderMutation = useMutation({ mutationFn: async (ids: string[]) => (await api.put(`/cronograma/planejamento/${plano!.id}/disciplinas/ordem`, { disciplina_ids: ids })).data as Planejamento, onSuccess: savedPlan, onError });
  const removeDiscMutation = useMutation({ mutationFn: async (id: string) => (await api.post(`/cronograma/planejamento/${plano!.id}/disciplinas/${id}/remover`, { confirmar_historico: true })).data as Planejamento, onSuccess: data => { savedPlan(data); setRemoveDiscipline(null); toast.success("Disciplina retirada. Histórico preservado."); }, onError });
  const distributionMutation = useMutation({ mutationFn: async (form: DistribuicaoForm) => (await api.post(`/cronograma/planejamento/${plano!.id}/distribuicao`, form)).data, onSuccess: () => { refresh(); setDistributionIds(null); toast.success("Horários adicionados ao cronograma."); }, onError });
  const activityMutation = useMutation({ mutationFn: async (payload: ActivityPayload) => {
    if (activity?.bloco && !activity.duplicate) return (await api.post(`/cronograma/blocos/${activity.bloco.id}/editar`, { scope: payload.scope, data: payload.data, alteracoes: payload.form })).data;
    const targetDate = dateForDay(payload.form.dia_semana, payload.data);
    return (await api.post("/cronograma/blocos", { ...payload.form, modo_criacao: "analitica", concurso_id: concursoId, cronograma_id: plano?.id, vigencia_inicio: targetDate, vigencia_fim: payload.repeat ? plano?.data_fim ?? null : targetDate, vigencia_indeterminada: payload.repeat && !plano?.data_fim })).data;
  }, onSuccess: () => { refresh(); setActivity(null); toast.success("Atividade salva. Histórico preservado."); }, onError });
  const removeMutation = useMutation({ mutationFn: async ({ scope }: { scope: RemoverScope }) => (await api.post(`/cronograma/blocos/${remove!.bloco.id}/remover`, { scope, data: remove!.date })).data, onSuccess: () => { refresh(); setRemove(null); toast.success("Atividade retirada. Histórico preservado."); }, onError });

  React.useEffect(() => { setModeOpen(false); setManualOpen(false); setConfigOpen(false); setAutoOpen(false); setAddOpen(false); setDistributionIds(null); setActivity(null); setRemove(null); setRemoveDiscipline(null); setSelectedDate(null); setRegistro(null); setFilter(""); setSearch(""); }, [concursoId]);
  function chooseMode(mode: CronogramaModo) { setModeOpen(false); if (mode === "automatica") setAutoOpen(true); else setManualOpen(true); }
  function newActivity(id?: string, date = hojeISO()) {
    const day = (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as Bloco["dia_semana"][])[new Date(`${date}T12:00:00`).getDay()];
    const busy = blocos.filter(b => b.ativo && b.dia_semana === day && (!b.vigencia_inicio || b.vigencia_inicio <= date) && (!b.vigencia_fim || b.vigencia_fim >= date)).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    let start = 8 * 60;
    for (const b of busy) {
      const bStart = Number(b.hora_inicio.slice(0, 2)) * 60 + Number(b.hora_inicio.slice(3, 5));
      const bEnd = Number(b.hora_fim.slice(0, 2)) * 60 + Number(b.hora_fim.slice(3, 5));
      if (start + 60 <= bStart) break;
      if (start < bEnd) start = bEnd;
    }
    if (start + 60 > 1439) { toast.info("Não há uma hora livre neste dia. Edite os horários para abrir disponibilidade."); return; }
    const time = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
    setSelectedDate(null);
    setActivity({ date, initialValues: { ...(id ? { disciplina_id: id } : {}), dia_semana: day, hora_inicio: time(start), hora_fim: time(start + 60) } });
  }

  function editActivity(bloco: Bloco, date = bloco.data ?? dateForDay(bloco.dia_semana, weekBase)) { if (bloco.cronograma_item_id && !bloco.bloco_cronograma_id) { toast.info("Atividade legada sem regra semanal vinculada. Configure novos horários para editar a distribuição; o histórico será preservado."); return; } setSelectedDate(null); setActivity({ bloco, date }); }
  const visible = (activitiesQuery.data ?? []).filter(b => (!filter || b.disciplina_id === filter) && discName(b.disciplina_id).toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  const grouped = Object.fromEntries(DIAS.map(day => [day, visible.filter(b => b.ativo && b.dia_semana === day && (!b.vigencia_inicio || b.vigencia_inicio <= dateForDay(day, weekBase)) && (!b.vigencia_fim || b.vigencia_fim >= dateForDay(day, weekBase))).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))])) as Record<Bloco["dia_semana"], Bloco[]>;
  const loading = planQuery.isLoading || catalogQuery.isLoading || blocosQuery.isLoading;
  if (!resolved || !concursoId || contextError || planQuery.isError || catalogQuery.isError || blocosQuery.isError) return <CronogramaContextState status={!resolved ? "hydrating" : !concursoId ? "no_contest" : "error"} onRetry={refresh} />;

  return <div className="space-y-6 pb-10"><header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">Meu Cronograma</h1><p className="mt-1 text-sm text-muted-foreground">Organize suas disciplinas, personalize seus horários e acompanhe sua evolução.</p>{plano && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="font-semibold">{plano.nome}</span><span className="text-sm text-muted-foreground">{contest?.nome ?? "Concurso ativo"}{plano.cargo ? ` · ${plano.cargo}` : ""}</span><Badge variant="outline">{plano.tipo === "manual" ? "Manual" : "Automático"}</Badge><Badge variant="secondary">{plano.ativo ? "Ativo" : "Inativo"}</Badge></div>}</div><div className="flex flex-wrap gap-2">{plano ? <><Button variant="outline" onClick={() => setConfigOpen(true)}><Settings />Configurar</Button><Button onClick={() => setAddOpen(true)}><Plus />Adicionar disciplinas</Button><Button variant="outline" onClick={() => setRegistro({})}><BookOpen />Registrar estudo</Button></> : <Button onClick={() => setModeOpen(true)} disabled={loading}><Plus />Criar cronograma</Button>}</div></header>
    {loading ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{DIAS.slice(0, 4).map(d => <Skeleton key={d} className="h-24 rounded-xl" />)}</div> : plano ? <><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{[{ label: "Horas planejadas na semana", value: resumoQuery.data ? formatStudyMinutes(resumoQuery.data.minutos_planejados_semana) : "—", icon: Calendar }, { label: "Horas estudadas na semana", value: resumoQuery.data ? formatStudyMinutes(resumoQuery.data.minutos_estudados_semana) : "—", icon: Clock }, { label: "Disciplinas cadastradas", value: String(plano.disciplinas.length), icon: BookOpen }, { label: "Progresso das atividades", value: resumoQuery.data ? `${resumoQuery.data.progresso_pct.toFixed(0)}%` : "—", icon: ListChecks }].map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm"><span className="mb-3 inline-flex rounded-lg bg-primary/10 p-3"><Icon className="size-5 text-primary" /></span><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div>)}</div>{resumoQuery.isError && <p role="alert" className="text-sm text-destructive">Não foi possível atualizar os indicadores. <Button variant="link" onClick={() => void resumoQuery.refetch()}>Tentar novamente</Button></p>}
    {!plano.disciplinas.length ? <EmptyState title="Seu cronograma está pronto!" description="Agora adicione as disciplinas que deseja estudar e organize seus horários." action={<Button onClick={() => setAddOpen(true)}>Adicionar disciplinas</Button>} /> : <Tabs value={tab} onValueChange={setTab}><TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">{[["calendario", "Calendário"], ["disciplinas", "Disciplinas"], ["atividades", "Atividades"], ["desempenho", "Desempenho"]].map(([id, label]) => <TabsTrigger key={id} value={id} className="min-h-11">{label}</TabsTrigger>)}</TabsList>
    <TabsContent value="calendario" className="grid min-w-0 gap-4 min-[1440px]:grid-cols-[minmax(0,1fr)_280px]"><div className="min-w-0 space-y-4"><div className="flex flex-wrap items-center gap-2"><Button variant={view === "semana" ? "default" : "outline"} onClick={() => setView("semana")}>Semanal</Button><Button variant={view === "mes" ? "default" : "outline"} onClick={() => setView("mes")}>Mensal</Button><Button variant="outline" onClick={() => setTab("atividades")}>Lista</Button><Button variant="outline" onClick={() => newActivity()}><Plus />Adicionar atividade</Button></div>{view === "semana" ? <><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{fmtDateBR(dateForDay("seg", weekBase))} a {fmtDateBR(dateForDay("dom", weekBase))}</p><div className="flex flex-wrap gap-1"><Button variant="outline" onClick={() => { const d = new Date(`${weekBase}T12:00:00`); d.setDate(d.getDate() - 7); setWeekBase(d.toISOString().slice(0, 10)); }}>Semana anterior</Button><Button variant="outline" onClick={() => setWeekBase(hojeISO())}>Hoje</Button><Button variant="outline" onClick={() => { const d = new Date(`${weekBase}T12:00:00`); d.setDate(d.getDate() + 7); setWeekBase(d.toISOString().slice(0, 10)); }}>Próxima semana</Button></div></div>{activitiesQuery.isError && <p role="alert" className="text-sm text-destructive">Falha ao carregar atividades. <Button variant="link" onClick={() => void activitiesQuery.refetch()}>Tentar novamente</Button></p>}{!activitiesQuery.isError && <CronogramaWeekGrid isLoading={activitiesQuery.isLoading} totalBlocos={visible.length} diaHoje={(["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as Bloco["dia_semana"][])[new Date().getDay()]} grouped={grouped} disciplinaNome={discName} deletePending={removeMutation.isPending} extendPending={false} onEdit={editActivity} onRemove={b => setRemove({ bloco: b, date: b.data ?? dateForDay(b.dia_semana, weekBase) })} onExtend={() => setConfigOpen(true)} onAdd={day => newActivity(undefined, dateForDay(day, weekBase))} onDuplicate={b => setActivity({ bloco: b, date: b.data ?? dateForDay(b.dia_semana, weekBase), duplicate: true })} onRegistro={b => setRegistro({ bloco: b, date: b.data ?? dateForDay(b.dia_semana, weekBase) })} occurrenceDate={day => dateForDay(day, weekBase)} />} </> : <><CalendarioMesToolbar ano={month.ano} mes={month.mes} onPrev={() => { const d = new Date(month.ano, month.mes - 2, 1); setMonth({ ano: d.getFullYear(), mes: d.getMonth() + 1 }); }} onNext={() => { const d = new Date(month.ano, month.mes, 1); setMonth({ ano: d.getFullYear(), mes: d.getMonth() + 1 }); }} onToday={() => setMonth({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 })} />{calendar.isLoading ? <Skeleton className="h-96" /> : calendar.isError ? <p role="alert">Não foi possível carregar o calendário.</p> : <CalendarioMensalGrid ano={month.ano} mes={month.mes} dias={calendar.dias} onDiaClick={setSelectedDate} />}</>}</div><CronogramaSidebar plano={plano} resumo={resumoQuery.data} activities={visible} disciplinaNome={discName} onRegistro={b => setRegistro({ bloco: b, date: b.data ?? dateForDay(b.dia_semana, weekBase) })} /></TabsContent>
    <TabsContent value="disciplinas"><PlanejamentoDisciplinas plano={plano} resumo={resumoQuery.data} blocos={blocos} filter={filter} onFilter={id => { setFilter(id); if (id) setTab("atividades"); }} onConfigure={setDistributionIds} onEdit={editActivity} onActivity={newActivity} onRemove={setRemoveDiscipline} onOrder={ids => orderMutation.mutate(ids)} pending={orderMutation.isPending || removeDiscMutation.isPending} /></TabsContent>
    <TabsContent value="atividades" className="space-y-4"><div className="flex flex-wrap gap-3"><Input aria-label="Buscar atividades" className="sm:max-w-xs" placeholder="Buscar por disciplina…" value={search} onChange={e => setSearch(e.target.value)} /><Select value={filter || "all"} onValueChange={value => setFilter(value === "all" ? "" : value)}><SelectTrigger aria-label="Filtrar disciplina" className="sm:max-w-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as disciplinas</SelectItem>{plano.disciplinas.map(d => <SelectItem key={d.disciplina_id} value={d.disciplina_id}>{d.nome}</SelectItem>)}</SelectContent></Select><Button onClick={() => newActivity(filter || undefined)}><Plus />Adicionar atividade</Button></div>{activitiesQuery.isError ? <p role="alert" className="text-sm text-destructive">Falha ao carregar atividades. <Button variant="link" onClick={() => void activitiesQuery.refetch()}>Tentar novamente</Button></p> : !visible.length ? <EmptyState title="Nenhuma atividade planejada" description="Configure horários em lote ou adicione sua primeira atividade." action={<Button onClick={() => setDistributionIds(plano.disciplinas.map(d => d.disciplina_id))}>Configurar horários</Button>} /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visible.map(b => <CronogramaBlocoCard key={`${b.id}-${b.data}`} bloco={b} disciplinaNome={discName(b.disciplina_id)} diaLabel={diaAbrev[b.dia_semana]} onEdit={() => editActivity(b)} onDelete={() => setRemove({ bloco: b, date: b.data ?? dateForDay(b.dia_semana, weekBase) })} onDuplicate={() => setActivity({ bloco: b, date: b.data ?? dateForDay(b.dia_semana, weekBase), duplicate: true })} onRegistro={() => setRegistro({ bloco: b, date: b.data ?? dateForDay(b.dia_semana, weekBase) })} occurrenceDate={b.data ?? dateForDay(b.dia_semana, weekBase)} />)}</div>}</TabsContent>
    <TabsContent value="desempenho"><PlanejamentoDesempenho concursoId={concursoId} resumo={resumoQuery.data} onRegistro={() => setRegistro({})} /></TabsContent></Tabs>}
    </> : <EmptyState icon={Calendar} title="Planeje seus estudos" description="Crie um cronograma manual uma vez e adicione disciplinas aos poucos, ou use o planejamento automático." action={<Button onClick={() => setModeOpen(true)}>Criar cronograma</Button>} />}
    <CronogramaModoSelectorModal open={modeOpen} onClose={() => setModeOpen(false)} onSelect={chooseMode} />
    <PlanejamentoManualDialog open={manualOpen || configOpen} onClose={() => { setManualOpen(false); setConfigOpen(false); }} onSave={form => planMutation.mutate(form)} initialValues={configOpen ? planValues : undefined} concursoNome={contest?.nome ?? "Concurso ativo"} isSaving={planMutation.isPending} />
    <GerarCronogramaAutoModal open={autoOpen} onClose={() => setAutoOpen(false)} disciplinas={disciplinas} hasConcursoAtivo={true} onSaved={() => { refresh(); setAutoOpen(false); }} />
    {plano && <><AdicionarDisciplinasDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={ids => addMutation.mutate(ids)} disciplinas={disciplinas} addedIds={plano.disciplinas.map(d => d.disciplina_id)} isSaving={addMutation.isPending} /><DistribuicaoDialog open={distributionIds !== null} onClose={() => setDistributionIds(null)} onSave={form => distributionMutation.mutate(form)} plano={plano} initialIds={distributionIds ?? EMPTY_IDS} blocos={blocos} isSaving={distributionMutation.isPending} /><RemoverDisciplinaDialog open={Boolean(removeDiscipline)} name={removeDiscipline ? discName(removeDiscipline) : ""} pending={removeDiscMutation.isPending} onClose={() => setRemoveDiscipline(null)} onConfirm={() => removeDiscipline && removeDiscMutation.mutate(removeDiscipline)} /></>}
    <AtividadeDialog open={Boolean(activity)} onClose={() => setActivity(null)} onSave={payload => activityMutation.mutate(payload)} disciplinas={scopedDisciplines} bloco={activity?.bloco} initialValues={activity?.initialValues} initialDate={activity?.date} duplicate={activity?.duplicate} isSaving={activityMutation.isPending} />
    {remove && <CronogramaRemoverDialog open onClose={() => setRemove(null)} onConfirm={scope => removeMutation.mutate({ scope })} bloco={remove.bloco} dataAlvo={remove.date} diaLabel={diaAbrev[remove.bloco.dia_semana]} isPending={removeMutation.isPending} />}
    <CalendarioDiaDetalheDialog open={Boolean(selectedDate)} data={selectedDate} concursoId={concursoId} onClose={() => setSelectedDate(null)} onAdicionar={date => newActivity(undefined, date)} onRegistrar={date => { setSelectedDate(null); setRegistro({ date }); }} onEditarBloco={id => { const b = activitiesQuery.data?.find(b => b.id === id) ?? blocos.find(b => b.id === id); if (b) editActivity(b, selectedDate ?? undefined); }} onRemoverBloco={id => { const b = activitiesQuery.data?.find(b => b.id === id) ?? blocos.find(b => b.id === id); if (b) { setRemove({ bloco: b, date: selectedDate! }); setSelectedDate(null); } }} />
    <RegistroEstudoModal open={Boolean(registro)} onClose={() => setRegistro(null)} defaultConcursoId={concursoId} defaultDisciplinaId={registro?.bloco?.disciplina_id} defaultBlocoId={registro?.bloco?.cronograma_item_id ? undefined : registro?.bloco?.bloco_cronograma_id ?? registro?.bloco?.id} defaultCronogramaItemId={registro?.bloco?.cronograma_item_id} defaultDataReferencia={registro?.date} />
  </div>;
}
