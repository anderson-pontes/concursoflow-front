import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/services/api";

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

type ConcursoInput = {
  nome: string;
  orgao: string;
  cargo: string | null;
  banca: string | null;
  status: string | null;
  logo_file: File | null;
  edital_file: File | null;
};

const defaultInput: ConcursoInput = {
  nome: "",
  orgao: "",
  cargo: null,
  banca: null,
  status: "ativo",
  logo_file: null,
  edital_file: null,
};

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

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Concurso | null>(null);
  const [input, setInput] = React.useState<ConcursoInput>(defaultInput);

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
    mutationFn: async (values: ConcursoInput) => {
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
    mutationFn: async (values: ConcursoInput) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Concursos</h2>
          <p className="text-sm text-muted-foreground">Cadastre e organize seus concursos-alvo.</p>
        </div>

        <button
          type="button"
          className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-800"
          onClick={openCreate}
        >
          + Novo
        </button>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Carregando...</div> : null}

      {isError ? (
        <div className="text-sm text-danger-600">
          {error instanceof Error ? error.message : "Erro ao carregar"}
        </div>
      ) : null}

      {!isLoading && concursos ? (
        <div className="grid gap-3 md:grid-cols-2">
          {concursos.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/40 bg-background/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={`Logo ${c.orgao}`} className="mb-2 h-10 w-10 rounded-md object-cover" />
                  ) : null}
                  <div className="truncate text-sm font-semibold">{c.nome}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {c.orgao} {c.cargo ? `• ${c.cargo}` : ""} {c.banca ? `• ${c.banca}` : ""}
                  </div>
                </div>

                <span className="rounded-full border border-primary-100 bg-primary-50 px-2 py-1 text-xs text-primary-800">
                  {c.status}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-border/40 bg-background px-3 py-1.5 text-xs hover:bg-muted"
                  onClick={() => openEdit(c)}
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="rounded-md bg-danger-600 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-danger-800"
                  onClick={() => {
                    const ok = window.confirm(`Excluir "${c.nome}"?`);
                    if (ok) deleteMutation.mutate(c.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  Excluir
                </button>
                {c.edital_url ? (
                  <a
                    href={c.edital_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-border/40 bg-background px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Ver edital
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border/40 bg-background p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold">
                  {editing ? "Editar concurso" : "Novo concurso"}
                </div>
                <div className="text-sm text-muted-foreground">Preencha os dados abaixo.</div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-border/40 bg-background px-3 py-1.5 text-sm hover:bg-muted"
                onClick={closeModal}
              >
                Fechar
              </button>
            </div>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (editing) updateMutation.mutate(input);
                else createMutation.mutate(input);
              }}
            >
              <label className="block">
                <span className="text-sm font-medium">Nome</span>
                <input
                  className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                  value={input.nome}
                  onChange={(e) => setInput((s) => ({ ...s, nome: e.target.value }))}
                  required
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Órgão</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                    value={input.orgao}
                    onChange={(e) => setInput((s) => ({ ...s, orgao: e.target.value }))}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                    value={input.status ?? "ativo"}
                    onChange={(e) => setInput((s) => ({ ...s, status: e.target.value }))}
                  >
                    <option value="ativo">ativo</option>
                    <option value="suspenso">suspenso</option>
                    <option value="realizado">realizado</option>
                    <option value="eliminado">eliminado</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Cargo (opcional)</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                    value={input.cargo ?? ""}
                    onChange={(e) => setInput((s) => ({ ...s, cargo: e.target.value || null }))}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Banca (opcional)</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                    value={input.banca ?? ""}
                    onChange={(e) => setInput((s) => ({ ...s, banca: e.target.value || null }))}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Upload da logo (opcional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                    onChange={(e) => setInput((s) => ({ ...s, logo_file: e.target.files?.[0] ?? null }))}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Upload do edital (opcional)</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,image/*"
                    className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
                    onChange={(e) => setInput((s) => ({ ...s, edital_file: e.target.files?.[0] ?? null }))}
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-800 disabled:opacity-60"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editing ? "Salvar" : "Criar"}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border/40 bg-background px-3 py-2 text-sm hover:bg-muted"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

