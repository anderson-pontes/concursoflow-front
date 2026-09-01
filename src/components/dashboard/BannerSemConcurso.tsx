import { BookOpenCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";

export function BannerSemConcurso() {
  return (
    <EmptyState
      icon={BookOpenCheck}
      title="Escolha o concurso que vai orientar seus estudos"
      description="Ative um edital verticalizado ou cadastre seu concurso para montar um plano com disciplinas e tópicos no contexto correto."
      className="min-h-[320px] bg-card"
      supportingContent={
        <div className="mx-auto w-full max-w-md space-y-2" aria-label="Jornada de configuração: etapa 1 de 4">
          <div className="flex items-center justify-between text-xs text-muted-foreground"><span>1 de 4 · Escolher concurso</span><span>25%</span></div>
          <Progress value={25} className="h-2" />
          <p className="text-xs text-muted-foreground">Depois você confirma o cargo, o conteúdo, o planejamento e a revisão final.</p>
        </div>
      }
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild className="min-h-11 w-full sm:w-auto">
            <Link to="/planos/novo?origem=catalogo">Escolher edital</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
            <Link to="/concursos?novo=manual">Cadastrar manualmente</Link>
          </Button>
        </div>
      }
    />
  );
}
