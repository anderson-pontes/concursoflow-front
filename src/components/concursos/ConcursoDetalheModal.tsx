import React from "react";
import { createPortal } from "react-dom";
import { Calendar, FileText, Landmark, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQueries } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  computeConcursoCardStatsFromKpis,
  kpiToProgressRowDisplay,
  loadConcursoProgress,
  saveConcursoProgress,
  type ConcursoProgressPersist,
} from "@/lib/concursoProgressStorage";
import { cn } from "@/lib/utils";
import { isImageUrl, isPdfUrl, resolvePublicUrl } from "@/lib/publicUrl";
import { api } from "@/services/api";
import { usePlanoStore } from "@/stores/planoStore";
import type { DisciplinaDashboardKpis, DisciplinaDashboardResponse } from "@/types/disciplinaDashboard";

type ConcursoRow = {
  id: string;
  nome: string;
  orgao: string;
  cargo: string | null;
  banca: string | null;
  edital_url: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
};

type ConcursoDetalheModalProps = {
  concurso: ConcursoRow | null;
  onClose: () => void;
  onEdit?: () => void;
};

function isEncerradoCard(status: string) {
  return status === "realizado" || status === "eliminado";
}

type TabId = "dados" | "edital" | "progresso";

function acertoBadgeClass(pct: number) {
  if (pct >= 70) return "bg-[#D1FAE5] text-[#16A34A]";
  if (pct >= 40) return "bg-[#FEF3C7] text-[#D97706]";
  return "bg-[#FEE2E2] text-[#EF4444]";
}

const TOAST_BR = { duration: 3000, position: "bottom-right" as const };

