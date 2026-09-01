import { BookOpenCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function BannerSemConcurso() {
  return (
    <EmptyState
      icon={BookOpenCheck}
      title="Escolha o concurso que vai orientar seus estudos"
      description="Ative um edital verticalizado ou cadastre seu concurso para montar um plano com disciplinas e tópicos no contexto correto."
      className="min-h-[320px] bg-card"
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild className="min-h-11 w-full sm:w-auto">
            <Link to="/planos/novo">Escolher edital</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
            <Link to="/concursos?novo=manual">Cadastrar manualmente</Link>
          </Button>
        </div>
      }
    />
  );
}
