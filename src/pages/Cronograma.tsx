import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { BookOpen, Clock, ListChecks, Pencil, Plus, Trash2, BarChart3, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { CronogramaAgendaHojeDialog } from "@/components/cronograma/CronogramaAgendaHojeDialog";
import { BlocoFormModal } from "@/components/cronograma/BlocoFormModal";
import { CronogramaBlocoCard } from "@/components/cronograma/CronogramaBlocoCard";
import {
  CronogramaModoSelectorModal,
  type CronogramaModo,
} from "@/components/cronograma/CronogramaModoSelectorModal";
import {
  CronogramaRemoverDialog,
  nextOccurrenceISO,
  type RemoverScope,
} from "@/components/cronograma/CronogramaRemoverDialog";
import {
  CronogramaSimplificadoEditModal,
  type SimplificadoEditPayload,
} from "@/components/cronograma/CronogramaSimplificadoEditModal";
import { CronogramaSimplificadoModal } from "@/components/cronograma/CronogramaSimplificadoModal";
import { GerarCronogramaAutoModal } from "@/components/cronograma/GerarCronogramaAutoModal";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { DIAS, diaAbrev, fmtHorasStats } from "@/lib/cronograma/constants";
import type {
  Bloco,
  DisciplinaOption,
  FormState,
  SessaoStats,
  SimplificadoFormState,
} from "@/lib/cronograma/types";
import { calendarioHref } from "@/lib/calendario/urlParams";
import {
  blocoTopicoIds,
  fmtDateBR,
  hojeISO,
  previewEstenderFim,
  vigenciaFim12Meses,
} from "@/lib/cronograma/types";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { useConcursoAtivoId } from "@/stores/concursoStore";

function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}

function editTitleForModo(modo: string | undefined): string {
  if (modo === "automatica") return "Editar horário (Automática)";
  if (modo === "simplificada") return "Editar horário (Simplificada)";
  return "Editar horário (Analítica)";
}

