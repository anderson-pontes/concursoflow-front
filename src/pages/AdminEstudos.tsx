import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createCategoria, deleteCategoria, listCategorias, updateCategoria } from "@/services/categorias";
import { getRevisoesConfig, putRevisoesConfig } from "@/services/revisoesConfig";

const fieldClass =
  "min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AdminEstudos() {
  const qc = useQueryClient();
  const [novaCategoria, setNovaCategoria] = React.useState("");
  const [diasInput, setDiasInput] = React.useState("1,7,30,60,120");

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });
  const { data: revisoes } = useQuery({
    queryKey: ["revisoes-config"],
    queryFn: getRevisoesConfig,
  });

  React.useEffect(() => {
    if (revisoes?.dias?.length) setDiasInput(revisoes.dias.join(","));
  }, [revisoes]);

  const createCategoriaMutation = useMutation({
    mutationFn: async () => createCategoria(novaCategoria.trim()),
    onSuccess: () => {
      setNovaCategoria("");
      qc.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria criada");
    },
  });

  const updateCategoriaMutation = useMutation({
    mutationFn: async (payload: { id: string; nome: string }) => updateCategoria(payload.id, payload.nome),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria atualizada");
    },
  });

  const deleteCategoriaMutation = useMutation({
    mutationFn: async (id: string) => deleteCategoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria excluída");
    },
    onError: () => toast.error("Categoria vinculada a registro de estudo"),
  });

  const saveRevisoesMutation = useMutation({
    mutationFn: async () => {
      const dias = diasInput
        .split(",")
        .map((x) => Number(x.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      return putRevisoesConfig(dias);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["revisoes-config"] });
      toast.success("Dias de revisão atualizados");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Configurações de Estudos</h2>
        <p className="text-sm text-muted-foreground">Suas categorias e dias padrão de revisão.</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h3 className="text-sm font-semibold">Categorias</h3>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            className={fieldClass}
            placeholder="Nova categoria"
          />
          <button
            type="button"
            onClick={() => createCategoriaMutation.mutate()}
            className="min-h-11 shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-700 disabled:opacity-60"
            disabled={!novaCategoria.trim() || createCategoriaMutation.isPending}
          >
            Criar
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {(categorias ?? []).map((c) => (
            <div key={c.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                defaultValue={c.nome}
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next && next !== c.nome) updateCategoriaMutation.mutate({ id: c.id, nome: next });
                }}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => deleteCategoriaMutation.mutate(c.id)}
                className="min-h-11 shrink-0 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h3 className="text-sm font-semibold">Dias padrão de revisão</h3>
        <p className="mt-1 text-xs text-muted-foreground">Informe os dias separados por vírgula (ex.: 1,7,30,60,120).</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={diasInput} onChange={(e) => setDiasInput(e.target.value)} className={fieldClass} />
          <button
            type="button"
            onClick={() => saveRevisoesMutation.mutate()}
            className="min-h-11 shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-700"
          >
            Salvar
          </button>
        </div>
      </section>
    </div>
  );
}
