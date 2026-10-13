import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserFormDialog } from "@/components/admin/UserFormDialog";
import type { AdminUserListItem } from "@/types/userManagement";
vi.mock("@/services/adminUsers", () => ({ createUserAdmin: vi.fn(), updateUserAdmin: vi.fn() }));
describe("admin user draft", () => {
  it("retains pending edits when a user snapshot refreshes and confirms dismissal", async () => {
    const actor = userEvent.setup(); const onOpenChange = vi.fn();
    const client = new QueryClient();
    const account = { id: "account-1", name: "Existing User", email: "user@example.test", role: "user", status: "ativo" } as AdminUserListItem;
    const tree = (name: string) => <QueryClientProvider client={client}><UserFormDialog open user={{ ...account, name }} onOpenChange={onOpenChange} onSaved={vi.fn()} /></QueryClientProvider>;
    const result = render(tree(account.name));
    const input = screen.getByLabelText(/Nome completo/);
    await actor.clear(input); await actor.type(input, "Local account draft");
    result.rerender(tree("New server snapshot")); expect(input).toHaveValue("Local account draft");
    await actor.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onOpenChange).not.toHaveBeenCalled();
    await actor.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(input).toHaveValue("Local account draft");
    await actor.click(screen.getByRole("button", { name: "Cancelar" }));
    await actor.click(screen.getByRole("button", { name: "Descartar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
