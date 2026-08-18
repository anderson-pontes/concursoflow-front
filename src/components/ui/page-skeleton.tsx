import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type PageSkeletonProps = {
  className?: string
  cards?: number
  rows?: number
}

function PageSkeleton({ className, cards = 3, rows = 4 }: PageSkeletonProps) {
  return (
    <div
      className={cn("space-y-6 p-1", className)}
      role="status"
      aria-live="polite"
      aria-label="Carregando conteúdo"
    >
      <span className="sr-only">Carregando conteúdo…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-52 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

export { PageSkeleton }
