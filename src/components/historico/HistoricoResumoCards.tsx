import type { HistoricoListResumo } from "@/lib/historico/types";
import { fmtMinutosEstudo } from "@/lib/calendario/format";

type Props = {
  resumo: HistoricoListResumo | undefined;
};

export function HistoricoResumoCards({ resumo }: Props) {
  if (!resumo) return null;

  const cards = [
    { label: "Tempo total", value: fmtMinutosEstudo(resumo.total_minutos) },
    { label: "Sessões", value: String(resumo.total_sessoes) },
    { label: "Questões", value: String(resumo.total_questoes) },
    { label: "Rendimento", value: `${resumo.rendimento_pct.toFixed(1)}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
