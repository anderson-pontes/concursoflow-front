import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChevronDown, Eye, GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { DominioPicker } from "@/components/disciplinas/DominioPicker";
import { DOMINIO_LABELS, prioridadeAssunto, revisaoChip } from "@/lib/topicos/prioridade";
import { fmtTempoTopico } from "@/lib/disciplinaDashboard/format";
import { cn } from "@/lib/utils";
import type { DisciplinaDashboardTopicoRow } from "@/types/disciplinaDashboard";
import type { DisciplinaDashboardTopicosTableProps } from "./DisciplinaDashboardTopicosTable";

type Props = Pick<DisciplinaDashboardTopicosTableProps, "isDemoMode" | "toggleConcluido" | "excluirTopico" | "atualizarTopico" | "onDetalhesTopico" | "onRegistroTopico" | "onEditTopico"> & {
  row: DisciplinaDashboardTopicoRow; complete: boolean; highlighted?: boolean;
};

export function SortableTopicRow({ row, complete, highlighted, isDemoMode, toggleConcluido, excluirTopico, atualizarTopico, onDetalhesTopico, onRegistroTopico, onEditTopico }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const { requestConfirmation, confirmDialog } = useConfirmDialog();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id, disabled: isDemoMode });
  const rev = revisaoChip(row.dominio, row.ultima_revisao_em, row.intervalo_idx);
  const hasQuestions = row.certas + row.erradas + row.em_branco > 0;
  const topicState = row.concluido_edital ? "completed" : row.sessoes_count > 0 ? "studying" : "new";
  const subject = { id: row.id, descricao: row.descricao };
  const metric = (label: string, content: React.ReactNode) => <><span className="topic-metric-label">{label}</span>{content}</>;
  return <>
    <tr ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} data-topico-id={row.id} data-topic-state={topicState} data-domain={row.dominio}
      className={cn("topic-row", row.concluido_edital && "bg-primary/5", highlighted && "ring-2 ring-inset ring-primary", isDragging && "relative z-10 bg-accent shadow-md opacity-70")}>
      <td className="topic-controls">
        <div className="flex items-center gap-1">
          <button type="button" {...attributes} {...listeners} disabled={isDemoMode} aria-label={`Reordenar tópico: ${row.descricao}`} className="flex h-11 w-8 touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"><GripVertical className="h-4 w-4" /></button>
          <button type="button" role="checkbox" aria-label={`Concluir tópico: ${row.descricao}`} aria-checked={row.concluido_edital} disabled={isDemoMode || toggleConcluido.isPending} onClick={() => toggleConcluido.mutate({ topicoId: row.id, concluido: !row.concluido_edital })} className="flex h-11 w-11 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-md border-2", row.concluido_edital ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{row.concluido_edital && <Check className="h-4 w-4" />}</span>
          </button>
        </div>
      </td>
      <td className="topic-name">
        <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-foreground [overflow-wrap:anywhere]">{row.descricao}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1"><span className="topic-status">{topicState === "completed" ? "Concluído" : topicState === "studying" ? "Em andamento" : "Nunca estudado"}</span><p className="text-xs leading-relaxed text-muted-foreground">{row.sessoes_count} {row.sessoes_count === 1 ? "sessão" : "sessões"}{row.ultimo_estudo_em ? ` · Último estudo: ${new Date(row.ultimo_estudo_em).toLocaleDateString("pt-BR")}` : ""}</p></div>
        <button type="button" aria-expanded={expanded} aria-controls={`topic-details-${row.id}`} onClick={() => setExpanded(!expanded)} className="mt-1 inline-flex min-h-9 items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring">{expanded ? "Recolher detalhes" : "Ver detalhes"}<ChevronDown className={cn("h-3.5 w-3.5", expanded && "rotate-180")} /></button>
      </td>
      <td className="topic-weight">{metric("Peso", <input aria-label={`Peso: ${row.descricao}`} type="number" min={1} max={99} disabled={isDemoMode || atualizarTopico.isPending} defaultValue={row.peso} key={`peso-${row.id}-${row.peso}`} onBlur={e => { const value = Math.max(1, parseInt(e.target.value, 10) || 1); if (value !== row.peso) atualizarTopico.mutate({topicoId:row.id,patch:{peso:value}}); }} className="h-11 w-14 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums" />)}</td>
      <td className="topic-mastery">{metric("Domínio", <DominioPicker comfortable value={row.dominio} disabled={isDemoMode || atualizarTopico.isPending} onChange={value => { if (value !== row.dominio) atualizarTopico.mutate({ topicoId:row.id,patch:{dominio:value} }); }} />)}</td>
      <td className="topic-priority">{metric("Prioridade", <><span title="Prioridade = peso × (6 − domínio). A cor acompanha o nível de domínio." className="topic-priority-badge inline-flex rounded-full border px-2 py-1 text-xs font-semibold">{prioridadeAssunto(row.peso, row.dominio)}</span>{rev.variant !== "none" && <span className={cn("mt-1 block text-xs", rev.variant === "overdue" ? "text-destructive" : "text-success-text")}>{rev.label}</span>}</>)}</td>
      {complete && <><td>{metric("Certas", row.certas)}</td><td>{metric("Erradas",row.erradas)}</td><td>{metric("Branco",row.em_branco)}</td></>}
      <td className="topic-accuracy">{metric("Aproveitamento", <span data-performance={!hasQuestions ? "none" : row.aproveitamento_pct < 60 ? "low" : row.aproveitamento_pct < 80 ? "mid" : "high"} className={cn("topic-accuracy-badge inline-flex rounded-full border px-2 py-1 text-xs font-semibold", !hasQuestions ? "text-muted-foreground" : row.aproveitamento_pct < 60 ? "text-destructive" : row.aproveitamento_pct < 80 ? "text-warning-foreground" : "text-success-text")}>{hasQuestions ? `${row.aproveitamento_pct}%` : "Sem questões"}</span>)}</td>
      <td className="topic-time">{metric("Tempo", <span className="whitespace-nowrap tabular-nums">{fmtTempoTopico(row.tempo_estudo_minutos)}</span>)}</td>
      {complete && <td>{metric("Páginas", (row.paginas_lidas ?? 0).toLocaleString("pt-BR"))}</td>}
      <td className="topic-actions"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-lg" aria-label={`Ações: ${row.descricao}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onDetalhesTopico(subject)}><Eye />Ver registros de estudo</DropdownMenuItem>
          <DropdownMenuItem disabled={isDemoMode} onSelect={() => onRegistroTopico([{id:row.id,nome:row.descricao}])}><Plus />Novo registro neste tópico</DropdownMenuItem>
          <DropdownMenuItem disabled={isDemoMode} onSelect={() => onEditTopico(subject)}><Pencil />Renomear</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={isDemoMode || excluirTopico.isPending} onSelect={() => { void requestConfirmation({title:"Excluir tópico?", description:`O tópico “${row.descricao}” será excluído. Esta ação não pode ser desfeita.`,confirmLabel:"Excluir tópico",variant:"destructive"}).then(confirmed => {if(confirmed) excluirTopico.mutate(row.id);}); }}><Trash2 />Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu></td>
    </tr>
    {expanded && <tr className="topic-details"><td colSpan={complete ? 12 : 8}>
      <div id={`topic-details-${row.id}`} className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
        <h3 className="whitespace-pre-wrap text-sm font-semibold leading-relaxed [overflow-wrap:anywhere]">{row.descricao}</h3>
        <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          {[["Peso",row.peso],["Domínio",DOMINIO_LABELS[row.dominio]],["Prioridade",prioridadeAssunto(row.peso,row.dominio)],["Certas",row.certas],["Erradas",row.erradas],["Em branco",row.em_branco],["Aproveitamento",hasQuestions ? `${row.aproveitamento_pct}%` : "Sem questões"],["Tempo estudado",fmtTempoTopico(row.tempo_estudo_minutos)],["Páginas",row.paginas_lidas ?? 0],["Sessões",row.sessoes_count],["Próxima revisão",row.proxima_revisao_em ? new Date(`${row.proxima_revisao_em}T12:00:00`).toLocaleDateString("pt-BR") : "Não agendada"]].map(([label,value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}
        </dl>
        <Button variant="outline" size="sm" onClick={() => onDetalhesTopico(subject)}><Eye className="mr-2 h-4 w-4" />Ver registros de estudo</Button>
      </div>
    </td></tr>}
    {confirmDialog}
  </>;
}
