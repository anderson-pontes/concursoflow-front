import React from "react";
import { ArrowLeft, CalendarClock, Check, RefreshCw, ShieldCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectField } from "@/components/ui/select-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  obterPlanejamentoAtual,
  previewPlanejamento,
  recalcularPlano,
} from "@/services/planejamento";
import type {
  ConfigPlanejamento,
  DisciplinaPlanoInput,
  NivelConhecimento,
  PlanejamentoPreview,
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
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const hydratedRef = React.useRef(false);

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
    mutationFn: () => previewPlanejamento(disciplinas.filter((item) => item.ativa), config!),
    onSuccess: setPreview,
    onError: () => toast.error("Revise as disciplinas, datas e disponibilidade informadas."),
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
    onError: () => toast.error("Não foi possível atualizar o planejamento."),
  });

  const updateDisciplina = (index: number, patch: Partial<DisciplinaPlanoInput>) => {
    setDisciplinas((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    setPreview(null);
  };

  const updateConfig = (patch: Partial<ConfigPlanejamento>) => {
    setConfig((current) => current ? { ...current, ...patch } : current);
    setPreview(null);
  };

  const canPreview = Boolean(
    config
      && disciplinas.some((item) => item.ativa)
      && Object.values(config.disponibilidade_minutos).some((minutes) => minutes > 0)
      && config.sessao_max_minutos >= config.sessao_min_minutos,
  );

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
        <Button variant="outline" disabled={!canPreview || previewMutation.isPending} onClick={() => previewMutation.mutate()}><CalendarClock /> {previewMutation.isPending ? "Calculando…" : "Gerar nova prévia"}</Button>
        <Button disabled={!preview || recalculateMutation.isPending} onClick={() => setConfirmOpen(true)}><RefreshCw /> Aplicar replanejamento</Button>
      </div>

      {preview ? <PreviewSummary preview={preview} /> : null}

      <Dialog open={confirmOpen} onOpenChange={(open) => !recalculateMutation.isPending && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar replanejamento?</DialogTitle>
            <DialogDescription>Os itens futuros deste concurso serão substituídos pela nova distribuição. Sessões de estudo já registradas serão mantidas.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={recalculateMutation.isPending}>Cancelar</Button><Button onClick={() => recalculateMutation.mutate()} disabled={recalculateMutation.isPending}><Check /> {recalculateMutation.isPending ? "Aplicando…" : "Confirmar e substituir futuros"}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewSummary({ preview }: { preview: PlanejamentoPreview }) {
  return <section aria-live="polite" className="rounded-2xl border border-primary/25 bg-primary-muted/50 p-5"><h2 className="font-semibold">Resumo da nova distribuição</h2><div className="mt-3 grid gap-3 sm:grid-cols-3"><Summary label="Carga semanal" value={`${Math.round(preview.carga_semanal_minutos / 6) / 10} h`} /><Summary label="Sessões futuras" value={String(preview.sessoes.length)} /><Summary label="Tempo planejado" value={`${Math.round(preview.minutos_totais / 6) / 10} h`} /></div><ul className="mt-4 max-h-64 divide-y divide-border overflow-auto rounded-lg border border-border bg-card">{preview.sessoes.slice(0, 30).map((sessao, index) => <li key={`${sessao.data}-${sessao.ordem}-${index}`} className="flex items-center gap-3 p-3 text-sm"><strong className="flex-1">{sessao.disciplina_nome}</strong><span className="text-muted-foreground">{new Date(`${sessao.data}T12:00:00`).toLocaleDateString("pt-BR")}</span><span>{sessao.duracao_minutos} min</span></li>)}</ul></section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium"><span className="mb-1.5 block">{label}</span>{children}</label>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span><strong className="mt-1 block">{value}</strong></div>;
}
