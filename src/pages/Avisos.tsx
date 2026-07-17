import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Bell, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AvisoDeleteDialog } from "@/components/avisos/AvisoDeleteDialog";
import {
  AvisoFormDialog,
  emptyAvisoForm,
  tipoLabel,
  type AvisoFormValues,
} from "@/components/avisos/AvisoFormDialog";
import { fmtDateBR } from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

type Aviso = {
  id: string;
  user_id: string;
  concurso_id: string | null;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_vencimento: string;
  hora_vencimento: string | null;
  prioridade: string;
  confirmado: boolean;
  confirmado_em: string | null;
  notificar_dias_antes: number;
  cor_hex: string | null;
  icone: string | null;
  created_at: string;
};

function formFromAviso(a: Aviso): AvisoFormValues {
  return {
    concurso_id: a.concurso_id ?? "",
    titulo: a.titulo,
    tipo: a.tipo,
    descricao: a.descricao ?? "",
    data_vencimento: a.data_vencimento.slice(0, 10),
  };
}

function mutationErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (error.response?.status === 404) return "Aviso não encontrado.";
  }
  return fallback;
}

function invalidateAvisos(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["avisos"] });
  qc.invalidateQueries({ queryKey: ["avisos-proximos"] });
}

function sortAvisos(list: Aviso[]): Aviso[] {
  return [...list].sort((a, b) => {
    if (a.confirmado !== b.confirmado) return a.confirmado ? 1 : -1;
    return a.data_vencimento.localeCompare(b.data_vencimento);
  });
}

function AvisoListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/5 max-w-[12rem] rounded bg-muted" />
              <div className="h-3 w-3/5 max-w-[16rem] rounded bg-muted" />
            </div>
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

type AvisoListItemProps = {
  aviso: Aviso;
  onEdit: (a: Aviso) => void;
  onDelete: (a: Aviso) => void;
  onConfirm: (id: string) => void;
  confirmPending: boolean;
};

