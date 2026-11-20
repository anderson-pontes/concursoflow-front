import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { Avisos } from "@/pages/Avisos";
import { api } from "@/services/api";
import { useConcursoStore } from "@/stores/concursoStore";

vi.mock("@/services/api", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock("@/hooks/useAvisoDay", () => ({ useAvisoDay: () => "2026-12-05" }));
vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({ onValueChange, ...props }: {
    id: string; value: string; disabled?: boolean; "aria-label": string; onValueChange: (value: string) => void;
  }) => <input id={props.id} aria-label={props["aria-label"]} value={props.value} disabled={props.disabled} onChange={(event) => onValueChange(event.target.value)} />,
}));

const notice = {
  id: "aviso-1", titulo: "Prazo de inscrição", concurso_id: "concurso-1", tipo: "inscricao",
  evento_edital: "encerramento_inscricoes", data_vencimento: "2026-12-15", data_inicio: "2026-12-01",
  data_fim: "2026-12-10", created_at: "2026-11-25T10:00:00Z", confirmado: false,
};

function setup(path = "/avisos") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Avisos /></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  vi.resetAllMocks();
  useConcursoStore.getState().resolveConcursoContext("concurso-1");
  vi.mocked(api.get).mockImplementation(async (url) => ({ data: url === "/concursos" ? [{ id: "concurso-1", nome: "Edital do Tribunal" }] : [
    notice, { ...notice, id: "aviso-2", titulo: "Lembrete futuro", data_inicio: "2026-12-07" },
    { ...notice, id: "aviso-3", titulo: "Lembrete encerrado", data_fim: "2026-12-04" },
  ] }));
  vi.mocked(api.post).mockResolvedValue({ data: notice });
  vi.mocked(api.put).mockResolvedValue({ data: notice });
});

it("exibe os limites inclusivos e separa o evento do período na lista de ativos", async () => {
  setup("/avisos?status=ativo");
  const artigo = await screen.findByRole("article");
  expect(artigo).toHaveTextContent("Ativo");
  expect(artigo).toHaveTextContent("01/12/2026 a 10/12/2026");
  expect(artigo).toHaveTextContent("15/12/2026");
  expect(screen.queryByText("Lembrete futuro")).not.toBeInTheDocument();
  expect(screen.queryByText("Lembrete encerrado")).not.toBeInTheDocument();
});

it("prefill do concurso e início, valida intervalo e envia evento separado", async () => {
  setup();
  await screen.findByText("Prazo de inscrição");
  fireEvent.click(screen.getByRole("button", { name: "Novo aviso" }));
  const dialog = screen.getByRole("dialog", { name: "Novo aviso" });
  const form = within(dialog);
  expect(form.getByRole("combobox", { name: "Concurso" })).toHaveTextContent("Edital do Tribunal");
  expect(form.getByLabelText("Data de início")).toHaveValue("2026-12-05");
  fireEvent.change(form.getByRole("textbox", { name: /Título/ }), { target: { value: "Inscrições" } });
  fireEvent.change(form.getByLabelText("Data do evento"), { target: { value: "2026-12-15" } });
  fireEvent.change(form.getByLabelText("Data de término"), { target: { value: "2026-12-04" } });
  fireEvent.click(form.getByRole("button", { name: "Criar aviso" }));
  expect(form.getByRole("alert")).toHaveTextContent(/posterior/);
  expect(api.post).not.toHaveBeenCalled();
  fireEvent.change(form.getByLabelText("Data de término"), { target: { value: "2026-12-10" } });
  fireEvent.click(form.getByRole("button", { name: "Criar aviso" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledExactlyOnceWith("/avisos", expect.objectContaining({
    concurso_id: "concurso-1", data_inicio: "2026-12-05", data_fim: "2026-12-10", data_vencimento: "2026-12-15",
  })));
  await waitFor(() => expect(dialog).not.toBeInTheDocument());
});

it("edita a vigência oficial sem reenviar a data do edital", async () => {
  setup("/avisos?status=ativo");
  fireEvent.click(await screen.findByRole("button", { name: "Ações do aviso Prazo de inscrição" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Editar" }));
  const form = within(screen.getByRole("dialog", { name: "Editar aviso" }));
  expect(form.getByLabelText("Data do evento")).toBeDisabled();
  fireEvent.change(form.getByLabelText("Data de término"), { target: { value: "2026-12-08" } });
  fireEvent.click(form.getByRole("button", { name: "Salvar alterações" }));
  await waitFor(() => expect(api.put).toHaveBeenCalledExactlyOnceWith("/avisos/aviso-1", {
    titulo: "Prazo de inscrição", descricao: null, tipo: "inscricao", data_inicio: "2026-12-01", data_fim: "2026-12-08",
  }));
});
