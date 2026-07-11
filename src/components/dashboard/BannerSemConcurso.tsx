import { useNavigate } from "react-router-dom";

export function BannerSemConcurso() {
  const navigate = useNavigate();
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          Nenhum concurso ativo. Cadastre um concurso para organizar disciplinas e data da prova.
        </p>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-700"
          onClick={() => navigate("/concursos")}
        >
          Criar concurso
        </button>
      </div>
    </div>
  );
}
