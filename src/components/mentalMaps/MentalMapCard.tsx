import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Database, Download, Eye, FileText, GitBranch, Layers3, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MentalMap } from "@/services/mentalMaps";
import "@/components/mentalMaps/mentalMaps.css";

const CATEGORY_STYLES = {
  "dados e inteligencia": { tone: "study-tone-indigo", Icon: Database },
  "gestao e metodologias": { tone: "study-tone-emerald", Icon: GitBranch },
  "seguranca da informacao": { tone: "study-tone-amber", Icon: ShieldCheck },
};
export function mentalMapCategory(category: string) {
  const key = category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  return CATEGORY_STYLES[key as keyof typeof CATEGORY_STYLES] ?? { tone: "mental-map-neutral", Icon: Layers3 };
}

export function MentalMapPreview({ category, featured = false }: { category: string; featured?: boolean }) {
  const { tone, Icon } = mentalMapCategory(category);
  const pattern = tone === "study-tone-emerald" ? "flow" : tone === "study-tone-amber" ? "security" : "connections";
  return <div data-cover-pattern={pattern} className={cn("mental-map-cover relative flex h-28 items-center justify-center overflow-hidden border-b sm:h-32", tone)} aria-hidden="true">
    <svg className="absolute h-full w-full" viewBox="0 0 360 144" preserveAspectRatio="xMidYMid meet" fill="none">
      {pattern === "flow" ? <g stroke="currentColor" strokeWidth="1.5" opacity=".45"><path d="M80 40H180V72H280V104 M80 104H180V72H280V40" /><rect x="64" y="30" width="32" height="20" rx="4" /><rect x="64" y="94" width="32" height="20" rx="4" /><rect x="264" y="30" width="32" height="20" rx="4" /><rect x="264" y="94" width="32" height="20" rx="4" /></g> : pattern === "security" ? <g stroke="currentColor" strokeWidth="1.5" opacity=".35"><path d="M180 12 244 32V76Q244 112 180 136Q116 112 116 76V32Z" /><path d="M180 25 230 41V76Q230 104 180 122Q130 104 130 76V41Z" /><path d="M60 72H105 M255 72H300" strokeDasharray="4 4" /><circle cx="60" cy="72" r="6" /><circle cx="300" cy="72" r="6" /></g> : <><path d="M90 36 180 72 270 36 M90 108 180 72 270 108" stroke="currentColor" strokeWidth="1.5" opacity=".4" />{[36, 108].flatMap(y => [90, 270].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="var(--card)" stroke="currentColor" strokeWidth="2" opacity=".7" />))}</>}
    </svg>
    <span className="mental-map-node relative flex size-14 items-center justify-center rounded-2xl"><Icon className="size-7" /></span>
    <span className="absolute left-3 top-3 rounded-lg bg-card/90 p-2"><Icon className="size-4" /></span>
    {featured && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-1 text-xs font-semibold text-foreground"><Sparkles className="size-3" />Destaque</span>}
  </div>;
}

export function MentalMapCard({ item, busyAction, onAccess }: { item: MentalMap; busyAction: string | null; onAccess: (item: MentalMap, download: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);
  const viewing = busyAction === `${item.slug}:view`, downloading = busyAction === `${item.slug}:download`;
  const extraTopics = Math.max(0, item.topics.length - 3);
  const updated = item.updated_at ? parseISO(item.updated_at) : null;
  const { tone } = mentalMapCategory(item.category);
  return <article className="min-w-0 h-full" aria-label={item.title}>
    <Card className="h-full min-w-0 gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md motion-reduce:transition-none">
      <MentalMapPreview category={item.category} featured={item.featured} />
      <CardHeader className="block space-y-0 p-4 pb-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("mental-map-category max-w-full whitespace-normal [overflow-wrap:anywhere]", tone)}>{item.category}</Badge>
          {!item.available && <Badge variant="secondary">Indisponível</Badge>}
        </div>
        <CardTitle className="mt-2 line-clamp-2 text-lg font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]" title={item.title}>{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 flex-col p-4 pt-2">
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]" title={item.description}>{item.description}</p>
        {item.topics.length > 0 && <div className="mt-3">
          <ul id={`topics-${item.slug}`} className="flex list-none flex-wrap gap-1.5" aria-label="Assuntos abordados">
            {(expanded ? item.topics : item.topics.slice(0, 3)).map((topic, index) => <li key={`${topic}-${index}`} className="min-w-0 max-w-full"><Badge variant="outline" className="max-w-full whitespace-normal text-xs font-normal leading-snug text-muted-foreground [overflow-wrap:anywhere]">{topic}</Badge></li>)}
          </ul>
          {extraTopics > 0 && <Button type="button" variant="ghost" size="sm" className="mt-1 min-h-10 max-w-full px-2 text-xs text-primary" aria-expanded={expanded} aria-controls={`topics-${item.slug}`} onClick={() => setExpanded(value => !value)}>{expanded ? "Recolher assuntos" : `+${extraTopics} assuntos`}</Button>}
        </div>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-xs text-muted-foreground">
          {item.page_count != null && item.page_count > 0 && <span className="inline-flex items-center gap-1"><FileText className="size-3.5" aria-hidden />{item.page_count} {item.page_count === 1 ? "página" : "páginas"}</span>}
          {updated && isValid(updated) && <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden /><time dateTime={item.updated_at!} title={`Atualizado em ${format(updated, "dd/MM/yyyy")}`}>{format(updated, "MMM 'de' yyyy", { locale: ptBR })}</time></span>}
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 border-t border-border p-4">
        <Button type="button" className="min-h-11 min-w-0 px-2 text-xs" disabled={!item.available || Boolean(busyAction)} aria-busy={viewing} onClick={() => onAccess(item, false)}>{viewing ? <Loader2 className="motion-safe:animate-spin" /> : <Eye />}{viewing ? "Abrindo…" : "Visualizar"}</Button>
        <Button type="button" variant="outline" className="min-h-11 min-w-0 px-2 text-xs" disabled={!item.available || Boolean(busyAction)} aria-busy={downloading} onClick={() => onAccess(item, true)}>{downloading ? <Loader2 className="motion-safe:animate-spin" /> : <Download />}{downloading ? "Baixando…" : "Baixar PDF"}</Button>
      </CardFooter>
    </Card>
  </article>;
}
