import React from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConcursoDetalheModal } from "@/components/concursos/ConcursoDetalheModal";
import { ModalConcurso, type ConcursoFormInput } from "@/components/concursos/ModalConcurso";
import {
  CONCURSO_PROGRESS_EVENT,
  acertoPctTextClass,
  computeConcursoCardStatsFromKpis,
  loadConcursoProgress,
} from "@/lib/concursoProgressStorage";
import { api } from "@/services/api";
import { resolvePublicUrl } from "@/lib/publicUrl";
import { cn } from "@/lib/utils";
import { usePlanoStore } from "@/stores/planoStore";
import type { DisciplinaDashboardKpis, DisciplinaDashboardResponse } from "@/types/disciplinaDashboard";

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

const CARD_SHADOW = "0 2px 12px rgba(0,0,0,0.07)";

function isEncerradoStatus(s: string) {
  return s === "realizado" || s === "eliminado";
}

function EmptyConcursosIllustration() {
  return (
    <svg width="160" height="140" viewBox="0 0 160 140" fill="none" aria-hidden className="text-[#6C3FC5]">
      <circle cx="40" cy="28" r="4" fill="currentColor" fillOpacity="0.35" />
      <circle cx="120" cy="20" r="3" fill="#F59E0B" fillOpacity="0.6" />
      <circle cx="128" cy="36" r="2.5" fill="#22C55E" fillOpacity="0.5" />
      <circle cx="24" cy="48" r="2.5" fill="#EF4444" fillOpacity="0.4" />
      <path
        d="M80 24 L95 52 L125 56 L102 78 L108 108 L80 92 L52 108 L58 78 L35 56 L65 52 Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M80 44v24M68 56h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="48" y="112" width="64" height="8" rx="4" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

function CardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="border-t-[3px] border-t-[#E5E7EB] p-5">
        <div className="flex gap-3">
          <div className="h-12 w-12 shrink-0 rounded-[10px] bg-[#F3F4F6]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-[#F3F4F6]" />
            <div className="h-3 w-1/2 rounded bg-[#F3F4F6]" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#F3F4F6] pt-4">
          <div className="h-10 rounded-lg bg-[#F3F4F6]" />
          <div className="h-10 rounded-lg bg-[#F3F4F6]" />
          <div className="h-10 rounded-lg bg-[#F3F4F6]" />
        </div>
        <div className="mt-4 flex gap-2 border-t border-[#F3F4F6] pt-4">
          <div className="h-9 flex-1 rounded-[10px] bg-[#F3F4F6]" />
          <div className="h-9 flex-1 rounded-[10px] bg-[#F3F4F6]" />
        </div>
      </div>
    </div>
  );
}

