import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Layers } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/services/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Deck } from "@/lib/flashcards/types";

type Disciplina = { id: string; nome: string };

import { DEFAULT_DECK_COLOR, DECK_COLOR_PALETTE } from "@/lib/palette/deck-colors";

type Props = {
  open: boolean;
  onClose: () => void;
  deck?: Deck | null;
  flatDecks?: Deck[];
};

export function DeckFormModal({ open, onClose, deck, flatDecks = [] }: Props) {
  const qc = useQueryClient();
  const isEdit = Boolean(deck);

  const [nome, setNome] = React.useState("");
  const [descricao, setDescricao] = React.useState("");
  const [cor, setCor] = React.useState<string>(DEFAULT_DECK_COLOR);
  const [disciplinaId, setDisciplinaId] = React.useState("");
  const [parentId, setParentId] = React.useState("");

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
        aria-describedby={undefined}
        className="block w-full max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <DialogTitle className="text-base font-semibold text-card-foreground">
              {isEdit ? "Editar baralho" : "Novo baralho"}
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Nome */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              Nome do baralho <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Direito Constitucional"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              Descrição
            </label>
            <textarea
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descrição opcional do baralho..."
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          {/* Disciplina */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              Disciplina
            </label>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
            >
              <option value="">Nenhuma</option>
              {(disciplinas ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">
              Baralho pai (opcional)
            </label>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">Nenhum (raiz)</option>
              {flatDecks
                .filter((d) => d.id !== deck?.id)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_path ?? d.nome}
                  </option>
                ))}
            </select>
          </div>

          {/* Cor */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Cor</label>
            <div className="flex flex-wrap gap-2">
              {DECK_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c,
                    borderColor: cor === c ? "white" : "transparent",
                    boxShadow: cor === c ? `0 0 0 3px ${c}` : undefined,
                  }}
                  title={c}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Personalizada:</label>
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="h-7 w-14 cursor-pointer rounded border border-border"
              />
              <span className="text-xs text-muted-foreground">{cor}</span>
            </div>
          </div>

          {/* Preview */}
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: `${cor}22`, border: `1.5px solid ${cor}44` }}
          >
            <div
              className="h-10 w-10 rounded-xl"
              style={{ background: cor }}
            />
            <div>
              <p className="text-sm font-semibold text-card-foreground">{nome || "Nome do baralho"}</p>
              <p className="text-xs text-muted-foreground">{descricao || "Sem descrição"}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {saveMutation.isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar baralho"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
