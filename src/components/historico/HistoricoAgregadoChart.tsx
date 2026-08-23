import { Activity, Clock3 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SelectField } from "@/components/ui/select-field";
import { fmtMinutosEstudo } from "@/lib/calendario/format";
import type { HistoricoAgregadoPonto } from "@/lib/historico/types";

type Props = {
  serie: HistoricoAgregadoPonto[];
  agruparPor: string;
  onAgruparChange: (v: string) => void;
};

const chartConfig = {
  minutos: {
    label: "Tempo estudado",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const descriptions: Record<string, string> = {
  dia: "Acompanhe a constância dos estudos em cada dia.",
  semana: "Compare seu ritmo de estudos entre as semanas.",
  mes: "Visualize a evolução acumulada ao longo dos meses.",
  disciplina: "Compare a dedicação entre as disciplinas.",
};

function shortLabel(label: string) {
  return label.length > 14 ? `${label.slice(0, 12)}…` : label;
}

function axisDuration(value: number) {
  if (value === 0) return "0";
  if (value < 60) return `${value}m`;
  return `${Math.round(value / 60)}h`;
}

export function HistoricoAgregadoChart({ serie, agruparPor, onAgruparChange }: Props) {
  const data = serie.map((p) => ({
    periodo: shortLabel(p.label),
    periodoCompleto: p.label,
    minutos: p.minutos,
    sessoes: p.sessoes,
  }));
  const totalMinutos = data.reduce((total, ponto) => total + ponto.minutos, 0);
  const totalSessoes = data.reduce((total, ponto) => total + ponto.sessoes, 0);
  const mediaMinutos = data.length ? Math.round(totalMinutos / data.length) : 0;
  const useBars = data.length === 1 || agruparPor === "disciplina";
  const tooltip = (
    <ChartTooltip
      cursor={{ fill: "var(--muted)", opacity: 0.45 }}
      content={(
        <ChartTooltipContent
          indicator="line"
          labelFormatter={(_, payload) => payload?.[0]?.payload?.periodoCompleto ?? ""}
          formatter={(value) => (
            <div className="flex min-w-36 items-center justify-between gap-4">
              <span className="text-muted-foreground">Tempo estudado</span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {fmtMinutosEstudo(Number(value))}
              </span>
            </div>
          )}
        />
      )}
    />
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="grid-cols-1 gap-3 border-b border-border/70 bg-muted/20 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <CardTitle>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Activity className="size-4 text-primary" aria-hidden="true" />
              Evolução por período
            </h2>
          </CardTitle>
          <CardDescription>{descriptions[agruparPor] ?? descriptions.dia}</CardDescription>
        </div>
        <CardAction className="col-start-1 row-start-2 w-full justify-self-stretch sm:col-start-2 sm:row-start-1 sm:w-auto sm:justify-self-end">
          <div className="space-y-1.5">
            <label htmlFor="historico-periodo" className="block text-xs font-medium text-muted-foreground">
              Período
            </label>
            <SelectField
              id="historico-periodo"
              value={agruparPor}
              onValueChange={onAgruparChange}
              className="h-10 w-full min-w-40 bg-background text-sm sm:w-44"
              aria-label="Selecionar período do gráfico"
              options={[
                { value: "dia", label: "Por dia" },
                { value: "semana", label: "Por semana" },
                { value: "mes", label: "Por mês" },
                { value: "disciplina", label: "Por disciplina" },
              ]}
            />
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {data.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center">
            <Clock3 className="size-8 text-muted-foreground/70" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Sem dados neste período</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Ajuste os filtros ou registre uma sessão para acompanhar sua evolução.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Resumo do gráfico">
              <div className="rounded-lg border border-border/70 bg-background px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Total estudado</p>
                <p className="mt-0.5 font-semibold tabular-nums text-foreground">{fmtMinutosEstudo(totalMinutos)}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Sessões</p>
                <p className="mt-0.5 font-semibold tabular-nums text-foreground">{totalSessoes}</p>
              </div>
              <div className="col-span-2 rounded-lg border border-border/70 bg-background px-3 py-2.5 sm:col-span-1">
                <p className="text-xs text-muted-foreground">Média por período</p>
                <p className="mt-0.5 font-semibold tabular-nums text-foreground">{fmtMinutosEstudo(mediaMinutos)}</p>
              </div>
            </div>

            <p className="sr-only">
              Gráfico com {data.length} períodos, total de {fmtMinutosEstudo(totalMinutos)} em {totalSessoes} sessões.
            </p>
            <ChartContainer
              config={chartConfig}
              className="h-60 w-full min-w-0 aspect-auto sm:h-72"
              aria-label="Evolução do tempo estudado por período"
            >
              {useBars ? (
                <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="periodo" axisLine={false} tickLine={false} tickMargin={10} minTickGap={24} />
                  <YAxis axisLine={false} tickLine={false} tickMargin={8} tickFormatter={axisDuration} width={42} />
                  {tooltip}
                  <Bar dataKey="minutos" fill="var(--color-minutos)" radius={[8, 8, 2, 2]} maxBarSize={56} />
                </BarChart>
              ) : (
                <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} accessibilityLayer>
                  <defs>
                    <linearGradient id="historico-fill-minutos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-minutos)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--color-minutos)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="periodo" axisLine={false} tickLine={false} tickMargin={10} minTickGap={24} />
                  <YAxis axisLine={false} tickLine={false} tickMargin={8} tickFormatter={axisDuration} width={42} />
                  {tooltip}
                  <Area
                    dataKey="minutos"
                    type="monotone"
                    fill="url(#historico-fill-minutos)"
                    stroke="var(--color-minutos)"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 2, fill: "var(--background)" }}
                    activeDot={{ r: 5, strokeWidth: 2, fill: "var(--background)" }}
                  />
                </AreaChart>
              )}
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
