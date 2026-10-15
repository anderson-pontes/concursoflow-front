import { describe, expect, it } from "vitest";
import { DISCIPLINA_COLORS, getDisciplinaColor } from "./disciplinaPalettes";

describe("identidade compartilhada das disciplinas", () => {
  it("mantém a mesma cor para o mesmo id e oferece tokens da paleta inicial", () => {
    expect(getDisciplinaColor("disciplina-1")).toEqual(getDisciplinaColor("disciplina-1"));
    expect(DISCIPLINA_COLORS.slice(0, 6).map(color => color.color)).toEqual([
      "#6366F1", "#0891B2", "#8B5CF6", "#F59E0B", "#10B981", "#EC4899",
    ]);
  });

  it("não depende do nome e mantém tokens de fundo e contraste juntos", () => {
    const token = getDisciplinaColor("uuid-da-disciplina");
    expect(token.soft).toMatch(/^#/);
    expect(token.onSoft).toMatch(/^#/);
    expect(token.color).toMatch(/^#/);
  });
});
