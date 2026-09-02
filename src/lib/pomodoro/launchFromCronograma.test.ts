import { describe, expect, it } from "vitest";

import {
  buildPomodoroLaunchUrlFromStudy,
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
    expect(pomodoroLaunchSignature({ source: "dashboard", disciplinaId: "1", topicoId: null, minutos: 25 })).toBe("dashboard|1||25");
  });
});
