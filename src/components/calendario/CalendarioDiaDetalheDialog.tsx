import { format, parseISO, startOfDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarRange, Clock, Pencil, Plus, Trash2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STATUS_LABEL } from "@/lib/calendario/constants";
import { fmtMinutosEstudo, fmtDuracaoCalendario } from "@/lib/calendario/format";
import type { PlanejadoItem } from "@/lib/calendario/types";
import { fetchDiaDetalhe } from "@/services/calendario";
import { CalendarioStatus } from "@/components/calendario/CalendarioPresentation";
import { Button, buttonVariants } from "@/components/ui/button";

type Props = {
  data: string | null;
  concursoId: string | null;
  open: boolean;
  onClose: () => void;
  onRegistrar?: (data: string) => void;
  onAdicionar?: (data: string) => void;
  onEditarBloco?: (blocoId: string) => void;
  onRemoverBloco?: (blocoId: string) => void;
  enhanced?:boolean;
  disciplinas?:Array<{id:string;nome:string}>;
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
  large=false,
}: {
  item: PlanejadoItem;
  onEditar?: (blocoId: string) => void;
  onRemover?: (blocoId: string) => void;
  large?:boolean;
}) {
  const blocoId = item.bloco_cronograma_id ?? (item.fonte === "bloco_semanal" ? item.id : null);
  if (!blocoId) return null;
  if (!onEditar && !onRemover) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {onEditar ? (
        <button
          type="button"
          onClick={() => onEditar(blocoId)}
          aria-label={`Editar ${item.disciplina_nome}`}
          className={`inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground transition hover:bg-muted ${large?"min-h-11 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring":""}`}
        >
          <Pencil className="h-3 w-3" aria-hidden />
          Editar
        </button>
      ) : null}
      {onRemover ? (
        <button
          type="button"
          onClick={() => onRemover(blocoId)}
          aria-label={`Remover ${item.disciplina_nome}`}
          className={`inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/10 ${large?"min-h-11 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring":""}`}
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
  onAdicionar,
  onEditarBloco,
  onRemoverBloco,
  enhanced=false,
  disciplinas=[],
}: Props) {
  const { data: detalhe, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendario-dia", data, concursoId],
    queryFn: () => fetchDiaDetalhe({ data: data!, concursoId }),
    enabled: open && Boolean(data),
  });

  const titulo = data
    ? format(parseISO(data), "EEEE, d 'de' MMMM", { locale: ptBR })
    : "";
  const futuro = Boolean(data && isDataFutura(data));
  const mostrarRegistrar = Boolean(data && onRegistrar && !futuro);

  if(enhanced) return <Dialog open={open} onOpenChange={value=>{if(!value)onClose();}}>
    <DialogContent hideClose aria-describedby={undefined} className="flex max-h-[min(92dvh,900px)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:p-0 max-sm:inset-x-0 max-sm:top-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-primary/5 p-4 sm:px-5">
        <div className="min-w-0"><p className="mb-1 text-xs text-muted-foreground">Estudos do dia</p><DialogTitle className="text-base font-semibold leading-relaxed capitalize [overflow-wrap:anywhere]">{titulo}{data?`, ${data.slice(0,4)}`:""}</DialogTitle>{detalhe&&<div className="mt-1.5"><CalendarioStatus status={detalhe.status} planejado={detalhe.totais.planejados}/></div>}</div>
        <Button variant="ghost" size="icon-lg" className="shrink-0" aria-label="Fechar detalhes do dia" onClick={onClose}><X className="size-5"/></Button>
      </header>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
        {isLoading?<p role="status" className="py-8 text-center text-sm text-muted-foreground">Carregando estudos…</p>:isError?<div role="alert" className="space-y-3 rounded-xl border border-destructive/30 p-4 text-sm"><p>Não foi possível carregar os estudos deste dia.</p><Button variant="outline" onClick={()=>void refetch()}>Tentar novamente</Button></div>:detalhe?<div className="space-y-5">
          <dl className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-border bg-muted/30 p-3"><dt className="text-xs text-muted-foreground">Planejado</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{fmtDuracaoCalendario(detalhe.totais.planejados)}</dd></div><div className="rounded-xl border border-border bg-muted/30 p-3"><dt className="text-xs text-muted-foreground">Realizado</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{fmtDuracaoCalendario(detalhe.totais.realizados)}</dd></div></dl>
          <section><h3 className="mb-2 text-sm font-semibold">Estudos planejados</h3>{detalhe.planejado.length?<ul className="space-y-2">{detalhe.planejado.map(item=><li key={`${item.fonte}-${item.id}`} className="min-w-0 rounded-xl border border-border bg-card p-3 [overflow-wrap:anywhere]">
            <p className="text-sm font-semibold leading-relaxed">{item.disciplina_nome}</p>{item.topico_nome&&<p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.topico_nome}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" aria-hidden/>{fmtDuracaoCalendario(item.duracao_minutos)} planejados{item.modo?` · ${item.modo==="revisao"?"Revisão":"Aprendizado"}`:""}</p>
            <PlanejadoActions large item={item} onEditar={onEditarBloco} onRemover={onRemoverBloco}/>
          </li>)}</ul>:<p className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">Nenhum estudo planejado neste dia.</p>}</section>
          <section><h3 className="mb-2 text-sm font-semibold">Estudos realizados</h3>{detalhe.realizado.length?<ul className="space-y-2">{detalhe.realizado.map(sessao=>{
            const nome=disciplinas.find(d=>d.id===sessao.disciplina_id)?.nome||detalhe.planejado.find(p=>p.disciplina_id===sessao.disciplina_id)?.disciplina_nome||"Estudo registrado";
            const topico=detalhe.planejado.find(p=>p.topico_id&&p.topico_id===sessao.topico_id)?.topico_nome;
            return <li key={sessao.id} className="min-w-0 rounded-xl border border-border bg-muted/20 p-3 [overflow-wrap:anywhere]"><p className="text-sm font-semibold leading-relaxed">{nome}</p>{topico&&<p className="mt-1 text-sm text-muted-foreground">{topico}</p>}<p className="mt-1 text-xs text-muted-foreground">{fmtDuracaoCalendario(sessao.duracao_minutos)} · {sessao.tipo}</p><Link className="mt-2 inline-flex min-h-9 items-center text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={`/disciplinas/${sessao.disciplina_id}`}>Ver disciplina</Link></li>;
          })}</ul>:<p className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">Nenhuma sessão registrada neste dia.</p>}</section>
        </div>:null}
      </div>
      <footer className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-muted/20 p-4 sm:px-5">
        {data&&onAdicionar&&<Button variant="outline" onClick={()=>onAdicionar(data)}><Plus/>Adicionar atividade</Button>}
        <Link to="/cronograma" className={buttonVariants({variant:"outline"})}><CalendarRange className="size-4"/>Ver no cronograma</Link>
        {mostrarRegistrar&&<Button className="flex-1" onClick={()=>onRegistrar!(data!)}><Plus/>Registrar estudo</Button>}
      </footer>
    </DialogContent>
  </Dialog>;

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
              {data && onAdicionar && <button type="button" onClick={() => onAdicionar(data)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"><Plus className="size-4" />Adicionar atividade neste dia</button>}
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
