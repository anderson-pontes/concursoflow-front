import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { DrawerDisciplina } from "@/components/planos/DrawerDisciplina";
import { api } from "@/services/api";
import { resolvePublicUrl } from "@/lib/publicUrl";
import { cn } from "@/lib/utils";
import { usePlanoStore } from "@/stores/planoStore";
import type { DisciplinaPlano, PlanoEstudo, TopicoPlano } from "@/types/plano";

type DisciplinaGlobal = {
  id: string;
  nome: string;
  sigla: string | null;
  cor_hex: string | null;
};

function formatProvaDate(s?: string): string | null {
  if (!s?.trim()) return null;
  try {
    const d = parseISO(s);
    if (!isValid(d)) return s;
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return s;
  }
}

function conclusaoTextClass(pct: number) {
  if (pct >= 70) return "text-success";
  if (pct >= 40) return "text-warning";
  return "text-destructive";
}

export function PlanoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const planoId = id ?? "";

  const loadPlanos = usePlanoStore((s) => s.loadPlanos);
  const planos = usePlanoStore((s) => s.planos);

  const listarPlanoDisciplinas = usePlanoStore((s) => s.listarPlanoDisciplinas);
  const listarPlanoTopicos = usePlanoStore((s) => s.listarPlanoTopicos);
  const adicionarDisciplina = usePlanoStore((s) => s.adicionarDisciplina);

  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = React.useState<DisciplinaPlano[]>([]);
  const [openDisciplinaId, setOpenDisciplinaId] = React.useState<string | null>(null);
  const [novaDisciplinaId, setNovaDisciplinaId] = React.useState<string>("");

  const plano: PlanoEstudo | null = React.useMemo(() => planos.find((p) => p.id === planoId) ?? null, [planos, planoId]);

  React.useEffect(() => {
    if (!plano && planoId) {
      loadPlanos().catch(() => {});
    }
  }, [loadPlanos, plano, planoId]);

  const refreshDisciplinas = React.useCallback(async () => {
    if (!planoId) return;
    const discRows = await listarPlanoDisciplinas(planoId);
    const discWithTopicos: DisciplinaPlano[] = await Promise.all(
      discRows.map(async (d) => {
        const topicos: TopicoPlano[] = await listarPlanoTopicos(planoId, d.disciplinaId);
        return { ...d, topicos };
      }),
    );
    setDisciplinasSelecionadas(discWithTopicos);
    if (openDisciplinaId) {
      const stillExists = discWithTopicos.some((d) => d.disciplinaId === openDisciplinaId);
      if (!stillExists) setOpenDisciplinaId(null);
    }
  }, [listarPlanoDisciplinas, listarPlanoTopicos, openDisciplinaId, planoId]);

  React.useEffect(() => {
    refreshDisciplinas().catch(() => {});
  }, [planoId, refreshDisciplinas]);

  const { data: disciplinasGlobais } = useQuery({
    queryKey: ["disciplinas-global-plano"],
    queryFn: async () => (await api.get("/disciplinas")).data as DisciplinaGlobal[],
    staleTime: 1000 * 60 * 5,
  });

  const disciplinaIdsSelecionadas = React.useMemo(
    () => new Set(disciplinasSelecionadas.map((d) => d.disciplinaId)),
    [disciplinasSelecionadas],
  );

  const opcoesAdicionar = React.useMemo(() => {
    return (disciplinasGlobais ?? []).filter((d) => !disciplinaIdsSelecionadas.has(d.id));
  }, [disciplinasGlobais, disciplinaIdsSelecionadas]);

  const disciplinaSelecionada = React.useMemo(() => {
    if (!openDisciplinaId) return null;
    return disciplinasSelecionadas.find((d) => d.disciplinaId === openDisciplinaId) ?? null;
  }, [disciplinasSelecionadas, openDisciplinaId]);

  const atualizarTopicosDaDisciplina = React.useCallback(
    async (disciplinaId: string) => {
      const topicos = await listarPlanoTopicos(planoId, disciplinaId);
      setDisciplinasSelecionadas((prev) =>
        prev.map((d) => (d.disciplinaId === disciplinaId ? { ...d, topicos } : d)),
      );
    },
    [listarPlanoTopicos, planoId],
  );

  const toggleTopico = usePlanoStore((s) => s.atualizarTopicoEstudado);
  const adicionarTopico = usePlanoStore((s) => s.adicionarTopico);
  const excluirTopico = usePlanoStore((s) => s.excluirTopico);

  const nDisciplinas = disciplinasSelecionadas.length;
  const totalTopicos = disciplinasSelecionadas.reduce((acc, d) => acc + d.topicos.length, 0);
  const estudadosTopicos = disciplinasSelecionadas.reduce(
    (acc, d) => acc + d.topicos.filter((t) => t.estudado).length,
    0,
  );
  const pctPlano = totalTopicos > 0 ? Math.round((estudadosTopicos / totalTopicos) * 100) : 0;

  const logoSrc = plano ? resolvePublicUrl(plano.logoUrl ?? null) : null;
  const iniciaisPlano = (plano?.nome ?? "PL").trim().slice(0, 2).toUpperCase() || "PL";
  const dataProvaFmt = plano ? formatProvaDate(plano.dataProva) : null;

  if (!plano) {
    if (disciplinasSelecionadas.length === 0) {
      return (
        <div className="flex min-h-[200px] items-center justify-center bg-background text-sm text-muted-foreground">
          Carregando plano...
        </div>
      );
    }
  }

  const tituloBreadcrumb = plano?.nome ?? "Plano";

  return (
    <div className="min-h-full space-y-6 bg-background pb-8 font-sans">
      <nav className="flex flex-wrap items-center gap-1 text-[13px]" aria-label="Breadcrumb">
        <Link to="/concursos/planos" className="text-muted-foreground transition-colors hover:text-primary">
          Planos de Estudo
        </Link>
        <span className="text-muted-foreground" aria-hidden>
          ›
        </span>
        <span className="font-bold text-foreground">{tituloBreadcrumb}</span>
      </nav>

      <div className="rounded-[14px] border border-border bg-card p-5 shadow-card sm:p-6 md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-muted text-lg font-bold text-primary">
              {logoSrc ? (
                <img src={logoSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                iniciaisPlano
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-foreground sm:text-[20px]">{plano?.nome ?? "Plano de Estudo"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {plano?.orgao ?? "—"} • {plano?.cargo ?? "—"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {plano?.ativo ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    ○ Inativo
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <span aria-hidden>📅</span>
                  {dataProvaFmt ? `Prova: ${dataProvaFmt}` : "Sem data da prova"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center lg:justify-end">
            <p className="text-center text-sm text-muted-foreground sm:text-left">
              <span className="font-semibold text-foreground">{nDisciplinas}</span>{" "}
              {nDisciplinas === 1 ? "disciplina" : "disciplinas"}
              <span className="mx-1.5 text-border">·</span>
              <span className="font-semibold text-foreground">
                {estudadosTopicos}/{totalTopicos}
              </span>{" "}
              tópicos
              <span className="mx-1.5 text-border">·</span>
              <span className={cn("font-semibold", conclusaoTextClass(pctPlano))}>{pctPlano}%</span> conclusão
            </p>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <select
                className="h-10 min-w-[200px] flex-1 rounded-[10px] border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:flex-initial"
                value={novaDisciplinaId}
                onChange={(e) => setNovaDisciplinaId(e.target.value)}
              >
                <option value="" disabled>
                  Adicionar disciplina…
                </option>
                {opcoesAdicionar.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.sigla ? `${d.sigla} — ` : ""}
                    {d.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="h-10 shrink-0 rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary-700 disabled:opacity-50"
                disabled={!novaDisciplinaId}
                onClick={async () => {
                  if (!novaDisciplinaId) return;
                  await adicionarDisciplina(planoId, { disciplinaId: novaDisciplinaId });
                  setNovaDisciplinaId("");
                  await refreshDisciplinas();
                  toast.success("Disciplina adicionada ao plano.");
                }}
              >
                + Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {disciplinasSelecionadas.map((d) => {
          const total = d.topicos.length;
          const estudados = d.topicos.filter((t) => t.estudado).length;
          const pct = total > 0 ? Math.round((estudados / total) * 100) : 0;

          return (
            <article
              key={d.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:border-primary-300 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => setOpenDisciplinaId(d.disciplinaId)}
                className="w-full text-left transition-colors hover:bg-surface-hover"
              >
                <div
                  className="h-1"
                  style={{ backgroundColor: d.cor || "var(--primary)" }}
                />
                <div className="border-b border-border-subtle px-5 py-4">
                  <div className="text-base font-bold text-foreground">
                    {d.codigo} {d.nome}
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">Peso edital: {d.pesoEdital} questões</div>
                </div>

                <div className="grid grid-cols-3 gap-2 px-5 py-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-foreground">{estudados}</div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Estudados</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{total}</div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className={cn("text-lg font-bold", conclusaoTextClass(pct))}>{pct}%</div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Conclusão</div>
                  </div>
                </div>
              </button>

              <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
                <span className="text-xs text-muted-foreground">Gerenciar tópicos no plano</span>
                <Link
                  to={`/disciplinas/${d.disciplinaId}`}
                  className="shrink-0 rounded-[10px] border border-border bg-primary-muted px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-surface"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver disciplina →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <DrawerDisciplina
        planoId={planoId}
        open={Boolean(disciplinaSelecionada)}
        disciplina={disciplinaSelecionada}
        onClose={() => setOpenDisciplinaId(null)}
        onToggleTopico={async (planoTopicoId, nextEstudado) => {
          if (!openDisciplinaId) return;
          const updated = await toggleTopico(planoTopicoId, nextEstudado);
          toast.success(updated.estudado ? "Tópico concluído! +1 progresso" : "Tópico marcado como não concluído");
          await atualizarTopicosDaDisciplina(openDisciplinaId);
        }}
        onAddTopico={async (topicoIdGlobal) => {
          if (!disciplinaSelecionada) return;
          await adicionarTopico(planoId, disciplinaSelecionada.disciplinaId, topicoIdGlobal);
          toast.success("Tópico adicionado ao plano.");
          await atualizarTopicosDaDisciplina(disciplinaSelecionada.disciplinaId);
        }}
        onDeleteTopico={async (planoTopicoId) => {
          if (!disciplinaSelecionada) return;
          await excluirTopico(planoTopicoId);
          toast.error("Tópico removido do plano.");
          await atualizarTopicosDaDisciplina(disciplinaSelecionada.disciplinaId);
        }}
      />
    </div>
  );
}
