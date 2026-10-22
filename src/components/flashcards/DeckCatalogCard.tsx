import type { CSSProperties } from "react";
import { BookOpen, MoreHorizontal, Pencil, Play, Plus, Trash2 } from "lucide-react";

import type { Deck, DeckMetricRow } from "@/lib/flashcards/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

type Props = {
  deck: Deck;
  metric?: DeckMetricRow;
  deleting?: boolean;
  onOpen: (deck: Deck) => void;
  onEdit: (deck: Deck) => void;
  onDelete: (deck: Deck) => void;
  onReview: (deckId: string) => void;
  onAddCards: (deck: Deck) => void;
};

export function DeckCatalogCard({
  deck,
  metric,
  deleting = false,
  onOpen,
  onEdit,
  onDelete,
  onReview,
  onAddCards,
}: Props) {
  const cardCount = deck.total_cards ?? 0;
  const empty = cardCount === 0;
  const domain = metric?.dominio_pct;
  const hasDomain = !empty && typeof domain === "number" && Number.isFinite(domain) && domain >= 0 && domain <= 100;
  const color = deck.cor_hex || "var(--primary)";

  return (
    <Card className="flash-deck h-full min-w-0 transition-shadow hover:shadow-md" style={{"--deck-color":color} as CSSProperties}>
      <CardHeader className="gap-x-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ color, backgroundColor: "color-mix(in srgb, var(--deck-color) 12%, var(--card))" }}
            aria-hidden="true"
          >
            <BookOpen className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="line-clamp-2 leading-snug [overflow-wrap:anywhere]" title={deck.nome}>{deck.nome}</CardTitle>
            <CardDescription className="mt-1 truncate" title={deck.full_path}>
              {deck.parent_id ? deck.full_path ?? "Subbaralho" : "Baralho principal"}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Ações do baralho ${deck.nome}`}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="min-h-10 gap-2" onSelect={() => onEdit(deck)}>
                <Pencil aria-hidden="true" />
                Editar baralho
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-h-10 gap-2 text-destructive focus:text-destructive"
                disabled={deleting}
                onSelect={() => onDelete(deck)}
              >
                <Trash2 aria-hidden="true" />
                {deleting ? "Excluindo..." : "Excluir baralho"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]" title={deck.descricao??undefined}>
          {deck.descricao || "Organize seus cartões e acompanhe o avanço das revisões."}
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {empty ? "Sem cartões" : `${cardCount} ${cardCount === 1 ? "cartão" : "cartões"}`}
          </Badge>
          {empty ? <Badge variant="outline">Não iniciado</Badge> : metric && metric.vencidos > 0 ? (
            <Badge variant="destructive">{metric.vencidos} para revisar</Badge>
          ) : (
            metric ? <Badge variant="outline">Revisões em dia</Badge> : null
          )}
        </div>

        {hasDomain ? <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Domínio</span>
            <span className="font-semibold tabular-nums text-foreground">{domain}%</span>
          </div>
          <Progress value={domain} aria-label={`Domínio do baralho: ${domain}%`} />
        </div> : <p className="text-sm text-muted-foreground">{empty ? "Adicione o primeiro cartão para começar." : "Domínio indisponível"}</p>}
      </CardContent>

      <CardFooter className="mt-auto grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => onOpen(deck)}>
          Ver cartões
        </Button>
        <Button type="button" className="min-w-0 px-2 text-xs sm:text-sm" onClick={() => empty ? onAddCards(deck) : onReview(deck.id)}>
          {empty ? <Plus aria-hidden="true" /> : <Play aria-hidden="true" />}
          {empty ? "Adicionar cartões" : "Estudar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
