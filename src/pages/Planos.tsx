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
    <div
      className="min-h-full space-y-6 pb-8"
      style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#F5F4FA" }}
    >
      <style>{`
        @keyframes plano-card-dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.88); }
        }
        .plano-card-dot-pulse { animation: plano-card-dot-pulse 2s ease-in-out infinite; }
      `}</style>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[#1A1A2E]">Planos de Estudo</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Organize seus estudos por concurso e acompanhe sua evolução
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#6C3FC5] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-[#5B32A8] hover:shadow-[0_4px_14px_rgba(108,63,197,0.35)]"
          onClick={() => setOpenCriar(true)}
        >
          <span className="text-lg font-light leading-none">+</span>
          Novo Plano
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] text-[#6B7280] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          📋 {summary.n} {summary.n === 1 ? "plano criado" : "planos criados"}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] text-[#6B7280] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          ✅ {summary.ativos} {summary.ativos === 1 ? "ativo" : "ativos"}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] text-[#6B7280] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          📚 {summary.disc} {summary.disc === 1 ? "disciplina" : "disciplinas"}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] text-[#6B7280] shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          📈 {summary.avgProgress}% de progresso médio
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C4B5FD] px-5 py-8 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#6C3FC5] hover:bg-[#EDE9FE]"
          style={{
            background: "linear-gradient(135deg, #FAFAFE, #F3F0FF)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          }}
          onClick={() => setOpenCriar(true)}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE9FE]">
            <span className="text-2xl font-light leading-none text-[#6C3FC5]">+</span>
          </div>
          <span className="text-base font-bold text-[#6C3FC5]">Criar novo plano</span>
          <span className="mt-1 max-w-[260px] text-[13px] text-[#9CA3AF]">
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
