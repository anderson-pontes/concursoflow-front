import React from "react";
import { Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/services/api";
import type { DisciplinaPlano, TopicoPlano } from "@/types/plano";

type TopicoGlobal = {
  id: string;
  descricao: string;
  status: string;
  numero_ordem: number;
};

export function DrawerDisciplina({
  planoId,
  open,
  disciplina,
  onClose,
  onToggleTopico,
  onAddTopico,
  onDeleteTopico,
}: {
  planoId: string;
  open: boolean;
  disciplina: DisciplinaPlano | null;
  onClose: () => void;
  onToggleTopico: (planoTopicoId: string, nextEstudado: boolean) => Promise<void> | void;
  onAddTopico: (topicoIdGlobal: string) => Promise<void> | void;
  onDeleteTopico: (planoTopicoId: string) => Promise<void> | void;
}) {
  const [novoTopicoId, setNovoTopicoId] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) setNovoTopicoId("");
  }, [open]);

  const {
    data: topicosGlobais,
    isLoading: loadingTopicosGlobais,
  } = useQuery({
    queryKey: ["topicos-concurso-plano", disciplina?.disciplinaId],
    enabled: open && Boolean(disciplina?.disciplinaId),
    queryFn: async () =>
      (await api.get(`/disciplinas/${disciplina?.disciplinaId}/topicos`)).data as TopicoGlobal[],
  });

  const topicosGlobaisList = topicosGlobais ?? [];

  const selectedTopicos = disciplina?.topicos ?? [];
  const selectedTopicoIdSet = React.useMemo(() => new Set(selectedTopicos.map((t) => t.topicoId)), [selectedTopicos]);

  const disponiveisParaAdicionar = React.useMemo(() => {
    return topicosGlobaisList.filter((t) => !selectedTopicoIdSet.has(t.id));
  }, [selectedTopicoIdSet, topicosGlobaisList]);

  const disciplinaNullSafe = disciplina ?? null;

  if (!open || !disciplinaNullSafe) return null;

  const total = disciplinaNullSafe.topicos.length;
  const estudados = disciplinaNullSafe.topicos.filter((t) => t.estudado).length;
  const pct = total > 0 ? Math.round((estudados / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[520px] overflow-y-auto border-l border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-neutral-800 dark:text-neutral-100">
              {disciplinaNullSafe.codigo} {disciplinaNullSafe.nome}
            </h3>
            <p className="text-xs text-neutral-400">{disciplinaNullSafe.pesoEdital} questões</p>
          </div>
          <button type="button" className="text-sm text-neutral-400 hover:text-neutral-600" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-neutral-400">
            <span>Progresso</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
            <div className="h-full bg-primary-600" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mb-3 space-y-2">
          {disciplinaNullSafe.topicos.map((t: TopicoPlano) => (
            <div
              key={t.id}
              className="flex items-center gap-3 border-b border-neutral-100 py-2.5 dark:border-neutral-700"
            >
              <input
                type="checkbox"
                checked={t.estudado}
                onChange={() => onToggleTopico(t.id, !t.estudado)}
              />

              <div className="min-w-0 flex-1">
                <div
                  className={[
                    "text-sm",
                    t.estudado ? "line-through text-neutral-400" : "text-neutral-700 dark:text-neutral-200",
                  ].join(" ")}
                >
                  {t.nome}
                </div>
                {t.dataEstudo ? (
                  <div className="text-xs text-neutral-400">{new Date(t.dataEstudo).toLocaleDateString()}</div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onDeleteTopico(t.id)}
                className="rounded p-1 text-neutral-400 hover:bg-danger-50 hover:text-danger-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {disciplinaNullSafe.topicos.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum tópico selecionado neste plano.</div>
          ) : null}
        </div>

        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <div className="mb-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">Adicionar tópico</div>

          <div className="flex gap-2">
            <select
              className="flex-1 rounded-lg border border-neutral-200 bg-background px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
              value={novoTopicoId}
              onChange={(e) => setNovoTopicoId(e.target.value)}
              disabled={loadingTopicosGlobais || disponiveisParaAdicionar.length === 0}
            >
              <option value="" disabled>
                {loadingTopicosGlobais ? "Carregando..." : "Selecione..."}
              </option>
              {disponiveisParaAdicionar.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.numero_ordem ? `${t.numero_ordem}. ` : ""}
                  {t.descricao}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
              disabled={!novoTopicoId}
              onClick={async () => {
                if (!novoTopicoId) return;
                await onAddTopico(novoTopicoId);
                setNovoTopicoId("");
              }}
            >
              + Adicionar
            </button>
          </div>

          {disponiveisParaAdicionar.length === 0 ? (
            <div className="mt-2 text-xs text-muted-foreground">Você já selecionou todos os tópicos desta disciplina.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

