import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { CalendarioDiaDetalheDialog } from "@/components/calendario/CalendarioDiaDetalheDialog";
import { CalendarioLegenda } from "@/components/calendario/CalendarioLegenda";
import { CalendarioMensalGrid } from "@/components/calendario/CalendarioMensalGrid";
import { CalendarioMesToolbar } from "@/components/calendario/CalendarioMesToolbar";
import { CalendarioResumoMes } from "@/components/calendario/CalendarioResumoMes";
import { BlocoFormModal } from "@/components/cronograma/BlocoFormModal";
import {
  CronogramaRemoverDialog,
  type RemoverScope,
} from "@/components/cronograma/CronogramaRemoverDialog";
import {
  CronogramaSimplificadoEditModal,
  type SimplificadoEditPayload,
} from "@/components/cronograma/CronogramaSimplificadoEditModal";
import { useCalendarioMensal } from "@/hooks/useCalendarioMensal";
import { parseCalendarioSearchParams } from "@/lib/calendario/urlParams";
import { diaLabels } from "@/lib/cronograma/constants";
import type { Bloco, DisciplinaOption, FormState } from "@/lib/cronograma/types";
import { blocoTopicoIds } from "@/lib/cronograma/types";
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

function diaLabelFromISO(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const jsDay = new Date(y, m - 1, d).getDay();
  const keys = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;
  return diaLabels[keys[jsDay]];
}

function buildSearch(ano: number, mes: number, data: string | null): URLSearchParams {
  const next = new URLSearchParams();
  next.set("ano", String(ano));
  next.set("mes", String(mes));
  if (data) next.set("data", data);
  return next;
}

