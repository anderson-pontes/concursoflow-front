import { useNavigate } from "react-router-dom";

export function BannerSemPlano() {
  const navigate = useNavigate();
  return (
    <div className="mb-4 rounded-xl border border-warning-200 bg-warning-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-warning-800">
          Nenhum plano ativo. Crie ou ative um plano para ver seus dados.
        </p>
        <button
          type="button"
          className="rounded-md bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-800"
          onClick={() => navigate("/concursos/planos")}
        >
          Criar plano
        </button>
      </div>
    </div>
  );
}

