import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { BannerSemConcurso } from "@/components/dashboard/BannerSemConcurso";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";

type CronogramaContextStatus =
  | "hydrating"
  | "no_contest"
  | "error"
  | "no_disciplines";

interface CronogramaContextStateProps {
  status: CronogramaContextStatus;
  onRetry: () => void;
}

export function CronogramaContextState({
  status,
  onRetry,
}: CronogramaContextStateProps): ReactNode | null {
  if (status === "hydrating") return <PageSkeleton cards={2} rows={3} />;
  if (status === "no_contest") {
    return (
      <div className="space-y-6 pb-10">
        <header>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Cronograma</h1>
          <p className="text-sm text-muted-foreground">Escolha um concurso antes de planejar sua semana.</p>
        </header>
        <BannerSemConcurso />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="space-y-6 pb-10">
        <header><h1 className="text-xl font-semibold tracking-tight text-foreground">Cronograma</h1></header>
        <div role="alert" className="rounded-xl border border-destructive/30 bg-card p-8 text-center">
          <h2 className="font-semibold">Não foi possível carregar o cronograma</h2>
          <p className="mt-1 text-sm text-muted-foreground">Os dados anteriores foram ocultados. Tente novamente.</p>
          <Button className="mt-5" onClick={onRetry}>Tentar novamente</Button>
        </div>
      </div>
    );
  }
  if (status === "no_disciplines") {
    return (
      <div className="space-y-6 pb-10">
        <header><h1 className="text-xl font-semibold tracking-tight text-foreground">Cronograma</h1></header>
        <EmptyState
          title="Adicione disciplinas antes de planejar"
          description="Vincule ao menos uma disciplina ao concurso ativo para criar horários compatíveis."
          action={<Button asChild><Link to="/disciplinas">Adicionar disciplinas</Link></Button>}
        />
      </div>
    );
  }
  return null;
}
