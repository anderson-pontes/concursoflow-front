import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppErrorBoundary } from "@/components/errors/AppErrorBoundary";

let shouldThrow = true;

function UnstableContent() {
  if (shouldThrow) throw new Error("falha controlada");
  return <p>Conteúdo recuperado</p>;
}

describe("AppErrorBoundary", () => {
  const preventExpectedError = (event: ErrorEvent) => event.preventDefault();

  beforeEach(() => {
    shouldThrow = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    window.addEventListener("error", preventExpectedError);
  });

  afterEach(() => {
    window.removeEventListener("error", preventExpectedError);
    vi.restoreAllMocks();
  });

  it("mostra uma recuperação acessível e tenta renderizar novamente", () => {
    render(
      <AppErrorBoundary>
        <UnstableContent />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível exibir esta página");
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(screen.getByText("Conteúdo recuperado")).toBeInTheDocument();
  });
});
