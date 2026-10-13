import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConcursoSwitcher } from "@/components/concursos/ConcursoSwitcher";
import { useConcursoStore } from "@/stores/concursoStore";
import { api } from "@/services/api";
const transition = vi.hoisted(() => vi.fn(async () => true));
vi.mock("@/services/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/hooks/useConcursoContextTransition", () => ({ useConcursoContextTransition: () => transition }));
const rows = [{ id: "a", nome: "Concurso com um nome muito extenso para testar a apresentação sem expandir a largura do dropdown", orgao: "Órgão A", cargo: "Analista", data_prova: null }, { id: "b", nome: "Concurso B", orgao: "Órgão B", cargo: "Técnico", data_prova: null }];
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
function setup(collapsed = false, mobileOpen = false) {
  const afterPick = vi.fn();
  const view = render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><aside data-testid="sidebar"><ConcursoSwitcher collapsed={collapsed} mobileOpen={mobileOpen} onAfterPick={afterPick} /><button>Próximo item da sidebar</button></aside><Location /></MemoryRouter></QueryClientProvider>);
  return { ...view, afterPick };
}
beforeEach(() => {
  vi.clearAllMocks();
  useConcursoStore.setState({ concursoAtivoId: "a", contextResolved: true, contextError: false });
  vi.mocked(api.get).mockResolvedValue({ data: rows });
});
describe("ConcursoSwitcher com menu Indigo Dark", () => {
  it("usa portal fora da sidebar que recorta conteúdo e explicita tokens e texto selecionado", async () => {
    setup(true);
    const trigger = await screen.findByRole("button", { name: /Órgão A/ });
    await userEvent.click(trigger);
    const listbox = screen.getByRole("listbox", { name: "Trocar concurso ativo" });
    expect(screen.getByTestId("sidebar")).not.toContainElement(listbox);
    const panel = listbox.closest('[data-slot="popover-content"]');
    expect(panel).toHaveClass("bg-sidebar-accent", "text-sidebar-foreground", "border-sidebar-border");
    expect(panel).not.toHaveClass("bg-popover", "text-popover-foreground");
    const selected = screen.getByRole("option", { selected: true });
    expect(selected).toHaveClass("bg-sidebar-primary", "text-sidebar-primary-foreground");
    expect(within(selected).getByTitle(rows[0].nome)).toHaveClass("truncate");
    expect(trigger).toHaveFocus();
  });
  it("preserva Arrow/Home/End/Enter, troca de contexto e fechamento com Escape", async () => {
    const { afterPick } = setup();
    const trigger = await screen.findByRole("button", { name: /Concurso ativo/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await screen.findByRole("listbox");
    fireEvent.keyDown(trigger, { key: "End" });
    expect(trigger).toHaveAttribute("aria-activedescendant", "concurso-switcher-opt-1");
    expect(screen.getByRole("option", { name: /Órgão B/ })).toHaveClass("ring-sidebar-foreground");
    fireEvent.keyDown(trigger, { key: "Home" });
    expect(trigger).toHaveAttribute("aria-activedescendant", "concurso-switcher-opt-0");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    await waitFor(() => expect(transition).toHaveBeenCalledWith("b", "sidebar"));
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(afterPick).toHaveBeenCalledOnce();
    fireEvent.keyDown(trigger, { key: "Enter" });
    await screen.findByRole("listbox");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it("mantém Gerenciar concursos acessível por Tab no portal e retorna à sidebar", async () => {
    setup(false, true);
    const trigger = await screen.findByRole("button", { name: /Concurso ativo/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    await screen.findByRole("listbox");
    fireEvent.keyDown(trigger, { key: "Tab" });
    const manage = screen.getByRole("button", { name: "+ Gerenciar concursos" });
    expect(manage).toHaveFocus();
    fireEvent.keyDown(manage, { key: "Tab", shiftKey: true });
    expect(trigger).toHaveFocus();
    fireEvent.keyDown(trigger, { key: "Tab" });
    fireEvent.keyDown(manage, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Próximo item da sidebar" })).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  it("permite navegar para gerenciamento e fecha ao selecionar o concurso já ativo", async () => {
    const { afterPick } = setup();
    const trigger = await screen.findByRole("button", { name: /Concurso ativo/ });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("option", { selected: true }));
    expect(transition).not.toHaveBeenCalled();
    expect(afterPick).toHaveBeenCalledOnce();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "+ Gerenciar concursos" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/concursos");
  });
  it("fecha ao clicar fora e não troca contexto sem selecionar opção", async () => {
    setup();
    const trigger = await screen.findByRole("button", { name: /Concurso ativo/ });
    await userEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Próximo item da sidebar" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(transition).not.toHaveBeenCalled();
  });
});
