import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/layout/Header";

const fixture = vi.hoisted(() => ({ user: { name: "Ana", role: "user" } }));
vi.mock("@/stores/authStore", () => ({ useAuthStore: (selector: (s: unknown) => unknown) => selector(fixture) }));
vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ isDark: false, toggle: vi.fn() }) }));
vi.mock("@/components/layout/NotificationBell", () => ({ NotificationBell: () => <button>Notificações</button> }));
vi.mock("@/components/layout/UserDropdown", () => ({ UserDropdown: () => <button>Perfil</button> }));

describe("Header Indigo Focus", () => {
  beforeEach(() => { fixture.user.role = "user"; });
  it("shows context and does not expose administrative shortcuts to a regular user", async () => {
    render(<MemoryRouter initialEntries={["/disciplinas/123"]}><Header /></MemoryRouter>);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent("Detalhes da disciplina");
    await userEvent.click(screen.getByRole("button", { name: "Buscar páginas (Ctrl+K)" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Gestão de usuários" })).not.toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText("Nome da página"), "revisoes");
    expect(within(dialog).getByRole("button", { name: "Revisões" })).toBeInTheDocument();
  });
  it("keeps Ctrl+K, authorized admin links and restores focus after escape", async () => {
    fixture.user.role = "admin";
    render(<MemoryRouter initialEntries={["/admin/editais"]}><Header /></MemoryRouter>);
    const trigger = screen.getByRole("button", { name: "Buscar páginas (Ctrl+K)" });
    trigger.focus();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Gestão de usuários" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
