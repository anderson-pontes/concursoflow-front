import { useId, useState } from "react";
import { BookOpen, CalendarDays, ChevronDown, Clock, ListChecks, MessageSquare, MessageSquareText, Timer } from "lucide-react";

import { activityLabels } from "@/components/estudos/StudyHistoryFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StudyHistoryActivity, StudyHistoryEntry, StudyHistoryPage } from "@/lib/historico/types";
import { cn } from "@/lib/utils";

const groupDateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" });

export function formatStudyTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const rest = seconds % 60;
  return [hours && `${hours} h`, minutes && `${minutes} min`, rest && `${rest} s`].filter(Boolean).join(" ") || "0 s";
}

export function groupStudyHistory(pages: StudyHistoryPage[] = []) {
  const days = new Map<string, StudyHistoryEntry[]>();
  const seen = new Set<string>();
  for (const { items } of pages) {
    for (const entry of items) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      const group = days.get(entry.dia);
      if (group) group.push(entry);
      else days.set(entry.dia, [entry]);
    }
  }
  return { days, count: seen.size };
}

export function StudyHistoryList({ days, latestId, timezone, newestFirst }: {
  days: Map<string, StudyHistoryEntry[]>;
  latestId?: string | null;
  timezone?: string;
  newestFirst: boolean;
}) {
  const headingPrefix = useId();
  const timeFormat = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: timezone });
  const firstId = days.values().next().value?.[0]?.id;
  return (
    <div className="space-y-4">
      {Array.from(days, ([day, entries]) => (
        <section key={day} aria-labelledby={`${headingPrefix}-${day}`} className="min-w-0 space-y-2">
          <h4 id={`${headingPrefix}-${day}`} className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
            <time dateTime={day}>{groupDateFormat.format(new Date(`${day}T12:00:00Z`))}</time>
          </h4>
          <ol className="ml-1.5 space-y-2 border-l border-border pl-3 sm:pl-4">
            {entries.map((entry) => (
              <li key={entry.id} className={cn(
                "relative min-w-0 before:absolute before:top-4 before:-left-[17px] before:size-2 before:rounded-full before:content-[''] sm:before:-left-[21px]",
                entry.id === latestId ? "before:bg-primary" : "before:bg-primary/40",
              )}>
                <HistoryEntry entry={entry} latest={entry.id === latestId}
                  openInitially={newestFirst && entry.id === firstId} time={timeFormat.format(new Date(entry.inicio))} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function HistoryEntry({ entry, latest, openInitially, time }: {
  entry: StudyHistoryEntry;
  latest: boolean;
  openInitially: boolean;
  time: string;
}) {
  const [open, setOpen] = useState(openInitially);
  const questions = entry.questoes_acertos + entry.questoes_erros + entry.questoes_em_branco;
  const comment = entry.comentarios?.trim() ? entry.comentarios : null;
  const notes = entry.anotacoes?.trim() ? entry.anotacoes : null;
  const activity = activityLabels[(entry.modalidade ?? entry.tipo) as StudyHistoryActivity];
  const hasDetails = Boolean(comment || notes || questions > 0);
  const surface = cn("min-w-0 rounded-xl border", latest ? "border-primary/35 bg-primary/5" : "border-border bg-card");
  const body = (
    <div className="min-w-0 space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium tabular-nums"><Clock className="size-3.5" aria-hidden /><time dateTime={entry.inicio}>{time}</time></span>
        {latest && <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">Mais recente</Badge>}
      </div>
      <p className="text-[15px] font-semibold leading-snug [overflow-wrap:anywhere]">
        {entry.topicos.length ? entry.topicos.map(({ nome }) => nome).join(" · ") : "Sessão sem tópico"}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
          <Timer className="size-3.5" aria-hidden />{formatStudyTime(entry.segundos)}
        </span>
        {activity && <span className="inline-flex items-center gap-1"><BookOpen className="size-3.5" aria-hidden />{activity}</span>}
        {comment && <span className="inline-flex items-center gap-1"><MessageSquare className="size-3.5" aria-hidden />Com comentário</span>}
      </div>
    </div>
  );
  if (!hasDetails) return <article className={cn(surface, "px-3 py-3 sm:px-4")}>{body}</article>;

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className={cn(surface, "group")}>
      <summary className="grid min-h-11 cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] gap-x-2 rounded-xl px-3 py-3 transition-colors hover:bg-muted/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden sm:px-4">
        {body}
        <ChevronDown className="mt-1 size-4 text-muted-foreground motion-safe:transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2 px-3 pb-3 sm:px-4">
        {questions > 0 && (
          <p className="flex items-start gap-1.5 text-sm tabular-nums text-muted-foreground">
            <ListChecks className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>{questions} {questions === 1 ? "questão" : "questões"} · {entry.questoes_acertos} {entry.questoes_acertos === 1 ? "acerto" : "acertos"} · {entry.questoes_erros} {entry.questoes_erros === 1 ? "erro" : "erros"}
              {entry.questoes_em_branco > 0 && ` · ${entry.questoes_em_branco} em branco`} · {(entry.questoes_acertos / questions).toLocaleString("pt-BR", { style: "percent", maximumFractionDigits: 1 })} de aproveitamento</span>
          </p>
        )}
        {(comment || notes) && (
          <div className="space-y-2 rounded-lg border-l-2 border-primary/50 bg-muted/50 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="size-4 text-primary" aria-hidden /> Anotações da sessão</p>
            {comment && <HistoryText label={notes && notes.trim() !== comment.trim() ? "Comentário" : undefined} value={comment} />}
            {notes && notes.trim() !== comment?.trim() && <HistoryText label={comment ? "Observações" : undefined} value={notes} />}
          </div>
        )}
      </div>
    </details>
  );
}

function HistoryText({ label, value }: { label?: string; value: string }) {
  const [expanded, setExpanded] = useState(false);
  const textId = useId();
  const excerpt = value.split("\n", 6).join("\n").slice(0, 320);
  const truncated = excerpt.length < value.length;
  return (
    <div>
      {label && <p className="text-xs font-semibold text-muted-foreground">{label}</p>}
      <p id={textId} className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
        {truncated && !expanded ? `${excerpt}…` : value}
      </p>
      {truncated && (
        <Button type="button" size="sm" variant="ghost" className="mt-1 min-h-10 px-1 text-primary"
          aria-controls={textId} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Mostrar menos" : "Ler mais"}
        </Button>
      )}
    </div>
  );
}
