import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { completePomodoroRevision } from "@/lib/revisoes/completePomodoroRevision";
import { invalidateRevisaoContext } from "@/lib/revisoes/queryKeys";
import { concluirRevisao } from "@/services/revisoes";
import { useRevisaoPomodoroStore } from "@/stores/revisaoPomodoroStore";

vi.mock("@/services/revisoes", () => ({ concluirRevisao: vi.fn() }));
vi.mock("@/lib/revisoes/queryKeys", () => ({ invalidateRevisaoContext: vi.fn() }));

const context = {
  revisaoId: "revisao-1",
  revisaoVersao: 4,
  concursoId: "concurso-1",
  disciplinaId: "disciplina-1",
  topicoId: "topico-1",
  idempotencyKey: "tentativa-estavel",
  returnTo: "/revisoes?grupo=hoje",
};

describe("completePomodoroRevision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useRevisaoPomodoroStore.setState({ context, conflict: false });
  });

  it("conclui com versão e chave idempotente e invalida somente o contexto do concurso", async () => {
    vi.mocked(concluirRevisao).mockResolvedValue({} as never);
    const queryClient = new QueryClient();
    const session = {
      inicio: "2026-09-08T12:00:00.000Z",
      fim: "2026-09-08T12:25:00.000Z",
      tempoEstudoSegundos: 1500,
    };

    await expect(completePomodoroRevision(queryClient, session)).resolves.toBe("success");
    expect(concluirRevisao).toHaveBeenCalledWith({
      revisaoId: "revisao-1",
      concursoId: "concurso-1",
      versaoEsperada: 4,
      idempotencyKey: "tentativa-estavel",
    }, {
      inicio: session.inicio,
      fim: session.fim,
      tempo_estudo_segundos: 1500,
    });
    expect(invalidateRevisaoContext).toHaveBeenCalledWith(queryClient, "concurso-1");
    expect(useRevisaoPomodoroStore.getState().context).toBeNull();
  });

  it("preserva o contexto e sinaliza conflito quando a versão mudou", async () => {
    vi.mocked(concluirRevisao).mockRejectedValue({ isAxiosError: true, response: { status: 409 } });
    const queryClient = new QueryClient();

    await expect(completePomodoroRevision(queryClient, {
      inicio: "2026-09-08T12:00:00.000Z",
      fim: "2026-09-08T12:25:00.000Z",
      tempoEstudoSegundos: 1500,
    })).resolves.toBe("conflict");

    expect(useRevisaoPomodoroStore.getState()).toEqual(expect.objectContaining({ context, conflict: true }));
    expect(invalidateRevisaoContext).toHaveBeenCalledWith(queryClient, "concurso-1");
  });
});
