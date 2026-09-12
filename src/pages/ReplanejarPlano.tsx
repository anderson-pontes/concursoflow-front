import React from "react";
import { ArrowLeft, CalendarClock, Check, RefreshCw, ShieldCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlanejamentoCapacidadeAlert, PlanejamentoExplicacao, PlanejamentoPreviewStaleDialog } from "@/components/planejamento/PlanejamentoExplicacao";
import { ReplanejamentoComparativo } from "@/components/planejamento/ReplanejamentoComparativo";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { isPlanejamentoComparativoDesatualizado, planejamentoCapacidadeDiagnostico } from "@/lib/planejamento/errors";
import {
  compararReplanejamento,
  obterPlanejamentoAtual,
  recalcularPlano,
} from "@/services/planejamento";
import type {
  ConfigPlanejamento,
  DisciplinaPlanoInput,
  NivelConhecimento,
  PlanejamentoPreview,
  PlanejamentoComparativo,
} from "@/types/planejamento";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const CONHECIMENTO: Array<{ value: NivelConhecimento; label: string }> = [
  { value: "muito_fraco", label: "Muito fraco" },
  { value: "fraco", label: "Fraco" },
  { value: "regular", label: "Regular" },
  { value: "bom", label: "Bom" },
  { value: "muito_bom", label: "Muito bom" },
];

function newKey() {
  return crypto?.randomUUID?.() ?? `replanejar-${Date.now()}`;
}

