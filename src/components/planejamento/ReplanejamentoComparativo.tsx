import React from "react";
import { ArrowRight, CalendarMinus, CalendarPlus, CheckCircle2, ChevronDown, MoveRight, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ItemComparativo, PlanejamentoComparativo } from "@/types/planejamento";

const GROUPS = [
  { key: "removidos", label: "Sessões que sairão", icon: CalendarMinus },
  { key: "movidos", label: "Sessões remanejadas", icon: MoveRight },
  { key: "adicionados", label: "Novas sessões", icon: CalendarPlus },
  { key: "preservados", label: "Sessões mantidas", icon: CheckCircle2 },
] as const;

const MOTIVOS = {
  SEM_ALTERACAO: "Sem alteração",
  DATA_ALTERADA: "Data alterada",
  DURACAO_ALTERADA: "Duração alterada",
  FORA_DA_NOVA_PROPOSTA: "Fora da nova proposta",
  NOVA_SESSAO: "Nova sessão",
} as const;

function dataLabel(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function Item({ item }: { item: ItemComparativo }) {
  const anterior = dataLabel(item.posicao_anterior?.data);
  const nova = dataLabel(item.posicao_nova?.data);
  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <strong className="min-w-0 break-words">{item.disciplina_nome}</strong>
        <Badge variant="outline">{MOTIVOS[item.motivo]}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {anterior ? <span>{anterior} · {item.duracao_anterior_minutos} min</span> : null}
        {anterior && nova ? <ArrowRight aria-label="para" className="h-4 w-4" /> : null}
        {nova ? <span>{nova} · {item.duracao_nova_minutos} min</span> : null}
      </div>
    </li>
  );
}

function GroupList({ items }: { items: ItemComparativo[] }) {
  const [limit, setLimit] = React.useState(10);
  const visible = items.slice(0, limit);
  if (!items.length) return <p className="rounded-lg border border-dashed p-5 text-center text-muted-foreground">Nenhuma sessão neste grupo.</p>;
  const disciplinas = visible.reduce<Map<string, ItemComparativo[]>>((map, item) => {
    const current = map.get(item.disciplina_id) ?? [];
    current.push(item);
    map.set(item.disciplina_id, current);
    return map;
  }, new Map());
  return (
    <>
      <div className="space-y-2">
        {[...disciplinas.entries()].map(([disciplinaId, rows], index) => (
          <details key={disciplinaId} open={index === 0} className="group rounded-xl border border-border bg-card">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span>{rows[0].disciplina_nome} <span className="text-muted-foreground">({rows.length})</span></span>
              <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="space-y-2 border-t border-border p-3">{rows.map((item) => <Item key={item.comparacao_id} item={item} />)}</ul>
          </details>
        ))}
      </div>
      {limit < items.length ? (
        <Button type="button" variant="outline" className="mt-3 min-h-11 w-full sm:w-auto" onClick={() => setLimit((value) => value + 10)}>
          Mostrar mais 10
        </Button>
      ) : null}
    </>
  );
}

export function ReplanejamentoComparativo({ comparativo }: { comparativo: PlanejamentoComparativo }) {
  const { resumo, grupos } = comparativo;
  const semMudancas = resumo.adicionados + resumo.removidos + resumo.movidos === 0;
  const initial = GROUPS.find((group) => grupos[group.key].length > 0)?.key ?? "preservados";
  return (
    <section aria-labelledby="comparativo-title" className="space-y-4">
      <div>
        <h2 id="comparativo-title" className="text-lg font-semibold">O que muda no seu planejamento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {semMudancas
            ? "A nova distribuição mantém todas as sessões futuras como estão."
            : `A proposta terá ${resumo.depois_itens} sessões: ${resumo.adicionados} novas, ${resumo.removidos} removidas e ${resumo.movidos} remanejadas.`}
        </p>
      </div>

      <Alert className="border-success/30 bg-success/10">
        <ShieldCheck aria-hidden="true" className="text-success" />
        <AlertTitle>Registros concluídos permanecem protegidos</AlertTitle>
        <AlertDescription>Histórico, sessões já realizadas e revisões não fazem parte desta substituição.</AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {GROUPS.map(({ key, label, icon: Icon }) => (
          <Card key={key} size="sm">
            <CardContent>
              <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
              <strong className="mt-2 block text-xl">{resumo[key]}</strong>
              <span className="text-xs text-muted-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />
      <Tabs key={initial} defaultValue={initial}>
        <TabsList className="grid min-h-0 w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
          {GROUPS.map(({ key, label }) => <TabsTrigger key={key} value={key} className="min-h-11 whitespace-normal px-2 text-center">{label} ({resumo[key]})</TabsTrigger>)}
        </TabsList>
        {GROUPS.map(({ key }) => <TabsContent key={key} value={key} className="mt-3"><GroupList items={grupos[key]} /></TabsContent>)}
      </Tabs>
    </section>
  );
}
