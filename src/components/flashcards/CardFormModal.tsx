import React from "react";
import ReactDOM from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, CreditCard, Plus, Tag } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/services/api";
import { RichTextEditor } from "@/components/flashcards/RichTextEditor";

type Flashcard = {
  id: string; deck_id: string; frente: string; verso: string;
  tags: string[] | null; imagem_frente_url: string | null; imagem_verso_url: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  deckId: string;
  card?: Flashcard | null;
};

export function CardFormModal({ open, onClose, deckId, card }: Props) {
  const qc = useQueryClient();
  const isEdit = Boolean(card);

  const [frente, setFrente] = React.useState("<p></p>");
  const [verso, setVerso] = React.useState("<p></p>");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"frente" | "verso">("frente");

  React.useEffect(() => {
    if (open) {
      setFrente(card?.frente ?? "<p></p>");
      setVerso(card?.verso ?? "<p></p>");
      setTags(card?.tags ?? []);
      setTagInput("");
      setActiveTab("frente");
    }
  }, [open, card]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const isEmpty = (html: string) =>
    !html || html === "<p></p>" || html === "<p><br></p>" || !html.replace(/<[^>]+>/g, "").trim();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        deck_id: deckId,
        frente,
        verso,
        tags: tags.length > 0 ? tags : null,
      };
      if (isEdit && card) {
        return (await api.put(`/flashcards/${card.id}`, body)).data;
      }
      return (await api.post("/flashcards", body)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashcards-cards", deckId] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks"] });
      toast.success(isEdit ? "Cartão atualizado!" : "Cartão criado!");
      if (!isEdit) {
        setFrente("<p></p>");
        setVerso("<p></p>");
        setTags([]);
        setActiveTab("frente");
      } else {
        onClose();
      }
    },
    onError: () => toast.error("Erro ao salvar cartão."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty(frente)) { toast.error("A frente do cartão não pode estar vazia."); return; }
    if (isEmpty(verso)) { toast.error("O verso do cartão não pode estar vazio."); return; }
    saveMutation.mutate();
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary-500" />
            <h2 className="text-base font-semibold text-card-foreground">
              {isEdit ? "Editar cartão" : "Novo cartão"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-border">
          {(["frente", "verso"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "flex-1 py-2.5 text-sm font-semibold capitalize transition-colors",
                activeTab === tab
                  ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
                  : "text-muted-foreground hover:text-card-foreground",
              ].join(" ")}
            >
              {tab === "frente" ? "Frente" : "Verso"}
              {tab === "frente" && isEmpty(frente) ? (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              ) : null}
              {tab === "verso" && isEmpty(verso) ? (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              ) : null}
            </button>
          ))}
        </div>

        {/* Editor */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {activeTab === "frente" ? (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conteúdo da Frente
                </label>
                <RichTextEditor
                  value={frente}
                  onChange={setFrente}
                  placeholder="Digite a pergunta ou conteúdo da frente..."
                  minHeight={180}
                />
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conteúdo do Verso
                </label>
                <RichTextEditor
                  value={verso}
                  onChange={setVerso}
                  placeholder="Digite a resposta ou conteúdo do verso..."
                  minHeight={180}
                />
              </div>
            )}

            {/* Tags */}
            <div className="mt-4">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Tag className="h-3 w-3" />
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="ml-0.5 text-primary-400 hover:text-primary-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addTag(); }
                      if (e.key === "," || e.key === " ") { e.preventDefault(); addTag(); }
                    }}
                    placeholder="+ tag"
                    className="w-24 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900/40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-border px-6 py-4">
            <p className="text-xs text-muted-foreground">
              {!isEdit ? "Após salvar, você pode adicionar mais cartões." : ""}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                {isEdit ? "Cancelar" : "Fechar"}
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {saveMutation.isPending
                  ? "Salvando..."
                  : isEdit ? "Salvar" : "Criar cartão"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
