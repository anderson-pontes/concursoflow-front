import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/services/api";
import { usePlanoStore } from "@/stores/planoStore";
import type { DisciplinaPlano, PlanoEstudo, TopicoPlano } from "@/types/plano";
import { DrawerDisciplina } from "@/components/planos/DrawerDisciplina";

type DisciplinaGlobal = {
  id: string;
  nome: string;
  sigla: string | null;
  total_questoes_prova: number | null;
  cor_hex: string | null;
};

export function PlanoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const planoId = id ?? "";

  const loadPlanos = usePlanoStore((s) => s.loadPlanos);
  const planos = usePlanoStore((s) => s.planos);

  const listarPlanoDisciplinas = usePlanoStore((s) => s.listarPlanoDisciplinas);
  const listarPlanoTopicos = usePlanoStore((s) => s.listarPlanoTopicos);
  const adicionarDisciplina = usePlanoStore((s) => s.adicionarDisciplina);

  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = React.useState<DisciplinaPlano[]>([]);
  const [openDisciplinaId, setOpenDisciplinaId] = React.useState<string | null>(null);
  const [novaDisciplinaId, setNovaDisciplinaId] = React.useState<string>("");

  const plano: PlanoEstudo | null = React.useMemo(() => planos.find((p) => p.id === planoId) ?? null, [planos, planoId]);

  // Carrega o plano (lista) quando necessário.
  React.useEffect(() => {
    if (!plano && planoId) {
      loadPlanos().catch(() => {
        // Silencioso: a UI mostra "Carregando..." até ter dados.
      });
    }
  }, [loadPlanos, plano, planoId]);

  const refreshDisciplinas = React.useCallback(async () => {
    if (!planoId) return;
    const discRows = await listarPlanoDisciplinas(planoId);
    const discWithTopicos: DisciplinaPlano[] = await Promise.all(
      discRows.map(async (d) => {
        const topicos: TopicoPlano[] = await listarPlanoTopicos(planoId, d.disciplinaId);
        return { ...d, topicos };
      }),
    );
    setDisciplinasSelecionadas(discWithTopicos);
    if (openDisciplinaId) {
      const stillExists = discWithTopicos.some((d) => d.disciplinaId === openDisciplinaId);
      if (!stillExists) setOpenDisciplinaId(null);
    }
  }, [listarPlanoDisciplinas, listarPlanoTopicos, openDisciplinaId, planoId]);

  React.useEffect(() => {
    refreshDisciplinas().catch(() => {
      // Mantém UI sem travar.
    });
  }, [planoId, refreshDisciplinas]);

  const { data: disciplinasGlobais } = useQuery({
    queryKey: ["disciplinas-global-plano"],
    queryFn: async () => (await api.get("/disciplinas")).data as DisciplinaGlobal[],
    staleTime: 1000 * 60 * 5,
  });

  const disciplinaIdsSelecionadas = React.useMemo(() => new Set(disciplinasSelecionadas.map((d) => d.disciplinaId)), [disciplinasSelecionadas]);

  const opcoesAdicionar = React.useMemo(() => {
    return (disciplinasGlobais ?? []).filter((d) => !disciplinaIdsSelecionadas.has(d.id));
  }, [disciplinasGlobais, disciplinaIdsSelecionadas]);

  const disciplinaSelecionada = React.useMemo(() => {
    if (!openDisciplinaId) return null;
    return disciplinasSelecionadas.find((d) => d.disciplinaId === openDisciplinaId) ?? null;
  }, [disciplinasSelecionadas, openDisciplinaId]);

  const atualizarTopicosDaDisciplina = React.useCallback(
    async (disciplinaId: string) => {
      const topicos = await listarPlanoTopicos(planoId, disciplinaId);
      setDisciplinasSelecionadas((prev) =>
        prev.map((d) => (d.disciplinaId === disciplinaId ? { ...d, topicos } : d)),
      );
    },
    [listarPlanoTopicos, planoId],
  );

  const toggleTopico = usePlanoStore((s) => s.atualizarTopicoEstudado);
  const adicionarTopico = usePlanoStore((s) => s.adicionarTopico);
  const excluirTopico = usePlanoStore((s) => s.excluirTopico);

  if (!plano) {
    // Mesmo assim, exibimos o conteúdo se o store já tiver disciplinas carregadas.
    if (disciplinasSelecionadas.length === 0) {
      return <div className="text-sm text-neutral-400">Carregando plano...</div>;
    }
  }

  return (
    <div>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
        <h1 className="text-xl font-medium text-neutral-800 dark:text-neutral-100">{plano?.nome ?? "Plano de Estudo"}</h1>
        <p className="text-xs text-neutral-400">
          {plano?.orgao ?? "—"} • {plano?.cargo ?? "—"}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-neutral-500">Adicionar disciplina</label>
          <select
            className="w-full rounded-lg border border-neutral-200 bg-background px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
            value={novaDisciplinaId}
            onChange={(e) => setNovaDisciplinaId(e.target.value)}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {opcoesAdicionar.map((d) => (
              <option key={d.id} value={d.id}>
                {d.sigla ? `${d.sigla} - ` : ""}
                {d.nome}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
          disabled={!novaDisciplinaId}
          onClick={async () => {
            if (!novaDisciplinaId) return;
            await adicionarDisciplina(planoId, { disciplinaId: novaDisciplinaId });
            setNovaDisciplinaId("");
            await refreshDisciplinas();
            toast.success("Disciplina adicionada ao plano.");
          }}
        >
          + Adicionar
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {disciplinasSelecionadas.map((d) => {
          const total = d.topicos.length;
          const estudados = d.topicos.filter((t) => t.estudado).length;
          const pct = total > 0 ? Math.round((estudados / total) * 100) : 0;

          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setOpenDisciplinaId(d.disciplinaId)}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white text-left dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="h-1" style={{ backgroundColor: d.cor }} />
              <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {d.codigo} {d.nome}
                </div>
                <div className="text-xs text-neutral-400">({d.pesoEdital} questões)</div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-4 text-center">
                <div>
                  <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{estudados}</div>
                  <div className="text-[10px] text-neutral-400">Estudados</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{total}</div>
                  <div className="text-[10px] text-neutral-400">Total</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{pct}%</div>
                  <div className="text-[10px] text-neutral-400">Conclusão</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <DrawerDisciplina
        planoId={planoId}
        open={Boolean(disciplinaSelecionada)}
        disciplina={disciplinaSelecionada}
        onClose={() => setOpenDisciplinaId(null)}
        onToggleTopico={async (planoTopicoId, nextEstudado) => {
          if (!openDisciplinaId) return;
          const updated = await toggleTopico(planoTopicoId, nextEstudado);
          toast.success(updated.estudado ? "Tópico concluído! +1 progresso" : "Tópico marcado como não concluído");
          await atualizarTopicosDaDisciplina(openDisciplinaId);
        }}
        onAddTopico={async (topicoIdGlobal) => {
          if (!disciplinaSelecionada) return;
          await adicionarTopico(planoId, disciplinaSelecionada.disciplinaId, topicoIdGlobal);
          toast.success("Tópico adicionado ao plano.");
          await atualizarTopicosDaDisciplina(disciplinaSelecionada.disciplinaId);
        }}
        onDeleteTopico={async (planoTopicoId) => {
          if (!disciplinaSelecionada) return;
          await excluirTopico(planoTopicoId);
          toast.error("Tópico removido do plano.");
          await atualizarTopicosDaDisciplina(disciplinaSelecionada.disciplinaId);
        }}
      />
    </div>
  );
}

