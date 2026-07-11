import React from "react";

/**
 * Navegação por teclado no padrão WAI-ARIA Tabs (roving focus).
 * Anexe o handler retornado ao container `role="tablist"`.
 * Cada tab deve ter `role="tab"` e `tabIndex` 0 (ativo) / -1 (inativo).
 *
 * Setas ←/→/↑/↓ movem o foco entre tabs (com wrap); Home/End vão ao primeiro/último.
 * O foco é movido e a tab é ativada via `click()` (dispara o `onClick` existente).
 */
export function useTablistNavigation() {
  return React.useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    const NAV_KEYS = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!NAV_KEYS.includes(e.key)) return;

    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'),
    );
    if (tabs.length === 0) return;

    const currentIndex = tabs.indexOf(document.activeElement as HTMLElement);
    if (currentIndex < 0) return;

    e.preventDefault();

    let nextIndex = currentIndex;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
    }

    const nextTab = tabs[nextIndex];
    nextTab.focus();
    nextTab.click();
  }, []);
}
