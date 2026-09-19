import { describe, expect, it } from "vitest";

import {
  buildPomodoroLaunchUrlFromStudy,
  buildPomodoroRevisionLaunchUrl,
  parsePomodoroLaunchParams,
  pomodoroLaunchSignature,
} from "@/lib/pomodoro/launchFromCronograma";

describe("lançamento contextual do Pomodoro", () => {
  it("monta e interpreta o prefill vindo do dashboard", () => {
    const url = buildPomodoroLaunchUrlFromStudy({
      source: "dashboard",
      disciplinaId: "disciplina-1",
      topicoId: "topico-1",
      minutos: 50,
    });
    const params = new URLSearchParams(url.split("?")[1]);

    expect(url).toBe("/pomodoro?from=dashboard&disciplina_id=disciplina-1&minutos=50&topico_id=topico-1");
    expect(parsePomodoroLaunchParams(params)).toEqual({
      source: "dashboard",
      disciplinaId: "disciplina-1",
      topicoId: "topico-1",
      minutos: 50,
    });
  });

  it("rejeita fonte desconhecida e mantém a fonte na assinatura", () => {
    expect(parsePomodoroLaunchParams(new URLSearchParams("from=atalho&disciplina_id=1&minutos=25"))).toBeNull();
    expect(pomodoroLaunchSignature({ source: "dashboard", disciplinaId: "1", topicoId: null, minutos: 25 })).toBe("dashboard|1||25|||");
  });

  it("preserva o contexto auditável ao abrir uma revisão no Pomodoro", () => {
    const url = buildPomodoroRevisionLaunchUrl({
      revisaoId: "revisao-1",
      revisaoVersao: 3,
      concursoId: "concurso-1",
      disciplinaId: "disciplina-1",
      topicoId: "topico-1",
      minutos: 40,
      returnTo: "/revisoes?grupo=atrasadas",
    });

    expect(parsePomodoroLaunchParams(new URLSearchParams(url.split("?")[1]))).toEqual({
      source: "revisao",
      disciplinaId: "disciplina-1",
      topicoId: "topico-1",
      minutos: 40,
      revisaoId: "revisao-1",
      revisaoVersao: 3,
      concursoId: "concurso-1",
      returnTo: "/revisoes?grupo=atrasadas",
    });
  });

  it("aceita o edital como origem fechada e preserva somente retorno interno", () => {
    const url = buildPomodoroLaunchUrlFromStudy({
      source: "edital",
      concursoId: "concurso-1",
      disciplinaId: "disciplina-1",
      topicoId: "topico-1",
      minutos: 45,
      returnTo: "/disciplinas?view=edital",
    });

    expect(parsePomodoroLaunchParams(new URLSearchParams(url.split("?")[1]))).toMatchObject({
      source: "edital",
      concursoId: "concurso-1",
      disciplinaId: "disciplina-1",
      topicoId: "topico-1",
      minutos: 45,
      returnTo: "/disciplinas?view=edital",
    });
  });

  it("rejeita duração fora do contrato e retorno externo", () => {
    expect(parsePomodoroLaunchParams(new URLSearchParams("from=edital&concurso_id=1&disciplina_id=1&topico_id=1&minutos=481"))).toBeNull();
    expect(parsePomodoroLaunchParams(new URLSearchParams("from=edital&concurso_id=1&disciplina_id=1&topico_id=1&minutos=25abc"))).toBeNull();
    expect(() => buildPomodoroRevisionLaunchUrl({
      revisaoId: "r",
      revisaoVersao: 1,
      concursoId: "c",
      disciplinaId: "d",
      topicoId: "t",
      minutos: 0,
      returnTo: "https://example.com",
    })).toThrow("invalid_pomodoro_duration");
  });
});
