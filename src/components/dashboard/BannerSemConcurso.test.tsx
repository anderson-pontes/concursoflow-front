import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { BannerSemConcurso } from "@/components/dashboard/BannerSemConcurso";

describe("BannerSemConcurso", () => {
  it("apresenta a jornada e as duas entradas sem criar dados", () => {
    render(<MemoryRouter><BannerSemConcurso /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: /escolha o concurso/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/jornada de configuração: etapa 1 de 4/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escolher edital" })).toHaveAttribute(
      "href",
      "/planos/novo?origem=catalogo",
    );
    expect(screen.getByRole("link", { name: "Cadastrar manualmente" })).toHaveAttribute(
      "href",
      "/concursos?novo=manual",
    );
  });
});
