import { format, parseISO, isValid } from "date-fns";
import { ArrowUpRight, BookOpen, CalendarDays, FileText, Landmark, ListChecks, MoreHorizontal, Pencil, Target, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Concurso } from "@/lib/concursos/types";
import { isEncerradoStatus } from "@/lib/concursos/utils";
import { resolvePublicUrl } from "@/lib/publicUrl";
import { ConcursoTitle, ConcursoStatus } from "@/components/concursos/ConcursoPresentation";
import { cn } from "@/lib/utils";

export type ConcursoCardStats = {
  disciplinasCount: number | null;
  questoesTotal: number | null;
  acertoMedioPct: number | null;
};
type Props = {
  concurso: Concurso;
  cardTotals: ConcursoCardStats | null;
  deletePending: boolean;
  onViewDetails: () => void;
  onEdit: () => void;
  onConfirmDelete: () => void;
};

export function ConcursoListCard({ concurso: c, cardTotals, deletePending, onViewDetails, onEdit, onConfirmDelete }: Props) {
  const { requestConfirmation, confirmDialog } = useConfirmDialog();
  const logo = resolvePublicUrl(c.logo_url), editalHref = resolvePublicUrl(c.edital_url);
  const encerrado = isEncerradoStatus(c.status);
  const title = c.cargo?.trim() || c.nome;
  const date = c.data_prova ? parseISO(c.data_prova) : null;
  const dataProva = date && isValid(date) ? format(date, "dd/MM/yyyy") : null;
  const stats = [
    { label: "Disciplinas", icon: BookOpen, value: cardTotals?.disciplinasCount ?? "Sem dados", tone: "indigo" },
    { label: "Questões", icon: ListChecks, value: cardTotals?.questoesTotal ?? "Sem dados", tone: "blue" },
    { label: "Acertos", icon: Target, value: cardTotals?.questoesTotal === 0 ? "Sem questões" : cardTotals?.questoesTotal != null && cardTotals.questoesTotal > 0 && cardTotals.acertoMedioPct != null ? `${cardTotals.acertoMedioPct}%` : "Sem dados", tone: "green" },
  ];

  return <>
    <article data-concurso-card className={cn("flex min-w-0 flex-col overflow-hidden rounded-2xl border border-t-[3px] bg-card text-card-foreground shadow-sm", encerrado ? "border-border border-t-muted-foreground" : "border-border border-t-primary")}>
      <div className="space-y-3 bg-muted/20 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card text-primary">
            {logo ? <img src={logo} alt="" className="size-full object-contain" /> : <Landmark className="size-6" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base font-bold leading-snug"><ConcursoTitle>{title}</ConcursoTitle></h2>
            <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{c.orgao || "Órgão não informado"}</p>
            <p className="text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{c.banca ? `Banca: ${c.banca}` : "Banca não informada"}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-lg" aria-label={`Ações do concurso ${title}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onEdit}><Pencil />Editar concurso</DropdownMenuItem>
                {editalHref && <DropdownMenuItem asChild><a href={editalHref} target="_blank" rel="noreferrer"><FileText />Ver edital</a></DropdownMenuItem>}
                <DropdownMenuItem variant="destructive" disabled={deletePending} onSelect={() => {
                  void requestConfirmation({ title: "Excluir concurso?", description: `O concurso “${title}” será excluído. Esta ação não pode ser desfeita.`, confirmLabel: "Excluir concurso", variant: "destructive" }).then(ok => { if (ok) onConfirmDelete(); });
                }}><Trash2 />Excluir concurso</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ConcursoStatus status={c.status} />
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-4 shrink-0" aria-hidden />{dataProva ? `Prova: ${dataProva}` : "Data da prova não definida"}</p>
      </div>
      <div className="border-t border-border p-4 sm:px-5">
        <dl className="grid grid-cols-3 gap-2">
          {stats.map(({ label, icon: Icon, value, tone }) => <div key={label} className={`concurso-soft-card concurso-tone-${tone} min-w-0 rounded-xl border px-2.5 py-2 sm:px-3`}>
            <dt className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"><Icon className="size-4 shrink-0 text-[var(--concurso-ink)]" aria-hidden />{label}</dt>
            <dd className={cn("mt-1 tabular-nums [overflow-wrap:anywhere]", typeof value === "number" || String(value).endsWith("%") ? "text-xl font-bold" : "text-xs font-medium leading-relaxed")}>{value}</dd>
          </div>)}
        </dl>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border p-4 sm:px-5">
        <Button className="min-w-0 flex-1" onClick={onViewDetails}>Ver detalhes<ArrowUpRight className="size-4" /></Button>
        {editalHref && <a href={editalHref} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}><FileText className="size-4" />Ver edital</a>}
        {!editalHref && <Button variant="outline" disabled title="Nenhum edital anexado"><FileText className="size-4" />Ver edital</Button>}
      </div>
    </article>
    {confirmDialog}
  </>;
}
