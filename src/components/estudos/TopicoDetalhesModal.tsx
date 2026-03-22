import React from "react";
import { createPortal } from "react-dom";
import { BookOpen, Check, Circle, Clock, Pencil, Target, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/services/api";

export type SessaoTopicoResumo = {
  id: string;
  inicio: string;
  fim: string | null;
  duracao_minutos: number;
  tempo_estudo_segundos: number;
  material: string | null;
  comentarios: string | null;
  questoes_acertos: number;
  questoes_erros: number;
  questoes_em_branco: number;
  paginas_blocos: { inicio: number; fim: number }[];
  teoria_finalizada: boolean;
  tipo: string;
  data_referencia: string | null;
  programar_revisoes: boolean;
  revisoes_dias: number[];
  topico_ids: string[];
};

type Props = {
  open: boolean;
  disciplinaId: string;
  topicoId: string;
  topicoNome: string;
  onClose: () => void;
  onEditSessao: (sessaoId: string) => void;
};

function fmtData(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function fmtMinutos(m: number) {
  if (m <= 0) return "—";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}min` : `${h}h`;
}

function QuestoesBar({ certas, erradas, branco }: { certas: number; erradas: number; branco: number }) {
  const total = certas + erradas + branco;
  if (total <= 0) return null;
  const pC = (certas / total) * 100;
  const pE = (erradas / total) * 100;
  const pB = (branco / total) * 100;
  return (
    <div
      className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
      role="img"
      aria-label={`Distribuição: ${certas} certas, ${erradas} erradas, ${branco} em branco`}
    >
      {certas > 0 ? (
        <div className="h-full min-w-0 bg-success-600 transition-all" style={{ width: `${pC}%` }} title="Certas" />
      ) : null}
      {erradas > 0 ? (
        <div className="h-full min-w-0 bg-danger-600 transition-all" style={{ width: `${pE}%` }} title="Erradas" />
      ) : null}
      {branco > 0 ? (
        <div className="h-full min-w-0 bg-neutral-400 dark:bg-neutral-500 transition-all" style={{ width: `${pB}%` }} title="Em branco" />
      ) : null}
    </div>
  );
}

function QuestoesPills({ certas, erradas, branco }: { certas: number; erradas: number; branco: number }) {
  const total = certas + erradas + branco;
  if (total <= 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-800 dark:bg-success-800/30 dark:text-success-100">
        {certas} certas
      </span>
      <span className="inline-flex items-center rounded-full bg-danger-50 px-2.5 py-1 text-xs font-semibold text-danger-800 dark:bg-danger-800/30 dark:text-danger-100">
        {erradas} erradas
      </span>
      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
        {branco} em branco
      </span>
    </div>
  );
}

function useConsolidado(sessoes: SessaoTopicoResumo[] | undefined) {
  return React.useMemo(() => {
    if (!sessoes?.length) return null;
    let minutos = 0;
    let certas = 0;
    let erradas = 0;
    let branco = 0;
    for (const s of sessoes) {
      minutos += s.duracao_minutos || 0;
      certas += s.questoes_acertos || 0;
      erradas += s.questoes_erros || 0;
      branco += s.questoes_em_branco || 0;
    }
    const resolvidas = certas + erradas + branco;
    const taxaPct = resolvidas > 0 ? Math.round((certas / resolvidas) * 1000) / 10 : null;
    return {
      minutos,
      certas,
      erradas,
      branco,
      resolvidas,
      taxaPct,
      sessoes: sessoes.length,
    };
  }, [sessoes]);
}

export function TopicoDetalhesModal({ open, disciplinaId, topicoId, topicoNome, onClose, onEditSessao }: Props) {
  const { data: sessoes, isLoading, isError } = useQuery({
    queryKey: ["topico-sessoes", disciplinaId, topicoId],
    enabled: open && Boolean(disciplinaId) && Boolean(topicoId),
    queryFn: async () =>
      (await api.get(`/disciplinas/${disciplinaId}/topicos/${topicoId}/sessoes`)).data as SessaoTopicoResumo[],
  });

  const consolidado = useConsolidado(sessoes);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="shrink-0 border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-dm text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalhes do tópico</h2>
              <p className="mt-2 flex items-start gap-2.5">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden />
                <span className="font-display text-xl font-normal leading-snug tracking-tight text-card-foreground sm:text-2xl">
                  {topicoNome}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground transition hover:bg-muted"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <p className="font-dm text-sm text-muted-foreground">Carregando registros…</p>
          ) : isError ? (
            <p className="font-dm text-sm text-danger-600">Não foi possível carregar os registros.</p>
          ) : !sessoes?.length ? (
            <p className="font-dm text-sm text-muted-foreground">Nenhuma sessão de estudo vinculada a este tópico.</p>
          ) : (
            <ul className="space-y-5">
              {sessoes.map((s) => {
                const qTotal = s.questoes_acertos + s.questoes_erros + s.questoes_em_branco;
                return (
                  <li
                    key={s.id}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:bg-card"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-border/80 bg-muted/50 px-4 py-3 dark:bg-neutral-800/40">
                      <div className="font-dm min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground">{fmtData(s.inicio)}</p>
                        {s.data_referencia ? (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">Ref. {s.data_referencia}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => onEditSessao(s.id)}
                        className="font-dm inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        Editar
                      </button>
                    </div>

                    <div className="px-4 pb-2 pt-4">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-dm text-sm text-muted-foreground">Tempo</span>
                        <span className="font-dm text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                          {fmtMinutos(s.duracao_minutos)}
                        </span>
                        {s.teoria_finalizada ? (
                          <span className="font-dm ml-1 inline-flex items-center rounded-full bg-success-50 px-2.5 py-0.5 text-[11px] font-semibold text-success-800 dark:bg-success-800/35 dark:text-success-100">
                            Teoria finalizada
                          </span>
                        ) : null}
                      </div>

                      {qTotal > 0 ? (
                        <div className="mt-4">
                          <p className="font-dm text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Questões
                          </p>
                          <QuestoesPills certas={s.questoes_acertos} erradas={s.questoes_erros} branco={s.questoes_em_branco} />
                          <QuestoesBar certas={s.questoes_acertos} erradas={s.questoes_erros} branco={s.questoes_em_branco} />
                        </div>
                      ) : null}

                      {s.paginas_blocos?.length ? (
                        <p className="font-dm mt-3 text-xs text-muted-foreground">
                          Páginas:{" "}
                          {s.paginas_blocos.map((b, i) => (
                            <span key={i}>
                              {i > 0 ? ", " : ""}
                              {b.inicio}–{b.fim}
                            </span>
                          ))}
                        </p>
                      ) : null}

                      {s.programar_revisoes && s.revisoes_dias?.length ? (
                        <p className="font-dm mt-2 text-xs text-primary-700 dark:text-primary-300">
                          Revisões: D+{s.revisoes_dias.join(", D+")}
                        </p>
                      ) : null}
                    </div>

                    <div className="mx-4 mb-4 space-y-3 rounded-lg border border-border/60 bg-[#FAF9F6] px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/70">
                      <div>
                        <p className="font-dm text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Material
                        </p>
                        <p className="font-dm mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {s.material?.trim() ? s.material : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="font-dm text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Comentários
                        </p>
                        <p className="font-dm mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {s.comentarios?.trim() ? s.comentarios : "—"}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {consolidado ? (
          <div className="shrink-0 border-t border-border bg-muted/30 px-5 py-4 dark:bg-neutral-900/50">
            <p className="font-dm mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Resumo neste tópico
            </p>
            <div className="flex flex-wrap gap-4 sm:gap-8">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                  <Clock className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="font-dm text-[10px] font-medium uppercase text-muted-foreground">Tempo total</p>
                  <p className="font-dm text-base font-semibold tabular-nums text-foreground">{fmtMinutos(consolidado.minutos)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-900/40 dark:text-success-300">
                  <Target className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="font-dm text-[10px] font-medium uppercase text-muted-foreground">Taxa de acerto</p>
                  <p className="font-dm text-base font-semibold tabular-nums text-foreground">
                    {consolidado.taxaPct !== null ? `${consolidado.taxaPct}%` : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="font-dm text-[10px] font-medium uppercase text-muted-foreground">Sessões</p>
                  <p className="font-dm text-base font-semibold tabular-nums text-foreground">{consolidado.sessoes}</p>
                </div>
              </div>
            </div>
            {consolidado.resolvidas > 0 ? (
              <div className="font-dm mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 dark:border-neutral-700">
                <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-800 dark:bg-success-800/25 dark:text-success-100">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  {consolidado.certas} certas
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2 py-0.5 text-[11px] font-semibold text-danger-800 dark:bg-danger-800/25 dark:text-danger-100">
                  <X className="h-3 w-3" strokeWidth={3} aria-hidden />
                  {consolidado.erradas} erradas
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                  <Circle className="h-3 w-3" aria-hidden />
                  {consolidado.branco} em branco
                </span>
              </div>
            ) : null}
            {consolidado.resolvidas > 0 ? (
              <QuestoesBar
                certas={consolidado.certas}
                erradas={consolidado.erradas}
                branco={consolidado.branco}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
