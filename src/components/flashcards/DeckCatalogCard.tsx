import { BookOpen, MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";

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
  metric: DeckMetricRow;
  deleting?: boolean;
  onOpen: (deck: Deck) => void;
  onEdit: (deck: Deck) => void;
  onDelete: (deck: Deck) => void;
  onReview: (deckId: string) => void;
};

export function DeckCatalogCard({
  deck,
  metric,
  deleting = false,
  onOpen,
  onEdit,
  onDelete,
  onReview,
}: Props) {
  const cardCount = deck.total_cards ?? 0;
  const color = deck.cor_hex || "hsl(var(--primary))";

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="gap-x-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          >
            <BookOpen className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate" title={deck.nome}>{deck.nome}</CardTitle>
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
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
          {deck.descricao || "Organize seus cartões e acompanhe o avanço das revisões."}
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {cardCount} {cardCount === 1 ? "cartão" : "cartões"}
          </Badge>
          {metric.vencidos > 0 ? (
            <Badge variant="destructive">{metric.vencidos} para revisar</Badge>
          ) : (
            <Badge variant="outline">Revisões em dia</Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Domínio</span>
            <span className="font-semibold tabular-nums text-foreground">{metric.dominio_pct}%</span>
          </div>
          <Progress value={metric.dominio_pct} aria-label={`Domínio do baralho: ${metric.dominio_pct}%`} />
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => onOpen(deck)}>
          Ver cartões
        </Button>
        <Button type="button" onClick={() => onReview(deck.id)}>
          <Play aria-hidden="true" />
          Estudar
        </Button>
      </CardFooter>
    </Card>
  );
}
