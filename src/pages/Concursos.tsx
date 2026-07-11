import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConcursoDetalheModal } from "@/components/concursos/ConcursoDetalheModal";
import { ConcursoCardSkeleton } from "@/components/concursos/ConcursoCardSkeleton";
import { ConcursoListCard } from "@/components/concursos/ConcursoListCard";
import {
  ConcursosEmptyState,
  ConcursosSummaryBar,
  ConcursosToolbar,
} from "@/components/concursos/ConcursosToolbar";
import { ModalConcurso, type ConcursoFormInput } from "@/components/concursos/ModalConcurso";
import {
  DEFAULT_CONCURSO_INPUT,
  type Concurso,
  type ConcursoStatusFilter,
} from "@/lib/concursos/types";
import { isEncerradoStatus } from "@/lib/concursos/utils";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import type { Disciplina } from "@/lib/disciplinas/types";

export function Concursos() {
  const qc = useQueryClient();

  const {
    data: concursos,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as Concurso[],
  });

  const { data: disciplinas = [] } = useQuery({
    queryKey: ["disciplinas", "catalog"],
    queryFn: async () => (await api.get("/disciplinas")).data as Disciplina[],
  });

  const disciplinasCountByConcurso = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const d of disciplinas) {
      for (const cid of d.concurso_ids) {
        m.set(cid, (m.get(cid) ?? 0) + 1);
      }
    }
    return m;
  }, [disciplinas]);

  const orgaoSuggestions = React.useMemo(() => {
    const s = new Set<string>();
    (concursos ?? []).forEach((c) => {
      if (c.orgao?.trim()) s.add(c.orgao.trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [concursos]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Concurso | null>(null);
  const [input, setInput] = React.useState<ConcursoFormInput>(DEFAULT_CONCURSO_INPUT);
  const [detalhe, setDetalhe] = React.useState<Concurso | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ConcursoStatusFilter>("todos");
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const deleteTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const armDeletePrompt = (id: string) => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setPendingDeleteId(id);
    deleteTimerRef.current = setTimeout(() => {
      setPendingDeleteId(null);
      deleteTimerRef.current = null;
    }, 3000);
  };

  React.useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const filteredConcursos = React.useMemo(() => {
    const list = concursos ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (statusFilter === "ativos" && isEncerradoStatus(c.status)) return false;
      if (statusFilter === "encerrados" && !isEncerradoStatus(c.status)) return false;
      if (!q) return true;
      const hay = [c.nome, c.orgao, c.cargo, c.banca].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [concursos, search, statusFilter]);

  const totalCadastrados = concursos?.length ?? 0;
  const totalAtivos = concursos?.filter((c) => !isEncerradoStatus(c.status)).length ?? 0;

  const openCreate = () => {
    setEditing(null);
    setInput(DEFAULT_CONCURSO_INPUT);
    setIsModalOpen(true);
  };

  const openEdit = (c: Concurso) => {
    setEditing(c);
    setInput({
      nome: c.nome,
      orgao: c.orgao,
      cargo: c.cargo,
      banca: c.banca,
      data_prova: c.data_prova,
      status: c.status,
      logo_file: null,
      edital_file: null,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const uploadConcursoFiles = async (concursoId: string, values: ConcursoFormInput) => {
    if (values.logo_file) {
      const form = new FormData();
      form.append("file", values.logo_file);
      await api.post(`/concursos/${concursoId}/upload-logo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    if (values.edital_file) {
      const form = new FormData();
      form.append("file", values.edital_file);
      await api.post(`/concursos/${concursoId}/upload-edital`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
  };

  const buildPayload = (values: ConcursoFormInput) => ({
    nome: values.nome,
    orgao: values.orgao,
    cargo: values.cargo || null,
    banca: values.banca || null,
    data_prova: values.data_prova || null,
    status: values.status || null,
  });

  const createMutation = useMutation({
    mutationFn: async (values: ConcursoFormInput) => {
      const res = await api.post("/concursos", buildPayload(values));
      const created = res.data as Concurso;
      await uploadConcursoFiles(created.id, values);
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concursos"] });
      closeModal();
      toast.success("Concurso criado com sucesso!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ConcursoFormInput) => {
      if (!editing) throw new Error("No editing contest");
      const res = await api.put(`/concursos/${editing.id}`, buildPayload(values));
      const updated = res.data as Concurso;
      await uploadConcursoFiles(editing.id, values);
      return updated;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concursos"] });
      closeModal();
      toast.success("Concurso atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/concursos/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concursos"] });
      setPendingDeleteId(null);
    },
  });

  const submitForm = () => {
    if (editing) updateMutation.mutate(input);
    else createMutation.mutate(input);
  };

  const showSkeleton = isLoading;
  const listRefreshing = isFetching && !isLoading;

  return (
    <div className="min-h-full space-y-6 pb-8 font-sans">
      <ConcursosToolbar
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onCreate={openCreate}
      />

      <ConcursosSummaryBar totalCadastrados={totalCadastrados} totalAtivos={totalAtivos} />

      {isError ? (
        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : "Erro ao carregar"}
        </div>
      ) : null}

      {showSkeleton ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 min-[1200px]:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ConcursoCardSkeleton key={i} />
          ))}
        </div>
      ) : !concursos?.length ? (
        <ConcursosEmptyState onCreate={openCreate} />
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-5 md:grid-cols-2 min-[1200px]:grid-cols-3",
            listRefreshing && "opacity-70 transition-opacity duration-200",
          )}
        >
          {filteredConcursos.length === 0 ? (
            <div className="col-span-full rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-12 text-center text-sm text-[var(--text-secondary)] shadow-sm">
              Nenhum concurso encontrado com os filtros atuais.
            </div>
          ) : null}
          {filteredConcursos.map((c) => {
            const count = disciplinasCountByConcurso.get(c.id) ?? 0;
            const cardTotals = {
              disciplinasCount: count,
              questoesTotal: 0,
              acertoMedioPct: 0,
            };

            return (
              <ConcursoListCard
                key={c.id}
                concurso={c}
                cardTotals={cardTotals}
                pendingDeleteId={pendingDeleteId}
                deletePending={deleteMutation.isPending}
                onViewDetails={() => setDetalhe(c)}
                onEdit={() => openEdit(c)}
                onDeletePrompt={() => armDeletePrompt(c.id)}
                onConfirmDelete={() => deleteMutation.mutate(c.id)}
                onCancelDelete={() => {
                  setPendingDeleteId(null);
                  if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
                }}
              />
            );
          })}
        </div>
      )}

      <ModalConcurso
        open={isModalOpen}
        onClose={closeModal}
        editing={editing}
        input={input}
        setInput={setInput}
        onSubmit={submitForm}
        isPending={createMutation.isPending || updateMutation.isPending}
        orgaoSuggestions={orgaoSuggestions}
      />

      <ConcursoDetalheModal
        concurso={detalhe}
        onClose={() => setDetalhe(null)}
        onEdit={
          detalhe
            ? () => {
                const c = detalhe;
                setDetalhe(null);
                openEdit(c);
              }
            : undefined
        }
      />
    </div>
  );
}