function AvisoListItem({
  aviso,
  onEdit,
  onDelete,
  onConfirm,
  confirmPending,
}: AvisoListItemProps) {
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

  const meta = `${tipoLabel(aviso.tipo)} · ${fmtDateBR(aviso.data_vencimento)} · prioridade ${aviso.prioridade}`;

  return (
    <article
      className={cn(
        "relative rounded-xl border border-border bg-card p-4 shadow-sm",
        menuOpen && "z-30",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-card-foreground">{aviso.titulo}</h2>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                aviso.confirmado
                  ? "bg-success/15 text-success"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {aviso.confirmado ? "Confirmado" : "Pendente"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
          {aviso.descricao ? (
            <p className="mt-2 text-sm text-muted-foreground">{aviso.descricao}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
          {!aviso.confirmado ? (
            <button
              type="button"
              className="min-h-10 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
              disabled={confirmPending}
              onClick={() => onConfirm(aviso.id)}
            >
              Confirmar
            </button>
          ) : null}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={`Ações do aviso ${aviso.titulo}`}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                    onEdit(aviso);
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
                    onDelete(aviso);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Excluir
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function Avisos() {
  const qc = useQueryClient();

  const { data: avisos, isLoading } = useQuery({
    queryKey: ["avisos"],
    queryFn: async () => (await api.get("/avisos")).data as Aviso[],
  });

  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formInitial, setFormInitial] = React.useState<AvisoFormValues>(() => emptyAvisoForm());

  const [deleteTarget, setDeleteTarget] = React.useState<Aviso | null>(null);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setFormInitial(emptyAvisoForm());
    setFormOpen(true);
  };

  const openEdit = (a: Aviso) => {
    setFormMode("edit");
    setEditingId(a.id);
    setFormInitial(formFromAviso(a));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const createMutation = useMutation({
    mutationFn: async (form: AvisoFormValues) => {
      const payload = {
        concurso_id: form.concurso_id ? form.concurso_id : null,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() ? form.descricao.trim() : null,
        tipo: form.tipo.trim() || "inscricao",
        data_vencimento: form.data_vencimento,
        hora_vencimento: null,
        prioridade: "media",
        notificar_dias_antes: 3,
        cor_hex: null,
        icone: null,
      };
      return (await api.post("/avisos", payload)).data as Aviso;
    },
    onSuccess: () => {
      invalidateAvisos(qc);
      closeForm();
      toast.success("Aviso criado.");
    },
    onError: (error) => toast.error(mutationErrorMessage(error, "Não foi possível criar o aviso.")),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: AvisoFormValues }) => {
      const payload = {
        concurso_id: form.concurso_id ? form.concurso_id : null,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() ? form.descricao.trim() : null,
        tipo: form.tipo.trim() || "inscricao",
        data_vencimento: form.data_vencimento,
      };
      return (await api.put(`/avisos/${id}`, payload)).data as Aviso;
    },
    onSuccess: () => {
      invalidateAvisos(qc);
      closeForm();
      toast.success("Aviso atualizado.");
    },
    onError: (error) => toast.error(mutationErrorMessage(error, "Não foi possível atualizar o aviso.")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/avisos/${id}`);
    },
    onSuccess: (_data, id) => {
      invalidateAvisos(qc);
      setDeleteTarget(null);
      if (editingId === id) closeForm();
      toast.success("Aviso excluído.");
    },
    onError: (error) => toast.error(mutationErrorMessage(error, "Não foi possível excluir o aviso.")),
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.patch(`/avisos/${id}/confirmar`)).data as Aviso;
    },
    onSuccess: () => {
      invalidateAvisos(qc);
      toast.success("Aviso confirmado.");
    },
    onError: (error) => toast.error(mutationErrorMessage(error, "Não foi possível confirmar o aviso.")),
  });

  const formBusy = createMutation.isPending || updateMutation.isPending;

  const handleFormSubmit = async (values: AvisoFormValues) => {
    try {
      if (formMode === "edit" && editingId) {
        await updateMutation.mutateAsync({ id: editingId, form: values });
      } else {
        await createMutation.mutateAsync(values);
      }
    } catch {
      // toast já em onError
    }
  };

  const sorted = React.useMemo(() => (avisos ? sortAvisos(avisos) : []), [avisos]);
  const nPend = sorted.filter((a) => !a.confirmado).length;
  const nConf = sorted.filter((a) => a.confirmado).length;
  const hasAvisos = sorted.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Avisos & Prazos
          </h1>
          <p className="text-sm text-muted-foreground">Prazos e lembretes do seu plano</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Novo aviso
        </button>
      </div>

      {hasAvisos ? (
        <p className="text-sm text-muted-foreground">
          {nPend} {nPend === 1 ? "pendente" : "pendentes"} · {nConf}{" "}
          {nConf === 1 ? "confirmado" : "confirmados"}
        </p>
      ) : null}

      {isLoading ? <AvisoListSkeleton /> : null}

      {!isLoading && !hasAvisos ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Bell className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="text-base font-semibold text-card-foreground">Nenhum aviso ainda</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Crie lembretes de inscrição, prova e outros prazos.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Novo aviso
          </button>
        </div>
      ) : null}

      {!isLoading && hasAvisos ? (
        <div className="space-y-3">
          {sorted.map((a) => (
            <AvisoListItem
              key={a.id}
              aviso={a}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onConfirm={(id) => confirmMutation.mutate(id)}
              confirmPending={confirmMutation.isPending}
            />
          ))}
        </div>
      ) : null}

      <AvisoFormDialog
        open={formOpen}
        mode={formMode}
        initialValues={formInitial}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        isPending={formBusy}
      />

      <AvisoDeleteDialog
        open={Boolean(deleteTarget)}
        titulo={deleteTarget?.titulo ?? ""}
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
