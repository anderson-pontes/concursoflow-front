import { Skeleton } from "@/components/ui/skeleton";

export function RevisoesListSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Carregando revisões">
      <span className="sr-only">Carregando revisões…</span>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="ml-auto h-11 w-full sm:w-36" />
        </div>
      ))}
    </div>
  );
}
