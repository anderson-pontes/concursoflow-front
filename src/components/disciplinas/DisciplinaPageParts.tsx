export function DisciplinaCardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="h-[3px] bg-[var(--border-default)]" />
      <div className="flex gap-3 px-5 pt-[18px]">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--bg-surface-2)]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-[var(--bg-surface-2)]" />
          <div className="h-3 w-20 rounded-full bg-[var(--bg-surface-2)]" />
        </div>
      </div>
      <div className="space-y-2 px-5 py-4">
        <div className="flex justify-between">
          <div className="h-3 w-40 rounded bg-[var(--bg-surface-2)]" />
          <div className="h-3 w-8 rounded bg-[var(--bg-surface-2)]" />
        </div>
        <div className="h-2 rounded-full bg-[var(--border-default)]" />
      </div>
      <div className="grid grid-cols-3 gap-2 px-5 pb-3">
        <div className="mx-auto h-8 w-10 rounded bg-[var(--bg-surface-2)]" />
        <div className="mx-auto h-8 w-10 rounded bg-[var(--bg-surface-2)]" />
        <div className="mx-auto h-8 w-10 rounded bg-[var(--bg-surface-2)]" />
      </div>
      <div className="border-t border-[var(--border-subtle)] px-5 py-3">
        <div className="h-6 w-24 rounded-full bg-[var(--bg-surface-2)]" />
      </div>
    </div>
  );
}

export function EmptyDisciplinasIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden className="text-[#6C3FC5]">
      <rect x="24" y="58" width="72" height="28" rx="4" fill="currentColor" fillOpacity="0.12" />
      <rect x="32" y="42" width="56" height="22" rx="4" fill="currentColor" fillOpacity="0.18" />
      <rect x="40" y="26" width="40" height="22" rx="4" fill="currentColor" fillOpacity="0.28" />
      <path d="M52 32h16M52 38h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
}
