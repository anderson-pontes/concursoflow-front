import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { EditalCreateForm } from "@/components/admin/editais/EditalCreateForm";

export function NovoEditalCatalogo() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <header>
        <Link to="/admin/editais" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar ao catálogo</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Novo edital</h1>
        <p className="mt-1 text-sm text-muted-foreground">Comece pelas informações gerais e siga diretamente para disciplinas e conteúdos.</p>
      </header>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <EditalCreateForm onCancel={() => navigate("/admin/editais")} onCreated={(edital) => { toast.success("Edital criado. Agora organize as disciplinas e conteúdos."); navigate(`/admin/editais/${edital.id}/editar?tab=conteudo`, { replace: true }); }} />
      </div>
    </div>
  );
}
