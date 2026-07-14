import { format, parseISO, startOfDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarRange, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STATUS_LABEL } from "@/lib/calendario/constants";
import { fmtMinutosEstudo } from "@/lib/calendario/format";
import type { PlanejadoItem } from "@/lib/calendario/types";
import { fetchDiaDetalhe } from "@/services/calendario";

type Props = {
  data: string | null;
  concursoId: string | null;
  open: boolean;
  onClose: () => void;
  onRegistrar?: (data: string) => void;
  onEditarBloco?: (blocoId: string) => void;
  onRemoverBloco?: (blocoId: string) => void;
};

function isDataFutura(isoDate: string): boolean {
  const dia = startOfDay(parseISO(isoDate));
  const hoje = startOfDay(new Date());
  return isAfter(dia, hoje);
}

function PlanejadoActions({
  item,
  onEditar,
  onRemover,
}: {
  item: PlanejadoItem;
  onEditar?: (blocoId: string) => void;
  onRemover?: (blocoId: string) => void;
}) {
  if (item.fonte !== "bloco_semanal") return null;
  if (!onEditar && !onRemover) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {onEditar ? (
        <button
          type="button"
          onClick={() => onEditar(item.id)}
          aria-label={`Editar ${item.disciplina_nome}`}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          <Pencil className="h-3 w-3" aria-hidden />
          Editar
        </button>
      ) : null}
      {onRemover ? (
        <button
          type="button"
          onClick={() => onRemover(item.id)}
          aria-label={`Remover ${item.disciplina_nome}`}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3" aria-hidden />
          Remover
        </button>
      ) : null}
    </div>
  );
}

export function CalendarioDiaDetalheDialog({
  data,
  concursoId,
  open,
  onClose,
  onRegistrar,
  onEditarBloco,
  onRemoverBloco,
}: Props) {
  const { data: detalhe, isLoading } = useQuery({
    queryKey: ["calendario-dia", data, concursoId],
    queryFn: () => fetchDiaDetalhe({ data: data!, concursoId }),
    enabled: open && Boolean(data),
  });

  const titulo = data
    ? format(parseISO(data), "EEEE, d 'de' MMMM", { locale: ptBR })
    : "";
  const futuro = Boolean(data && isDataFutura(data));
  const mostrarRegistrar = Boolean(data && onRegistrar && !futuro);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">{titulo}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : detalhe ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                {STATUS_LABEL[detalhe.status]}
              </span>
              <span className="text-muted-foreground">
                {futuro || detalhe.status === "futuro"
                  ? `${fmtMinutosEstudo(detalhe.totais.planejados)} planejados`
                  : `${fmtMinutosEstudo(detalhe.totais.realizados)} / ${fmtMinutosEstudo(detalhe.totais.planejados)} planejados`}
              </span>
            </div>

            {detalhe.planejado.length > 0 ? (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Planejado</h3>
                <ul className="space-y-2">
                  {detalhe.planejado.map((p) => (
                    <li key={`${p.fonte}-${p.id}`} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                      <p className="font-medium">{p.disciplina_nome}</p>
                      {p.topico_nome ? <p className="text-xs text-muted-foreground">{p.topico_nome}</p> : null}
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {fmtMinutosEstudo(p.duracao_minutos)}
                      </p>
                      <PlanejadoActions
                        item={p}
                        onEditar={onEditarBloco}
                        onRemover={onRemoverBloco}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum estudo planejado neste dia.</p>
            )}

            {detalhe.realizado.length > 0 ? (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Realizado</h3>
                <ul className="space-y-2">
                  {detalhe.realizado.map((s) => (
                    <li key={s.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                      <p className="font-medium">{s.duracao_minutos} min</p>
                      <p className="text-xs capitalize text-muted-foreground">{s.tipo}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma sessão registrada neste dia.</p>
            )}

            <div className="space-y-2">
              {mostrarRegistrar ? (
                <button
                  type="button"
                  onClick={() => onRegistrar!(data!)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  Registrar estudo
                </button>
              ) : null}
              <Link
                to="/cronograma"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <CalendarRange className="h-4 w-4" aria-hidden />
                Ver no cronograma
              </Link>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
