import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Bell, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { AvisoDeleteDialog } from "@/components/avisos/AvisoDeleteDialog";
import {
  AvisoFormDialog,
  emptyAvisoForm,
  tipoLabel,
  type AvisoFormValues,
} from "@/components/avisos/AvisoFormDialog";
import { fmtDateBR } from "@/lib/cronograma/types";
import { avisoStatus, avisoStatusLabel, type AvisoPeriodo, type AvisoStatus } from "@/lib/avisoVigencia";
import { useAvisoDay } from "@/hooks/useAvisoDay";
import { useConcursoAtivoId, useConcursoContextResolved } from "@/stores/concursoStore";
import { SelectField } from "@/components/ui/select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

type Aviso = AvisoPeriodo & {
  id: string;
  user_id: string;
  concurso_id: string | null;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_vencimento: string | null;
  evento_edital: string | null;
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
    data_vencimento: a.data_vencimento ?? "",
    data_inicio: a.data_inicio,
    data_fim: a.data_fim,
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
  qc.invalidateQueries({ queryKey: ["avisos-concurso"] });
  qc.invalidateQueries({ queryKey: ["dashboard-resumo"] });
}

function toPayload(form: AvisoFormValues, oficial = false) {
  return {
    titulo: form.titulo,
    descricao: form.descricao || null,
    tipo: form.tipo,
    data_inicio: form.data_inicio,
    data_fim: form.data_fim,
    ...(!oficial ? { concurso_id: form.concurso_id || null, data_vencimento: form.data_vencimento || null } : {}),
  };
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
  concurso: string;
  status: AvisoStatus;
  onView: (a: Aviso) => void;
  onEdit: (a: Aviso) => void;
  onDelete: (a: Aviso) => void;
  onConfirm: (id: string) => void;
  confirmPending: boolean;
};

