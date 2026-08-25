import { BookOpen, ChevronLeft, FileArchive, MoreHorizontal, Pencil, Play, Plus, Trash2 } from "lucide-react";

import { DeckCatalogCard } from "@/components/flashcards/DeckCatalogCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import type { Deck, DeckMetricRow, Flashcard, FlashcardsView } from "@/lib/flashcards/types";
import { cardStudyStatus, metricForDeck, stripHtml } from "@/lib/flashcards/utils";

type Props = {
  view: FlashcardsView;
  decks: Deck[];
  deckMetrics: DeckMetricRow[];
  selectedDeck: Deck | null;
  deckCards: Flashcard[];
  onOpenDeckModal: (deck?: Deck | null) => void;
  onOpenImport: () => void;
  onDeleteAllDecks: () => void;
  deletingAll: boolean;
  onDeleteDeck: (deck: Deck) => void;
  deletingDeckId: string | null;
  onSelectDeck: (deck: Deck) => void;
  onBackToDecks: () => void;
  onOpenCardModal: (card?: Flashcard | null) => void;
  onDeleteCard: (id: string) => void;
  onStartReview: (deckId: string) => void;
};

export function FlashcardsDecksTab({
  view,
  decks,
  deckMetrics,
  selectedDeck,
  deckCards,
  onOpenDeckModal,
  onOpenImport,
  onDeleteAllDecks,
  deletingAll,
  onDeleteDeck,
  deletingDeckId,
  onSelectDeck,
  onBackToDecks,
  onOpenCardModal,
  onDeleteCard,
  onStartReview,
}: Props) {
  const { requestConfirmation, confirmDialog } = useConfirmDialog();

  const requestDeckDeletion = (deck: Deck) => {
    void requestConfirmation({
      title: `Excluir “${deck.nome}”?`,
      description: "O baralho será removido da sua conta. Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir baralho",
      variant: "destructive",
    }).then((confirmed) => {
      if (confirmed) onDeleteDeck(deck);
    });
  };

  if (view === "decks" || !selectedDeck) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Biblioteca de baralhos</CardTitle>
            <CardDescription className="max-w-2xl">
              Organize os cartões por matéria ou edital e acompanhe o que precisa ser revisado.
            </CardDescription>
            <CardAction className="hidden gap-2 sm:flex">
              <Button type="button" variant="outline" onClick={onOpenImport}>
                <FileArchive aria-hidden="true" /> Importar Anki
              </Button>
              <Button type="button" onClick={() => onOpenDeckModal(null)}>
                <Plus aria-hidden="true" /> Novo baralho
              </Button>
              {decks.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="icon" aria-label="Mais ações dos baralhos">
                      <MoreHorizontal aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      disabled={deletingAll}
                      className="min-h-10 gap-2 text-destructive focus:text-destructive"
                      onSelect={() => {
                        void requestConfirmation({
                          title: "Excluir todos os baralhos?",
                          description: "Todos os baralhos serão removidos da sua conta. Esta ação não pode ser desfeita.",
                          confirmLabel: "Excluir todos",
                          variant: "destructive",
                        }).then((confirmed) => {
                          if (confirmed) onDeleteAllDecks();
                        });
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                      {deletingAll ? "Excluindo..." : "Excluir todos os baralhos"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 sm:hidden">
            <Button type="button" className="flex-1" onClick={() => onOpenDeckModal(null)}>
              <Plus aria-hidden="true" /> Novo baralho
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={onOpenImport}>
              <FileArchive aria-hidden="true" /> Importar
            </Button>
          </CardContent>
        </Card>

        {decks.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={BookOpen}
            title="Crie seu primeiro baralho"
            description="Adicione cartões manualmente ou importe um arquivo do Anki para começar suas revisões."
            action={(
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" onClick={() => onOpenDeckModal(null)}><Plus aria-hidden="true" /> Criar baralho</Button>
                <Button type="button" variant="outline" onClick={onOpenImport}><FileArchive aria-hidden="true" /> Importar do Anki</Button>
              </div>
            )}
          />
        ) : (
          <section className="mt-4" aria-labelledby="deck-catalog-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="deck-catalog-title" className="text-sm font-semibold text-foreground">
                {decks.length} {decks.length === 1 ? "baralho" : "baralhos"}
              </h2>
              <p className="text-xs text-muted-foreground">Ordenados pela sua organização atual</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {decks.map((deck) => (
                <DeckCatalogCard
                  key={deck.id}
                  deck={deck}
                  metric={metricForDeck(deckMetrics, deck.id)}
                  deleting={deletingDeckId === deck.id}
                  onOpen={onSelectDeck}
                  onEdit={(item) => onOpenDeckModal(item)}
                  onDelete={requestDeckDeletion}
                  onReview={onStartReview}
                />
              ))}
            </div>
          </section>
        )}
        {confirmDialog}
      </>
    );
  }

  const d = selectedDeck;
  const dm = metricForDeck(deckMetrics, d.id);
  const nDominados = deckCards.filter((card) => cardStudyStatus(card) === "dominado").length;
  const nAprendendo = deckCards.filter((card) => cardStudyStatus(card) === "aprendendo").length;
  const nNovos = deckCards.filter((card) => cardStudyStatus(card) === "novo").length;

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" onClick={onBackToDecks} className="-ml-2">
        <ChevronLeft aria-hidden="true" /> Voltar aos baralhos
      </Button>

      <Card>
        <CardHeader>
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: d.cor_hex || "hsl(var(--primary))" }}
              aria-hidden="true"
            >
              <BookOpen className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-xl" title={d.nome}>{d.nome}</CardTitle>
              <CardDescription className="mt-1">
                {d.descricao || d.full_path || "Gerencie os cartões e acompanhe o progresso deste baralho."}
              </CardDescription>
            </div>
          </div>
          <CardAction className="flex gap-1">
            <Button type="button" variant="outline" size="icon" onClick={() => onOpenDeckModal(d)} aria-label="Editar baralho">
              <Pencil aria-hidden="true" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="Mais ações do baralho"><MoreHorizontal aria-hidden="true" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="min-h-10 gap-2 text-destructive focus:text-destructive"
                  disabled={deletingDeckId === d.id}
                  onSelect={() => requestDeckDeletion(d)}
                >
                  <Trash2 aria-hidden="true" />
                  {deletingDeckId === d.id ? "Excluindo..." : "Excluir baralho"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{deckCards.length} {deckCards.length === 1 ? "cartão" : "cartões"}</Badge>
            <Badge variant={dm.vencidos > 0 ? "destructive" : "outline"}>
              {dm.vencidos > 0 ? `${dm.vencidos} para revisar` : "Revisões em dia"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Novos", nNovos], ["Aprendendo", nAprendendo], ["Dominados", nDominados], ["Domínio", `${dm.dominio_pct}%`]].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Progresso do baralho</span>
              <span className="font-semibold tabular-nums">{dm.dominio_pct}%</span>
            </div>
            <Progress value={dm.dominio_pct} aria-label={`Progresso do baralho: ${dm.dominio_pct}%`} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" size="lg" onClick={() => onStartReview(d.id)}><Play aria-hidden="true" /> Estudar este baralho</Button>
            <Button type="button" size="lg" variant="outline" onClick={() => onOpenCardModal(null)}><Plus aria-hidden="true" /> Novo cartão</Button>
          </div>
        </CardContent>
      </Card>

      {deckCards.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Este baralho ainda não tem cartões"
          description="Crie o primeiro cartão para começar a estudar com repetição espaçada."
          action={<Button type="button" onClick={() => onOpenCardModal(null)}><Plus aria-hidden="true" /> Criar primeiro cartão</Button>}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Cartões do baralho</CardTitle>
            <CardDescription>Edite o conteúdo ou remova cartões que não fazem mais parte do estudo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {deckCards.map((card) => {
                const frente = stripHtml(card.frente) || "(sem conteúdo)";
                const verso = stripHtml(card.verso) || "Sem resposta cadastrada";
                return (
                  <li key={card.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground" title={frente}>{frente}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground" title={verso}>{verso}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => onOpenCardModal(card)} aria-label="Editar cartão"><Pencil aria-hidden="true" /></Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          void requestConfirmation({
                            title: "Excluir cartão?",
                            description: "Este cartão será removido do baralho. Esta ação não pode ser desfeita.",
                            confirmLabel: "Excluir cartão",
                            variant: "destructive",
                          }).then((confirmed) => {
                            if (confirmed) onDeleteCard(card.id);
                          });
                        }}
                        aria-label="Excluir cartão"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
      {confirmDialog}
    </div>
  );
}
