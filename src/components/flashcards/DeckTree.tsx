import React from "react";

import type { Deck } from "@/lib/flashcards/types";

type Props = {
  decks: Deck[];
  selectedId: string | null;
  onSelect: (deck: Deck) => void;
};

type NodeProps = {
  deck: Deck;
  level: number;
  selectedId: string | null;
  onSelect: (deck: Deck) => void;
};

function deckSubtreeTotal(deck: Deck): number {
  const own = deck.total_cards ?? 0;
  const kids = deck.children ?? [];
  return own + kids.reduce((acc, child) => acc + deckSubtreeTotal(child), 0);
}

function DeckNode({ deck, level, selectedId, onSelect }: NodeProps) {
  const hasChildren = Boolean(deck.children?.length);
  const [expanded, setExpanded] = React.useState(true);
  const isSelected = selectedId === deck.id;
  const ownTotal = deck.total_cards ?? 0;
  const subtreeTotal = deckSubtreeTotal(deck);

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(deck)}
        className={[
          "flex w-full items-center gap-1 rounded-lg px-2 py-2 text-left text-sm transition",
          isSelected
            ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-200"
            : "text-[#1A1A2E] hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700/60",
        ].join(" ")}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setExpanded((v) => !v);
              }
            }}
            className="inline-flex h-4 w-4 items-center justify-center text-xs text-[#6B7280]"
          >
            {expanded ? "▾" : "▸"}
          </span>
        ) : (
          <span className="inline-block h-4 w-4" />
        )}
        <span className="truncate">{deck.nome}</span>
        <span className="ml-auto inline-flex items-center gap-1.5 pl-2">
          {hasChildren ? (
            <span
              className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-200"
              title="Total no baralho e subbaralhos"
            >
              {subtreeTotal}
            </span>
          ) : null}
          <span
            className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#6B7280] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            title="Cartões deste baralho"
          >
            {ownTotal}
          </span>
        </span>
      </button>
      {hasChildren && expanded ? (
        <div className="relative">
          <div
            className="absolute bottom-1 left-[18px] top-0 w-px bg-neutral-200 dark:bg-neutral-700"
            style={{ marginLeft: `${level * 16}px` }}
            aria-hidden
          />
          {deck.children!.map((child) => (
            <DeckNode
              key={child.id}
              deck={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DeckTree({ decks, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-0.5">
      {decks.map((deck) => (
        <DeckNode
          key={deck.id}
          deck={deck}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
