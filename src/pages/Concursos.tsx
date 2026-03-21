import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Eye, Pencil, Trash2 } from "lucide-react";

import { ConcursoDetalheModal } from "@/components/concursos/ConcursoDetalheModal";
import { ModalConcurso, type ConcursoFormInput } from "@/components/concursos/ModalConcurso";
import { api } from "@/services/api";
import { resolvePublicUrl } from "@/lib/publicUrl";
import { cn } from "@/lib/utils";

type Concurso = {
  id: string;
  user_id: string;
  nome: string;
  orgao: string;
  cargo: string | null;
  banca: string | null;
  edital_url: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
};

const defaultInput: ConcursoFormInput = {
  nome: "",
  orgao: "",
  cargo: null,
  banca: null,
  status: "ativo",
  logo_file: null,
  edital_file: null,
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ativo: "Ativo",
    suspenso: "Suspenso",
    realizado: "Realizado",
    eliminado: "Eliminado",
  };
  return map[status] ?? status;
}

export function Concursos() {
  const qc = useQueryClient();

  const {
    data: concursos,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => {
      const res = await api.get("/concursos");
      return res.data as Concurso[];
    },
  });

  const orgaoSuggestions = React.useMemo(() => {
    const s = new Set<string>();
    (concursos ?? []).forEach((c) => {
      if (c.orgao?.trim()) s.add(c.orgao.trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [concursos]);

  const bancaSuggestions = React.useMemo(() => {
    const s = new Set<string>();
    (concursos ?? []).forEach((c) => {
      if (c.banca?.trim()) s.add(c.banca.trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [concursos]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Concurso | null>(null);
  const [input, setInput] = React.useState<ConcursoFormInput>(defaultInput);
  const [detalhe, setDetalhe] = React.useState<Concurso | null>(null);

  const openCreate = () => {
    setEditing(null);
    setInput(defaultInput);
    setIsModalOpen(true);
  };

  const openEdit = (c: Concurso) => {
    setEditing(c);
    setInput({
      nome: c.nome,
      orgao: c.orgao,
      cargo: c.cargo,
      banca: c.banca,
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

  const createMutation = useMutation({
    mutationFn: async (values: ConcursoFormInput) => {
      const payload = {
        nome: values.nome,
        orgao: values.orgao,
        cargo: values.cargo || null,
        banca: values.banca || null,
        status: values.status || null,
      };
      const res = await api.post("/concursos", payload);
      const created = res.data as Concurso;
      if (values.logo_file) {
        const form = new FormData();
        form.append("file", values.logo_file);
        await api.post(`/concursos/${created.id}/upload-logo`, form, { headers: { "Content-Type": "multipart/form-data" } });
      }
      if (values.edital_file) {
        const form = new FormData();
        form.append("file", values.edital_file);
        await api.post(`/concursos/${created.id}/upload-edital`, form, { headers: { "Content-Type": "multipart/form-data" } });
      }
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concursos"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ConcursoFormInput) => {
      if (!editing) throw new Error("No editing contest");
      const payload = {
        nome: values.nome,
        orgao: values.orgao,
        cargo: values.cargo,
        banca: values.banca,
        status: values.status,
      };
      const res = await api.put(`/concursos/${editing.id}`, payload);
      const updated = res.data as Concurso;
      if (values.logo_file) {
        const form = new FormData();
        form.append("file", values.logo_file);
        await api.post(`/concursos/${editing.id}/upload-logo`, form, { headers: { "Content-Type": "multipart/form-data" } });
      }
      if (values.edital_file) {
        const form = new FormData();
        form.append("file", values.edital_file);
        await api.post(`/concursos/${editing.id}/upload-edital`, form, { headers: { "Content-Type": "multipart/form-data" } });
      }
      return updated;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concursos"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/concursos/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concursos"] });
    },
  });

  const submitForm = () => {
    if (editing) updateMutation.mutate(input);
    else createMutation.mutate(input);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Concursos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre e organize seus concursos-alvo.</p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          onClick={openCreate}
        >
          + Novo concurso
        </button>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Carregando...</div> : null}

      {isError ? (
        <div className="text-sm text-danger-600">{error instanceof Error ? error.message : "Erro ao carregar"}</div>
      ) : null}

      {!isLoading && concursos ? (
        <div className="grid gap-4 md:grid-cols-2">
          {concursos.map((c) => {
            const logo = resolvePublicUrl(c.logo_url);
            return (
              <article
                key={c.id}
                className={cn(
                  "flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition",
                  "dark:border-neutral-700 dark:bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 dark:border-neutral-700 dark:bg-neutral-900/50">
                      {logo ? (
                        <img src={logo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground">{c.nome}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.orgao}
                        {c.cargo ? ` · ${c.cargo}` : ""}
                        {c.banca ? ` · ${c.banca}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-950/50 dark:text-primary-200">
                    {statusBadge(c.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-muted dark:border-neutral-600"
                    onClick={() => setDetalhe(c)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver detalhes
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted dark:border-neutral-600"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  {c.edital_url ? (
                    <a
                      href={resolvePublicUrl(c.edital_url) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted dark:border-neutral-600"
                    >
                      Edital
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-danger-600 px-3 py-2 text-xs font-medium text-white hover:bg-danger-700 disabled:opacity-60"
                    onClick={() => {
                      const ok = window.confirm(`Excluir "${c.nome}"?`);
                      if (ok) deleteMutation.mutate(c.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <ModalConcurso
        open={isModalOpen}
        onClose={closeModal}
        editing={editing}
        input={input}
        setInput={setInput}
        onSubmit={submitForm}
        isPending={createMutation.isPending || updateMutation.isPending}
        orgaoSuggestions={orgaoSuggestions}
        bancaSuggestions={bancaSuggestions}
      />

      <ConcursoDetalheModal concurso={detalhe} onClose={() => setDetalhe(null)} />
    </div>
  );
}