export function Cronograma() {
  const qc = useQueryClient();
  const concursoAtivoId = useConcursoAtivoId();

  const jsDay = new Date().getDay(); // 0=Sun
  const diaHoje = (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as Bloco["dia_semana"][])[jsDay];

  const { data: disciplinasCatalog = [], isLoading: loadingDisciplinas } = useQuery({
    queryKey: ["disciplinas", "catalog", null],
    queryFn: async () => {
      const rows = (await api.get("/disciplinas")).data as Array<{
        id: string;
        nome: string;
        peso: number | null;
        total_questoes_prova: number | null;
        total_pontos?: number | null;
        concurso_ids?: string[];
      }>;
      return rows.map((r) => ({
        id: r.id,
        nome: r.nome,
        peso: r.peso,
        total_questoes_prova: r.total_questoes_prova,
        total_pontos: r.total_pontos,
        concurso_ids: r.concurso_ids,
      })) as DisciplinaOption[];
    },
  });

  /** Catálogo completo; com concurso ativo, prioriza vinculadas ao concurso no topo. */
  const disciplinas = React.useMemo(() => {
    if (!concursoAtivoId) return disciplinasCatalog;
    const linked = disciplinasCatalog.filter((d) => d.concurso_ids?.includes(concursoAtivoId));
    const rest = disciplinasCatalog.filter((d) => !d.concurso_ids?.includes(concursoAtivoId));
    return linked.length > 0 ? [...linked, ...rest] : disciplinasCatalog;
  }, [disciplinasCatalog, concursoAtivoId]);
  const discMap = React.useMemo(() => new Map(disciplinas.map((d) => [d.id, d.nome])), [disciplinas]);

  const { data: blocos, isLoading } = useQuery({
    queryKey: ["cronograma-blocos", concursoAtivoId ?? null],
    queryFn: async () =>
      (
        await api.get("/cronograma/blocos", {
          params: concursoAtivoId ? { concurso_id: concursoAtivoId } : {},
        })
      ).data as Bloco[],
  });

  const { data: stats } = useQuery({
    queryKey: ["sessoes-stats", concursoAtivoId ?? null],
    queryFn: async () => (await api.get("/sessoes-estudo/stats")).data as SessaoStats,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: FormState) =>
      (await api.post("/cronograma/blocos", { ...payload, modo_criacao: "analitica" })).data as Bloco,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
      toast.success("Bloco criado.");
      setCreateOpen(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Erro ao criar bloco.")),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: FormState | SimplificadoEditPayload;
    }) => (await api.put(`/cronograma/blocos/${id}`, payload)).data as Bloco,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
      toast.success("Bloco atualizado.");
      setEditBloco(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Erro ao atualizar bloco.")),
  });

  const [removeTarget, setRemoveTarget] = React.useState<{
    bloco: Bloco;
    dataAlvo: string;
    diaLabel: string;
  } | null>(null);

  const removerMutation = useMutation({
    mutationFn: async ({
      id,
      scope,
      data,
    }: {
      id: string;
      scope: RemoverScope;
      data: string;
    }) =>
      (
        await api.post(`/cronograma/blocos/${id}/remover`, { scope, data })
      ).data as { action: string },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
      const msg =
        res.action === "exception"
          ? "Ocorrência deste dia removida."
          : res.action === "vigencia_cut"
            ? "Vigência encerrada a partir desta data."
            : "Horário removido do cronograma.";
      toast.success(msg);
      setRemoveTarget(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Erro ao remover bloco.")),
  });

  const limparMutation = useMutation({
    mutationFn: async () =>
      (await api.delete("/cronograma/limpar")).data as { blocos_removidos: number; itens_removidos: number },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
      toast.success(
        `Cronograma limpo — ${data.blocos_removidos} bloco(s) e ${data.itens_removidos} item(ns) removidos.`,
      );
    },
    onError: () => toast.error("Não foi possível limpar o cronograma."),
  });

  const simplificadaMutation = useMutation({
    mutationFn: async (form: SimplificadoFormState) =>
      (
        await api.post("/cronograma/grupos/simplificado", {
          disciplina_id: form.disciplina_id,
          dias_semana: form.dias_semana,
          hora_inicio: form.hora_inicio,
          hora_fim: form.hora_fim,
          tipo: form.tipo,
          vigencia_modo: form.vigencia_modo,
          vigencia_inicio: form.vigencia_inicio,
          vigencia_fim:
            form.vigencia_modo === "periodo"
              ? form.vigencia_fim
              : form.vigencia_modo === "12_meses"
                ? vigenciaFim12Meses(form.vigencia_inicio)
                : null,
        })
      ).data as { grupo_id: string; blocos: Bloco[] },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
      toast.success(`Cronograma criado — ${data.blocos.length} dia(s).`);
      setSimplificadaOpen(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Erro ao criar cronograma simplificado.")),
  });

  const estenderMutation = useMutation({
    mutationFn: async (grupoId: string) =>
      (
        await api.post(`/cronograma/grupos/${grupoId}/estender`, { meses: 12 })
      ).data as { grupo_id: string; vigencia_fim: string; blocos_atualizados: number },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
      toast.success(`Vigência estendida até ${fmtDateBR(data.vigencia_fim)}.`);
    },
    onError: () => toast.error("Não foi possível estender a vigência."),
  });

  const [modoSelectorOpen, setModoSelectorOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [autoOpen, setAutoOpen] = React.useState(false);
  const [simplificadaOpen, setSimplificadaOpen] = React.useState(false);
  const [editBloco, setEditBloco] = React.useState<Bloco | null>(null);
  const [openRegistro, setOpenRegistro] = React.useState(false);
  const [agendaHojeOpen, setAgendaHojeOpen] = React.useState(false);

  function openCriarCronograma() {
    setModoSelectorOpen(true);
  }

  function handleModoSelect(modo: CronogramaModo) {
    setModoSelectorOpen(false);
    if (modo === "automatica") {
      if (loadingDisciplinas) {
        toast.info("Carregando disciplinas…");
        return;
      }
      if (disciplinas.length === 0) {
        toast.error("Nenhuma disciplina no catálogo. Cadastre em Disciplinas & Tópicos.");
        return;
      }
      setAutoOpen(true);
      return;
    }
    if (modo === "analitica" || modo === "simplificada") {
      if (loadingDisciplinas) {
        toast.info("Carregando disciplinas…");
        return;
      }
      if (disciplinas.length === 0) {
        toast.error("Nenhuma disciplina no catálogo. Cadastre em Disciplinas & Tópicos.");
        return;
      }
      if (modo === "analitica") setCreateOpen(true);
      else setSimplificadaOpen(true);
      return;
    }
  }

  const grouped = React.useMemo(() => {
    const map = Object.fromEntries(DIAS.map((d) => [d, [] as Bloco[]])) as Record<Bloco["dia_semana"], Bloco[]>;
    for (const b of blocos ?? []) map[b.dia_semana]?.push(b);
    return map;
  }, [blocos]);

  const groupedPorDisciplina = React.useMemo(() => {
    return Object.fromEntries(
      DIAS.map((d) => [
        d,
        [...(grouped[d] ?? [])].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
      ]),
    ) as Record<Bloco["dia_semana"], Bloco[]>;
  }, [grouped]);

  const totalBlocos = (blocos ?? []).length;
  const today = new Date();
  const calendarioMensalHref = calendarioHref(
    today.getFullYear(),
    today.getMonth() + 1,
    hojeISO(),
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Cronograma</h1>
          <p className="text-sm text-muted-foreground">Planejamento semanal de estudos</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:max-w-[min(100%,42rem)] lg:justify-end">
          <button
            type="button"
            onClick={() => setAgendaHojeOpen(true)}
            title="Ver o que está agendado para estudar na semana"
            aria-label="Ver o que está agendado para estudar na semana"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-sm font-medium text-card-foreground shadow-sm hover:bg-muted sm:px-3"
          >
            <ListChecks className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Agendado</span>
          </button>
          <Link
            to={calendarioMensalHref}
            title="Calendário mensal"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-sm font-medium text-card-foreground shadow-sm hover:bg-muted sm:px-3"
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Calendário</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpenRegistro(true)}
            title="Novo registro"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-sm font-medium text-card-foreground shadow-sm hover:bg-muted sm:px-3"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Registro</span>
          </button>
          <button
            type="button"
            disabled={limparMutation.isPending}
            title="Limpar cronograma"
            onClick={() => {
              if (
                !window.confirm(
                  "Isso remove todos os blocos do cronograma semanal e os itens gerados automaticamente. Deseja continuar?",
                )
              ) {
                return;
              }
              limparMutation.mutate();
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:bg-muted disabled:opacity-50 sm:px-3"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{limparMutation.isPending ? "Limpando…" : "Limpar"}</span>
          </button>
          <button
            type="button"
            onClick={openCriarCronograma}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Criar cronograma
          </button>
        </div>
      </div>

      {!isLoading && totalBlocos === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-8 text-center">
          <p className="text-sm font-medium text-card-foreground">Nenhum horário no cronograma</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Escolha um modo: automático com IA, analítico com tópicos, ou simplificado por disciplina.
          </p>
          <button
            type="button"
            onClick={openCriarCronograma}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Criar cronograma
          </button>
        </div>
      ) : null}

      {stats ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          {[
            { label: "Tempo total", value: fmtHorasStats(stats.tempo_total_horas), icon: Clock },
            { label: "Sessões", value: stats.sessoes_count != null ? String(stats.sessoes_count) : "—", icon: BarChart3 },
            { label: "Média diária", value: fmtHorasStats(stats.media_diaria_horas), icon: Calendar },
            { label: "Blocos", value: String(totalBlocos), icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-card p-3 shadow-sm sm:gap-3 sm:p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 sm:h-9 sm:w-9">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
                <p className="truncate text-sm font-semibold tabular-nums text-card-foreground sm:text-base">{value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="overflow-x-auto overscroll-x-contain pb-1">
          <div className="grid min-w-[52rem] grid-cols-7 gap-2 2xl:min-w-0 2xl:gap-3">
            {DIAS.map((d) => (
              <div key={d} className="h-40 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch]">
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:min-w-[52rem] md:grid-cols-7 md:gap-2 2xl:min-w-0 2xl:gap-3"
            role="list"
            aria-label="Dias da semana"
          >
            {DIAS.map((dia) => {
              const isHoje = dia === diaHoje;
              const items = groupedPorDisciplina[dia] ?? [];
              return (
                <div
                  key={dia}
                  role="listitem"
                  className={cn(
                    "min-w-0 rounded-xl border p-2.5 sm:p-3",
                    isHoje
                      ? "border-primary-400 bg-primary-50/60 shadow-sm dark:border-primary-600 dark:bg-primary-950/30"
                      : "border-border bg-card",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "flex min-w-0 flex-wrap items-center gap-1 text-xs font-semibold uppercase tracking-wide",
                        isHoje ? "text-primary-700 dark:text-primary-300" : "text-muted-foreground",
                      )}
                    >
                      <span>{diaAbrev[dia]}</span>
                      {isHoje ? (
                        <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold normal-case text-white">
                          hoje
                        </span>
                      ) : null}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      {items.length === 1 ? (
                        <button
                          type="button"
                          title={`Editar ${diaAbrev[dia]}`}
                          aria-label={`Editar bloco de ${diaAbrev[dia]}`}
                          onClick={() => setEditBloco(items[0])}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      {items.length > 0 ? (
                        <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                          {items.length}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {items.map((bloco) => (
                      <CronogramaBlocoCard
                        key={bloco.id}
                        bloco={bloco}
                        disciplinaNome={discMap.get(bloco.disciplina_id) ?? "—"}
                        diaLabel={diaAbrev[dia]}
                        onEdit={() => setEditBloco(bloco)}
                        onDelete={() =>
                          setRemoveTarget({
                            bloco,
                            dataAlvo: nextOccurrenceISO(bloco.dia_semana),
                            diaLabel: diaAbrev[dia],
                          })
                        }
                        deletePending={removerMutation.isPending}
                        estenderPending={estenderMutation.isPending}
                        onEstender={
                          bloco.grupo_id
                            ? () => {
                                const ate = fmtDateBR(previewEstenderFim(bloco.vigencia_fim));
                                if (
                                  !window.confirm(
                                    `Estender a vigência por mais 12 meses (até ${ate})?`,
                                  )
                                ) {
                                  return;
                                }
                                estenderMutation.mutate(bloco.grupo_id!);
                              }
                            : undefined
                        }
                      />
                    ))}
                    {items.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">Sem blocos</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground md:block 2xl:hidden">
            Deslize horizontalmente para ver a semana completa
          </p>
        </div>
      )}

      <CronogramaAgendaHojeDialog
        open={agendaHojeOpen}
        onClose={() => setAgendaHojeOpen(false)}
        blocos={blocos ?? []}
        disciplinaNome={(id) => discMap.get(id) ?? "Disciplina"}
        onCriarCronograma={openCriarCronograma}
      />

      <CronogramaModoSelectorModal
        open={modoSelectorOpen}
        onClose={() => setModoSelectorOpen(false)}
        onSelect={handleModoSelect}
      />

      <BlocoFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(form) => createMutation.mutate(form)}
        disciplinas={disciplinas}
        title="Novo horário (Analítica)"
        isSaving={createMutation.isPending}
      />

      {editBloco && editBloco.modo_criacao === "simplificada" ? (
        <CronogramaSimplificadoEditModal
          open
          onClose={() => setEditBloco(null)}
          onSave={(payload) => updateMutation.mutate({ id: editBloco.id, payload })}
          bloco={editBloco}
          disciplinas={disciplinas}
          isSaving={updateMutation.isPending}
        />
      ) : null}

      {editBloco && editBloco.modo_criacao !== "simplificada" ? (
        <BlocoFormModal
          open
          onClose={() => setEditBloco(null)}
          onSave={(form) => updateMutation.mutate({ id: editBloco.id, payload: form })}
          disciplinas={disciplinas}
          initialValues={{
            disciplina_id: editBloco.disciplina_id,
            dia_semana: editBloco.dia_semana,
            hora_inicio: editBloco.hora_inicio.slice(0, 5),
            hora_fim: editBloco.hora_fim.slice(0, 5),
            tipo: editBloco.tipo,
            ativo: editBloco.ativo,
            topico_ids: blocoTopicoIds(editBloco),
          }}
          title={editTitleForModo(editBloco.modo_criacao)}
          isSaving={updateMutation.isPending}
        />
      ) : null}

      <GerarCronogramaAutoModal
        open={autoOpen}
        onClose={() => setAutoOpen(false)}
        disciplinas={disciplinas}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
        }}
      />

      <CronogramaSimplificadoModal
        open={simplificadaOpen}
        onClose={() => setSimplificadaOpen(false)}
        onSave={(form) => simplificadaMutation.mutate(form)}
        disciplinas={disciplinas}
        isSaving={simplificadaMutation.isPending}
      />

      {removeTarget ? (
        <CronogramaRemoverDialog
          open
          onClose={() => setRemoveTarget(null)}
          bloco={removeTarget.bloco}
          dataAlvo={removeTarget.dataAlvo}
          diaLabel={removeTarget.diaLabel}
          isPending={removerMutation.isPending}
          onConfirm={(scope) =>
            removerMutation.mutate({
              id: removeTarget.bloco.id,
              scope,
              data: removeTarget.dataAlvo,
            })
          }
        />
      ) : null}

      <RegistroEstudoModal
        open={openRegistro}
        onClose={() => setOpenRegistro(false)}
        defaultDisciplinaId={null}
      />
    </div>
  );
}
