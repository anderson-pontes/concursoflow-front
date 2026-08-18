import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HistoricoAgregadoPonto } from "@/lib/historico/types";
import { SelectField } from "@/components/ui/select-field";

type Props = {
  serie: HistoricoAgregadoPonto[];
  agruparPor: string;
  onAgruparChange: (v: string) => void;
};

export function HistoricoAgregadoChart({ serie, agruparPor, onAgruparChange }: Props) {
  const data = serie.map((p) => ({
    name: p.label.length > 12 ? `${p.label.slice(0, 10)}…` : p.label,
    minutos: p.minutos,
    fullLabel: p.label,
  }));

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Tempo por período</h2>
        <SelectField value={agruparPor} onValueChange={onAgruparChange} className="w-40 text-xs" aria-label="Agrupar gráfico" options={[{ value: "dia", label: "Por dia" }, { value: "semana", label: "Por semana" }, { value: "mes", label: "Por mês" }, { value: "disciplina", label: "Por disciplina" }]} />
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sem dados no período.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} width={36} />
            <Tooltip
              formatter={(v: number) => [`${v} min`, "Estudo"]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ""}
            />
            <Bar dataKey="minutos" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
