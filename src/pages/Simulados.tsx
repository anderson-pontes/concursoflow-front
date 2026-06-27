import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/services/api";
import { useConcursoAtivoId } from "@/stores/concursoStore";

export function Simulados() {
  const qc = useQueryClient();
  const concursoAtivoId = useConcursoAtivoId();

  const { data: simuladoRows = [] } = useQuery({
    queryKey: ["simulados", concursoAtivoId],
    queryFn: async () =>
      (await api.get("/simulados", { params: { concurso_id: concursoAtivoId ?? undefined } })).data as Array<{
        id: string;
        nome: string;
      }>,
  });

  const { data: disciplinaRows = [] } = useQuery({
    queryKey: ["simulados-concurso-disciplinas", concursoAtivoId],
    enabled: Boolean(concursoAtivoId),
    queryFn: async () => {
      const rows = (await api.get("/disciplinas", { params: { concurso_id: concursoAtivoId } })).data as Array<{
        id: string;
        nome: string;
      }>;
      return rows.map((d) => ({ id: d.id, nome: d.nome }));
    },
  });

  const [nome, setNome] = React.useState("");
  const [selected, setSelected] = React.useState<string>("");
  const [disciplinaId, setDisciplinaId] = React.useState<string>("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/simulados", {
        nome,
        tipo: "simulado",
        data_realizacao: new Date().toISOString().slice(0, 10),
        concurso_id: concursoAtivoId ?? undefined,
      });
    },
    onSuccess: () => {
      setNome("");
      qc.invalidateQueries({ queryKey: ["simulados", concursoAtivoId] });
    },
  });

  const resultadoMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/simulados/${selected}/resultados`, [
        { disciplina_id: disciplinaId, total_questoes: 10, certas: 0, erradas: 0, em_branco: 0 },
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["simulados", concursoAtivoId] }),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Simulados</h2>
      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <div className="flex gap-2">
          <input className="flex-1 rounded-lg border border-border/40 bg-background px-3 py-2 text-sm" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Novo simulado" />
          <button type="button" className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60" disabled={!nome.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
            Criar
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <div className="space-y-2">
          {simuladoRows.map((s) => (
            <button key={s.id} type="button" className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${selected === s.id ? "border-primary" : "border-border/40"}`} onClick={() => setSelected(s.id)}>
              {s.nome}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <select className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
          <option value="" disabled>Disciplina do concurso...</option>
          {disciplinaRows.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>
        <button type="button" className="mt-3 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60" disabled={!selected || !disciplinaId || resultadoMutation.isPending} onClick={() => resultadoMutation.mutate()}>
          Lançar resultado
        </button>
      </div>
    </div>
  );
}
