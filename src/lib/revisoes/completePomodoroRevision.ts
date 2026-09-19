import { isAxiosError } from "axios";
import type { QueryClient } from "@tanstack/react-query";

import { invalidateRevisaoContext } from "@/lib/revisoes/queryKeys";
import { concluirRevisao } from "@/services/revisoes";
import { useRevisaoPomodoroStore } from "@/stores/revisaoPomodoroStore";

export type CompletePomodoroRevisionResult = "success" | "conflict" | "error" | "missing_context";

export async function completePomodoroRevision(
  queryClient: QueryClient,
  session: { inicio: string; fim: string; tempoEstudoSegundos: number },
): Promise<CompletePomodoroRevisionResult> {
  const state = useRevisaoPomodoroStore.getState();
  const context = state.context;
  if (!context) return "missing_context";

  try {
    await concluirRevisao({
      revisaoId: context.revisaoId,
      concursoId: context.concursoId,
      versaoEsperada: context.revisaoVersao,
      idempotencyKey: context.idempotencyKey,
    }, {
      inicio: session.inicio,
      fim: session.fim,
      tempo_estudo_segundos: session.tempoEstudoSegundos,
    });
    await invalidateRevisaoContext(queryClient, context.concursoId);
    state.clear();
    return "success";
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      state.markConflict();
      await invalidateRevisaoContext(queryClient, context.concursoId);
      return "conflict";
    }
    return "error";
  }
}
