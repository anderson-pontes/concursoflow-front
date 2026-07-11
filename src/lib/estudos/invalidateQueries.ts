import type { QueryClient } from "@tanstack/react-query";

/** Invalida caches de calendário, histórico e dashboard após registrar/editar sessão. */
export function invalidateEstudosQueries(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: ["calendario"] });
  void qc.invalidateQueries({ queryKey: ["calendario-dia"] });
  void qc.invalidateQueries({ queryKey: ["historico-sessoes"] });
  void qc.invalidateQueries({ queryKey: ["historico-agregado"] });
  void qc.invalidateQueries({ queryKey: ["dashboard-resumo"] });
  void qc.invalidateQueries({ queryKey: ["dashboard-heatmap"] });
  void qc.invalidateQueries({ queryKey: ["sessoes-stats"] });
}
