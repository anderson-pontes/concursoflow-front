import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/services/api";
import { concluirRevisao, ignorarRevisao, listarRevisoes, reagendarRevisao } from "@/services/revisoes";

vi.mock("@/services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const context = {
  revisaoId: "revisao-1",
  concursoId: "concurso-a",
  versaoEsperada: 3,
  idempotencyKey: "00000000-0000-4000-8000-000000000001",
};

describe("revisoes service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serializa somente filtros definidos e preserva o cursor", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [] } });

    await listarRevisoes({
      concursoId: "concurso-a",
      grupo: "atrasadas",
      disciplinaId: "disciplina-1",
      dataInicio: null,
      dataFim: "2026-09-30",
      cursor: "cursor-seguro",
      limit: 20,
    });

    expect(api.get).toHaveBeenCalledWith("/revisoes", {
      params: {
        concurso_id: "concurso-a",
        grupo: "atrasadas",
        disciplina_id: "disciplina-1",
        data_inicio: undefined,
        data_fim: "2026-09-30",
        cursor: "cursor-seguro",
        limit: 20,
      },
    });
  });

  it("envia versão e chave idempotente nos três comandos", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: "revisao-1" } });

    await concluirRevisao(context, {
      inicio: "2026-09-08T10:00:00-03:00",
      fim: "2026-09-08T10:25:00-03:00",
      tempo_estudo_segundos: 1500,
    });
    await reagendarRevisao(context, "2026-09-10");
    await ignorarRevisao(context);

    const config = {
      params: { concurso_id: "concurso-a" },
      headers: { "Idempotency-Key": context.idempotencyKey },
    };
    expect(api.post).toHaveBeenNthCalledWith(1, "/revisoes/revisao-1/concluir", {
      versao_esperada: 3,
      sessao: {
        inicio: "2026-09-08T10:00:00-03:00",
        fim: "2026-09-08T10:25:00-03:00",
        tempo_estudo_segundos: 1500,
      },
    }, config);
    expect(api.post).toHaveBeenNthCalledWith(2, "/revisoes/revisao-1/reagendar", {
      versao_esperada: 3,
      nova_data: "2026-09-10",
    }, config);
    expect(api.post).toHaveBeenNthCalledWith(3, "/revisoes/revisao-1/ignorar", {
      versao_esperada: 3,
    }, config);
  });
});
