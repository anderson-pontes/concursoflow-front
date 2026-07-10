import React from "react";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { fmtPontos } from "@/lib/disciplinas/pontos";
import type { DisciplinaInput } from "@/lib/disciplinas/types";
import { api } from "@/services/api";

export type DisciplinaFormValues = {
  nome: string;
  sigla: string;
  concursoIds: string[];
};

type ConcursoOption = { id: string; orgao: string; cargo: string | null; nome: string };

type ComputedTotals = {
  peso: number | null;
  totalPontos: number | null;
  topicosTotal: number | null;
};

type ModalDisciplinaFormProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<DisciplinaFormValues>;
  /** Peso/pontos calculados a partir dos assuntos — só existem no modo edição. */
  computedTotals?: ComputedTotals;
  onClose: () => void;
  onSubmit: (values: DisciplinaFormValues) => Promise<void>;
  isPending?: boolean;
  defaultConcursoId?: string;
};

const emptyValues: DisciplinaFormValues = {
  nome: "",
  sigla: "",
  concursoIds: [],
};

export function ModalDisciplinaForm({
  open,
  mode,
  initialValues,
  computedTotals,
  onClose,
  onSubmit,
  isPending = false,
  defaultConcursoId,
}: ModalDisciplinaFormProps) {
  const [values, setValues] = React.useState<DisciplinaFormValues>(emptyValues);

  const { data: concursos = [] } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as ConcursoOption[],
    enabled: open,
  });

  React.useEffect(() => {
    if (!open) return;
    const base = { ...emptyValues, ...initialValues };
    if (mode === "create" && defaultConcursoId && base.concursoIds.length === 0) {
      base.concursoIds = [defaultConcursoId];
    }
    setValues(base);
  }, [open, mode, initialValues, defaultConcursoId]);

  if (!open) return null;

  const toggleConcurso = (id: string) => {
    setValues((s) => ({
      ...s,
      concursoIds: s.concursoIds.includes(id)
        ? s.concursoIds.filter((x) => x !== id)
        : [...s.concursoIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.nome.trim()) return;
    await onSubmit({
      ...values,
      nome: values.nome.trim(),
      sigla: values.sigla.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[4px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[20px] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_24px_64px_rgba(0,0,0,0.18)] sm:rounded-[20px]"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <header className="relative shrink-0 border-b border-[var(--border-subtle)] px-6 pb-4 pt-6 pr-14">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="absolute right-3 top-3 rounded-lg p-2 text-2xl leading-none text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            aria-label="Fechar"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F0FF] text-[#6C3FC5] dark:bg-[var(--ap-brand-light)]">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {mode === "create" ? "Nova disciplina" : "Editar disciplina"}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Catálogo global — vincule a um ou mais concursos (opcional)
              </p>
            </div>
          </div>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <div>
              <label htmlFor="disc-nome" className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="disc-nome"
                autoFocus
                required
                disabled={isPending}
                value={values.nome}
                onChange={(e) => setValues((s) => ({ ...s, nome: e.target.value }))}
                placeholder="Ex.: Direito Tributário"
                className="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[#6C3FC5] focus:shadow-[0_0_0_3px_rgba(108,63,197,0.15)]"
              />
            </div>

            <div>
              <label htmlFor="disc-sigla" className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                Sigla <span className="text-[var(--text-muted)]">(opcional)</span>
              </label>
              <input
                id="disc-sigla"
                disabled={isPending}
                value={values.sigla}
                onChange={(e) => setValues((s) => ({ ...s, sigla: e.target.value }))}
                placeholder="Ex.: DIR"
                maxLength={10}
                className="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[#6C3FC5] focus:shadow-[0_0_0_3px_rgba(108,63,197,0.15)]"
              />
            </div>

            {mode === "edit" ? (
              <div className="rounded-[10px] border border-[#E9D5FF] bg-[#FAF5FF] px-4 py-3 dark:border-[#3D3060] dark:bg-[#1E1A2E]">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Peso e pontos (calculados pelos assuntos)
                </p>
                {computedTotals?.topicosTotal ? (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    <span className="text-lg font-bold tabular-nums text-[#6C3FC5] dark:text-[#A78BFA]">
                      {fmtPontos(computedTotals.totalPontos)} pts
                    </span>
                    <span className="ml-2">
                      soma do peso de {computedTotals.topicosTotal} assunto(s) cadastrado(s)
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Sem assuntos cadastrados ainda. Peso e domínio são definidos por assunto na tela da disciplina.
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-[10px] border border-dashed border-[var(--border-default)] px-4 py-3 text-xs text-[var(--text-muted)]">
                Após criar, cadastre os assuntos (tópicos) da disciplina — peso e domínio de cada um definem a
                prioridade dela automaticamente.
              </p>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">Vincular a concursos</p>
              {concursos.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--border-default)] px-4 py-3 text-sm text-[var(--text-muted)]">
                  Nenhum concurso cadastrado. A disciplina ficará só no catálogo.
                </p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-[10px] border border-[var(--border-default)] p-3">
                  {concursos.map((c) => {
                    const checked = values.concursoIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors",
                          checked ? "bg-[#F3F0FF] dark:bg-[#1E1A2E]" : "hover:bg-[var(--bg-surface-hover)]",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[var(--border-default)] text-[#6C3FC5]"
                          checked={checked}
                          disabled={isPending}
                          onChange={() => toggleConcurso(c.id)}
                        />
                        <span className="min-w-0 flex-1 text-sm text-[var(--text-primary)]">
                          <span className="font-semibold">{c.orgao}</span>
                          <span className="text-[var(--text-secondary)]"> — {c.cargo ?? c.nome}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Deixe desmarcado para manter a disciplina apenas no catálogo.
              </p>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--border-subtle)] px-6 py-4">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-[10px] border border-[var(--border-default)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !values.nome.trim()}
              className="rounded-[10px] bg-[#6C3FC5] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#5B32A8] disabled:opacity-50"
            >
              {isPending ? "Salvando…" : mode === "create" ? "Criar disciplina" : "Salvar alterações"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export function toDisciplinaInput(values: DisciplinaFormValues): DisciplinaInput {
  return {
    nome: values.nome,
    sigla: values.sigla || null,
    concurso_ids: values.concursoIds,
    ordem: 0,
  };
}
