import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { CronogramaContent } from "@/components/cronograma/CronogramaContent";
import { CronogramaContextState } from "@/components/cronograma/CronogramaContextState";
import { CronogramaDialogs } from "@/components/cronograma/CronogramaDialogs";
import type { CronogramaModo } from "@/components/cronograma/CronogramaModoSelectorModal";
import {
  nextOccurrenceISO,
  type RemoverScope,
} from "@/components/cronograma/CronogramaRemoverDialog";
import type { SimplificadoEditPayload } from "@/components/cronograma/CronogramaSimplificadoEditModal";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { DIAS } from "@/lib/cronograma/constants";
import { filtrarDisciplinasDoConcursoAtivo } from "@/lib/cronograma/disciplinasConcurso";
import type {
  Bloco,
  DisciplinaOption,
  FormState,
  SessaoStats,
  SimplificadoFormState,
} from "@/lib/cronograma/types";
import { calendarioHref } from "@/lib/calendario/urlParams";
import {
  fmtDateBR,
  hojeISO,
  previewEstenderFim,
  vigenciaFim12Meses,
} from "@/lib/cronograma/types";
import { api } from "@/services/api";
import {
  useConcursoAtivoId,
  useConcursoContextError,
  useConcursoContextResolved,
} from "@/stores/concursoStore";
import { resolveConcursoContextStatus } from "@/lib/concursos/context";

function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}

