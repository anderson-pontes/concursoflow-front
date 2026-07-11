import type { CalendarioResumoMes } from "@/lib/calendario/types";
import { fmtMinutosEstudo } from "@/lib/calendario/format";

type Props = {
  resumo: CalendarioResumoMes | undefined;
  compact?: boolean;
};

export function CalendarioResumoMes({ resumo, compact }: Props) {
  if (!resumo) return null;

  const cards = [
    { label: "Cumprimento", value: `${resumo.taxa_cumprimento_pct.toFixed(0)}%` },
    { label: "Dias cumpridos", value: `${resumo.dias_cumpridos}/${resumo.dias_com_planejamento || "—"}` },
    { label: "Parciais", value: String(resumo.dias_parciais) },
    { label: "Pendentes", value: String(resumo.dias_nao_cumpridos) },
    { label: "Realizado", value: fmtMinutosEstudo(resumo.minutos_realizados) },
    { label: "Planejado", value: fmtMinutosEstudo(resumo.minutos_planejados) },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{resumo.taxa_cumprimento_pct.toFixed(0)}%</strong> cumprimento
        </span>
        <span>{fmtMinutosEstudo(resumo.minutos_realizados)} estudados</span>
        <span>{resumo.dias_cumpridos} dias ok</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
