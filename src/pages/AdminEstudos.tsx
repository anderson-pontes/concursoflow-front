import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CategoriaDeleteDialog } from "@/components/config-estudos/CategoriaDeleteDialog";
import { CategoriaFormDialog } from "@/components/config-estudos/CategoriaFormDialog";
import {
  REVISAO_DIAS_PADRAO,
  RevisaoDiasChips,
  diasEqual,
  sortDiasAsc,
} from "@/components/config-estudos/RevisaoDiasChips";
import { cn } from "@/lib/utils";
import {
  createCategoria,
  deleteCategoria,
  listCategorias,
  updateCategoria,
  type Categoria,
} from "@/services/categorias";
import { getRevisoesConfig, putRevisoesConfig } from "@/services/revisoesConfig";

function CategoriasSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex h-12 animate-pulse items-center rounded-lg border border-border bg-muted/40 px-3"
        >
          <div className="h-3 w-1/3 max-w-[10rem] rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function CicloSkeleton() {
  return (
    <div className="flex flex-wrap gap-2" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-8 w-12 animate-pulse rounded-full bg-muted" />
      ))}
    </div>
  );
}

type CategoriaRowProps = {
  categoria: Categoria;
  onEdit: (c: Categoria) => void;
  onDelete: (c: Categoria) => void;
};

function CategoriaRow({ categoria, onEdit, onDelete }: CategoriaRowProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = menuRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5",
        menuOpen && "z-30",
      )}
    >
      <span className="min-w-0 truncate text-sm font-medium text-foreground">{categoria.nome}</span>
      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Ações da categoria ${categoria.nome}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-lg border border-border bg-card p-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
              onClick={() => {
                setMenuOpen(false);
                onEdit(categoria);
              }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Editar
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
              onClick={() => {
                setMenuOpen(false);
                onDelete(categoria);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Excluir
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ConfiguracoesEstudos() {
  const qc = useQueryClient();

  const { data: categorias, isLoading: loadingCategorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });
  const { data: revisoes, isLoading: loadingRevisoes } = useQuery({
    queryKey: ["revisoes-config"],
    queryFn: getRevisoesConfig,
  });

  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formNome, setFormNome] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<Categoria | null>(null);

  const [diasDraft, setDiasDraft] = React.useState<number[]>([...REVISAO_DIAS_PADRAO]);
  const [diasHydrated, setDiasHydrated] = React.useState(false);

  React.useEffect(() => {
    if (!revisoes) return;
    const source = revisoes.dias?.length ? revisoes.dias : [...REVISAO_DIAS_PADRAO];
    setDiasDraft(sortDiasAsc(source));
    setDiasHydrated(true);
  }, [revisoes?.id, revisoes?.updated_at]);

  const savedDias = revisoes?.dias ?? [];
  const cicloDirty = diasHydrated && !diasEqual(diasDraft, savedDias);
  const canSaveCiclo = cicloDirty && diasDraft.length > 0;

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setFormNome("");
    setFormOpen(true);
  };

  const openEdit = (c: Categoria) => {
    setFormMode("edit");
    setEditingId(c.id);
    setFormNome(c.nome);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const createMutation = useMutation({
    mutationFn: async (nome: string) => createCategoria(nome),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias"] });
      closeForm();
      toast.success("Categoria criada.");
    },
    onError: () => toast.error("Não foi possível criar a categoria."),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => updateCategoria(id, nome),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias"] });
      closeForm();
      toast.success("Categoria atualizada.");
    },
    onError: () => toast.error("Não foi possível atualizar a categoria."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteCategoria(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["categorias"] });
      setDeleteTarget(null);
      if (editingId === id) closeForm();
      toast.success("Categoria excluída.");
    },
    onError: () => toast.error("Categoria vinculada a registro de estudo"),
  });

  const saveRevisoesMutation = useMutation({
    mutationFn: async (dias: number[]) => putRevisoesConfig(sortDiasAsc(dias)),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["revisoes-config"] });
      setDiasDraft(sortDiasAsc(data.dias));
      toast.success("Ciclo de revisão atualizado.");
    },
    onError: () => toast.error("Não foi possível salvar o ciclo de revisão."),
  });

  const formBusy = createMutation.isPending || updateMutation.isPending;

  const handleFormSubmit = async (nome: string) => {
    try {
      if (formMode === "edit" && editingId) {
        await updateMutation.mutateAsync({ id: editingId, nome });
      } else {
        await createMutation.mutateAsync(nome);
      }
    } catch {
      // toast em onError
    }
  };

  const list = categorias ?? [];
  const hasCategorias = list.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Configurações de estudos
        </h1>
        <p className="text-sm text-muted-foreground">Categorias e ciclo padrão de revisão</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-card-foreground">Categorias</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Rótulos usados ao registrar um estudo
            </p>
            {!loadingCategorias && hasCategorias ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {list.length} {list.length === 1 ? "categoria" : "categorias"}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Nova categoria
          </button>
        </div>

        <div className="mt-4">
          {loadingCategorias ? <CategoriasSkeleton /> : null}

          {!loadingCategorias && !hasCategorias ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Tags className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-card-foreground">Nenhuma categoria ainda</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Crie rótulos para organizar seus registros de estudo.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                Nova categoria
              </button>
            </div>
          ) : null}

          {!loadingCategorias && hasCategorias ? (
            <div className="space-y-2">
              {list.map((c) => (
                <CategoriaRow
                  key={c.id}
                  categoria={c}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-card-foreground">Ciclo de revisão</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Intervalos em dias após o estudo (ex.: 1, 7, 30…)
            </p>
          </div>
          <button
            type="button"
            disabled={loadingRevisoes || saveRevisoesMutation.isPending}
            onClick={() => setDiasDraft([...REVISAO_DIAS_PADRAO])}
            className="mt-2 self-start text-sm font-medium text-primary hover:underline disabled:opacity-50 sm:mt-0"
          >
            Restaurar padrão
          </button>
        </div>

        <div className="mt-4">
          {loadingRevisoes && !diasHydrated ? (
            <CicloSkeleton />
          ) : (
            <RevisaoDiasChips
              dias={diasDraft}
              onChange={setDiasDraft}
              disabled={saveRevisoesMutation.isPending}
            />
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={!canSaveCiclo || saveRevisoesMutation.isPending}
            onClick={() => saveRevisoesMutation.mutate(diasDraft)}
            className="min-h-10 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            {saveRevisoesMutation.isPending ? "Salvando…" : "Salvar ciclo"}
          </button>
        </div>
      </section>

      <CategoriaFormDialog
        open={formOpen}
        mode={formMode}
        initialNome={formNome}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        isPending={formBusy}
      />

      <CategoriaDeleteDialog
        open={Boolean(deleteTarget)}
        nome={deleteTarget?.nome ?? ""}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

/** Alias legado — rota `/configuracoes/estudos` */
export const AdminEstudos = ConfiguracoesEstudos;
