import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/services/api";
import { usePlanoAtivo, usePlanoStore } from "@/stores/planoStore";

type DisciplinaOption = {
  id: string; // disciplina_id (global)
  nome: string;
};

type Bloco = {
  id: string;
  user_id: string;
  disciplina_id: string;
  dia_semana: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
  hora_inicio: string;
  hora_fim: string;
  tipo: string;
  ativo: boolean;
};

const diaLabels: Record<Bloco["dia_semana"], string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
  dom: "Dom",
};

export function Cronograma() {
  const qc = useQueryClient();

  const planoAtivo = usePlanoAtivo();
  const listarPlanoDisciplinas = usePlanoStore((s) => s.listarPlanoDisciplinas);
  const planoIdParam =
    planoAtivo?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(planoAtivo.id) ? planoAtivo.id : undefined;

  const { data: disciplinasGlobais } = useQuery({
    queryKey: ["disciplinas-all"],
    enabled: !planoIdParam,
    queryFn: async () => {
      const rows = (await api.get("/disciplinas")).data as Array<{ id: string; nome: string }>;
      return rows.map((r) => ({ id: r.id, nome: r.nome })) as DisciplinaOption[];
    },
  });

  const { data: disciplinasDoPlano } = useQuery({
    queryKey: ["disciplinas-do-plano", planoIdParam ?? null],
    enabled: Boolean(planoIdParam),
    queryFn: async () => {
      if (!planoIdParam) return [] as DisciplinaOption[];
      const rows = await listarPlanoDisciplinas(planoIdParam);
      return rows.map((r) => ({ id: r.disciplinaId, nome: r.nome })) as DisciplinaOption[];
    },
  });

  const disciplinas = planoIdParam ? disciplinasDoPlano : disciplinasGlobais;

  const { data: blocos, isLoading } = useQuery({
    queryKey: ["cronograma-blocos", planoIdParam ?? null],
    queryFn: async () => {
      const params = planoIdParam ? { plano_id: planoIdParam } : undefined;
      const res = await api.get("/cronograma/blocos", { params });
      return res.data as Bloco[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["sessoes-stats", planoIdParam ?? null],
    queryFn: async () => {
      const params = planoIdParam ? { plano_id: planoIdParam } : undefined;
      return (await api.get("/sessoes-estudo/stats", { params })).data as unknown;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      disciplina_id: string;
      dia_semana: Bloco["dia_semana"];
      hora_inicio: string;
      hora_fim: string;
      tipo: string;
      ativo: boolean;
    }) => {
      const res = await api.post("/cronograma/blocos", {
        ...payload,
        plano_id: planoIdParam ?? undefined,
      });
      return res.data as Bloco;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cronograma-blocos", planoIdParam ?? null] }),
  });

  const [form, setForm] = React.useState<{
    disciplina_id: string;
    dia_semana: Bloco["dia_semana"];
    hora_inicio: string;
    hora_fim: string;
    tipo: string;
    ativo: boolean;
  }>({
    disciplina_id: "",
    dia_semana: "seg",
    hora_inicio: "08:00",
    hora_fim: "09:00",
    tipo: "estudo",
    ativo: true,
  });

  React.useEffect(() => {
    if (!form.disciplina_id && disciplinas && disciplinas.length > 0) {
      setForm((s) => ({ ...s, disciplina_id: disciplinas[0].id }));
    }
  }, [disciplinas, form.disciplina_id]);

  const grouped = React.useMemo(() => {
    const map: Record<string, Bloco[]> = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
    for (const b of blocos ?? []) {
      map[b.dia_semana].push(b);
    }
    for (const k of Object.keys(map)) {
      map[k as Bloco["dia_semana"]].sort((a, c) => a.hora_inicio.localeCompare(c.hora_inicio));
    }
    return map;
  }, [blocos]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Cronograma</h2>
          <p className="text-sm text-muted-foreground">Blocos de estudo por semana (visão simplificada).</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <h3 className="text-sm font-semibold">Novo bloco</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Disciplina</span>
            <select
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={form.disciplina_id}
              onChange={(e) => setForm((s) => ({ ...s, disciplina_id: e.target.value }))}
            >
              {(disciplinas ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Dia</span>
            <select
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={form.dia_semana}
              onChange={(e) => setForm((s) => ({ ...s, dia_semana: e.target.value as Bloco["dia_semana"] }))}
            >
              {Object.entries(diaLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Início</span>
            <input
              type="time"
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={form.hora_inicio}
              onChange={(e) => setForm((s) => ({ ...s, hora_inicio: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Fim</span>
            <input
              type="time"
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={form.hora_fim}
              onChange={(e) => setForm((s) => ({ ...s, hora_fim: e.target.value }))}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Tipo</span>
            <select
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              value={form.tipo}
              onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}
            >
              <option value="estudo">estudo</option>
              <option value="revisao">revisao</option>
              <option value="questoes">questoes</option>
              <option value="livre">livre</option>
              <option value="pomodoro">pomodoro</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              className="w-full rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-800 disabled:opacity-60"
              disabled={!form.disciplina_id || createMutation.isPending}
              onClick={() => {
                createMutation.mutate({
                  disciplina_id: form.disciplina_id,
                  dia_semana: form.dia_semana,
                  hora_inicio: form.hora_inicio,
                  hora_fim: form.hora_fim,
                  tipo: form.tipo,
                  ativo: form.ativo,
                });
              }}
            >
              Criar
            </button>
          </div>
        </div>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Carregando cronograma...</div> : null}

      <div className="grid gap-3 lg:grid-cols-7">
        {Object.keys(grouped).map((day) => {
          const key = day as Bloco["dia_semana"];
          return (
            <div key={day} className="rounded-xl border border-border/40 bg-background/70 p-3">
              <div className="text-sm font-semibold">{diaLabels[key]}</div>
              <div className="mt-2 space-y-2">
                {(grouped[key] ?? []).map((b) => (
                  <div key={b.id} className="rounded-lg border border-border/40 bg-background px-2 py-2 text-xs">
                    <div className="font-medium">{b.hora_inicio} - {b.hora_fim}</div>
                    <div className="text-muted-foreground">{b.tipo}</div>
                  </div>
                ))}
                {(grouped[key] ?? []).length === 0 ? (
                  <div className="text-xs text-muted-foreground">Sem blocos</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border/40 bg-background/70 p-4">
        <h3 className="text-sm font-semibold">Stats (últimos 7 dias)</h3>
        <pre className="mt-2 overflow-auto text-xs text-muted-foreground">{stats ? JSON.stringify(stats, null, 2) : "—"}</pre>
      </div>
    </div>
  );
}

