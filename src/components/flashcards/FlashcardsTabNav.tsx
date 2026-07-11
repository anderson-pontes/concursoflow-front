import { useTablistNavigation } from "@/hooks/useTablistNavigation";
import type { FlashcardsTab } from "@/lib/flashcards/types";

export type FlashcardsTabItem = {
  id: FlashcardsTab;
  label: string;
  icon: React.ReactNode;
};

type Props = {
  tabs: FlashcardsTabItem[];
  activeTab: FlashcardsTab;
  dueTodayTotal: number;
  onTabChange: (tab: FlashcardsTab) => void;
};

export function FlashcardsTabNav({ tabs, activeTab, dueTodayTotal, onTabChange }: Props) {
  const onTablistKeyDown = useTablistNavigation();
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-700">
      <div
        role="tablist"
        aria-label="Seções de flashcards"
        onKeyDown={onTablistKeyDown}
        className="-mx-1 flex gap-1 overflow-x-auto pb-0 scrollbar-thin sm:mx-0"
      >
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onTabChange(t.id)}
              className={[
                "group relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground dark:text-neutral-400 dark:hover:text-neutral-200",
              ].join(" ")}
            >
              {t.icon}
              <span className="whitespace-nowrap">{t.label}</span>
              {t.id === "revisar" ? (
                <span
                  className={[
                    "inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full px-1.5 tabular-nums text-xs font-semibold text-white",
                    dueTodayTotal > 0 ? "fc-badge-pulse bg-orange-600" : "bg-muted-foreground",
                  ].join(" ")}
                >
                  {dueTodayTotal}
                </span>
              ) : null}
              {active ? (
                <span
                  className="absolute bottom-0 left-2 right-2 h-1 rounded-t-full bg-primary"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
