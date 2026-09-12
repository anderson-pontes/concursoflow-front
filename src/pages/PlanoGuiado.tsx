import React from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarClock, Check, CircleCheck, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlanejamentoCapacidadeAlert, PlanejamentoExplicacao, PlanejamentoPreviewStaleDialog } from "@/components/planejamento/PlanejamentoExplicacao";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectField } from "@/components/ui/select-field";
import { CatalogPagination } from "@/components/editais/CatalogPagination";
import { CatalogDetailsDialog } from "@/components/editais/CatalogDetailsDialog";
import { PublicCatalogResults } from "@/components/editais/PublicCatalogResults";
import { CatalogViewToggle, type CatalogViewMode } from "@/components/editais/CatalogViewToggle";
import { cn } from "@/lib/utils";
import { clearOnboardingDraft, readOnboardingDraft, saveOnboardingDraft, type OnboardingDraft } from "@/lib/onboardingDraftStorage";
import { isPlanejamentoPreviewDesatualizado, planejamentoCapacidadeDiagnostico } from "@/lib/planejamento/errors";
import { useConcursoContextTransition } from "@/hooks/useConcursoContextTransition";
import type { Disciplina } from "@/lib/disciplinas/types";
import { api } from "@/services/api";
import { obterEditalPublicado, paginarEditaisPublicados } from "@/services/editaisCatalogo";
import { confirmarPlanoGuiado, previewPlanejamento } from "@/services/planejamento";
import { createTelemetryJourney, telemetryErrorCode, trackCatalogItemForActivation, trackTelemetry } from "@/services/telemetry";
import { useConcursoStore } from "@/stores/concursoStore";
import { useAuthStore } from "@/stores/authStore";
import type { ConfigPlanejamento, DisciplinaPlanoInput, NivelConhecimento, PlanoGuiadoResponse, TipoPlanoGuiado } from "@/types/planejamento";

const ETAPAS = ["Origem", "Concurso", "Conteúdo", "Planejamento", "Revisão"];
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const CONHECIMENTO: { value: NivelConhecimento; label: string }[] = [
  { value: "muito_fraco", label: "Muito fraco" }, { value: "fraco", label: "Fraco" },
  { value: "regular", label: "Regular" }, { value: "bom", label: "Bom" }, { value: "muito_bom", label: "Muito bom" },
];

function uuid() { return crypto?.randomUUID?.() ?? `plano-${Date.now()}-${Math.random()}`; }
function isoDate(offset = 0) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }

export function PlanoGuiado() {
  const [searchParams] = useSearchParams();
  const catalogEntry = searchParams.get("origem") === "catalogo";
  const [step, setStep] = React.useState(catalogEntry ? 2 : 1);
  const [tipo, setTipo] = React.useState<TipoPlanoGuiado | null>(catalogEntry ? "catalogo" : null);
  const [busca, setBusca] = React.useState("");
  const buscaCatalogo = React.useDeferredValue(busca.trim());
  const [catalogPage, setCatalogPage] = React.useState(1);
  const [catalogViewMode, setCatalogViewMode] = React.useState<CatalogViewMode>("cards");
  const [editalId, setEditalId] = React.useState<string | null>(null);
  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const [cargoId, setCargoId] = React.useState<string | null>(null);
  const [nome, setNome] = React.useState(""); const [orgao, setOrgao] = React.useState("");
  const [cargoNome, setCargoNome] = React.useState(""); const [banca, setBanca] = React.useState("");
  const [dataProva, setDataProva] = React.useState(""); const [observacoes, setObservacoes] = React.useState("");
  const [disciplinas, setDisciplinas] = React.useState<DisciplinaPlanoInput[]>([]);
  const [novoNome, setNovoNome] = React.useState(""); const [novosTopicos, setNovosTopicos] = React.useState("");
  const [config, setConfig] = React.useState<ConfigPlanejamento>({ tipo: "ciclo", disponibilidade_minutos: { 0: 60, 1: 60, 2: 60, 3: 60, 4: 60 }, sessao_min_minutos: 25, sessao_max_minutos: 50, data_inicio: isoDate(), data_fim: isoDate(90) });
  const [draftCandidate, setDraftCandidate] = React.useState<OnboardingDraft | null>(null);
  const [draftReady, setDraftReady] = React.useState(false);
  const [completedPlan, setCompletedPlan] = React.useState<PlanoGuiadoResponse | null>(null);
  const [stalePreviewOpen, setStalePreviewOpen] = React.useState(false);
  const concursoAtivoId = useConcursoStore((state) => state.concursoAtivoId);
  const previewInputSignature = React.useMemo(
    () => JSON.stringify({ concursoAtivoId, disciplinas: disciplinas.filter((item) => item.ativa), config }),
    [concursoAtivoId, config, disciplinas],
  );
  const previewInputSignatureRef = React.useRef<string | null>(null);
  const currentPreviewInputSignatureRef = React.useRef(previewInputSignature);
  currentPreviewInputSignatureRef.current = previewInputSignature;
  const idempotency = React.useRef<string>(uuid()); const headingRef = React.useRef<HTMLHeadingElement>(null);
  const restoredVersionId = React.useRef<string | null>(null);
  const telemetryJourney = React.useRef(createTelemetryJourney());
  const activationStarted = React.useRef(false);
  const openedCatalogItems = React.useRef(new Set<string>());
  const lastTrackedSearch = React.useRef("");
  const navigate = useNavigate(); const qc = useQueryClient(); const transitionConcurso = useConcursoContextTransition();
  const userScope = useAuthStore((state) => state.user?.id ?? "");

  React.useEffect(() => {
    if (!userScope) return;
    setDraftCandidate(null);
    setDraftReady(false);
    const result = readOnboardingDraft(userScope);
    if (result.status === "available") {
      setDraftCandidate(result.draft);
      return;
    }
    if (result.status === "discarded") toast.info("Um rascunho antigo ou inválido foi descartado com segurança.");
    setDraftReady(true);
  }, [userScope]);

  React.useEffect(() => setCatalogPage(1), [buscaCatalogo]);
  const catalogo = useQuery({ queryKey: ["catalogo-editais", buscaCatalogo, catalogPage], queryFn: () => paginarEditaisPublicados({ search: buscaCatalogo, page: catalogPage, pageSize: 8 }), enabled: tipo === "catalogo" });
  React.useEffect(() => {
    if (catalogo.data && catalogPage > Math.max(1, catalogo.data.total_pages)) setCatalogPage(Math.max(1, catalogo.data.total_pages));
  }, [catalogPage, catalogo.data]);
  React.useEffect(() => {
    if (!buscaCatalogo || !catalogo.data || lastTrackedSearch.current === buscaCatalogo) return;
    lastTrackedSearch.current = buscaCatalogo;
    trackTelemetry("catalog_search_started", { has_filters: true, result_count: catalogo.data.total });
  }, [buscaCatalogo, catalogo.data]);
  const detalhe = useQuery({ queryKey: ["catalogo-edital", editalId], queryFn: () => obterEditalPublicado(editalId!), enabled: Boolean(editalId) });
  const pessoais = useQuery({ queryKey: ["disciplinas", "catalogo-plano"], queryFn: async () => (await api.get<Disciplina[]>("/disciplinas", { params: { include_topicos_stats: true } })).data, enabled: tipo === "personalizado" });
  const edital = detalhe.data ?? catalogo.data?.items.find((item) => item.id === editalId); const versao = edital?.versao_atual; const cargo = versao?.cargos.find((item) => item.id === cargoId);

  const resumeDraft = () => {
    if (!draftCandidate) return;
    setStep(draftCandidate.step);
    setTipo(draftCandidate.tipo);
    setBusca(draftCandidate.busca);
    setEditalId(draftCandidate.editalId);
    setCargoId(draftCandidate.cargoId);
    setNome(draftCandidate.nome);
    setOrgao(draftCandidate.orgao);
    setCargoNome(draftCandidate.cargoNome);
    setBanca(draftCandidate.banca);
    setDataProva(draftCandidate.dataProva);
    setObservacoes(draftCandidate.observacoes);
    setDisciplinas(draftCandidate.disciplinas);
    setConfig(draftCandidate.config);
    idempotency.current = draftCandidate.idempotencyKey;
    restoredVersionId.current = draftCandidate.versionId;
    setDraftCandidate(null);
    setDraftReady(true);
    activationStarted.current = true;
    const resumedStep = (["contest", "contest", "subjects", "planning", "planning"] as const)[draftCandidate.step - 1];
    telemetryJourney.current.track("activation_resumed", {
      step: resumedStep,
      step_position: draftCandidate.step,
    });
    toast.success("Rascunho retomado. Confira os dados antes de confirmar.");
  };

  const discardDraft = () => {
    clearOnboardingDraft(userScope);
    setDraftCandidate(null);
    setDraftReady(true);
    toast.info("Rascunho descartado.");
  };

  React.useEffect(() => {
    if (!draftReady || !userScope || completedPlan) return;
    const hasProgress = Boolean(nome.trim() || editalId || disciplinas.length);
    if (!hasProgress) return;
    const timer = window.setTimeout(() => {
      saveOnboardingDraft(userScope, {
        idempotencyKey: idempotency.current,
        step,
        tipo,
        busca,
        editalId,
        versionId: versao?.id ?? restoredVersionId.current,
        cargoId,
        nome,
        orgao,
        cargoNome,
        banca,
        dataProva,
        observacoes,
        disciplinas,
        config,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [banca, busca, cargoId, cargoNome, completedPlan, config, dataProva, disciplinas, draftReady, editalId, nome, observacoes, orgao, step, tipo, userScope, versao?.id]);

  React.useEffect(() => {
    if (!draftReady || !restoredVersionId.current || !detalhe.data) return;
    const versionIsAvailable = detalhe.data.versao_atual?.id === restoredVersionId.current;
    const cargoIsAvailable = detalhe.data.versao_atual?.cargos.some((item) => item.id === cargoId);
    restoredVersionId.current = null;
    if (versionIsAvailable && cargoIsAvailable) return;
    setStep(2);
    setCargoId(null);
    setDisciplinas([]);
    telemetryJourney.current.track("activation_failed", { stage: "details", error_code: "unavailable" });
    toast.warning("A versão ou o cargo do rascunho não está mais disponível. Faça uma nova seleção.");
  }, [cargoId, detalhe.data, draftReady]);

  const preview = useMutation({
    mutationFn: (_inputSignature: string) => previewPlanejamento(disciplinas.filter((d) => d.ativa), config),
    onSuccess: (result, inputSignature) => {
      previewInputSignatureRef.current = inputSignature;
      telemetryJourney.current.track("plan_preview_generated", {
        planning_type: config.tipo === "semanal" ? "weekly" : "cycle",
        block_count: result.sessoes.length,
        total_minutes: result.minutos_totais,
      });
    },
    onError: (error) => {
      if (!planejamentoCapacidadeDiagnostico(error)) toast.error("Revise a disponibilidade e as durações das sessões.");
    },
  });
  const isPreviewCurrent = Boolean(
    preview.data
    && previewInputSignatureRef.current === previewInputSignature,
  );
  const confirm = useMutation({
    mutationFn: () => confirmarPlanoGuiado({ tipo_plano: tipo!, nome, orgao, cargo: cargoNome || null, banca: banca || null, data_prova: dataProva || null, observacoes: observacoes || null, catalogo: tipo === "catalogo" ? { edital_id: edital!.id, version_id: versao!.id, cargo_id: cargo!.id } : null, disciplinas: disciplinas.filter((d) => d.ativa), planejamento: config, idempotency_key: idempotency.current, preview_fingerprint: isPreviewCurrent ? preview.data?.preview_fingerprint : undefined }),
    onSuccess: async (result) => {
      telemetryJourney.current.track("plan_confirmed", {
        planning_type: config.tipo === "semanal" ? "weekly" : "cycle",
        block_count: result.preview.sessoes.length,
        total_minutes: result.preview.minutos_totais,
      });
      telemetryJourney.current.track("activation_completed", {
        activation_mode: tipo === "catalogo" ? "catalog" : "manual",
        subject_count: result.disciplinas_criadas,
        topic_count: result.topicos_criados,
      });
      await Promise.all([qc.invalidateQueries({ queryKey: ["concursos"] }), qc.invalidateQueries({ queryKey: ["disciplinas"] })]);
      await transitionConcurso(result.concurso_id, tipo === "catalogo" ? "catalog" : "settings");
      clearOnboardingDraft(userScope);
      toast.success("Plano criado e pronto para estudar.");
      setCompletedPlan(result);
    },
    onError: (error) => {
      const errorCode = telemetryErrorCode(error);
      telemetryJourney.current.track("plan_confirmation_failed", { error_code: errorCode });
      telemetryJourney.current.track("activation_failed", { stage: "confirmation", error_code: errorCode });
      if (isPlanejamentoPreviewDesatualizado(error)) {
        preview.reset();
        setStalePreviewOpen(true);
        return;
      }
      toast.error("Não foi possível criar o plano. Suas escolhas foram mantidas.");
    },
  });

  const previewDataForInvalidation = preview.data;
  const resetPreview = preview.reset;
  React.useEffect(() => {
    if (previewDataForInvalidation && previewInputSignatureRef.current !== previewInputSignature) resetPreview();
  }, [previewDataForInvalidation, previewInputSignature, resetPreview]);
  const capacityDiagnostic = planejamentoCapacidadeDiagnostico(preview.error);

  React.useEffect(() => { headingRef.current?.focus(); }, [step, completedPlan]);
  const ensureActivationStarted = (mode: TipoPlanoGuiado) => {
    if (activationStarted.current) return;
    activationStarted.current = true;
    telemetryJourney.current.track("activation_started", {
      activation_mode: mode === "catalogo" ? "catalog" : "manual",
      entry_state: useConcursoStore.getState().concursoAtivoId ? "has_contest" : "no_contest",
    });
  };
  const selectOrigin = (mode: TipoPlanoGuiado) => {
    if (mode === "personalizado") ensureActivationStarted(mode);
    setTipo(mode);
    setDisciplinas([]);
  };
  const ensureCatalogItemOpened = (id: string) => {
    if (openedCatalogItems.current.has(id)) return;
    openedCatalogItems.current.add(id);
    const startedNow = trackCatalogItemForActivation(telemetryJourney.current, {
      activationStarted: activationStarted.current,
      entryState: useConcursoStore.getState().concursoAtivoId ? "has_contest" : "no_contest",
    });
    if (startedNow) activationStarted.current = true;
  };
  const selecionarEdital = (id: string) => { ensureCatalogItemOpened(id); setEditalId(id); setCargoId(null); setDisciplinas([]); };
  const openCatalogDetails = (id: string) => { ensureCatalogItemOpened(id); setDetailsId(id); };
  const selecionarCargo = (id: string) => { const selected = versao?.cargos.find((item) => item.id === id); if (!selected || !edital) return; setCargoId(id); setNome(edital.nome); setOrgao(edital.orgao); setBanca(edital.banca ?? ""); setCargoNome(selected.nome); setDataProva(versao?.data_prova ?? ""); setDisciplinas(selected.disciplinas.map((d, ordem) => ({ disciplina_id: d.id, nome: d.nome, sigla: d.sigla, topicos: d.topicos.map((t) => t.descricao), ativa: true, peso: 5, conhecimento: "regular", ordem }))); };
  const togglePessoal = (d: Disciplina) => setDisciplinas((items) => items.some((x) => x.disciplina_id === d.id) ? items.filter((x) => x.disciplina_id !== d.id) : [...items, { disciplina_id: d.id, nome: d.nome, sigla: d.sigla, topicos: [], ativa: true, peso: 5, conhecimento: "regular", ordem: items.length }]);
  const adicionarDisciplina = () => { if (!novoNome.trim()) return; setDisciplinas((items) => [...items, { nome: novoNome.trim(), topicos: novosTopicos.split(/\r?\n/).map((x) => x.trim()).filter(Boolean), ativa: true, peso: 5, conhecimento: "regular", ordem: items.length }]); setNovoNome(""); setNovosTopicos(""); };
  const updateDisc = (index: number, patch: Partial<DisciplinaPlanoInput>) => setDisciplinas((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const moverDisc = (index: number, delta: number) => setDisciplinas((items) => { const target = index + delta; if (target < 0 || target >= items.length) return items; const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next.map((item, ordem) => ({ ...item, ordem })); });
  const canNext = step === 1 ? Boolean(tipo) : step === 2 ? (tipo === "catalogo" ? Boolean(cargoId) : Boolean(nome.trim() && orgao.trim())) : step === 3 ? disciplinas.some((d) => d.ativa) : step === 4 ? Object.values(config.disponibilidade_minutos).some((m) => m > 0) && config.sessao_max_minutos >= config.sessao_min_minutos : true;
  const next = () => {
    if (!tipo) return;
    if (tipo === "personalizado" || openedCatalogItems.current.size > 0) ensureActivationStarted(tipo);
    const completedSteps = ["contest", "details", "subjects", "planning"] as const;
    const completed = completedSteps[step - 1];
    if (completed) telemetryJourney.current.track("activation_step_completed", { step: completed, step_position: step, total_steps: 5 });
    if (step === 4) {
      preview.mutate(previewInputSignature, {
        onSuccess: (_result, inputSignature) => {
          if (inputSignature === currentPreviewInputSignatureRef.current) setStep(5);
        },
      });
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  };
  const compactCatalogJourney = tipo === "catalogo" && step >= 2;
  const visibleSteps = compactCatalogJourney ? ETAPAS.slice(1) : ETAPAS;
  const visibleStep = compactCatalogJourney ? step - 1 : step;

  if (draftCandidate) {
    return <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <header><h1 className="text-2xl font-bold">Continuar configuração</h1><p className="mt-1 text-sm text-muted-foreground">Encontramos um progresso salvo neste dispositivo.</p></header>
      <Alert className="grid-cols-[auto_1fr] p-5">
        <Sparkles className="text-primary" />
        <AlertTitle>Retomar seu plano em andamento?</AlertTitle>
        <AlertDescription>
          <p>Você parou na etapa {draftCandidate.step} de 5. O rascunho é exclusivo da sua conta e ainda não criou ou alterou nenhum concurso.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={resumeDraft}>Retomar rascunho</Button>
            <Button type="button" variant="outline" onClick={discardDraft}>Descartar e começar novamente</Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>;
  }

  if (completedPlan) {
    return <div className="mx-auto max-w-3xl pb-8">
      <section className="rounded-2xl border border-success/30 bg-card p-6 text-center shadow-sm sm:p-10" aria-live="polite">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success"><CircleCheck className="h-7 w-7" /></span>
        <h1 ref={headingRef} tabIndex={-1} className="mt-5 text-2xl font-bold outline-none">Seu plano está pronto</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Criamos {completedPlan.sessoes_planejadas} sessões com {completedPlan.disciplinas_criadas} disciplinas. Confira sua próxima atividade e comece a estudar.</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button type="button" onClick={() => navigate("/dashboard")}>Ver próxima ação <ArrowRight /></Button>
          <Button asChild variant="outline"><Link to="/cronograma">Revisar cronograma</Link></Button>
        </div>
      </section>
    </div>;
  }

  return <div className="mx-auto max-w-6xl space-y-6 pb-28 sm:pb-8">
    <header><Link to="/concursos" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Meus concursos</Link><h1 ref={headingRef} tabIndex={-1} className="mt-2 text-2xl font-bold outline-none">Criar plano de estudos<span className="sr-only"> — etapa {visibleStep}: {visibleSteps[visibleStep - 1]}</span></h1><p className="mt-1 text-sm text-muted-foreground">Monte o conteúdo, informe sua rotina e receba um planejamento pronto.</p></header>
    <ol className={cn("grid gap-2", compactCatalogJourney ? "grid-cols-4" : "grid-cols-5")} aria-label="Etapas do plano">{visibleSteps.map((label, i) => <li key={label} aria-current={visibleStep === i + 1 ? "step" : undefined} className={cn("rounded-lg border px-2 py-3 text-center text-xs font-semibold", visibleStep === i + 1 ? "border-primary bg-primary-muted text-primary" : visibleStep > i + 1 ? "border-success/40 bg-success/10" : "border-border text-muted-foreground")}><span className="mr-1 hidden sm:inline">{visibleStep > i + 1 ? "✓" : i + 1}.</span>{label}</li>)}</ol>
    <main className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6" aria-live="polite">
      {step === 1 && <section><StepTitle title="Como você quer começar?" text="Use um edital pronto ou monte um plano personalizado com suas disciplinas." /><div className="mt-5 grid gap-4 sm:grid-cols-2">{([{ id: "catalogo", title: "Escolher edital publicado", text: "Cargo, disciplinas e tópicos já verticalizados." }, { id: "personalizado", title: "Criar plano personalizado", text: "Aproveite disciplinas existentes ou cadastre novas." }] as const).map((option) => <button key={option.id} type="button" aria-pressed={tipo === option.id} onClick={() => selectOrigin(option.id)} className={cn("min-h-32 rounded-xl border p-5 text-left focus-visible:ring-2 focus-visible:ring-ring", tipo === option.id ? "border-primary bg-primary-muted ring-1 ring-primary" : "border-border hover:border-primary/50")}><Sparkles className="h-6 w-6 text-primary" /><strong className="mt-3 block">{option.title}</strong><span className="mt-1 block text-sm text-muted-foreground">{option.text}</span></button>)}</div></section>}
      {step === 2 && tipo === "catalogo" && <section><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><StepTitle title="Escolha o concurso e o cargo" text="Pesquise no catálogo de versões revisadas e publicadas." /><CatalogViewToggle value={catalogViewMode} onValueChange={setCatalogViewMode} /></div><label className="relative mt-5 block"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><span className="sr-only">Buscar edital</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar concurso, órgão, banca ou cargo" className="min-h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3" /></label>{catalogo.data?.items.length ? <PublicCatalogResults items={catalogo.data.items} selectedId={editalId} viewMode={catalogViewMode} onSelect={selecionarEdital} onViewDetails={openCatalogDetails} /> : null}{catalogo.isLoading && <p role="status" className="py-8 text-center text-sm text-muted-foreground">Carregando editais…</p>}{catalogo.isError && <Alert variant="destructive" className="mt-5"><Search /><AlertTitle>Não foi possível carregar o catálogo</AlertTitle><AlertDescription><Button type="button" variant="outline" className="mt-3" onClick={() => void catalogo.refetch()}>Tentar novamente</Button></AlertDescription></Alert>}{catalogo.data?.items.length ? <div className="mt-5"><CatalogPagination page={catalogo.data.page} totalPages={catalogo.data.total_pages} total={catalogo.data.total} onPageChange={setCatalogPage} /></div> : null}{!catalogo.isLoading && !catalogo.isError && !catalogo.data?.items.length ? <div className="py-10 text-center"><p className="text-sm text-muted-foreground">Nenhum edital corresponde à busca.</p><Button asChild variant="outline" className="mt-4"><Link to="/concursos?novo=manual">Cadastrar concurso manualmente</Link></Button></div> : null}{editalId && <div className="mt-6"><h3 className="font-semibold">Cargo ou especialidade</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{versao?.cargos.map((item) => <button type="button" role="radio" aria-checked={cargoId === item.id} key={item.id} onClick={() => selecionarCargo(item.id)} className={cn("rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", cargoId === item.id ? "border-primary bg-primary-muted" : "border-border")}><strong>{item.nome}</strong><span className="mt-1 block text-xs text-muted-foreground">{item.disciplinas.length} disciplinas</span></button>)}</div></div>}</section>}
      {step === 2 && tipo === "personalizado" && <section><StepTitle title="Identifique seu plano" text="Essas informações ajudam a separar seus objetivos e histórico." /><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nome do concurso ou plano"><input value={nome} onChange={(e) => setNome(e.target.value)} className="input-base" /></Field><Field label="Órgão"><input value={orgao} onChange={(e) => setOrgao(e.target.value)} className="input-base" /></Field><Field label="Cargo (opcional)"><input value={cargoNome} onChange={(e) => setCargoNome(e.target.value)} className="input-base" /></Field><Field label="Banca (opcional)"><input value={banca} onChange={(e) => setBanca(e.target.value)} className="input-base" /></Field><Field label="Data da prova (opcional)"><DatePicker value={dataProva} onValueChange={setDataProva} /></Field><Field label="Observações (opcional)"><textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} className="input-base" /></Field></div></section>}
      {step === 3 && <section><StepTitle title="Escolha disciplinas e tópicos" text={tipo === "catalogo" ? "O edital trouxe o conteúdo abaixo. Desmarque o que não fará parte deste plano." : "Reaproveite disciplinas ou adicione conteúdo novo."} />{tipo === "catalogo" && <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Data da prova (opcional)"><DatePicker value={dataProva} onValueChange={setDataProva} /></Field><Field label="Observações (opcional)"><textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="input-base" /></Field></div>}{tipo === "personalizado" && <><div className="mt-5 grid gap-2 sm:grid-cols-2">{pessoais.data?.map((d) => <label key={d.id} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-border p-3"><Checkbox checked={disciplinas.some((x) => x.disciplina_id === d.id)} onCheckedChange={() => togglePessoal(d)} /><span><strong className="block text-sm">{d.nome}</strong><small className="text-muted-foreground">{d.topicos_total ?? 0} tópicos cadastrados</small></span></label>)}</div><div className="mt-6 rounded-xl border border-dashed border-border p-4"><h3 className="font-semibold">Adicionar nova disciplina</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Nome"><input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} className="input-base" /></Field><Field label="Tópicos (um por linha)"><textarea value={novosTopicos} onChange={(e) => setNovosTopicos(e.target.value)} rows={3} className="input-base" /></Field></div><Button type="button" variant="outline" onClick={adicionarDisciplina} disabled={!novoNome.trim()}><Plus /> Adicionar disciplina</Button></div></>}
        <div className="mt-5 space-y-2">{disciplinas.map((d, i) => <div key={d.disciplina_id ?? `${d.nome}-${i}`} className="flex items-start gap-3 rounded-xl border border-border p-4"><Checkbox className="mt-3" checked={d.ativa} onCheckedChange={(v) => updateDisc(i, { ativa: Boolean(v) })} /><div className="min-w-0 flex-1">{tipo === "personalizado" && !d.disciplina_id ? <><input aria-label="Nome da disciplina" value={d.nome} onChange={(e) => updateDisc(i, { nome: e.target.value })} className="input-base font-semibold" /><textarea aria-label={`Tópicos de ${d.nome}`} value={d.topicos.join("\n")} onChange={(e) => updateDisc(i, { topicos: e.target.value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean) })} rows={2} className="input-base mt-2" /></> : <><strong className="block">{d.nome}</strong><small className="text-muted-foreground">{d.topicos.length ? `${d.topicos.length} tópicos` : "Tópicos já cadastrados"}</small></>}</div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" disabled={i === 0} aria-label={`Mover ${d.nome} para cima`} onClick={() => moverDisc(i, -1)}><ArrowUp /></Button><Button variant="ghost" size="icon" disabled={i === disciplinas.length - 1} aria-label={`Mover ${d.nome} para baixo`} onClick={() => moverDisc(i, 1)}><ArrowDown /></Button>{tipo === "personalizado" && !d.disciplina_id && <Button variant="ghost" size="icon" aria-label={`Remover ${d.nome}`} onClick={() => setDisciplinas((items) => items.filter((_, index) => index !== i).map((item, ordem) => ({ ...item, ordem }))) }><Trash2 /></Button>}</div></div>)}</div></section>}
      {step === 4 && <section><StepTitle title="Como organizar seus estudos?" text="A prioridade considera peso × dificuldade. Quanto menor seu domínio, maior a frequência sugerida." /><div className="mt-5 space-y-3">{disciplinas.filter((d) => d.ativa).map((d) => { const i = disciplinas.indexOf(d); return <div key={d.disciplina_id ?? d.nome} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1fr_140px_180px]"><strong className="self-center">{d.nome}</strong><Field label="Peso (1–10)"><input type="number" min={1} max={10} value={d.peso} onChange={(e) => updateDisc(i, { peso: Number(e.target.value) })} className="input-base" /></Field><Field label="Seu conhecimento"><SelectField value={d.conhecimento} onValueChange={(value) => updateDisc(i, { conhecimento: value as NivelConhecimento })} options={CONHECIMENTO} /></Field></div>})}</div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Formato"><SelectField value={config.tipo} onValueChange={(value) => setConfig({ ...config, tipo: value as "ciclo" | "semanal" })} options={[{ value: "ciclo", label: "Ciclo de estudos" }, { value: "semanal", label: "Grade semanal" }]} /></Field><div /><Field label="Data de início"><DatePicker value={config.data_inicio} onValueChange={(value) => setConfig({ ...config, data_inicio: value })} /></Field><Field label="Planejar até"><DatePicker value={config.data_fim} onValueChange={(value) => setConfig({ ...config, data_fim: value })} /></Field><Field label="Sessão mínima (min)"><input type="number" min={5} max={240} value={config.sessao_min_minutos} onChange={(e) => setConfig({ ...config, sessao_min_minutos: Number(e.target.value) })} className="input-base" /></Field><Field label="Sessão máxima (min)"><input type="number" min={5} max={240} value={config.sessao_max_minutos} onChange={(e) => setConfig({ ...config, sessao_max_minutos: Number(e.target.value) })} className="input-base" /></Field></div><fieldset className="mt-6"><legend className="font-semibold">Disponibilidade por dia</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{DIAS.map((dia, i) => <Field key={dia} label={dia}><div className="flex items-center gap-1"><input aria-label={`Horas de ${dia}`} type="number" min={0} max={23} value={Math.floor((config.disponibilidade_minutos[i] ?? 0) / 60)} onChange={(e) => setConfig({ ...config, disponibilidade_minutos: { ...config.disponibilidade_minutos, [i]: Number(e.target.value) * 60 + ((config.disponibilidade_minutos[i] ?? 0) % 60) } })} className="input-base px-2" /><span className="text-xs">h</span><input aria-label={`Minutos de ${dia}`} type="number" min={0} max={59} value={(config.disponibilidade_minutos[i] ?? 0) % 60} onChange={(e) => setConfig({ ...config, disponibilidade_minutos: { ...config.disponibilidade_minutos, [i]: Math.floor((config.disponibilidade_minutos[i] ?? 0) / 60) * 60 + Number(e.target.value) } })} className="input-base px-2" /><span className="text-xs">m</span></div></Field>)}</div></fieldset></section>}
      {step === 5 && <section>
        <StepTitle title="Seu plano está pronto para confirmar" text="Revise a distribuição. Nenhuma alteração será criada antes da sua confirmação." />
        {preview.isPending && <p role="status" className="py-12 text-center">Calculando melhor distribuição…</p>}
        {isPreviewCurrent && preview.data && <>
          {tipo === "catalogo" && edital ? <div className="mt-5 flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">{edital.logo_url ? <img src={edital.logo_url} alt={`Logo de ${edital.orgao}`} className="h-full w-full object-contain p-2" /> : <Sparkles className="h-6 w-6 text-primary" />}</div><div className="min-w-0"><strong className="block text-base">{edital.nome}</strong><p className="mt-1 text-sm text-muted-foreground">{edital.orgao}{edital.banca ? ` · ${edital.banca}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">{cargoNome}{dataProva ? ` · prova em ${new Date(`${dataProva}T12:00:00`).toLocaleDateString("pt-BR")}` : ""}</p></div></div> : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><Summary label="Plano" value={nome} /><Summary label="Cargo" value={cargoNome || "Não informado"} /><Summary label="Conteúdo" value={`${disciplinas.filter((d) => d.ativa).length} disciplinas · ${disciplinas.filter((d) => d.ativa).reduce((sum, d) => sum + d.topicos.length, 0)} tópicos`} /></div>
          <PlanejamentoExplicacao preview={preview.data} />
          <div className="mt-5 max-h-80 overflow-auto rounded-xl border border-border"><h3 className="border-b border-border px-3 py-2 text-sm font-semibold">Próximas sessões</h3><ul className="divide-y divide-border">{preview.data.sessoes.slice(0, 40).map((s, i) => <li key={`${s.data}-${s.ordem}-${i}`} className="flex items-center gap-3 p-3 text-sm"><CalendarClock className="h-4 w-4 text-primary" /><span className="flex-1"><strong>{s.disciplina_nome}</strong><span className="ml-2 text-muted-foreground">{new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")}</span></span><span>{s.duracao_minutos} min</span></li>)}</ul>{preview.data.sessoes.length > 40 && <p className="p-3 text-center text-xs text-muted-foreground">Mais {preview.data.sessoes.length - 40} sessões serão criadas.</p>}</div>
        </>}
      </section>}
      {step === 4 && capacityDiagnostic ? <PlanejamentoCapacidadeAlert diagnostico={capacityDiagnostic} /> : null}
    </main>
    <CatalogDetailsDialog editalId={detailsId} scope="public" open={Boolean(detailsId)} onOpenChange={(open) => { if (!open) setDetailsId(null); }} />
    <PlanejamentoPreviewStaleDialog open={stalePreviewOpen} onOpenChange={setStalePreviewOpen} onReview={() => { setStalePreviewOpen(false); setStep(4); }} onRegenerate={() => { setStalePreviewOpen(false); preview.mutate(previewInputSignature); }} />
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0"><div className="mx-auto flex max-w-6xl justify-between gap-3"><Button className="min-h-11" variant="outline" disabled={step === 1 || confirm.isPending} onClick={() => setStep((s) => Math.max(1, s - 1))}><ArrowLeft /> Voltar</Button>{step < 5 ? <Button className="min-h-11" disabled={!canNext || preview.isPending} onClick={next}>Continuar <ArrowRight /></Button> : <Button className="min-h-11" disabled={confirm.isPending || !isPreviewCurrent || !preview.data?.explicacao.confirmavel} onClick={() => confirm.mutate()}>{confirm.isPending ? "Criando plano…" : <><Check /> Confirmar e ativar</>}</Button>}</div></footer>
  </div>;
}

function StepTitle({ title, text }: { title: string; text: string }) { return <div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-medium"><span className="mb-1.5 block">{label}</span>{children}</label>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-muted/30 p-4"><span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span><strong className="mt-1 block">{value}</strong></div>; }