export function Cronograma() {
  const qc = useQueryClient();
  const concursoAtivoId = useConcursoAtivoId();
  const contextResolved = useConcursoContextResolved();
  const contextError = useConcursoContextError();
  const { requestConfirmation, confirmDialog } = useConfirmDialog();

  const jsDay = new Date().getDay(); // 0=Sun
  const diaHoje = (["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as Bloco["dia_semana"][])[jsDay];

  const { data: disciplinasCatalog = [], isLoading: loadingDisciplinas, isError: disciplinasError, refetch: refetchDisciplinas } = useQuery({
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
    enabled: contextResolved && Boolean(concursoAtivoId),
  });

  /** Opções de criação e edição pertencentes exclusivamente ao concurso ativo. */
  const disciplinasDoConcursoAtivo = React.useMemo(
    () => filtrarDisciplinasDoConcursoAtivo(disciplinasCatalog, concursoAtivoId),
    [disciplinasCatalog, concursoAtivoId],
  );
  const discMap = React.useMemo(
    () => new Map(disciplinasCatalog.map((d) => [d.id, d.nome])),
    [disciplinasCatalog],
  );

  const { data: blocos, isLoading, isError: blocosError, refetch: refetchBlocos } = useQuery({
    queryKey: ["cronograma-blocos", concursoAtivoId ?? null],
    queryFn: async () =>
      (
        await api.get("/cronograma/blocos", {
          params: concursoAtivoId ? { concurso_id: concursoAtivoId } : {},
        })
      ).data as Bloco[],
    enabled: contextResolved && Boolean(concursoAtivoId),
  });

  const { data: stats } = useQuery({
    // O endpoint não aceita concurso_id: estatística histórica do usuário, preservada entre trocas.
    queryKey: ["sessoes-stats"],
    queryFn: async () => (await api.get("/sessoes-estudo/stats")).data as SessaoStats,
    enabled: contextResolved && Boolean(concursoAtivoId),
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

  React.useEffect(() => {
    setModoSelectorOpen(false);
    setCreateOpen(false);
    setAutoOpen(false);
    setSimplificadaOpen(false);
    setEditBloco(null);
    setOpenRegistro(false);
    setAgendaHojeOpen(false);
    setRemoveTarget(null);
  }, [concursoAtivoId]);

  function openCriarCronograma() {
    setModoSelectorOpen(true);
  }

  function handleModoSelect(modo: CronogramaModo) {
    setModoSelectorOpen(false);
    if (!concursoAtivoId) {
      toast.error("Selecione um concurso antes de criar o cronograma.");
      return;
    }
    if (loadingDisciplinas) {
      toast.info("Carregando disciplinas…");
      return;
    }
    if (modo === "automatica") {
      setAutoOpen(true);
      return;
    }
    if (modo === "analitica" || modo === "simplificada") {
      if (disciplinasDoConcursoAtivo.length === 0) {
        toast.error(
          "O concurso ativo não possui disciplinas. Cadastre ou vincule em Disciplinas & Tópicos.",
        );
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

  const contextStatus = resolveConcursoContextStatus({
    resolved: contextResolved,
    concursoId: concursoAtivoId,
    essentialError: contextError || disciplinasError || blocosError,
    essentialLoading: loadingDisciplinas || isLoading,
    disciplinesLoaded: !loadingDisciplinas,
    disciplinesCount: disciplinasDoConcursoAtivo.length,
    planLoaded: !isLoading,
    plannedItemsCount: blocos?.length,
    actionableItemsCount: blocos?.length,
  });

  if (contextStatus === "hydrating" || contextStatus === "no_contest" || contextStatus === "no_disciplines" || contextStatus === "error") {
    return (
      <CronogramaContextState
        status={contextStatus}
        onRetry={() => {
          void Promise.all([
            qc.invalidateQueries({ queryKey: ["concursos"] }),
            refetchDisciplinas(),
            refetchBlocos(),
          ]);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <CronogramaContent
        concursoAtivoId={concursoAtivoId}
        calendarioMensalHref={calendarioMensalHref}
        totalBlocos={totalBlocos}
        isLoading={isLoading}
        stats={stats}
        diaHoje={diaHoje}
        grouped={groupedPorDisciplina}
        disciplinaNome={(id) => discMap.get(id) ?? "—"}
        clearPending={limparMutation.isPending}
        deletePending={removerMutation.isPending}
        extendPending={estenderMutation.isPending}
        onAgenda={() => setAgendaHojeOpen(true)}
        onRegistro={() => setOpenRegistro(true)}
        onClear={() => {
          void requestConfirmation({
            title: "Limpar cronograma?",
            description: "Isso remove todos os blocos do cronograma semanal e os itens gerados automaticamente. Esta ação não pode ser desfeita.",
            confirmLabel: "Limpar cronograma",
            variant: "destructive",
          }).then((confirmed) => {
            if (confirmed) limparMutation.mutate();
          });
        }}
        onCreate={openCriarCronograma}
        onEdit={setEditBloco}
        onRemove={(bloco, diaLabel) => setRemoveTarget({ bloco, dataAlvo: nextOccurrenceISO(bloco.dia_semana), diaLabel })}
        onExtend={(bloco) => {
          const ate = fmtDateBR(previewEstenderFim(bloco.vigencia_fim));
          void requestConfirmation({
            title: "Estender vigência do cronograma?",
            description: `A vigência deste cronograma será estendida por mais 12 meses, até ${ate}.`,
            confirmLabel: "Estender vigência",
          }).then((confirmed) => {
            if (confirmed && bloco.grupo_id) estenderMutation.mutate(bloco.grupo_id);
          });
        }}
      />

      <CronogramaDialogs
        blocos={blocos ?? []}
        disciplinas={disciplinasDoConcursoAtivo}
        hasConcursoAtivo={Boolean(concursoAtivoId)}
        disciplinaNome={(id) => discMap.get(id) ?? "Conteúdo indisponível"}
        agendaHojeOpen={agendaHojeOpen}
        modoSelectorOpen={modoSelectorOpen}
        createOpen={createOpen}
        autoOpen={autoOpen}
        simplificadaOpen={simplificadaOpen}
        editBloco={editBloco}
        removeTarget={removeTarget}
        openRegistro={openRegistro}
        createPending={createMutation.isPending}
        updatePending={updateMutation.isPending}
        simplifiedPending={simplificadaMutation.isPending}
        removePending={removerMutation.isPending}
        onCloseAgenda={() => setAgendaHojeOpen(false)}
        onCreateCronograma={openCriarCronograma}
        onCloseModoSelector={() => setModoSelectorOpen(false)}
        onModoSelect={handleModoSelect}
        onCloseCreate={() => setCreateOpen(false)}
        onCreate={(form) => createMutation.mutate(form)}
        onCloseEdit={() => setEditBloco(null)}
        onUpdate={(id, payload) => updateMutation.mutate({ id, payload })}
        onCloseAuto={() => setAutoOpen(false)}
        onAutoSaved={() => {
          qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
        }}
        onCloseSimplificada={() => setSimplificadaOpen(false)}
        onCreateSimplificada={(form) => simplificadaMutation.mutate(form)}
        onCloseRemove={() => setRemoveTarget(null)}
        onRemove={(id, scope, data) => removerMutation.mutate({ id, scope, data })}
        onCloseRegistro={() => setOpenRegistro(false)}
      />
      {confirmDialog}
    </div>
  );
}
