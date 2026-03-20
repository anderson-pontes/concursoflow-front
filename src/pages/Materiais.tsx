import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/services/api";

type Disciplina = {
  id: string;
  concurso_id: string;
  nome: string;
  sigla: string | null;
};

type Material = {
  id: string;
  user_id: string;
  disciplina_id: string;
  tipo: string;
  titulo: string;
  autor_professor: string | null;
  editora_plataforma: string | null;
  ano: number | null;
  url: string | null;
  paginas: number | null;
  horas_estimadas: number | null;
  concluido: boolean;
  progresso_pct: number;
  anotacoes: string | null;
  created_at: string;
};

export function Materiais() {
  const qc = useQueryClient();

  const { data: disciplinas } = useQuery({
    queryKey: ["disciplinas-all"],
    queryFn: async () => (await api.get("/disciplinas")).data as Disciplina[],
  });

  const [disciplinaId, setDisciplinaId] = React.useState<string>("");

  React.useEffect(() => {
    if (!disciplinaId && disciplinas && disciplinas.length > 0) {
      setDisciplinaId(disciplinas[0].id);
    }
  }, [disciplinas, disciplinaId]);

  const { data: materiais } = useQuery({
    queryKey: ["materiais", disciplinaId],
    enabled: Boolean(disciplinaId),
    queryFn: async () => (await api.get("/materiais", { params: { disciplina_id: disciplinaId } })).data as Material[],
  });

  const [form, setForm] = React.useState({
    disciplina_id: "",
    tipo: "pdf",
    titulo: "",
    autor_professor: "",
    url: "",
  });

  React.useEffect(() => {
    if (disciplinaId && !form.disciplina_id) setForm((s) => ({ ...s, disciplina_id: disciplinaId }));
  }, [disciplinaId, form.disciplina_id]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        disciplina_id: form.disciplina_id,
        tipo: form.tipo,
        titulo: form.titulo,
        autor_professor: form.autor_professor ? form.autor_professor : null,
        editora_plataforma: null,
        ano: null,
        url: form.url ? form.url : null,
        paginas: null,
        horas_estimadas: null,
        anotacoes: null,
      };
      const res = await api.post("/materiais", payload);
      return res.data as Material;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materiais", disciplinaId] });
      setForm((s) => ({ ...s, titulo: "", url: "", autor_professor: "" }));
    },
  });

  const toggleConcluidoMutation = useMutation({
    mutationFn: async (payload: { id: string; concluido: boolean }) => {
      const res = await api.put(`/materiais/${payload.id}`, { concluido: payload.concluido, progresso_pct: payload.concluido ? 100 : 0 });
      return res.data as Material;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiais", disciplinaId] }),
  });

  const tipos = ["videoaula", "pdf", "livro", "apostila", "lei", "jurisprudencia", "artigo", "outro"];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Materiais</h2>
        <p className="text-sm text-muted-foreground">Cadastro simples e progresso por material.</p>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Disciplina</span>
            <select
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
            >
              {(disciplinas ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Novo material</span>
            <input
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              placeholder="Título"
              value={form.titulo}
              onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
            />
          </label>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium">Tipo</span>
            <select className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none" value={form.tipo} onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">URL (opcional)</span>
            <input className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none" placeholder="https://..." value={form.url} onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Autor/Professor</span>
            <input className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none" placeholder="Nome" value={form.autor_professor} onChange={(e) => setForm((s) => ({ ...s, autor_professor: e.target.value }))} />
          </label>
        </div>

        <button
          type="button"
          className="mt-3 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-800 disabled:opacity-60"
          disabled={!form.titulo.trim() || !form.disciplina_id || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? "Criando..." : "Criar"}
        </button>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <h3 className="text-sm font-semibold">Lista</h3>
        {!materiais ? (
          <div className="mt-3 text-sm text-muted-foreground">Carregando...</div>
        ) : materiais.length === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">Sem materiais.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {materiais.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/40 bg-background p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{m.titulo}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {m.tipo} • progresso {m.progresso_pct}%
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border/40 bg-background px-3 py-1.5 text-xs hover:bg-muted"
                    onClick={() =>
                      toggleConcluidoMutation.mutate({
                        id: m.id,
                        concluido: !m.concluido,
                      })
                    }
                  >
                    {m.concluido ? "Marcar como não concluído" : "Marcar como concluído"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

