import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/services/api";
import { usePlanoAtivo, usePlanoStore } from "@/stores/planoStore";

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

  const planoAtivo = usePlanoAtivo();
  const planoIdParam =
    planoAtivo?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(planoAtivo.id)
      ? planoAtivo.id
      : undefined;

  const listarPlanoDisciplinas = usePlanoStore((s) => s.listarPlanoDisciplinas);
  const listarPlanoTopicos = usePlanoStore((s) => s.listarPlanoTopicos);

  const { data: ranking } = useQuery({
    queryKey: ["questoes-ranking", planoIdParam ?? null],
    queryFn: async () => {
      const params = planoIdParam ? { plano_id: planoIdParam } : undefined;
      return (await api.get("/questoes/ranking", { params })).data as RankingRow[];
    },
    enabled: Boolean(planoIdParam),
  });

  const { data: disciplinasDoPlano } = useQuery({
    queryKey: ["questoes-disciplinas-plano", planoIdParam ?? null],
    enabled: Boolean(planoIdParam),
    queryFn: async () => {
      const rows = await listarPlanoDisciplinas(planoIdParam!);
      return rows.map(
        (d) =>
          ({
            id: d.id,
            disciplinaId: d.disciplinaId,
            nome: d.nome,
          }) satisfies PlanDisciplina,
      );
    },
  });

  const [disciplinaId, setDisciplinaId] = React.useState<string>("");
  const [topicoId, setTopicoId] = React.useState<string>("");

  React.useEffect(() => {
    if (!planoIdParam) return;
    if (!disciplinaId && disciplinasDoPlano && disciplinasDoPlano.length > 0) {
      setDisciplinaId(disciplinasDoPlano[0].disciplinaId);
    }
  }, [disciplinasDoPlano, disciplinaId, planoIdParam]);

  const { data: topicosDoPlano } = useQuery({
    queryKey: ["questoes-topicos-plano", planoIdParam ?? null, disciplinaId],
    enabled: Boolean(planoIdParam) && Boolean(disciplinaId),
    queryFn: async () => {
      const rows = await listarPlanoTopicos(planoIdParam!, disciplinaId);
      return rows.map((t) => ({
        id: t.id,
        topicoId: t.topicoId,
        nome: t.nome,
        estudado: t.estudado,
      })) as PlanTopico[];
    },
  });

  React.useEffect(() => {
    if (!planoIdParam) return;
    if (!topicoId && topicosDoPlano && topicosDoPlano.length > 0) {
      setTopicoId(topicosDoPlano[0].topicoId);
    }
  }, [planoIdParam, topicoId, topicosDoPlano]);

  const [dataSessao, setDataSessao] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [total, setTotal] = React.useState(10);
  const [certas, setCertas] = React.useState(0);
  const [erradas, setErradas] = React.useState(0);
  const [emBranco, setEmBranco] = React.useState(0);
  const [ciclo, setCiclo] = React.useState(1);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!planoIdParam) throw new Error("Nenhum plano ativo");
      if (!disciplinaId || !topicoId) throw new Error("Selecione disciplina e tópico");
      const payload = {
        plano_id: planoIdParam,
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
      qc.invalidateQueries({ queryKey: ["questoes-ranking", planoIdParam ?? null] });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Questões</h2>
        <p className="text-sm text-muted-foreground">Registro básico de sessões e ranking por plano.</p>
      </div>

      {!planoIdParam ? (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
          Selecione um plano ativo para registrar sessões.
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
              {(disciplinasDoPlano ?? []).map((d) => (
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
              {(topicosDoPlano ?? []).map((t) => (
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
          disabled={mutation.isPending || !disciplinaId || !topicoId || total < 0 || !planoIdParam}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Salvando..." : "Salvar sessão"}
        </button>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <h3 className="text-sm font-semibold">Ranking (menor rendimento)</h3>
        <div className="mt-3 overflow-auto">
          {planoIdParam ? (
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

