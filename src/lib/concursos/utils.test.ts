import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import type { Concurso } from "@/lib/concursos/types";
import { getProximaProva, isEncerradoStatus } from "@/lib/concursos/utils";
const row = (data_prova: string | null, status = "ativo") => ({ data_prova, status } as Concurso);
describe("próxima prova conhecida", () => {
  const today = new Date(2026, 9, 19, 18);
  it("ordena datas válidas e futuras sem alterar a lista original", () => {
    const contests = [row("2027-01-17"), row("2026-11-01"), row("2026-01-01"), row(null), row("invalida"), row("2026-10-20", "realizado"), row("2026-10-21", "eliminado")];
    expect(format(getProximaProva(contests, today)!, "yyyy-MM-dd")).toBe("2026-11-01");
    expect(contests[0].data_prova).toBe("2027-01-17");
  });
  it("inclui a prova de hoje independentemente do horário", () => {
    expect(format(getProximaProva([row("2026-10-19")], today)!, "yyyy-MM-dd")).toBe("2026-10-19");
  });
  it("retorna ausência sem datas disponíveis e preserva os critérios de status", () => {
    expect(getProximaProva([row(null), row("2026-01-01")], today)).toBeNull();
    expect(isEncerradoStatus("suspenso")).toBe(false);
    expect(isEncerradoStatus("realizado")).toBe(true);
  });
});