export function CalendarioEstudos() {
  const qc = useQueryClient();
  const concursoAtivoId = useConcursoAtivoId();
  const [searchParams, setSearchParams] = useSearchParams();

  const [ano, setAno] = React.useState(() => parseCalendarioSearchParams(searchParams).ano);
  const [mes, setMes] = React.useState(() => parseCalendarioSearchParams(searchParams).mes);
  const [diaSel, setDiaSel] = React.useState<string | null>(
    () => parseCalendarioSearchParams(searchParams).data,
  );
  const [detalheOpen, setDetalheOpen] = React.useState(
    () => Boolean(parseCalendarioSearchParams(searchParams).data),
  );
  const [registroOpen, setRegistroOpen] = React.useState(false);
  const [registroData, setRegistroData] = React.useState<string | null>(null);
  const [editBloco, setEditBloco] = React.useState<Bloco | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<{
    bloco: Bloco;
    dataAlvo: string;
    diaLabel: string;
  } | null>(null);

  const writingUrl = React.useRef(false);

  const syncUrl = React.useCallback(
    (nextAno: number, nextMes: number, nextData: string | null) => {
      const desired = buildSearch(nextAno, nextMes, nextData);
      if (desired.toString() === searchParams.toString()) return;
      writingUrl.current = true;
      setSearchParams(desired, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Browser back/forward or inbound deep-link
  React.useEffect(() => {
    if (writingUrl.current) {
      writingUrl.current = false;
      return;
    }
    const parsed = parseCalendarioSearchParams(searchParams);
    setAno(parsed.ano);
    setMes(parsed.mes);
    if (parsed.data) {
      setDiaSel(parsed.data);
      setDetalheOpen(true);
    } else {
      setDetalheOpen(false);
      setDiaSel(null);
    }
  }, [searchParams]);

  // Push state → URL (ano/mes always; data só com dialog aberto)
  React.useEffect(() => {
    syncUrl(ano, mes, detalheOpen && diaSel ? diaSel : null);
  }, [ano, mes, diaSel, detalheOpen, syncUrl]);

  const { dias, resumo, isLoading, isError } = useCalendarioMensal(ano, mes, concursoAtivoId);

  const { data: disciplinasCatalog = [] } = useQuery({
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

  const disciplinas = React.useMemo(() => {
    if (!concursoAtivoId) return disciplinasCatalog;
    const linked = disciplinasCatalog.filter((d) => d.concurso_ids?.includes(concursoAtivoId));
    const rest = disciplinasCatalog.filter((d) => !d.concurso_ids?.includes(concursoAtivoId));
    return linked.length > 0 ? [...linked, ...rest] : disciplinasCatalog;
  }, [disciplinasCatalog, concursoAtivoId]);

  const { data: blocos = [] } = useQuery({
    queryKey: ["cronograma-blocos", concursoAtivoId ?? null],
    queryFn: async () =>
      (
        await api.get("/cronograma/blocos", {
          params: concursoAtivoId ? { concurso_id: concursoAtivoId } : {},
        })
      ).data as Bloco[],
  });

  const blocosById = React.useMemo(() => new Map(blocos.map((b) => [b.id, b])), [blocos]);

  const invalidateCronogramaCalendario = React.useCallback(() => {
    qc.invalidateQueries({ queryKey: ["cronograma-blocos", concursoAtivoId ?? null] });
    qc.invalidateQueries({ queryKey: ["calendario"] });
    qc.invalidateQueries({ queryKey: ["calendario-dia"] });
  }, [qc, concursoAtivoId]);

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: FormState | SimplificadoEditPayload;
    }) => (await api.put(`/cronograma/blocos/${id}`, payload)).data as Bloco,
    onSuccess: () => {
      invalidateCronogramaCalendario();
      toast.success("Bloco atualizado.");
      setEditBloco(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Erro ao atualizar bloco.")),
  });

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
      invalidateCronogramaCalendario();
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

  const resolveBloco = (blocoId: string): Bloco | null => {
    const bloco = blocosById.get(blocoId);
    if (!bloco) {
      toast.error("Bloco não encontrado no cronograma. Atualize a página e tente de novo.");
      return null;
    }
    return bloco;
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(ano, mes - 1 + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth() + 1);
    setDetalheOpen(false);
    setDiaSel(null);
  };

  const goToday = () => {
    const t = new Date();
    setAno(t.getFullYear());
    setMes(t.getMonth() + 1);
    setDetalheOpen(false);
    setDiaSel(null);
  };

  const openDia = (data: string) => {
    setDiaSel(data);
    setDetalheOpen(true);
  };

  const closeDetalhe = () => {
    setDetalheOpen(false);
    setDiaSel(null);
  };

  const openRegistro = (data: string) => {
    setRegistroData(data);
    closeDetalhe();
    setRegistroOpen(true);
  };

  const handleEditarBloco = (blocoId: string) => {
    const bloco = resolveBloco(blocoId);
    if (bloco) setEditBloco(bloco);
  };

  const handleRemoverBloco = (blocoId: string) => {
    if (!diaSel) return;
    const bloco = resolveBloco(blocoId);
    if (!bloco) return;
    setRemoveTarget({
      bloco,
      dataAlvo: diaSel,
      diaLabel: diaLabelFromISO(diaSel),
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Calendário de estudos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe cumprimento do plano mês a mês</p>
      </div>

      <CalendarioMesToolbar
        ano={ano}
        mes={mes}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onToday={goToday}
      />

      <CalendarioResumoMes resumo={resumo} />

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-destructive">Erro ao carregar calendário.</p>
        ) : (
          <CalendarioMensalGrid ano={ano} mes={mes} dias={dias} onDiaClick={openDia} />
        )}
        <CalendarioLegenda className="mt-4 border-t border-border pt-4" />
      </section>

      <CalendarioDiaDetalheDialog
        data={diaSel}
        concursoId={concursoAtivoId}
        open={detalheOpen}
        onClose={closeDetalhe}
        onRegistrar={openRegistro}
        onEditarBloco={handleEditarBloco}
        onRemoverBloco={handleRemoverBloco}
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
        open={registroOpen}
        onClose={() => {
          setRegistroOpen(false);
          setRegistroData(null);
        }}
        defaultDataReferencia={registroData}
      />
    </div>
  );
}
