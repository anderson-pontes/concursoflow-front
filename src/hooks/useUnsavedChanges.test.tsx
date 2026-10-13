import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

function Editor() {
  const guard = useUnsavedChanges(true);
  return <><p>Draft preserved</p><Link to="/away">Leave editor</Link><Link to="/editor?tab=content">Switch tab</Link>{guard.confirmDialog}</>;
}
function mount() {
  window.history.replaceState({ idx: 0 }, "", "/away");
  window.history.pushState({ idx: 1 }, "", "/editor");
  return render(<BrowserRouter><Routes><Route path="/editor" element={<Editor />} /><Route path="/away" element={<p>Outside editor</p>} /></Routes></BrowserRouter>);
}
afterEach(() => { window.history.replaceState({}, "", "/"); });
describe("unsaved editor navigation", () => {
  it("keeps query changes and cancels leaving without losing the draft", async () => {
    const user = userEvent.setup(); mount();
    await user.click(screen.getByText("Switch tab"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await user.click(screen.getByText("Leave editor"));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByText("Continuar editando"));
    expect(screen.getByText("Draft preserved")).toBeInTheDocument();
    await user.click(screen.getByText("Leave editor"));
    await user.click(screen.getByText("Descartar e sair"));
    expect(screen.getByText("Outside editor")).toBeInTheDocument();
  });
  it("intercepts browser back before the draft unmounts and leaves only after confirmation", async () => {
    const user = userEvent.setup(); mount();
    act(() => window.history.back());
    await screen.findByRole("alertdialog");
    await waitFor(() => expect(window.location.pathname).toBe("/editor"));
    expect(screen.getByText("Draft preserved")).toBeInTheDocument();
    await user.click(screen.getByText("Continuar editando"));
    act(() => window.history.back());
    await screen.findByRole("alertdialog");
    await waitFor(() => expect(window.location.pathname).toBe("/editor"));
    await user.click(screen.getByText("Descartar e sair"));
    await screen.findByText("Outside editor");
  });
  it("protects full reload while dirty", () => {
    mount(); const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event); expect(event.defaultPrevented).toBe(true);
  });
});
