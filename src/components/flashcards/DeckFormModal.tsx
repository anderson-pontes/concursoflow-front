import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Layers } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/services/api";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Deck } from "@/lib/flashcards/types";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Disciplina = { id: string; nome: string };

import { DEFAULT_DECK_COLOR, DECK_COLOR_PALETTE } from "@/lib/palette/deck-colors";

type Props = {
  open: boolean;
  onClose: () => void;
  deck?: Deck | null;
  flatDecks?: Deck[];
};

export function DeckFormModal(props: Props) {
  return props.open ? <DeckFormContent key={props.deck?.id ?? "new"} {...props} /> : null;
}

function DeckFormContent({ open, onClose, deck, flatDecks = [] }: Props) {
  const qc = useQueryClient();
  const isEdit = Boolean(deck);

  const [nome, setNome] = React.useState(deck?.nome ?? "");
  const [descricao, setDescricao] = React.useState(deck?.descricao ?? "");
  const [cor, setCor] = React.useState<string>(deck?.cor_hex ?? DEFAULT_DECK_COLOR);
  const [disciplinaId, setDisciplinaId] = React.useState(deck?.disciplina_id ?? "");
  const [parentId, setParentId] = React.useState(deck?.parent_id ?? "");

  const { data: disciplinas } = useQuery({
    queryKey: ["disciplinas-all"],
    queryFn: async () => (await api.get("/disciplinas")).data as Disciplina[],
    enabled: open,
  });

  React.useEffect(() => {
    if (open) {
      setNome(deck?.nome ?? "");
      setDescricao(deck?.descricao ?? "");
      setCor(deck?.cor_hex ?? DEFAULT_DECK_COLOR);
      setDisciplinaId(deck?.disciplina_id ?? "");
      setParentId(deck?.parent_id ?? "");
    }
  }, [open, deck]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        nome,
        parent_id: parentId || null,
        descricao: descricao || null,
        cor_hex: cor,
        disciplina_id: disciplinaId || null,
      };
      if (isEdit && deck) {
        return (await api.put(`/flashcards/decks/${deck.id}`, body)).data;
      }
      return (await api.post("/flashcards/decks", body)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashcards-decks"] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks-flat"] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks-tree"] });
      qc.invalidateQueries({ queryKey: ["flashcards-metrics"] });
      toast.success(isEdit ? "Baralho atualizado!" : "Baralho criado!");
      onClose();
    },
    onError: () => toast.error("Erro ao salvar baralho."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Informe um nome para o baralho."); return; }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        hideClose
                className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[600px] flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" aria-hidden />
            <DialogTitle className="text-base font-semibold text-card-foreground">
              {isEdit ? "Editar baralho" : "Novo baralho"}
            </DialogTitle>
            <DialogDescription className="sr-only">Organize seus cartões por assunto e personalize o baralho.</DialogDescription>
          </div>
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="deck-name">
              Nome do baralho <span className="text-danger-500">*</span>
            </Label>
            <Input
              id="deck-name"
              type="text"
              placeholder="Ex: Direito Constitucional"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={100}
              required
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="deck-description">
              Descrição
            </Label>
            <Textarea
              id="deck-description"
              placeholder="Descrição opcional do baralho..."
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          {/* Disciplina */}
          <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="deck-discipline">
              Disciplina
            </Label>
            <SelectField id="deck-discipline" aria-label="Disciplina" value={disciplinaId} onValueChange={setDisciplinaId} options={[{ value: "", label: "Nenhuma" }, ...(disciplinaId && !(disciplinas ?? []).some(d => d.id === disciplinaId) ? [{value:disciplinaId,label:"Disciplina vinculada"}] : []), ...(disciplinas ?? []).map((d) => ({ value: d.id, label: d.nome }))]} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deck-parent">
              Baralho pai (opcional)
            </Label>
            <SelectField id="deck-parent" aria-label="Baralho pai" value={parentId} onValueChange={setParentId} options={[{ value: "", label: "Nenhum (raiz)" }, ...(parentId && !flatDecks.some(d => d.id === parentId) ? [{value:parentId,label:"Baralho pai vinculado"}] : []), ...flatDecks.filter((d) => d.id !== deck?.id).map((d) => ({ value: d.id, label: d.full_path ?? d.nome }))]} />
          </div>

          </div>
          {/* Cor */}
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium text-card-foreground">Cor</legend>
            <div className="flex flex-wrap gap-2">
              {DECK_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className="size-10 rounded-full border-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{
                    background: c,
                    borderColor: cor === c ? "white" : "transparent",
                    boxShadow: cor === c ? `0 0 0 3px ${c}` : undefined,
                  }}
                  aria-label={`Selecionar cor ${c}`}
                  aria-pressed={cor === c}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Label htmlFor="deck-custom-color" className="text-xs text-muted-foreground">Personalizada:</Label>
              <input
                id="deck-custom-color"
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="h-11 w-14 cursor-pointer rounded border border-border"
              />
              <span className="text-xs text-muted-foreground">{cor}</span>
            </div>
          </fieldset>

          {/* Preview */}
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: `${cor}22`, border: `1.5px solid ${cor}44` }}
          >
            <div
              className="h-10 w-10 shrink-0 rounded-xl"
              style={{ background: cor }}
            />
            <div className="min-w-0 [overflow-wrap:anywhere]">
              <p className="text-sm font-semibold text-card-foreground">{nome || "Nome do baralho"}</p>
              <p className="text-xs text-muted-foreground">{descricao || "Sem descrição"}</p>
            </div>
          </div>

          </div>
          {/* Actions */}
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-4 py-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending || !nome.trim()}
            >
              {saveMutation.isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar baralho"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
