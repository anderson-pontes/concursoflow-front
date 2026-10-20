export function ConcursoCardSkeleton() {
  return <div aria-hidden className="animate-pulse overflow-hidden rounded-2xl border border-t-[3px] border-border bg-card p-5 shadow-sm">
    <div className="flex items-center justify-between"><div className="size-12 rounded-xl bg-muted" /><div className="h-6 w-16 rounded-full bg-muted" /></div>
    <div className="mt-4 space-y-2"><div className="h-5 w-3/4 rounded bg-muted" /><div className="h-5 w-2/3 rounded bg-muted" /><div className="h-3 w-1/2 rounded bg-muted" /></div>
    <div className="mt-4 h-4 w-1/2 rounded bg-muted" />
    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">{[0,1,2].map(i=><div key={i} className="h-16 rounded-lg bg-muted" />)}</div>
    <div className="mt-4 h-11 rounded-lg bg-muted" />
  </div>;
}
