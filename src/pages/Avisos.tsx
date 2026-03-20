import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/services/api";

type Concurso = {
  id: string;
  nome: string;
};

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

export function Avisos() {
  const qc = useQueryClient();

  const { data: concursos } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as Concurso[],
  });

  const { data: avisos, isLoading } = useQuery({
    queryKey: ["avisos"],
    queryFn: async () => (await api.get("/avisos")).data as Aviso[],
  });

  const [form, setForm] = React.useState({
    concurso_id: "",
    titulo: "",
    tipo: "inscricao",
    descricao: "",
    data_vencimento: new Date().toISOString().slice(0, 10),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        concurso_id: form.concurso_id ? form.concurso_id : null,
        titulo: form.titulo,
        descricao: form.descricao ? form.descricao : null,
        tipo: form.tipo,
        data_vencimento: form.data_vencimento,
        hora_vencimento: null,
        prioridade: "media",
        notificar_dias_antes: 3,
        cor_hex: null,
        icone: null,
      };
      const res = await api.post("/avisos", payload);
      return res.data as Aviso;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["avisos"] });
      setForm((s) => ({ ...s, titulo: "", descricao: "" }));
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/avisos/${id}/confirmar`);
      return res.data as Aviso;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["avisos"] }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Avisos & Prazos</h2>
        <p className="text-sm text-muted-foreground">Listagem e confirmação de prazos (simplificado).</p>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <h3 className="text-sm font-semibold">Novo aviso</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Concurso (opcional)</span>
            <select
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={form.concurso_id}
              onChange={(e) => setForm((s) => ({ ...s, concurso_id: e.target.value }))}
            >
              <option value="">Sem concurso</option>
              {(concursos ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Tipo</span>
            <input
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={form.tipo}
              onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Título</span>
            <input
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={form.titulo}
              onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Data vencimento</span>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={form.data_vencimento}
              onChange={(e) => setForm((s) => ({ ...s, data_vencimento: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Descrição (opcional)</span>
            <input
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={form.descricao}
              onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
            />
          </label>
        </div>

        <button
          type="button"
          className="mt-4 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-800 disabled:opacity-60"
          disabled={createMutation.isPending || !form.titulo.trim()}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? "Criando..." : "Criar aviso"}
        </button>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <h3 className="text-sm font-semibold">Seus avisos</h3>
        {isLoading ? <div className="mt-3 text-sm text-muted-foreground">Carregando...</div> : null}
        {avisos ? (
          <div className="mt-3 space-y-2">
            {avisos.map((a) => (
              <div key={a.id} className="rounded-lg border border-border/40 bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{a.titulo}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {a.tipo} • {a.data_vencimento} • prioridade {a.prioridade}
                    </div>
                    {a.descricao ? <div className="mt-2 text-sm text-muted-foreground">{a.descricao}</div> : null}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        a.confirmado
                          ? "border border-success-100 bg-success-50 text-success-800"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {a.confirmado ? "Confirmado" : "Pendente"}
                    </span>
                    {!a.confirmado ? (
                      <button
                        type="button"
                        className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-primary-800 disabled:opacity-60"
                        disabled={confirmMutation.isPending}
                        onClick={() => confirmMutation.mutate(a.id)}
                      >
                        Confirmar
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {avisos.length === 0 ? <div className="text-sm text-muted-foreground">Sem avisos ainda.</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

