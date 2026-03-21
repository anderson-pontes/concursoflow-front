import React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { usePlanoStore } from "@/stores/planoStore";
import { PlanoCard } from "@/components/planos/PlanoCard";
import { ModalCriarPlano } from "@/components/planos/ModalCriarPlano";
import type { PlanoEstudo } from "@/types/plano";

export function PlanosPage() {
  const planos = usePlanoStore((s) => s.planos);
  const criarPlano = usePlanoStore((s) => s.criarPlano);
  const editarPlano = usePlanoStore((s) => s.editarPlano);
  const excluirPlano = usePlanoStore((s) => s.excluirPlano);
  const setPlanoAtivo = usePlanoStore((s) => s.setPlanoAtivo);

  const [openCriar, setOpenCriar] = React.useState(false);
  const [editing, setEditing] = React.useState<PlanoEstudo | null>(null);

  const orgaoSuggestions = React.useMemo(() => {
    const s = new Set<string>();
    planos.forEach((p) => {
      if (p.orgao?.trim()) s.add(p.orgao.trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [planos]);

  const cargoSuggestions = React.useMemo(() => {
    const s = new Set<string>();
    planos.forEach((p) => {
      if (p.cargo?.trim()) s.add(p.cargo.trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [planos]);

  const bancaSuggestions = React.useMemo(() => {
    const s = new Set<string>();
    planos.forEach((p) => {
      if (p.banca?.trim()) s.add(p.banca.trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [planos]);

  const suggestionProps = React.useMemo(
    () => ({
      orgaoSuggestions,
      cargoSuggestions,
      bancaSuggestions,
    }),
    [orgaoSuggestions, cargoSuggestions, bancaSuggestions],
  );

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-neutral-800 dark:text-neutral-100">Planos de Estudo</h1>
          <p className="text-xs text-neutral-400">Gerencie seus planos para cada concurso</p>
        </div>
        <button
          className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800"
          onClick={() => setOpenCriar(true)}
        >
          + Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <button
          type="button"
          className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary-200 bg-primary-50 p-6 transition-all hover:border-primary-400 hover:bg-primary-100 dark:border-primary-800 dark:bg-neutral-800"
          onClick={() => setOpenCriar(true)}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100">
            <Plus className="h-6 w-6 text-primary-600" />
          </div>
          <div className="text-sm font-medium text-primary-800">Criar novo plano</div>
          <div className="text-center text-xs text-primary-500">Adicione disciplinas a partir de um edital</div>
        </button>

        {planos.map((plano) => (
          <PlanoCard
            key={plano.id}
            plano={plano}
            onAtivar={(id) => {
              setPlanoAtivo(id);
              const p = planos.find((x) => x.id === id);
              toast.success(`Dashboard atualizado para: ${p?.nome ?? "Plano"}`);
            }}
            onEditar={(p) => setEditing(p)}
            onExcluir={(p) => {
              const ok = window.confirm(`Excluir o plano "${p.nome}"?`);
              if (!ok) return;
              excluirPlano(p.id);
              toast.error("Plano excluído.");
            }}
          />
        ))}
      </div>

      <ModalCriarPlano
        open={openCriar}
        onClose={() => setOpenCriar(false)}
        title="Novo plano de estudo"
        submitText="Criar Plano"
        {...suggestionProps}
        onSubmit={async (values) => {
          await criarPlano({
            nome: values.nome,
            orgao: values.orgao,
            cargo: values.cargo,
            banca: values.banca || undefined,
            dataProva: values.data_prova || undefined,
            status: values.status,
            ativo: values.ativo,
          });
          toast.success("Plano criado com sucesso!");
        }}
      />

      <ModalCriarPlano
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar plano"
        submitText="Salvar"
        {...suggestionProps}
        initialValues={
          editing
            ? {
                nome: editing.nome,
                orgao: editing.orgao,
                cargo: editing.cargo,
                banca: editing.banca,
                status: editing.status,
                data_prova: editing.dataProva,
                ativo: editing.ativo,
              }
            : undefined
        }
        onSubmit={async (values) => {
          if (!editing) return;
          await editarPlano(editing.id, {
            nome: values.nome,
            orgao: values.orgao,
            cargo: values.cargo,
            banca: values.banca || undefined,
            status: values.status,
            dataProva: values.data_prova || undefined,
            ativo: values.ativo,
          });
          toast.success("Plano atualizado!");
        }}
      />
    </div>
  );
}
