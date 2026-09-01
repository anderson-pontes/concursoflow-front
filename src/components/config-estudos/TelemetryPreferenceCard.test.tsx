import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TelemetryPreferenceCard } from "@/components/config-estudos/TelemetryPreferenceCard";
import { getTelemetryPreference, updateTelemetryPreference } from "@/services/telemetry";

vi.mock("@/services/telemetry", () => ({
  getTelemetryPreference: vi.fn(),
  updateTelemetryPreference: vi.fn(),
}));

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TelemetryPreferenceCard />
    </QueryClientProvider>,
  );
}

describe("TelemetryPreferenceCard", () => {
  beforeEach(() => {
    vi.mocked(getTelemetryPreference).mockReset();
    vi.mocked(updateTelemetryPreference).mockReset();
  });

  it("explica a coleta sem dark pattern e permite opt-out", async () => {
    vi.mocked(getTelemetryPreference).mockResolvedValue({ opted_out: false });
    vi.mocked(updateTelemetryPreference).mockResolvedValue({ opted_out: true });
    const user = userEvent.setup();
    renderCard();

    const control = await screen.findByRole("switch", { name: "Compartilhar dados pseudonimizados de uso" });
    expect(screen.getByText(/código técnico derivado da sua conta/i)).toBeInTheDocument();
    expect(screen.getByText(/no máximo 90 dias/i)).toBeInTheDocument();
    expect(control).toBeChecked();
    expect(screen.getByText(/Não enviamos nome, e-mail, termos pesquisados/i)).toBeInTheDocument();

    await user.click(control);

    expect(vi.mocked(updateTelemetryPreference).mock.calls[0][0]).toBe(true);
  });

  it("mantém a coleta segura e oferece nova tentativa quando a preferência falha", async () => {
    vi.mocked(getTelemetryPreference).mockRejectedValue(new Error("offline"));
    renderCard();

    expect(await screen.findByText("Preferência indisponível", {}, { timeout: 2_000 })).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
  });
});
