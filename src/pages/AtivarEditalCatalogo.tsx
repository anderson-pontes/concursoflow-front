import React from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AtivacaoStepper } from "@/components/editais/AtivacaoStepper";
import { CatalogDiscovery } from "@/components/editais/CatalogDiscovery";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useConcursoContextTransition } from "@/hooks/useConcursoContextTransition";
import { ativarEdital, obterEditalPublicado } from "@/services/editaisCatalogo";
import { createTelemetryJourney, telemetryErrorCode, trackTelemetry } from "@/services/telemetry";
import { useConcursoStore } from "@/stores/concursoStore";
import type { EditalCargoCatalogo } from "@/types/editaisCatalogo";

function makeIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `ativacao-${Date.now()}-${Math.random()}`;
}

export function AtivarEditalCatalogo() {
  const [step, setStep] = React.useState(1);
  const [editalId, setEditalId] = React.useState<string | null>(null);
  const [cargoId, setCargoId] = React.useState<string | null>(null);
  const [disciplinas, setDisciplinas] = React.useState<string[]>([]);
  const [selectionAlert, setSelectionAlert] = React.useState<string | null>(null);
  const [selectionValidation, setSelectionValidation] = React.useState<"idle" | "validating" | "valid" | "error">("idle");
  const idempotencyKey = React.useRef(makeIdempotencyKey());
  const telemetryJourney = React.useRef(createTelemetryJourney());
  const activationStarted = React.useRef(false);
  const openedCatalogItems = React.useRef(new Set<string>());
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const transitionConcurso = useConcursoContextTransition();

  const detailQuery = useQuery({ queryKey: ["catalogo-edital", editalId], queryFn: () => obterEditalPublicado(editalId!), enabled: Boolean(editalId) });
  const edital = detailQuery.data ?? null;
  const versao = edital?.versao_atual ?? null;
  const cargo = versao?.cargos.find((item) => item.id === cargoId) ?? null;

  React.useEffect(() => { titleRef.current?.focus(); }, [step]);

  const activation = useMutation({
    mutationFn: () => ativarEdital({ templateId: edital!.id, versionId: versao!.id, cargoId: cargo!.id, disciplinaIds: disciplinas, idempotencyKey: idempotencyKey.current }),
    onSuccess: async (result) => {
      await Promise.all([qc.invalidateQueries({ queryKey: ["concursos"] }), qc.invalidateQueries({ queryKey: ["disciplinas"] })]);
      await transitionConcurso(result.concurso_id, "catalog");
      telemetryJourney.current.track("activation_completed", {
        activation_mode: "catalog",
        subject_count: result.disciplinas_criadas,
        topic_count: result.topicos_criados,
      });
      toast.success(`Plano ativado com ${result.disciplinas_criadas} disciplinas e ${result.topicos_criados} tópicos.`);
      navigate("/disciplinas");
    },
    onError: (error) => {
      telemetryJourney.current.track("activation_failed", {
        stage: "confirmation",
        error_code: telemetryErrorCode(error),
      });
    },
  });

  const ensureCatalogItemOpened = (id: string) => {
    if (openedCatalogItems.current.has(id)) return;
    openedCatalogItems.current.add(id);
    telemetryJourney.current.track("catalog_item_opened", { source: "search_results" });
  };
  const ensureActivationStarted = () => {
    if (activationStarted.current) return;
    activationStarted.current = true;
    telemetryJourney.current.track("activation_started", {
      activation_mode: "catalog",
      entry_state: useConcursoStore.getState().concursoAtivoId ? "has_contest" : "no_contest",
    });
  };
  const selectEdital = (id: string) => {
    ensureCatalogItemOpened(id);
    ensureActivationStarted();
    setEditalId(id);
    setCargoId(null);
    setDisciplinas([]);
    setSelectionAlert(null);
  };
  const clearCatalogSelection = () => { setEditalId(null); setCargoId(null); setDisciplinas([]); setSelectionAlert(null); };
  React.useEffect(() => {
    if (!editalId || !detailQuery.isError || !isAxiosError(detailQuery.error) || detailQuery.error.response?.status !== 404) return;
    clearCatalogSelection();
    setStep(1);
    setSelectionAlert("Este edital não está mais disponível. Escolha outro edital para continuar.");
  }, [detailQuery.error, detailQuery.isError, editalId]);
  const selectCargo = (next: EditalCargoCatalogo) => { setCargoId(next.id); setDisciplinas(next.disciplinas.map((item) => item.id)); };
  const canContinue = step === 1 ? Boolean(edital && versao && selectionValidation === "valid") : step === 2 ? Boolean(cargoId) : step === 3 ? disciplinas.length > 0 : true;
  const advanceStep = () => {
    ensureActivationStarted();
    const completedSteps = ["contest", "details", "subjects"] as const;
    const completed = completedSteps[step - 1];
    if (completed) {
      telemetryJourney.current.track("activation_step_completed", {
        step: completed,
        step_position: step,
        total_steps: 4,
      });
    }
    setStep((value) => Math.min(4, value + 1));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-28 sm:pb-8">
      <header><Link to="/concursos" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar aos meus concursos</Link><h1 ref={titleRef} tabIndex={-1} className="mt-2 text-2xl font-bold tracking-tight outline-none">Ativar edital verticalizado</h1><p className="mt-1 text-sm text-muted-foreground">Escolha o conteúdo e receba seu plano pronto para estudar.</p></header>
      <AtivacaoStepper current={step} />

      <main className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        {step === 1 ? <section aria-labelledby="step-title"><h2 id="step-title" className="text-lg font-semibold">Qual edital você está estudando?</h2><p className="mt-1 text-sm text-muted-foreground">Consulte versões revisadas e publicadas pelo ClickEdital.</p><CatalogDiscovery selectedId={editalId} selectedEdital={edital} selectionAlert={selectionAlert ?? (detailQuery.isError ? "Não foi possível validar este edital agora. Tente selecionar novamente." : null)} onSelect={selectEdital} onSelectionInvalidated={clearCatalogSelection} onSelectionValidationChange={setSelectionValidation} onItemOpened={ensureCatalogItemOpened} onSearchResult={(total, context) => trackTelemetry("catalog_search_started", { has_filters: context.hasFilters, filter_count: context.filterCount, result_count: total })} /></section> : null}

        {step === 2 ? <section aria-labelledby="step-title"><h2 id="step-title" className="text-lg font-semibold">Escolha seu cargo ou especialidade</h2><p className="mt-1 text-sm text-muted-foreground">{edital?.nome}</p>{detailQuery.isLoading ? <p className="py-16 text-center text-sm text-muted-foreground" role="status">Carregando cargos…</p> : null}{detailQuery.isError ? <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">Não foi possível carregar os cargos.</p> : null}<div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Cargo do edital">{versao?.cargos.map((item) => <button key={item.id} type="button" role="radio" aria-checked={cargoId === item.id} onClick={() => selectCargo(item)} className={cn("min-h-24 rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", cargoId === item.id ? "border-primary bg-primary-muted ring-1 ring-primary" : "border-border hover:border-primary/50")}><strong className="block">{item.nome}</strong><span className="mt-2 block text-sm text-muted-foreground">{item.disciplinas.length} disciplinas · {item.disciplinas.reduce((sum, disc) => sum + (disc.topicos_total ?? disc.topicos.length), 0)} tópicos</span></button>)}</div></section> : null}

        {step === 3 && cargo ? <section aria-labelledby="step-title"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 id="step-title" className="text-lg font-semibold">Escolha as disciplinas</h2><p className="mt-1 text-sm text-muted-foreground">Todas começam selecionadas. Você poderá ajustar depois.</p></div><Button variant="outline" className="min-h-11" onClick={() => setDisciplinas(disciplinas.length === cargo.disciplinas.length ? [] : cargo.disciplinas.map((item) => item.id))}>{disciplinas.length === cargo.disciplinas.length ? "Desmarcar todas" : "Selecionar todas"}</Button></div><div className="mt-5 space-y-2">{cargo.disciplinas.map((disciplina) => { const checked = disciplinas.includes(disciplina.id); return <label key={disciplina.id} className={cn("flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-4", checked ? "border-primary/50 bg-primary-muted" : "border-border hover:bg-muted/30")}><Checkbox checked={checked} onCheckedChange={() => setDisciplinas((items) => checked ? items.filter((id) => id !== disciplina.id) : [...items, disciplina.id])} /><span className="min-w-0 flex-1"><strong className="block">{disciplina.nome}</strong><span className="text-xs text-muted-foreground">{disciplina.topicos_total ?? disciplina.topicos.length} tópicos{disciplina.sigla ? ` · ${disciplina.sigla}` : ""}</span></span></label>; })}</div><p className="mt-4 text-sm font-medium" aria-live="polite">{disciplinas.length} de {cargo.disciplinas.length} disciplinas selecionadas</p>{!disciplinas.length ? <p role="alert" className="mt-2 text-sm text-destructive">Selecione pelo menos uma disciplina para continuar.</p> : null}</section> : null}

        {step === 4 && edital && cargo ? <section aria-labelledby="step-title"><h2 id="step-title" className="text-lg font-semibold">Revise seu novo plano</h2><p className="mt-1 text-sm text-muted-foreground">Nada será alterado nos seus concursos atuais.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><Summary label="Edital" value={edital.nome} /><Summary label="Cargo" value={cargo.nome} /><Summary label="Conteúdo" value={`${disciplinas.length} disciplinas · ${cargo.disciplinas.filter((item) => disciplinas.includes(item.id)).reduce((sum, item) => sum + (item.topicos_total ?? item.topicos.length), 0)} tópicos`} /></div><div className="mt-5 rounded-xl border border-border"><ul className="divide-y divide-border">{cargo.disciplinas.filter((item) => disciplinas.includes(item.id)).map((item) => <li key={item.id} className="flex items-center gap-3 p-3 text-sm"><CheckCircle2 className="h-4 w-4 text-success" /><span className="flex-1 font-medium">{item.nome}</span><span className="text-xs text-muted-foreground">{item.topicos_total ?? item.topicos.length} tópicos</span></li>)}</ul></div>{activation.isError ? <div role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Não foi possível ativar o plano. Sua seleção foi mantida; tente novamente.</div> : null}</section> : null}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3"><Button variant="outline" className="min-h-11" disabled={step === 1 || activation.isPending} onClick={() => setStep((value) => Math.max(1, value - 1))}><ArrowLeft /> Voltar</Button>{step < 4 ? <Button className="min-h-11" disabled={!canContinue || (step === 1 && detailQuery.isLoading)} onClick={advanceStep}>Continuar <ArrowRight /></Button> : <Button className="min-h-11 px-5" disabled={activation.isPending} onClick={() => activation.mutate()}>{activation.isPending ? "Criando seu plano…" : "Criar e ativar plano"}</Button>}</div></footer>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-muted/30 p-4"><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span><strong className="mt-1 block text-sm">{value}</strong></div>; }
