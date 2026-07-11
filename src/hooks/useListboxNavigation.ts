import React from "react";

/**
 * Navegação por teclado no padrão WAI-ARIA Combobox/Listbox com `aria-activedescendant`.
 *
 * O foco permanece no input/trigger; a "opção ativa" é rastreada por índice e exposta
 * via `activeId` (para `aria-activedescendant`). ↓/↑ movem (com wrap), Home/End vão às
 * pontas, Enter seleciona a ativa, Escape fecha.
 */
export function useListboxNavigation({
  itemCount,
  isOpen,
  onSelect,
  onClose,
  idPrefix,
}: {
  itemCount: number;
  isOpen: boolean;
  onSelect: (index: number) => void;
  onClose?: () => void;
  idPrefix: string;
}) {
  const [activeIndex, setActiveIndex] = React.useState(-1);

  React.useEffect(() => {
    if (!isOpen) setActiveIndex(-1);
  }, [isOpen]);

  React.useEffect(() => {
    setActiveIndex((i) => (i >= itemCount ? -1 : i));
  }, [itemCount]);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || itemCount === 0) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % itemCount);
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => (i <= 0 ? itemCount - 1 : i - 1));
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(itemCount - 1);
          break;
        case "Enter":
          if (activeIndex >= 0 && activeIndex < itemCount) {
            e.preventDefault();
            onSelect(activeIndex);
          }
          break;
        case "Escape":
          if (onClose) {
            e.preventDefault();
            onClose();
          }
          break;
      }
    },
    [isOpen, itemCount, activeIndex, onSelect, onClose],
  );

  const getOptionId = React.useCallback((index: number) => `${idPrefix}-opt-${index}`, [idPrefix]);
  const listboxId = `${idPrefix}-listbox`;
  const activeId = activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  return { activeIndex, setActiveIndex, onKeyDown, getOptionId, listboxId, activeId };
}
