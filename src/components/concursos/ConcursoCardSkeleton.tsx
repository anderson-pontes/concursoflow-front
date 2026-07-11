export function ConcursoCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] shadow-card">
      <div className="border-t-[3px] border-t-[var(--border-default)] p-5">
        <div className="flex gap-3">
          <div className="h-12 w-12 shrink-0 rounded-[10px] bg-[var(--bg-surface-2)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-[var(--bg-surface-2)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--bg-surface-2)]" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border-subtle)] pt-4">
          <div className="h-10 rounded-lg bg-[var(--bg-surface-2)]" />
          <div className="h-10 rounded-lg bg-[var(--bg-surface-2)]" />
          <div className="h-10 rounded-lg bg-[var(--bg-surface-2)]" />
        </div>
        <div className="mt-4 flex gap-2 border-t border-[var(--border-subtle)] pt-4">
          <div className="h-9 flex-1 rounded-[10px] bg-[var(--bg-surface-2)]" />
          <div className="h-9 flex-1 rounded-[10px] bg-[var(--bg-surface-2)]" />
        </div>
      </div>
    </div>
  );
}
