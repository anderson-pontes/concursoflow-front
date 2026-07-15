export function DisciplinaCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="h-[3px] bg-muted" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-5 w-20 rounded-full bg-muted" />
        </div>
        <div className="h-3 w-40 rounded bg-muted" />
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between">
            <div className="h-3 w-32 rounded bg-muted" />
            <div className="h-3 w-8 rounded bg-muted" />
          </div>
          <div className="h-1.5 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function EmptyDisciplinasIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden className="text-primary">
      <rect x="24" y="58" width="72" height="28" rx="4" fill="currentColor" fillOpacity="0.12" />
      <rect x="32" y="42" width="56" height="22" rx="4" fill="currentColor" fillOpacity="0.18" />
      <rect x="40" y="26" width="40" height="22" rx="4" fill="currentColor" fillOpacity="0.28" />
      <path d="M52 32h16M52 38h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
}
