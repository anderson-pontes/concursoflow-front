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
  total_questoes_prova: number | null;
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
  if (pct >= 70) return "text-[#16A34A]";
  if (pct >= 40) return "text-[#F59E0B]";
  return "text-[#EF4444]";
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
        <div
          className="flex min-h-[200px] items-center justify-center text-sm text-[#9CA3AF]"
          style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#F5F4FA" }}
        >
          Carregando plano...
        </div>
      );
    }
  }

  const tituloBreadcrumb = plano?.nome ?? "Plano";

  return (
    <div
      className="min-h-full space-y-6 pb-8"
      style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#F5F4FA" }}
    >
      <nav className="flex flex-wrap items-center gap-1 text-[13px]" aria-label="Breadcrumb">
        <Link to="/concursos/planos" className="text-[#6B7280] transition-colors hover:text-[#6C3FC5]">
          Planos de Estudo
        </Link>
        <span className="text-[#9CA3AF]" aria-hidden>
          ›
        </span>
        <span className="font-bold text-[#1A1A2E]">{tituloBreadcrumb}</span>
      </nav>

      <div
        className="rounded-[14px] border-[1.5px] border-[#E5E7EB] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.07)] sm:p-6 md:px-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F0FF] text-lg font-bold text-[#6C3FC5]">
              {logoSrc ? (
                <img src={logoSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                iniciaisPlano
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-[#1A1A2E] sm:text-[20px]">{plano?.nome ?? "Plano de Estudo"}</h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                {plano?.orgao ?? "—"} • {plano?.cargo ?? "—"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {plano?.ativo ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D1FAE5] px-2.5 py-0.5 text-xs font-semibold text-[#16A34A]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" aria-hidden />
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-semibold text-[#9CA3AF]">
                    ○ Inativo
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF]">
                  <span aria-hidden>📅</span>
                  {dataProvaFmt ? `Prova: ${dataProvaFmt}` : "Sem data da prova"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center lg:justify-end">
            <p className="text-center text-sm text-[#6B7280] sm:text-left">
              <span className="font-semibold text-[#1A1A2E]">{nDisciplinas}</span>{" "}
              {nDisciplinas === 1 ? "disciplina" : "disciplinas"}
              <span className="mx-1.5 text-[#D1D5DB]">·</span>
              <span className="font-semibold text-[#1A1A2E]">
                {estudadosTopicos}/{totalTopicos}
              </span>{" "}
              tópicos
              <span className="mx-1.5 text-[#D1D5DB]">·</span>
              <span className={cn("font-semibold", conclusaoTextClass(pctPlano))}>{pctPlano}%</span> conclusão
            </p>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <select
                className="h-10 min-w-[200px] flex-1 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm text-[#1A1A2E] outline-none transition-colors focus:border-[#6C3FC5] focus:shadow-[0_0_0_3px_#EDE9FE] sm:flex-initial"
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
                className="h-10 shrink-0 rounded-[10px] bg-[#6C3FC5] px-4 text-sm font-bold text-white transition-all hover:bg-[#5B32A8] disabled:opacity-50"
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
              className="overflow-hidden rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all duration-200 hover:border-[#C4B5FD] hover:shadow-[0_8px_32px_rgba(108,63,197,0.13)]"
            >
              <button
                type="button"
                onClick={() => setOpenDisciplinaId(d.disciplinaId)}
                className="w-full text-left transition-colors hover:bg-[#FAFAFE]"
              >
                <div className="h-1" style={{ backgroundColor: d.cor || "#6C3FC5" }} />
                <div className="border-b border-[#F3F4F6] px-5 py-4">
                  <div className="text-base font-bold text-[#1A1A2E]">
                    {d.codigo} {d.nome}
                  </div>
                  <div className="mt-0.5 text-[13px] text-[#6B7280]">Peso edital: {d.pesoEdital} questões</div>
                </div>

                <div className="grid grid-cols-3 gap-2 px-5 py-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-[#1A1A2E]">{estudados}</div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">Estudados</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#1A1A2E]">{total}</div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">Total</div>
                  </div>
                  <div>
                    <div className={cn("text-lg font-bold", conclusaoTextClass(pct))}>{pct}%</div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">Conclusão</div>
                  </div>
                </div>
              </button>

              <div className="flex items-center justify-between border-t border-[#F3F4F6] px-4 py-3">
                <span className="text-xs text-[#9CA3AF]">Gerenciar tópicos no plano</span>
                <Link
                  to={`/disciplinas/${d.disciplinaId}`}
                  className="shrink-0 rounded-[10px] border border-[#E5E7EB] bg-[#F3F0FF] px-3 py-1.5 text-xs font-semibold text-[#6C3FC5] transition-colors hover:border-[#6C3FC5] hover:bg-white"
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