export function ReplanejarPlano() {
  const { concursoId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const idempotencyKey = React.useRef(newKey());
  const [disciplinas, setDisciplinas] = React.useState<DisciplinaPlanoInput[]>([]);
  const [config, setConfig] = React.useState<ConfigPlanejamento | null>(null);
  const [preview, setPreview] = React.useState<PlanejamentoPreview | null>(null);
  const [comparativo, setComparativo] = React.useState<PlanejamentoComparativo | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [stalePreviewOpen, setStalePreviewOpen] = React.useState(false);
  const hydratedRef = React.useRef(false);
  const concursoIdRef = React.useRef(concursoId);
  const previewConcursoIdRef = React.useRef<string | null>(null);
  concursoIdRef.current = concursoId;
  const currentPreview = previewConcursoIdRef.current === concursoId ? preview : null;
  const currentComparativo = previewConcursoIdRef.current === concursoId ? comparativo : null;

  React.useEffect(() => {
    hydratedRef.current = false;
    idempotencyKey.current = newKey();
    setDisciplinas([]);
    setConfig(null);
    setPreview(null);
    setComparativo(null);
    previewConcursoIdRef.current = null;
    setConfirmOpen(false);
    setStalePreviewOpen(false);
  }, [concursoId]);

  const planejamento = useQuery({
    queryKey: ["planejamento-atual", concursoId],
    queryFn: () => obterPlanejamentoAtual(concursoId),
    enabled: Boolean(concursoId),
  });

  React.useEffect(() => {
    if (!planejamento.data || hydratedRef.current) return;
    hydratedRef.current = true;
    setDisciplinas(planejamento.data.disciplinas);
    setConfig(planejamento.data.planejamento);
    headingRef.current?.focus();
  }, [planejamento.data]);

  const previewMutation = useMutation({
    mutationFn: (request: { concursoId: string; disciplinas: DisciplinaPlanoInput[]; config: ConfigPlanejamento }) =>
      compararReplanejamento(request.concursoId, request.disciplinas, request.config),
    onSuccess: (result, request) => {
      if (request.concursoId === concursoIdRef.current) {
        previewConcursoIdRef.current = request.concursoId;
        setPreview(result.preview);
        setComparativo(result.comparativo);
      }
    },
    onError: (error) => {
      if (!planejamentoCapacidadeDiagnostico(error)) toast.error("Revise as disciplinas, datas e disponibilidade informadas.");
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: () =>
      recalcularPlano(concursoId, {
        tipo_plano: "personalizado",
        nome: planejamento.data!.nome,
        orgao: planejamento.data!.orgao,
        cargo: planejamento.data!.cargo,
        banca: planejamento.data!.banca,
        data_prova: planejamento.data!.data_prova,
        observacoes: planejamento.data!.observacoes,
        catalogo: null,
        disciplinas,
        planejamento: config!,
        idempotency_key: idempotencyKey.current,
        preview_fingerprint: currentPreview?.preview_fingerprint,
        baseline_fingerprint: currentComparativo?.baseline_fingerprint,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["planejamento-atual", concursoId] }),
        queryClient.invalidateQueries({ queryKey: ["cronograma"] }),
        queryClient.invalidateQueries({ queryKey: ["cronograma-blocos"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast.success("Planejamento atualizado. Seus registros concluídos foram preservados.");
      navigate("/cronograma");
    },
    onError: (error) => {
      if (isPlanejamentoComparativoDesatualizado(error)) {
        setConfirmOpen(false);
        setPreview(null);
        setComparativo(null);
        previewConcursoIdRef.current = null;
        setStalePreviewOpen(true);
        return;
      }
      toast.error("Não foi possível atualizar o planejamento.");
    },
  });

  const resetPreviewMutation = previewMutation.reset;
  const resetRecalculateMutation = recalculateMutation.reset;
  React.useEffect(() => {
    resetPreviewMutation();
    resetRecalculateMutation();
  }, [concursoId, resetPreviewMutation, resetRecalculateMutation]);

  const updateDisciplina = (index: number, patch: Partial<DisciplinaPlanoInput>) => {
    setDisciplinas((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    setPreview(null);
    setComparativo(null);
    previewConcursoIdRef.current = null;
    previewMutation.reset();
  };

  const updateConfig = (patch: Partial<ConfigPlanejamento>) => {
    setConfig((current) => current ? { ...current, ...patch } : current);
    setPreview(null);
    setComparativo(null);
    previewConcursoIdRef.current = null;
    previewMutation.reset();
  };

  const canPreview = Boolean(
    config
      && disciplinas.some((item) => item.ativa)
      && Object.values(config.disponibilidade_minutos).some((minutes) => minutes > 0)
      && config.sessao_max_minutos >= config.sessao_min_minutos,
  );
  const capacityDiagnostic = planejamentoCapacidadeDiagnostico(previewMutation.error);
  const gerarPreview = () => previewMutation.mutate({
    concursoId,
    disciplinas: disciplinas.filter((item) => item.ativa),
    config: config!,
  });

  if (planejamento.isError) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
        <h1 className="font-semibold text-destructive">Não foi possível carregar este planejamento.</h1>
        <Button asChild variant="outline" className="mt-4"><Link to="/cronograma">Voltar ao cronograma</Link></Button>
      </div>
    );
  }

  if (planejamento.isLoading || !planejamento.data || !config) {
    return <p role="status" className="py-16 text-center text-sm text-muted-foreground">Carregando planejamento…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header>
        <Link to="/cronograma" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao cronograma
        </Link>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-2xl font-bold outline-none">Replanejar {planejamento.data.nome}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ajuste prioridades e disponibilidade. Somente itens futuros deste concurso serão substituídos.</p>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div><strong className="block">Seu histórico está protegido</strong><span className="text-muted-foreground">Sessões concluídas, questões e progresso não serão apagados pelo replanejamento.</span></div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Prioridade das disciplinas</h2>
        <div className="mt-4 space-y-3">
          {disciplinas.map((disciplina, index) => (
            <div key={disciplina.disciplina_id ?? disciplina.nome} className={cn("grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[auto_1fr_140px_180px]", !disciplina.ativa && "opacity-60")}>
              <Checkbox aria-label={`Incluir ${disciplina.nome}`} checked={disciplina.ativa} onCheckedChange={(checked) => updateDisciplina(index, { ativa: Boolean(checked) })} />
              <strong>{disciplina.nome}</strong>
              <Field label="Peso (1–10)"><input type="number" min={1} max={10} value={disciplina.peso} onChange={(event) => updateDisciplina(index, { peso: Number(event.target.value) })} className="input-base" /></Field>
              <Field label="Conhecimento"><SelectField value={disciplina.conhecimento} onValueChange={(value) => updateDisciplina(index, { conhecimento: value as NivelConhecimento })} options={CONHECIMENTO} /></Field>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Disponibilidade e sessões</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Formato"><SelectField value={config.tipo} onValueChange={(value) => updateConfig({ tipo: value as ConfigPlanejamento["tipo"] })} options={[{ value: "ciclo", label: "Ciclo de estudos" }, { value: "semanal", label: "Grade semanal" }]} /></Field>
          <div />
          <Field label="Replanejar a partir de"><DatePicker value={config.data_inicio} onValueChange={(value) => updateConfig({ data_inicio: value })} /></Field>
          <Field label="Planejar até"><DatePicker value={config.data_fim} onValueChange={(value) => updateConfig({ data_fim: value })} /></Field>
          <Field label="Sessão mínima (min)"><input type="number" min={5} max={240} value={config.sessao_min_minutos} onChange={(event) => updateConfig({ sessao_min_minutos: Number(event.target.value) })} className="input-base" /></Field>
          <Field label="Sessão máxima (min)"><input type="number" min={5} max={240} value={config.sessao_max_minutos} onChange={(event) => updateConfig({ sessao_max_minutos: Number(event.target.value) })} className="input-base" /></Field>
        </div>
        <fieldset className="mt-6"><legend className="font-semibold">Disponibilidade por dia</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{DIAS.map((dia, index) => { const minutes = config.disponibilidade_minutos[index] ?? 0; return <Field key={dia} label={dia}><div className="flex items-center gap-1"><input aria-label={`Horas de ${dia}`} type="number" min={0} max={23} value={Math.floor(minutes / 60)} onChange={(event) => updateConfig({ disponibilidade_minutos: { ...config.disponibilidade_minutos, [index]: Number(event.target.value) * 60 + minutes % 60 } })} className="input-base px-2" /><span className="text-xs">h</span><input aria-label={`Minutos de ${dia}`} type="number" min={0} max={59} value={minutes % 60} onChange={(event) => updateConfig({ disponibilidade_minutos: { ...config.disponibilidade_minutos, [index]: Math.floor(minutes / 60) * 60 + Number(event.target.value) } })} className="input-base px-2" /><span className="text-xs">m</span></div></Field>; })}</div></fieldset>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" disabled={!canPreview || previewMutation.isPending} onClick={gerarPreview}><CalendarClock /> {previewMutation.isPending ? "Comparando…" : "Comparar nova proposta"}</Button>
        <Button disabled={!currentPreview?.explicacao.confirmavel || !currentComparativo || recalculateMutation.isPending} onClick={() => setConfirmOpen(true)}><RefreshCw /> Aplicar replanejamento</Button>
      </div>

      {capacityDiagnostic ? <PlanejamentoCapacidadeAlert diagnostico={capacityDiagnostic} /> : null}
      {previewMutation.isPending ? (
        <section role="status" aria-label="Comparando planejamentos" className="space-y-3 rounded-2xl border border-border p-5">
          <Skeleton className="h-6 w-64 max-w-full" />
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24" />)}</div>
        </section>
      ) : null}
      {previewMutation.isError && !capacityDiagnostic ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível comparar os planejamentos</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Revise os dados ou tente novamente. Nenhuma alteração foi aplicada.</p>
            <Button type="button" variant="outline" className="min-h-11" onClick={gerarPreview}>Tentar novamente</Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {currentPreview ? <PlanejamentoExplicacao preview={currentPreview} /> : null}
      {currentComparativo ? <ReplanejamentoComparativo comparativo={currentComparativo} /> : null}

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !recalculateMutation.isPending && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar replanejamento?</AlertDialogTitle>
            <AlertDialogDescription>Você revisou {currentComparativo?.resumo.itens_comparativo ?? 0} impactos. Os itens futuros serão substituídos; sessões realizadas, histórico e revisões serão mantidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={recalculateMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => recalculateMutation.mutate()} disabled={recalculateMutation.isPending}><Check /> {recalculateMutation.isPending ? "Aplicando…" : "Confirmar e substituir futuros"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PlanejamentoPreviewStaleDialog open={stalePreviewOpen} onOpenChange={setStalePreviewOpen} onReview={() => setStalePreviewOpen(false)} onRegenerate={() => { setStalePreviewOpen(false); gerarPreview(); }} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium"><span className="mb-1.5 block">{label}</span>{children}</label>;
}
