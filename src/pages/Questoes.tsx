import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/services/api";
import { useConcursoAtivoId } from "@/stores/concursoStore";

type RankingRow = {
  topico_id: string;
  rendimento_medio: number;
};

type PlanDisciplina = {
  id: string; // plano_disciplinas row id
  disciplinaId: string; // global disciplina id
  nome: string;
};

type PlanTopico = {
  id: string; // plano_topicos row id
  topicoId: string; // global topico id
  nome: string;
  estudado: boolean;
};

export function Questoes() {
  const qc = useQueryClient();

  const concursoAtivoId = useConcursoAtivoId();

  const { data: ranking } = useQuery({
    queryKey: ["questoes-ranking"],
    queryFn: async () => (await api.get("/questoes/ranking")).data as RankingRow[],
  });

  const { data: disciplinasDoConcurso } = useQuery({
    queryKey: ["questoes-disciplinas-concurso", concursoAtivoId ?? null],
    enabled: Boolean(concursoAtivoId),
    queryFn: async () => {
      const rows = (await api.get("/disciplinas", { params: { concurso_id: concursoAtivoId } })).data as Array<{
        id: string;
        nome: string;
      }>;
      return rows.map((r) => ({ id: r.id, disciplinaId: r.id, nome: r.nome })) as PlanDisciplina[];
    },
  });

  const [disciplinaId, setDisciplinaId] = React.useState<string>("");
  const [topicoId, setTopicoId] = React.useState<string>("");

  React.useEffect(() => {
    if (!concursoAtivoId) return;
    if (!disciplinaId && disciplinasDoConcurso && disciplinasDoConcurso.length > 0) {
      setDisciplinaId(disciplinasDoConcurso[0].disciplinaId);
    }
  }, [disciplinasDoConcurso, disciplinaId, concursoAtivoId]);

  const { data: topicosDoConcurso } = useQuery({
    queryKey: ["questoes-topicos", disciplinaId],
    enabled: Boolean(disciplinaId),
    queryFn: async () => {
      const rows = (await api.get(`/disciplinas/${disciplinaId}/topicos`)).data as Array<{
        id: string;
        descricao: string;
      }>;
      return rows.map((t) => ({
        id: t.id,
        topicoId: t.id,
        nome: t.descricao,
        estudado: false,
      })) as PlanTopico[];
    },
  });

  React.useEffect(() => {
    if (!concursoAtivoId) return;
    if (!topicoId && topicosDoConcurso && topicosDoConcurso.length > 0) {
      setTopicoId(topicosDoConcurso[0].topicoId);
    }
  }, [concursoAtivoId, topicoId, topicosDoConcurso]);

  const [dataSessao, setDataSessao] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [total, setTotal] = React.useState(10);
  const [certas, setCertas] = React.useState(0);
  const [erradas, setErradas] = React.useState(0);
  const [emBranco, setEmBranco] = React.useState(0);
  const [ciclo, setCiclo] = React.useState(1);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!concursoAtivoId) throw new Error("Nenhum concurso ativo");
      if (!disciplinaId || !topicoId) throw new Error("Selecione disciplina e tópico");
      const payload = {
        topico_id: topicoId,
        disciplina_id: disciplinaId,
        data_sessao: dataSessao,
        total_questoes: total,
        certas,
        erradas,
        em_branco: emBranco,
        ciclo,
        fonte: null,
        nivel: null,
        anotacoes: null,
      };
      const res = await api.post("/questoes/sessao", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questoes-ranking"] });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Questões</h2>
        <p className="text-sm text-muted-foreground">Registro de sessões por concurso ativo.</p>
      </div>

      {!concursoAtivoId ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Selecione um concurso ativo na barra lateral para registrar sessões.
        </div>
      ) : null}

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <h3 className="text-sm font-semibold">Registrar sessão</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Disciplina</span>
            <select
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={disciplinaId}
              onChange={(e) => {
                const next = e.target.value;
                setDisciplinaId(next);
                setTopicoId("");
              }}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {(disciplinasDoConcurso ?? []).map((d) => (
                <option key={d.disciplinaId} value={d.disciplinaId}>
                  {d.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Tópico</span>
            <select
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={topicoId}
              onChange={(e) => setTopicoId(e.target.value)}
              disabled={!disciplinaId}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {(topicosDoConcurso ?? []).map((t) => (
                <option key={t.topicoId} value={t.topicoId}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Data</span>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={dataSessao}
              onChange={(e) => setDataSessao(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Ciclo</span>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={ciclo}
              onChange={(e) => setCiclo(Number(e.target.value))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Total</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Acertos</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={certas}
              onChange={(e) => setCertas(Number(e.target.value))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Erros</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={erradas}
              onChange={(e) => setErradas(Number(e.target.value))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Em branco</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={emBranco}
              onChange={(e) => setEmBranco(Number(e.target.value))}
            />
          </label>
        </div>

        <button
          type="button"
          className="mt-4 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-800 disabled:opacity-60"
          disabled={mutation.isPending || !disciplinaId || !topicoId || total < 0 || !concursoAtivoId}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Salvando..." : "Salvar sessão"}
        </button>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <h3 className="text-sm font-semibold">Ranking (menor rendimento)</h3>
        <div className="mt-3 overflow-auto">
          {concursoAtivoId ? (
            ranking ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="py-2 pr-3">Topico ID</th>
                    <th className="py-2">Rendimento médio</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((row) => (
                    <tr key={row.topico_id} className="border-t border-border/40">
                      <td className="py-2 pr-3 font-mono text-xs">{row.topico_id}</td>
                      <td className="py-2">{row.rendimento_medio.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            )
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </div>
      </div>
    </div>
  );
}

