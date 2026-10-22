import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
export function FlashcardsLoadState({loading,onRetry}:{loading:boolean;onRetry:()=>void}) {
  if(loading) return <div role="status" aria-label="Carregando flashcards" className="flash-deck-grid">{[0,1,2].map(i=><Skeleton key={i} className="h-60 w-full rounded-xl"/>)}</div>;
  return <div role="alert" className="space-y-3 rounded-xl border border-border bg-card p-6 text-center"><p className="font-semibold">Não foi possível carregar este conteúdo</p><p className="text-sm text-muted-foreground">Tente novamente para acessar seus flashcards.</p><Button variant="outline" onClick={onRetry}>Tentar novamente</Button></div>;
}
