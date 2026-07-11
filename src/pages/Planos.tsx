import React from "react";
import { toast } from "sonner";

import { PlanoCard } from "@/components/planos/PlanoCard";
import { ModalCriarPlano } from "@/components/planos/ModalCriarPlano";
import { usePlanoStore } from "@/stores/planoStore";
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

  const summary = React.useMemo(() => {
    const n = planos.length;
    const ativos = planos.filter((p) => p.ativo).length;
    const disc = planos.reduce((acc, p) => acc + (p.stats?.disciplinas_qty ?? 0), 0);
    const avgProgress =
      n > 0 ? Math.round(planos.reduce((acc, p) => acc + (p.stats?.progresso_pct ?? 0), 0) / n) : 0;
    return { n, ativos, disc, avgProgress };
  }, [planos]);

  return (
    <div className="min-h-full space-y-6 pb-8">
      <style>{`
        @keyframes plano-card-dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.88); }
        }
        .plano-card-dot-pulse { animation: plano-card-dot-pulse 2s ease-in-out infinite; }
      `}</style>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-[28px]">Planos de Estudo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize seus estudos por concurso e acompanhe sua evolução
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:bg-primary-700 hover:shadow-md"
          onClick={() => setOpenCriar(true)}
        >
          <span className="text-lg font-light leading-none">+</span>
          Novo Plano
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground shadow-sm">
          📋 {summary.n} {summary.n === 1 ? "plano criado" : "planos criados"}
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground shadow-sm">
          ✅ {summary.ativos} {summary.ativos === 1 ? "ativo" : "ativos"}
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground shadow-sm">
          📚 {summary.disc} {summary.disc === 1 ? "disciplina" : "disciplinas"}
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] text-muted-foreground shadow-sm">
          📈 {summary.avgProgress}% de progresso médio
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-300 bg-gradient-to-br from-background to-primary-muted px-5 py-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md dark:border-primary-800 dark:from-background dark:to-primary-muted"
          onClick={() => setOpenCriar(true)}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted">
            <span className="text-2xl font-light leading-none text-primary">+</span>
          </div>
          <span className="text-base font-bold text-primary">Criar novo plano</span>
          <span className="mt-1 max-w-[260px] text-[13px] text-muted-foreground">
            Adicione disciplinas a partir de um edital
          </span>
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