export function Concursos() {
  const qc = useQueryClient();

  const {
    data: concursos,
    isLoading,
    isFetching,
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

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"todos" | "ativos" | "encerrados">("todos");
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const deleteTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [progressTick, setProgressTick] = React.useState(0);
  React.useEffect(() => {
    const onProgress = () => setProgressTick((t) => t + 1);
    window.addEventListener(CONCURSO_PROGRESS_EVENT, onProgress);
    return () => window.removeEventListener(CONCURSO_PROGRESS_EVENT, onProgress);
  }, []);

  const planos = usePlanoStore((s) => s.planos);
  const loadPlanos = usePlanoStore((s) => s.loadPlanos);
  const carregandoPlanos = usePlanoStore((s) => s.carregandoPlanos);

  React.useEffect(() => {
    if (planos.length === 0 && !carregandoPlanos) {
      void loadPlanos();
    }
  }, [planos.length, carregandoPlanos, loadPlanos]);

  const progressData = React.useMemo(() => loadConcursoProgress(), [progressTick]);

  const linkedDisciplinaIds = React.useMemo(() => {
    const s = new Set<string>();
    for (const c of concursos ?? []) {
      if (!progressData.planoPorConcurso[c.id]) continue;
      for (const r of progressData.disciplinas[c.id] ?? []) {
        if (r.disciplinaId) s.add(r.disciplinaId);
      }
    }
    return [...s].sort();
  }, [concursos, progressData]);

  const disciplinaDashboardQueries = useQueries({
    queries: linkedDisciplinaIds.map((disciplinaId) => ({
      queryKey: ["disciplina-dashboard", disciplinaId, "live"],
      queryFn: async () => (await api.get(`/disciplinas/${disciplinaId}/dashboard`)).data as DisciplinaDashboardResponse,
      staleTime: 60_000,
    })),
  });

  const kpiByDisciplinaId = React.useMemo(() => {
    const m = new Map<string, DisciplinaDashboardKpis>();
    linkedDisciplinaIds.forEach((id, i) => {
      const row = disciplinaDashboardQueries[i];
      if (row?.data?.kpis) m.set(id, row.data.kpis);
    });
    return m;
  }, [linkedDisciplinaIds, disciplinaDashboardQueries]);

  const dashboardQueryByDisciplinaId = React.useMemo(() => {
    const m = new Map<string, (typeof disciplinaDashboardQueries)[number]>();
    linkedDisciplinaIds.forEach((id, i) => {
      m.set(id, disciplinaDashboardQueries[i]);
    });
    return m;
  }, [linkedDisciplinaIds, disciplinaDashboardQueries]);

  const armDeletePrompt = (id: string) => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setPendingDeleteId(id);
    deleteTimerRef.current = setTimeout(() => {
      setPendingDeleteId(null);
      deleteTimerRef.current = null;
    }, 3000);
  };

  React.useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const filteredConcursos = React.useMemo(() => {
    const list = concursos ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (statusFilter === "ativos" && isEncerradoStatus(c.status)) return false;
      if (statusFilter === "encerrados" && !isEncerradoStatus(c.status)) return false;
      if (!q) return true;
      const hay = [c.nome, c.orgao, c.cargo, c.banca].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [concursos, search, statusFilter]);

  const totalCadastrados = concursos?.length ?? 0;
  const totalAtivos =
    concursos?.filter((c) => !isEncerradoStatus(c.status)).length ?? 0;

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
      toast.success("✅ Concurso criado com sucesso!", { duration: 3000 });
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
      toast.success("✅ Concurso atualizado com sucesso!", { duration: 3000 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/concursos/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concursos"] });
      setPendingDeleteId(null);
    },
  });

  const submitForm = () => {
    if (editing) updateMutation.mutate(input);
    else createMutation.mutate(input);
  };

  const showSkeleton = isLoading;
  const listRefreshing = isFetching && !isLoading;

  return (
    <div
      className="min-h-full space-y-6 pb-8"
      style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#F5F4FA" }}
    >
      <style>{`
        @keyframes concurso-dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.92); }
        }
        .concurso-dot-pulse { animation: concurso-dot-pulse 1.6s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[#1A1A2E]">Concursos</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Gerencie seus concursos-alvo e acompanhe seu progresso</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-[240px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base opacity-60" aria-hidden>
              🔍
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar concurso..."
              className="h-11 w-full rounded-[10px] border-[1.5px] border-[#E5E7EB] bg-white py-2 pl-10 pr-3 text-sm text-[#1A1A2E] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#6C3FC5] focus:shadow-[0_0_0_3px_#EDE9FE]"
            />
          </div>

          <div className="inline-flex rounded-[10px] bg-[#F3F4F6] p-1">
            {(
              [
                { id: "todos" as const, label: "Todos" },
                { id: "ativos" as const, label: "Ativos" },
                { id: "encerrados" as const, label: "Encerrados" },
              ] as const
            ).map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => setStatusFilter(seg.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200",
                  statusFilter === seg.id
                    ? "bg-white text-[#6C3FC5] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                    : "bg-transparent text-[#6B7280]",
                )}
              >
                {seg.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#6C3FC5] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-[#5B32A8]"
          >
            <span className="text-lg leading-none">+</span>
            Novo concurso
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] text-[#6B7280] shadow-sm">
          📋 {totalCadastrados} {totalCadastrados === 1 ? "concurso cadastrado" : "concursos cadastrados"}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] text-[#6B7280] shadow-sm">
          ✅ {totalAtivos} {totalAtivos === 1 ? "ativo" : "ativos"}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] text-[#6B7280] shadow-sm">
          📅 Próxima prova: não definida
        </span>
      </div>

      {isError ? (
        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : "Erro ao carregar"}
        </div>
      ) : null}

      {showSkeleton ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 min-[1200px]:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !concursos?.length ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white px-8 py-16 text-center"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <EmptyConcursosIllustration />
          <h2 className="mt-6 text-lg font-bold text-[#1A1A2E]">Nenhum concurso cadastrado ainda</h2>
          <p className="mt-2 max-w-md text-sm text-[#6B7280]">Adicione seu primeiro concurso-alvo e comece a estudar com foco.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-[#6C3FC5] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-px hover:bg-[#5B32A8]"
          >
            + Cadastrar meu primeiro concurso
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-5 md:grid-cols-2 min-[1200px]:grid-cols-3",
            listRefreshing && "opacity-70 transition-opacity duration-200",
          )}
        >
          {filteredConcursos.length === 0 ? (
            <div className="col-span-full rounded-[12px] border border-[#E5E7EB] bg-white px-6 py-12 text-center text-sm text-[#6B7280] shadow-sm">
              Nenhum concurso encontrado com os filtros atuais.
            </div>
          ) : null}
          {filteredConcursos.map((c) => {
            const logo = resolvePublicUrl(c.logo_url);
            const editalHref = resolvePublicUrl(c.edital_url);
            const encerrado = isEncerradoStatus(c.status);
            const cargoTitulo = c.cargo?.trim() || c.nome;
            const orgaoBanca = [c.orgao, c.banca].filter(Boolean).join(" · ") || "—";
            const linkedPlanoId = progressData.planoPorConcurso[c.id];
            const discRows = progressData.disciplinas[c.id] ?? [];
            const hasLinkedPlano = Boolean(linkedPlanoId);
            const discIdsInCard = new Set(
              discRows.map((r) => r.disciplinaId).filter((id): id is string => Boolean(id)),
            );
            const cardStatsLoading =
              hasLinkedPlano &&
              discIdsInCard.size > 0 &&
              [...discIdsInCard].some((id) => {
                const q = dashboardQueryByDisciplinaId.get(id);
                return !q || q.isPending || q.isLoading;
              });
            const cardTotals = hasLinkedPlano
              ? cardStatsLoading
                ? null
                : computeConcursoCardStatsFromKpis(discRows, kpiByDisciplinaId)
              : null;
            const planoNome = linkedPlanoId ? planos.find((p) => p.id === linkedPlanoId)?.nome : null;

            return (
              <article
                key={c.id}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-2xl border-x border-b border-[1.5px] border-[#E5E7EB] bg-white transition-all duration-200 ease-out",
                  encerrado ? "border-t-[3px] border-t-[#9CA3AF]" : "border-t-[3px] border-t-[#6C3FC5]",
                  "hover:-translate-y-0.5 hover:border-x-[#C4B5FD] hover:border-b-[#C4B5FD] hover:shadow-[0_8px_32px_rgba(108,63,197,0.12)]",
                )}
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                <div className="px-5 pb-0 pt-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-[#F3F0FF]">
                      {logo ? (
                        <img src={logo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl leading-none" aria-hidden>
                          🏛️
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-base font-bold text-[#1A1A2E]">{cargoTitulo}</h3>
                      <p className="mt-0.5 text-[13px] text-[#6B7280]">{orgaoBanca}</p>
                      <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
                        {encerrado ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-[#6B7280]">
                            <span aria-hidden>○</span> Encerrado
                          </span>
                        ) : c.status === "suspenso" ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-xs font-semibold text-[#D97706]">
                            ○ Suspenso
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#D1FAE5] px-2.5 py-1 text-xs font-semibold text-[#16A34A]">
                            <span className="concurso-dot-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" aria-hidden />
                            Ativo
                          </span>
                        )}
                        {hasLinkedPlano ? (
                          <span
                            className="max-w-[140px] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-full bg-[#F3F0FF] px-2 py-0.5 text-[11px] font-semibold text-[#6C3FC5]"
                            title={planoNome ?? "Plano vinculado"}
                          >
                            📋 {planoNome ?? "Plano"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-[#F3F4F6] px-5 py-4">
                  <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">📚 Disciplinas</p>
                      <p className="mt-1 text-sm font-bold text-[#1A1A2E]">
                        {cardTotals ? cardTotals.disciplinasCount : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">✅ Questões</p>
                      <p className="mt-1 text-sm font-bold text-[#1A1A2E]">
                        {cardTotals ? cardTotals.questoesTotal : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">🎯 % Acerto</p>
                      {cardTotals ? (
                        <p
                          className={cn(
                            "mt-1 text-sm font-bold tabular-nums",
                            acertoPctTextClass(cardTotals.acertoMedioPct),
                          )}
                        >
                          {cardTotals.acertoMedioPct}%
                        </p>
                      ) : (
                        <p className="mt-1 text-sm font-bold text-[#1A1A2E]">—</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-nowrap items-center gap-2 overflow-hidden border-t border-[#F3F4F6] px-5 py-4">
                  <button
                    type="button"
                    className="inline-flex min-w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#6B7280] transition-colors duration-200 hover:bg-[#F9FAFB]"
                    onClick={() => setDetalhe(c)}
                  >
                    <span aria-hidden>👁</span> Ver detalhes
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#6B7280] transition-colors duration-200 hover:bg-[#F9FAFB]"
                    onClick={() => openEdit(c)}
                  >
                    <span aria-hidden>✏️</span> Editar
                  </button>
                  {editalHref ? (
                    <a
                      href={editalHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[#F3F0FF] px-3 py-1.5 text-[13px] font-bold text-[#6C3FC5] transition-colors duration-200 hover:bg-violet-100"
                    >
                      <span aria-hidden>📄</span> Edital
                    </a>
                  ) : null}
                  <div className="ml-auto flex min-w-[36px] shrink-0 items-center justify-end">
                    {pendingDeleteId === c.id ? (
                      <div className="flex flex-nowrap items-center gap-1.5">
                        <button
                          type="button"
                          className="shrink-0 whitespace-nowrap rounded-lg bg-[#EF4444] px-2 py-1.5 text-[11px] font-bold text-white transition hover:bg-red-600"
                          onClick={() => deleteMutation.mutate(c.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="shrink-0 whitespace-nowrap rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-[11px] font-semibold text-[#6B7280] hover:bg-[#F9FAFB]"
                          onClick={() => {
                            setPendingDeleteId(null);
                            if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex h-9 min-w-[36px] shrink-0 items-center justify-center rounded-lg p-2 text-lg leading-none text-[#9CA3AF] transition-all duration-200 hover:bg-[#FFF5F5] hover:text-[#EF4444]"
                        aria-label="Excluir concurso"
                        onClick={() => armDeletePrompt(c.id)}
                        disabled={deleteMutation.isPending}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

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

      <ConcursoDetalheModal
        concurso={detalhe}
        onClose={() => setDetalhe(null)}
        onEdit={
          detalhe
            ? () => {
                const c = detalhe;
                setDetalhe(null);
                openEdit(c);
              }
            : undefined
        }
      />
    </div>
  );
}
