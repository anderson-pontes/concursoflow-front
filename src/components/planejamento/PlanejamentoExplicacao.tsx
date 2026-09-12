import React from "react";
import { CalendarDays, ChevronDown, CircleAlert, Clock3, ListChecks } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PlanejamentoCapacidadeDiagnostico } from "@/lib/planejamento/errors";
import type { PlanejamentoPreview } from "@/types/planejamento";

const CONHECIMENTO_LABEL = {
  muito_fraco: "Muito fraco",
  fraco: "Fraco",
  regular: "Regular",
  bom: "Bom",
  muito_bom: "Muito bom",
} as const;

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}min`;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

export function PlanejamentoExplicacao({ preview }: { preview: PlanejamentoPreview }) {
  const [open, setOpen] = React.useState<Set<string>>(new Set());
  const { capacidade, disciplinas } = preview.explicacao;

  if (!preview.explicacao.confirmavel || preview.sessoes.length === 0) {
    return (
      <section aria-labelledby="planejamento-explicacao-vazia" className="mt-5">
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle id="planejamento-explicacao-vazia">Não há sessões para confirmar</AlertTitle>
          <AlertDescription>Volte e selecione ao menos uma disciplina com disponibilidade suficiente para gerar uma nova prévia.</AlertDescription>
        </Alert>
      </section>
    );
  }

  const toggle = (key: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section aria-labelledby="planejamento-explicacao-titulo" className="mt-5 space-y-4">
      <div>
        <h2 id="planejamento-explicacao-titulo" className="text-lg font-semibold">Como seu plano foi distribuído</h2>
        <p className="mt-1 text-sm text-muted-foreground">A prioridade combina o peso da disciplina com seu nível de conhecimento e distribui o tempo disponível.</p>
      </div>

      <Alert className="border-primary/25 bg-primary-muted/40">
        <CircleAlert aria-hidden="true" className="text-primary" />
        <AlertTitle>A distribuição cabe no período informado</AlertTitle>
        <AlertDescription>
          Organizamos {formatMinutes(capacidade.carga_alocada_minutos)} em {preview.sessoes.length} sessões. Ainda não estimamos se esse tempo cobre todo o edital porque os tópicos não possuem duração definida.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={Clock3} label="Tempo informado" value={formatMinutes(capacidade.capacidade_informada_minutos)} />
        <Metric icon={ListChecks} label="Tempo planejado" value={formatMinutes(capacidade.carga_alocada_minutos)} />
        <Metric icon={CalendarDays} label="Dias utilizados" value={`${capacidade.dias_utilizados} de ${capacidade.dias_disponiveis}`} />
        <Metric icon={ListChecks} label="Sessões" value={String(preview.sessoes.length)} />
      </div>

      {capacidade.saldo_nao_planejavel_minutos > 0 ? (
        <p className="text-sm text-muted-foreground">
          {formatMinutes(capacidade.saldo_nao_planejavel_minutos)} ficaram fora do plano porque não atingem a duração mínima de uma sessão.
        </p>
      ) : null}

      <div className="space-y-3">
        <h3 className="font-semibold">Distribuição por disciplina</h3>
        {disciplinas.map((disciplina, index) => {
          const key = disciplina.disciplina_id ?? `${disciplina.disciplina_nome}-${index}`;
          const expanded = open.has(key);
          const regionId = `justificativa-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
          const percentage = disciplina.participacao_bps / 100;
          return (
            <Card key={key} size="sm">
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <strong className="truncate">{disciplina.disciplina_nome}</strong>
                      <span className="shrink-0 text-sm font-semibold">{percentage.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatMinutes(disciplina.minutos_alocados)} · {disciplina.sessoes} sessões · {disciplina.dias_utilizados} dias</p>
                    <Progress className="mt-2 h-2" value={percentage} aria-label={`Participação de ${disciplina.disciplina_nome}: ${percentage.toLocaleString("pt-BR")}%`} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 justify-between sm:justify-center"
                    aria-expanded={expanded}
                    aria-controls={regionId}
                    onClick={() => toggle(key)}
                  >
                    {expanded ? "Ocultar justificativa" : "Ver justificativa"}
                    <ChevronDown aria-hidden="true" className={cn("transition-transform", expanded && "rotate-180")} />
                  </Button>
                </div>
                {expanded ? (
                  <dl id={regionId} className="mt-4 grid gap-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
                    <Detail label="Peso no edital" value={`${disciplina.peso} de 10`} />
                    <Detail label="Seu conhecimento" value={CONHECIMENTO_LABEL[disciplina.conhecimento]} />
                    <Detail label="Fator aplicado" value={String(disciplina.fator_conhecimento)} />
                    <Detail label="Prioridade calculada" value={`${disciplina.prioridade} (${disciplina.peso} × ${disciplina.fator_conhecimento})`} />
                  </dl>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">A prioridade serve para distribuir o tempo entre disciplinas; não representa percentual de domínio.</p>
    </section>
  );
}

export function PlanejamentoCapacidadeAlert({
  diagnostico,
  onAdjust,
}: {
  diagnostico: PlanejamentoCapacidadeDiagnostico;
  onAdjust?: () => void;
}) {
  const semSlots = diagnostico.motivo === "PLANEJAMENTO_SEM_SLOTS";
  return (
    <Alert variant="destructive" className="mt-5">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{semSlots ? "Nenhuma sessão cabe nessa disponibilidade" : "O período não comporta todas as disciplinas"}</AlertTitle>
      <AlertDescription>
        <p>{semSlots
          ? "Aumente o tempo de um dia ou reduza a duração mínima da sessão."
          : `Há ${diagnostico.slots} sessões possíveis para ${diagnostico.disciplinas} disciplinas. Amplie o período ou a disponibilidade antes de confirmar.`}</p>
        {onAdjust ? <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={onAdjust}>Ajustar disponibilidade</Button> : null}
      </AlertDescription>
    </Alert>
  );
}

export function PlanejamentoPreviewStaleDialog({
  open,
  onOpenChange,
  onRegenerate,
  onReview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: () => void;
  onReview: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Seu plano mudou desde a prévia</AlertDialogTitle>
          <AlertDialogDescription>Para evitar uma distribuição diferente da que você revisou, gere uma nova prévia antes de confirmar.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onReview}>Voltar e revisar</AlertDialogCancel>
          <AlertDialogAction onClick={onRegenerate}>Gerar nova prévia</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <Card size="sm"><CardContent><Icon aria-hidden="true" className="h-4 w-4 text-primary" /><span className="mt-2 block text-xs text-muted-foreground">{label}</span><strong className="mt-1 block text-base">{value}</strong></CardContent></Card>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>;
}
