import type { FlashcardsTab } from "@/lib/flashcards/types";
import { FLASH_DUE_BADGE } from "@/lib/flashcards/constants";

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
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-700">
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-0 scrollbar-thin sm:mx-0">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={[
                "group relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors",
                active
                  ? "text-[#6C3FC5]"
                  : "text-[#6B7280] hover:text-[#1A1A2E] dark:text-neutral-400 dark:hover:text-neutral-200",
              ].join(" ")}
            >
              {t.icon}
              <span className="whitespace-nowrap">{t.label}</span>
              {t.id === "revisar" ? (
                <span
                  className={[
                    "inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full px-1.5 tabular-nums text-xs font-semibold text-white",
                    dueTodayTotal > 0 ? "fc-badge-pulse" : "",
                  ].join(" ")}
                  style={{ backgroundColor: dueTodayTotal > 0 ? FLASH_DUE_BADGE : "#9CA3AF" }}
                >
                  {dueTodayTotal}
                </span>
              ) : null}
              {active ? (
                <span
                  className="absolute bottom-0 left-2 right-2 h-1 rounded-t-full bg-[#6C3FC5]"
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
