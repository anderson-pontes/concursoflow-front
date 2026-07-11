import React from "react";

/**
 * Navegação por teclado no padrão WAI-ARIA Menu (roving focus).
 *
 * Anexe `onKeyDown` ao container `role="menu"`. Cada item deve ter
 * `role="menuitem"` e `tabIndex={-1}` (o foco é movido programaticamente).
 *
 * Ao abrir, o foco vai para o primeiro item. ↓/↑ movem (com wrap), Home/End
 * vão às pontas, Escape/Tab fecham e devolvem o foco ao trigger.
 */
export function useMenuNavigation({
  isOpen,
  onClose,
  menuRef,
  triggerRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  menuRef: React.RefObject<HTMLElement>;
  triggerRef: React.RefObject<HTMLElement>;
}) {
  const getItems = React.useCallback(() => {
    const menu = menuRef.current;
    if (!menu) return [] as HTMLElement[];
    return Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'));
  }, [menuRef]);

  React.useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      const items = getItems();
      items[0]?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen, getItems]);

  const closeAndRestore = React.useCallback(() => {
    onClose();
    triggerRef.current?.focus();
  }, [onClose, triggerRef]);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      const items = getItems();
      if (items.length === 0) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeAndRestore();
        }
        return;
      }
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          items[(currentIndex + 1) % items.length]?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          items[(currentIndex - 1 + items.length) % items.length]?.focus();
          break;
        case "Home":
          e.preventDefault();
          items[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          closeAndRestore();
          break;
        case "Tab":
          onClose();
          break;
      }
    },
    [isOpen, getItems, closeAndRestore, onClose],
  );

  return { onKeyDown };
}