function AvisoListItem({
  aviso,
  concurso,
  status,
  onView,
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

  const meta = `${tipoLabel(aviso.tipo)} · ${concurso}`;

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
            <h2 className="min-w-0 break-words text-sm font-semibold text-card-foreground">{aviso.titulo}</h2>
            <Badge variant={status === "ativo" ? "secondary" : "outline"}>{avisoStatusLabel[status]}</Badge>
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
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span><strong className="font-medium text-foreground">Exibição:</strong> {fmtDateBR(aviso.data_inicio)} a {fmtDateBR(aviso.data_fim)}</span>
            {aviso.data_vencimento && <span><strong className="font-medium text-foreground">Evento{aviso.evento_edital ? " do edital" : ""}:</strong> {fmtDateBR(aviso.data_vencimento)}</span>}
          </div>
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
                <button type="button" role="menuitem"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => { setMenuOpen(false); onView(aviso); }}>
                  <Eye className="size-3.5" aria-hidden /> Visualizar
                </button>
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
  const today = useAvisoDay();
  const activeContest = useConcursoAtivoId();
  const contextResolved = useConcursoContextResolved();
  const [filters, setFilters] = useSearchParams();
  const filter = (key: string) => filters.get(key) ?? "";
  const setFilter = (key: string, value: string) => {
    setFilters((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });
  };

  const { data: avisos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["avisos"],
    queryFn: async () => (await api.get("/avisos")).data as Aviso[],
  });
  const { data: concursos = [] } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get<{ id: string; nome: string }[]>("/concursos")).data,
  });

  const [form, setForm] = React.useState<{ mode: "create" | "edit" | "view"; initial: AvisoFormValues; aviso?: Aviso } | null>(null);

  const [deleteTarget, setDeleteTarget] = React.useState<Aviso | null>(null);

  const openCreate = () => setForm({ mode: "create", initial: emptyAvisoForm(today, activeContest ?? "") });
  const openExisting = (aviso: Aviso, mode: "edit" | "view") => setForm({ mode, aviso, initial: formFromAviso(aviso) });
  const closeForm = () => setForm(null);

  const createMutation = useMutation({
    mutationFn: async (form: AvisoFormValues) => {
      return (await api.post("/avisos", toPayload(form))).data as Aviso;
    },
    onSuccess: () => {
      invalidateAvisos(qc);
      closeForm();
      toast.success("Aviso criado.");
    },
    onError: (error) => toast.error(mutationErrorMessage(error, "Não foi possível criar o aviso.")),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ aviso, values }: { aviso: Aviso; values: AvisoFormValues }) => {
      return (await api.put(`/avisos/${aviso.id}`, toPayload(values, Boolean(aviso.evento_edital)))).data as Aviso;
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
      if (form?.aviso?.id === id) closeForm();
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
      if (form?.mode === "edit" && form.aviso) {
        await updateMutation.mutateAsync({ aviso: form.aviso, values });
      } else if (form?.mode === "create") {
        await createMutation.mutateAsync(values);
      }
    } catch {
      // toast já em onError
    }
  };

  const statusFilter = filter("status");
  const contestFilter = filter("concurso");
  const typeFilter = filter("tipo");
  const sort = filter("ordem");
  const tipos = [...new Set(avisos.map((aviso) => aviso.tipo.toLowerCase()))].sort();
  const contestNames = new Map(concursos.map((item) => [item.id, item.nome]));
  const visible = avisos.map((aviso) => ({ aviso, status: avisoStatus(aviso, today) }))
    .filter(({ aviso, status }) =>
      (!statusFilter || status === statusFilter) &&
      (!contestFilter || (aviso.concurso_id ?? "sem-concurso") === contestFilter) &&
      (!typeFilter || aviso.tipo.toLowerCase() === typeFilter))
    .sort(({ aviso: a }, { aviso: b }) => {
      if (sort === "inicio") return a.data_inicio.localeCompare(b.data_inicio);
      if (sort === "fim") return a.data_fim.localeCompare(b.data_fim);
      return b.created_at.localeCompare(a.created_at);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Avisos & Prazos
          </h1>
          <p className="text-sm text-muted-foreground">Prazos e lembretes do seu plano</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={!contextResolved}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Novo aviso
        </button>
      </div>

      <div className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-2 xl:grid-cols-4">
        <SelectField aria-label="Status do aviso" value={statusFilter} onValueChange={(value) => setFilter("status", value)}
          options={[{ value: "", label: "Todos os status" }, { value: "ativo", label: "Ativos" }, { value: "agendado", label: "Agendados" }, { value: "encerrado", label: "Encerrados" }]} />
        <SelectField aria-label="Filtrar por concurso" value={contestFilter} onValueChange={(value) => setFilter("concurso", value)}
          options={[{ value: "", label: "Todos os concursos" }, { value: "sem-concurso", label: "Sem concurso" }, ...concursos.map((item) => ({ value: item.id, label: item.nome }))]} />
        <SelectField aria-label="Filtrar por tipo" value={typeFilter} onValueChange={(value) => setFilter("tipo", value)}
          options={[{ value: "", label: "Todos os tipos" }, ...tipos.map((tipo) => ({ value: tipo, label: tipoLabel(tipo) }))]} />
        <SelectField aria-label="Ordenar avisos" value={sort} onValueChange={(value) => setFilter("ordem", value)}
          options={[{ value: "", label: "Mais recentes" }, { value: "inicio", label: "Data de início" }, { value: "fim", label: "Data de término" }]} />
      </div>

      {isLoading ? <AvisoListSkeleton /> : null}
      {isError && <div className="space-y-2 rounded-xl border bg-card p-4" role="alert">
        <p>Não foi possível carregar os avisos.</p>
        <Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
      </div>}

      {!isLoading && !isError && visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Bell className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="text-base font-semibold text-card-foreground">{avisos.length ? "Nenhum aviso neste filtro" : "Nenhum aviso ainda"}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {avisos.length ? "Altere os filtros para encontrar outros avisos." : "Crie lembretes de inscrição, prova e outros prazos."}
          </p>
          <button
            type="button"
            onClick={openCreate}
            disabled={!contextResolved}
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Novo aviso
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map(({ aviso: a, status }) => (
            <AvisoListItem
              key={a.id}
              aviso={a}
              concurso={a.concurso_id ? contestNames.get(a.concurso_id) ?? "Concurso vinculado" : "Sem concurso"}
              status={status}
              onView={(aviso) => openExisting(aviso, "view")}
              onEdit={(aviso) => openExisting(aviso, "edit")}
              onDelete={setDeleteTarget}
              onConfirm={(id) => confirmMutation.mutate(id)}
              confirmPending={confirmMutation.isPending}
            />
          ))}
        </div>
      ) : null}

      {form && <AvisoFormDialog
        mode={form.mode}
        initialValues={form.initial}
        concursos={concursos}
        oficial={Boolean(form.aviso?.evento_edital)}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        isPending={formBusy}
      />}

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
