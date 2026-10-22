import { useTablistNavigation } from "@/hooks/useTablistNavigation";
import { Button } from "@/components/ui/button";
import type { FlashcardsTab } from "@/lib/flashcards/types";
export type FlashcardsTabItem={id:FlashcardsTab;label:string;mobileLabel?:string;icon:React.ReactNode};
type Props={tabs:FlashcardsTabItem[];activeTab:FlashcardsTab;dueTodayTotal:number;onTabChange:(tab:FlashcardsTab)=>void};
export function FlashcardsTabNav({tabs,activeTab,dueTodayTotal,onTabChange}:Props) {
 const onKeyDown=useTablistNavigation();
 return <div className="min-w-0 overflow-x-auto rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div role="tablist" aria-label="Seções de flashcards" onKeyDown={onKeyDown} className="inline-flex min-w-full gap-1 rounded-lg bg-muted p-1 sm:min-w-0">
 {tabs.map(t=><Button key={t.id} type="button" variant="ghost" role="tab" aria-selected={activeTab===t.id} aria-label={t.label} tabIndex={activeTab===t.id?0:-1} onClick={()=>onTabChange(t.id)} className="flash-tab min-h-11 min-w-0 flex-1 gap-1 px-2 text-xs sm:flex-none sm:gap-2 sm:px-4 sm:text-sm"><span aria-hidden className="shrink-0 [&>svg]:size-4">{t.icon}</span><span className="sm:hidden">{t.mobileLabel??t.label}</span><span className="hidden sm:inline">{t.label}</span>{t.id==="revisar"&&<span className="rounded-full bg-card/15 px-1.5 tabular-nums">{dueTodayTotal}</span>}</Button>)}
 </div></div>;
}