export function ConcursoDetalheModal({ concurso, onClose, onEdit }: ConcursoDetalheModalProps) {
  const [tab, setTab] = React.useState<TabId>("dados");
  const [persist, setPersist] = React.useState<ConcursoProgressPersist>(loadConcursoProgress);

  React.useEffect(() => {
    saveConcursoProgress(persist);
  }, [persist]);

  React.useEffect(() => {
    if (concurso) setTab("dados");
  }, [concurso?.id]);

  React.useEffect(() => {
    if (!concurso) return;
    const label = concurso.cargo?.trim() || concurso.nome;
    setPersist((p) => ({
      ...p,
      concursoMeta: { ...p.concursoMeta, [concurso.id]: { label } },
    }));
  }, [concurso?.id, concurso?.cargo, concurso?.nome]);

  React.useEffect(() => {
    if (!concurso) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [concurso]);

  if (!concurso) return null;

  const logoSrc = resolvePublicUrl(concurso.logo_url);
  const editalSrc = resolvePublicUrl(concurso.edital_url);
  const created = (() => {
    try {
      return format(parseISO(concurso.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return concurso.created_at;
    }
  })();

  const cargoTitle = concurso.cargo?.trim() || concurso.nome;
  const encerrado = isEncerradoCard(concurso.status);
  const suspenso = concurso.status === "suspenso";

  const modalShadow = "0 24px 64px rgba(0,0,0,0.18)";

  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: "dados", icon: "📋", label: "Dados" },
    { id: "edital", icon: "📄", label: "Edital" },
    { id: "progresso", icon: "📊", label: "Progresso" },
  ];

  const InfoCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | null | undefined;
  }) => (
    <div className="flex gap-3 rounded-[10px] border border-[#F3F4F6] bg-[#FAFAFA] p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#6C3FC5]" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">{label}</p>
        {value?.trim() ? (
          <p className="mt-1 text-[15px] font-bold text-[#1A1A2E]">{value}</p>
        ) : (
          <span className="mt-2 inline-block rounded-md bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium text-[#9CA3AF]">
            Não informado
          </span>
        )}
      </div>
    </div>
  );

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9999] bg-[rgba(0,0,0,0.55)] backdrop-blur-[4px]"
        style={{ WebkitBackdropFilter: "blur(4px)", fontFamily: "Inter, system-ui, sans-serif" }}
        aria-hidden
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <style>{`
        @keyframes concurso-modal-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.88); }
        }
        .concurso-modal-dot-pulse {
          animation: concurso-modal-dot 2s ease-in-out infinite;
        }
        @keyframes concurso-dropdown-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .concurso-dropdown-panel {
          animation: concurso-dropdown-in 200ms ease-out;
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalhe-concurso-title"
        className={cn(
          "fixed left-1/2 top-1/2 z-[10000] flex max-h-[90vh] w-[820px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-[20px] bg-white",
        )}
        style={{ boxShadow: modalShadow, fontFamily: "Inter, system-ui, sans-serif" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER 88px */}
        <header className="flex h-[88px] shrink-0 items-center gap-4 border-b border-[#E5E7EB] px-7">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">
            {logoSrc ? (
              <img src={logoSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl leading-none" aria-hidden>
                🏛️
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="detalhe-concurso-title" className="line-clamp-1 text-[22px] font-bold text-[#1A1A2E]">
              {cargoTitle}
            </h2>
            <p className="mt-0.5 text-sm text-[#6B7280]">{concurso.orgao}</p>
            <div className="mt-1.5">
              {encerrado ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-semibold text-[#6B7280]">
                  <span aria-hidden>○</span> Encerrado
                </span>
              ) : suspenso ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#D97706]">
                  ○ Suspenso
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D1FAE5] py-0.5 pl-2 pr-2.5 text-xs font-semibold text-[#16A34A]">
                  <span className="concurso-modal-dot-pulse h-2 w-2 shrink-0 rounded-full bg-[#16A34A]" aria-hidden />
                  Ativo
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-lg text-lg leading-none text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#1A1A2E]"
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        {/* TABS 48px */}
        <div className="shrink-0 border-b border-[#E5E7EB] px-7">
          <nav className="flex gap-6 overflow-x-auto" aria-label="Seções do concurso">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative h-12 shrink-0 px-1 text-sm transition-colors duration-200",
                    active ? "font-semibold text-[#6C3FC5]" : "font-normal text-[#6B7280] hover:text-[#6C3FC5]",
                  )}
                >
                  <span className="inline-flex h-12 items-center">
                    <span className="mr-1.5 text-base leading-none">{t.icon}</span>
                    {t.label}
                  </span>
                  {active ? (
                    <span
                      className="absolute bottom-[-1px] left-0 right-0 mx-auto h-0.5 rounded-t-sm bg-[#6C3FC5]"
                      style={{ width: "100%" }}
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* CONTEÚDO */}
        <div className="min-w-0 overflow-x-hidden px-7 py-6">
          {tab === "dados" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard icon={Landmark} label="Órgão" value={concurso.orgao} />
              <InfoCard icon={User} label="Cargo" value={concurso.cargo} />
              <InfoCard icon={FileText} label="Banca" value={concurso.banca} />
              <InfoCard icon={Calendar} label="Cadastrado em" value={created} />
            </div>
          ) : null}

          {tab === "edital" ? (
            <div className="min-w-0">
              {!editalSrc ? (
                <div className="flex flex-col items-center rounded-[10px] border border-[#E5E7EB] bg-[#FAFAFA] px-6 py-12 text-center">
                  <span className="text-5xl" aria-hidden>
                    📄
                  </span>
                  <p className="mt-4 text-sm font-medium text-[#1A1A2E]">Nenhum edital anexado</p>
                  {onEdit ? (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-4 text-sm font-semibold text-[#6C3FC5] hover:underline"
                    >
                      Editar concurso para adicionar edital
                    </button>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="mb-3 flex justify-end">
                    <a
                      href={editalSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#6C3FC5] transition-colors hover:bg-[#F3F0FF]"
                    >
                      <span aria-hidden>↗</span> Abrir em nova aba
                    </a>
                  </div>
                  <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white">
                    {isPdfUrl(editalSrc) ? (
                      <iframe title="Pré-visualização do edital" src={editalSrc} className="h-[440px] w-full" />
                    ) : isImageUrl(editalSrc) ? (
                      <div className="flex h-[440px] items-center justify-center overflow-auto p-2">
                        <img src={editalSrc} alt="Edital" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex h-[440px] flex-col items-center justify-center gap-3 p-8 text-center">
                        <FileText className="h-10 w-10 text-[#9CA3AF]" />
                        <p className="text-sm text-[#6B7280]">Pré-visualização indisponível para este tipo de arquivo.</p>
                        <a
                          href={editalSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#6C3FC5] hover:underline"
                        >
                          Baixar / abrir arquivo
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}

          {tab === "progresso" ? (
            <ProgressoTab concurso={concurso} persist={persist} setPersist={setPersist} />
          ) : null}
        </div>

        {/* FOOTER 64px */}
        <footer className="flex h-16 shrink-0 items-center border-t border-[#E5E7EB] px-7">
          <p className="text-xs text-[#9CA3AF]">Última atualização: {created}</p>
          <div className="ml-auto flex items-center gap-2.5">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#F9FAFB]"
              >
                Editar concurso
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] bg-[#6C3FC5] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#5B32A8]"
            >
              Fechar
            </button>
          </div>
        </footer>
      </div>
    </>,
    document.body,
  );
}

/* ─── Aba Progresso ─── */
function ProgressoTab({
  concurso,
  persist,
  setPersist,
}: {
  concurso: ConcursoRow;
  persist: ConcursoProgressPersist;
  setPersist: React.Dispatch<React.SetStateAction<ConcursoProgressPersist>>;
}) {
  const navigate = useNavigate();
  const planos = usePlanoStore((s) => s.planos);
  const loadPlanos = usePlanoStore((s) => s.loadPlanos);
  const carregandoPlanos = usePlanoStore((s) => s.carregandoPlanos);
  const listarPlanoDisciplinas = usePlanoStore((s) => s.listarPlanoDisciplinas);

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [planoSearch, setPlanoSearch] = React.useState("");
  const [selectedPlanoId, setSelectedPlanoId] = React.useState<string | null>(null);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualNome, setManualNome] = React.useState("");
  const [unlinkConfirm, setUnlinkConfirm] = React.useState(false);
  const [editalBarReady, setEditalBarReady] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  const cid = concurso.id;
  const linkedPlanoId = persist.planoPorConcurso[cid] ?? null;
  const rows = persist.disciplinas[cid] ?? [];
  const linkedPlano = linkedPlanoId ? planos.find((p) => p.id === linkedPlanoId) : null;

  const disciplinaIds = React.useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      if (r.disciplinaId) s.add(r.disciplinaId);
    }
    return [...s].sort();
  }, [rows]);

  const dashboardQueries = useQueries({
    queries: disciplinaIds.map((disciplinaId) => ({
      queryKey: ["disciplina-dashboard", disciplinaId, "live"],
      queryFn: async () => (await api.get(`/disciplinas/${disciplinaId}/dashboard`)).data as DisciplinaDashboardResponse,
      staleTime: 60_000,
      enabled: Boolean(linkedPlanoId),
    })),
  });

  const kpiByDisciplinaId = React.useMemo(() => {
    const m = new Map<string, DisciplinaDashboardKpis>();
    if (!linkedPlanoId) return m;
    disciplinaIds.forEach((id, i) => {
      const row = dashboardQueries[i];
      if (row?.data?.kpis) m.set(id, row.data.kpis);
    });
    return m;
  }, [linkedPlanoId, disciplinaIds, dashboardQueries]);

  const queryByDisciplinaId = React.useMemo(() => {
    const m = new Map<string, (typeof dashboardQueries)[number]>();
    disciplinaIds.forEach((id, i) => {
      m.set(id, dashboardQueries[i]);
    });
    return m;
  }, [disciplinaIds, dashboardQueries]);

  const progressoKpisLoading =
    Boolean(linkedPlanoId) &&
    disciplinaIds.length > 0 &&
    disciplinaIds.some((id) => {
      const q = queryByDisciplinaId.get(id);
      return Boolean(q?.isPending || q?.isLoading);
    });

  const progressTotals = React.useMemo(() => {
    if (!linkedPlanoId) return null;
    if (progressoKpisLoading) return null;
    return computeConcursoCardStatsFromKpis(rows, kpiByDisciplinaId);
  }, [linkedPlanoId, progressoKpisLoading, rows, kpiByDisciplinaId]);

  React.useEffect(() => {
    if (planos.length === 0 && !carregandoPlanos) {
      loadPlanos().catch(() => {});
    }
  }, [planos.length, carregandoPlanos, loadPlanos]);

  React.useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) {
        setPickerOpen(false);
        setSelectedPlanoId(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pickerOpen]);

  React.useEffect(() => {
    setEditalBarReady(false);
    const t = requestAnimationFrame(() => setEditalBarReady(true));
    return () => cancelAnimationFrame(t);
  }, [linkedPlanoId, cid]);

  const otherConcursoForPlano = (planoId: string) => {
    for (const [ocid, pid] of Object.entries(persist.planoPorConcurso)) {
      if (pid === planoId && ocid !== cid) {
        return persist.concursoMeta[ocid]?.label ?? "Outro concurso";
      }
    }
    return null;
  };

  const filteredPlanos = React.useMemo(() => {
    const q = planoSearch.trim().toLowerCase();
    if (!q) return planos;
    return planos.filter((p) => p.nome.toLowerCase().includes(q) || p.orgao.toLowerCase().includes(q));
  }, [planos, planoSearch]);

  const confirmVinculo = async () => {
    if (!selectedPlanoId) return;
    try {
      const disc = await listarPlanoDisciplinas(selectedPlanoId);
      setPersist((p) => {
        const cur = p.disciplinas[cid] ?? [];
        const seen = new Set(cur.map((r) => r.disciplinaId).filter(Boolean));
        const merged = [...cur];
        for (const d of disc) {
          if (d.disciplinaId && seen.has(d.disciplinaId)) continue;
          if (d.disciplinaId) seen.add(d.disciplinaId);
          merged.push({
            key: d.disciplinaId ? `plano:${d.disciplinaId}` : `plano-row:${d.id}`,
            nome: d.nome,
            disciplinaId: d.disciplinaId,
            source: "plano",
          });
        }
        return {
          ...p,
          planoPorConcurso: { ...p.planoPorConcurso, [cid]: selectedPlanoId },
          disciplinas: { ...p.disciplinas, [cid]: merged },
        };
      });
      toast.success(`✅ Plano vinculado! ${disc.length} disciplinas importadas.`, TOAST_BR);
      setPickerOpen(false);
      setSelectedPlanoId(null);
      setPlanoSearch("");
    } catch {
      toast.error("❌ Não foi possível vincular. Tente novamente.", TOAST_BR);
    }
  };

  const desvincular = () => {
    setPersist((p) => {
      const { [cid]: _, ...rest } = p.planoPorConcurso;
      return { ...p, planoPorConcurso: rest };
    });
    toast.success("🔗 Plano desvinculado. Disciplinas mantidas.", TOAST_BR);
    setUnlinkConfirm(false);
  };

  const addManual = () => {
    const n = manualNome.trim();
    if (!n) return;
    setPersist((p) => {
      const cur = p.disciplinas[cid] ?? [];
      return {
        ...p,
        disciplinas: {
          ...p.disciplinas,
          [cid]: [...cur, { key: `manual:${Date.now()}`, nome: n, source: "manual" }],
        },
      };
    });
    setManualNome("");
  };

  const EDITAL_PCT = 42;

  if (!linkedPlanoId) {
    return (
      <div className="min-w-0 space-y-6">
        <div className="relative rounded-[14px] border-2 border-dashed border-[#C4B5FD] bg-[#FAFAFE] px-7 py-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F0FF] text-[40px] leading-none">
            📚
          </div>
          <h3 className="text-base font-bold text-[#1A1A2E]">Vincule um Plano de Estudo</h3>
          <p className="mx-auto mt-2 max-w-[400px] text-[13px] leading-relaxed text-[#6B7280]">
            Ao vincular, as disciplinas do plano serão importadas automaticamente para acompanhar seu progresso neste concurso.
          </p>
          <div ref={pickerRef} className="relative mt-5 inline-block">
            <button
              type="button"
              onClick={() => {
                setPickerOpen((o) => !o);
                setSelectedPlanoId(null);
              }}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#6C3FC5] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-[#5B32A8]"
            >
              + Vincular plano de estudo
            </button>
            {pickerOpen ? (
              <div
                className="concurso-dropdown-panel absolute left-1/2 top-full z-20 mt-2 w-[min(100vw-2rem,380px)] -translate-x-1/2 rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:left-0 sm:translate-x-0"
              >
                <div className="border-b border-[#F3F4F6] p-3">
                  <p className="text-[13px] font-bold text-[#1A1A2E]">Selecionar plano de estudo</p>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm opacity-50">🔍</span>
                    <input
                      value={planoSearch}
                      onChange={(e) => setPlanoSearch(e.target.value)}
                      placeholder="Buscar planos..."
                      className="h-9 w-full rounded-[10px] border border-[#E5E7EB] py-1 pl-8 pr-2 text-sm outline-none focus:border-[#6C3FC5] focus:shadow-[0_0_0_3px_#EDE9FE]"
                    />
                  </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {filteredPlanos.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[#6B7280]">
                      <p>Nenhum plano criado ainda</p>
                      <Link
                        to="/concursos/planos"
                        className="mt-2 inline-block text-sm font-semibold text-[#6C3FC5] hover:underline"
                        onClick={() => setPickerOpen(false)}
                      >
                        Criar plano de estudo →
                      </Link>
                    </div>
                  ) : (
                    <ul className="py-1">
                      {filteredPlanos.map((p) => {
                        const vincOutro = otherConcursoForPlano(p.id);
                        const sel = selectedPlanoId === p.id;
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedPlanoId(p.id)}
                              className={cn(
                                "flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors",
                                sel ? "bg-[#EDE9FE]" : "hover:bg-[#F3F0FF]",
                              )}
                            >
                              <span className="text-base" aria-hidden>
                                📋
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[#1A1A2E]">{p.nome}</p>
                                <p className="text-xs text-[#6B7280]">{p.stats.disciplinas_qty} disciplinas</p>
                                {vincOutro ? (
                                  <span className="mt-1 inline-block rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">
                                    Vinculado a: {vincOutro}
                                  </span>
                                ) : null}
                              </div>
                              {sel ? <span className="shrink-0 text-[#6C3FC5]">✓</span> : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-[#F3F4F6] px-3 py-2">
                  <span className="text-xs text-[#9CA3AF]">{filteredPlanos.length} planos encontrados</span>
                  <button
                    type="button"
                    disabled={!selectedPlanoId}
                    onClick={() => void confirmVinculo()}
                    className="rounded-[10px] bg-[#6C3FC5] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                  >
                    Confirmar vínculo
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative py-2 text-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-[#E5E7EB]" aria-hidden />
          <span className="relative bg-white px-3 text-xs text-[#9CA3AF]">ou adicione disciplinas manualmente</span>
        </div>

        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4">
          {!manualOpen ? (
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#9CA3AF]">Nenhuma disciplina adicionada</p>
              <button
                type="button"
                onClick={() => setManualOpen(true)}
                className="shrink-0 rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-xs font-semibold text-[#6B7280] hover:bg-[#F9FAFB]"
              >
                + Adicionar disciplina
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="mb-3 flex w-full items-center justify-between text-left text-sm font-semibold text-[#1A1A2E]"
              >
                Disciplinas manuais
                <span className="text-[#9CA3AF]">▾</span>
              </button>
              {rows.filter((r) => r.source === "manual").length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Nenhuma disciplina adicionada</p>
              ) : (
                <ul className="mb-3 space-y-1 text-sm text-[#1A1A2E]">
                  {rows
                    .filter((r) => r.source === "manual")
                    .map((r) => (
                      <li key={r.key} className="rounded-lg bg-[#FAFAFA] px-2 py-1">
                        {r.nome}
                      </li>
                    ))}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={manualNome}
                  onChange={(e) => setManualNome(e.target.value)}
                  placeholder="Nome da disciplina"
                  className="min-w-[160px] flex-1 rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#6C3FC5]"
                  onKeyDown={(e) => e.key === "Enter" && addManual()}
                />
                <button
                  type="button"
                  onClick={addManual}
                  className="rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-xs font-semibold text-[#6B7280] hover:bg-[#F9FAFB]"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-[10px] bg-[#F3F0FF] px-4 py-3">
        <span className="text-xl" aria-hidden>
          📚
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#1A1A2E]">
            Plano vinculado: <strong>{linkedPlano?.nome ?? "Plano"}</strong>
          </p>
          <p className="text-xs text-[#9CA3AF]">Disciplinas importadas automaticamente</p>
        </div>
        <div className="shrink-0">
          {unlinkConfirm ? (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={desvincular} className="text-xs font-semibold text-[#EF4444] hover:underline">
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setUnlinkConfirm(false)}
                className="text-xs font-semibold text-[#6B7280] hover:underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setUnlinkConfirm(true)}
              className="text-xs font-semibold text-[#9CA3AF] transition-colors hover:text-[#EF4444]"
            >
              Desvincular
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-[13px]">
          <span className="text-[#9CA3AF]">Edital lido</span>
          <span className="font-bold tabular-nums text-[#6C3FC5]">{EDITAL_PCT}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6C3FC5] to-[#8B5CF6] transition-[width] duration-[600ms] ease-out"
            style={{ width: editalBarReady ? `${EDITAL_PCT}%` : "0%" }}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[1px] text-[#9CA3AF]">Disciplinas</p>
        {rows.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">Nenhuma disciplina na lista ainda.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              let loading = false;
              let display = kpiToProgressRowDisplay(undefined);
              if (r.disciplinaId) {
                const q = queryByDisciplinaId.get(r.disciplinaId);
                loading = Boolean(q?.isPending || q?.isLoading);
                if (!loading) {
                  display = kpiToProgressRowDisplay(kpiByDisciplinaId.get(r.disciplinaId));
                }
              }
              return (
                <li key={r.key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (r.disciplinaId) navigate(`/disciplinas/${r.disciplinaId}`);
                      else navigate("/questoes");
                    }}
                    className="flex w-full min-w-0 items-center gap-3 rounded-[10px] border border-[#F3F4F6] bg-[#FAFAFA] px-4 py-3.5 text-left transition-colors hover:border-[#C4B5FD] hover:bg-[#F3F0FF]"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#1A1A2E]">{r.nome}</span>
                    <div className="hidden w-[120px] shrink-0 sm:block">
                      <div className="h-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                        <div
                          className="h-1 rounded-full bg-[#6C3FC5] transition-[width] duration-300"
                          style={{ width: loading ? "0%" : `${display.barPct}%` }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-[#9CA3AF]">
                      {loading ? "…" : `${display.questoes} questões`}
                    </span>
                    {loading ? (
                      <span className="shrink-0 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-bold tabular-nums text-[#9CA3AF]">
                        …
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                          acertoBadgeClass(display.pct),
                        )}
                      >
                        {display.pct}%
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-center text-[13px] text-[#9CA3AF]">
        {progressoKpisLoading ? (
          "Carregando totais…"
        ) : progressTotals ? (
          <>
            {progressTotals.disciplinasCount} disciplinas · {progressTotals.questoesTotal} questões no total ·{" "}
            {progressTotals.acertoMedioPct}% de acerto médio
          </>
        ) : (
          "0 disciplinas · 0 questões no total · 0% de acerto médio"
        )}
      </p>
    </div>
  );
}
