import React from "react";
import ReactDOM from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/services/api";
import { RichTextEditor } from "@/components/flashcards/RichTextEditor";


type Flashcard = {
  id: string;
  deck_id: string;
  frente: string;
  verso: string;
  tags: string[] | null;
  imagem_frente_url: string | null;
  imagem_verso_url: string | null;
};

type DeckOption = { id: string; nome: string; full_path?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  deckId: string;
  deckName?: string;
  card?: Flashcard | null;
  /** Lista de baralhos para trocar no modal (apenas criação). */
  decks?: DeckOption[];
  onDeckChange?: (deckId: string) => void;
};

function plainTextLen(html: string) {
  const t = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return t.length;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function truncateText(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function CardFormModal({
  open,
  onClose,
  deckId,
  deckName,
  card,
  decks = [],
  onDeckChange,
}: Props) {
  const qc = useQueryClient();
  const isEdit = Boolean(card);

  const [effectiveDeckId, setEffectiveDeckId] = React.useState(deckId);
  const [frente, setFrente] = React.useState("<p></p>");
  const [verso, setVerso] = React.useState("<p></p>");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"frente" | "verso">("frente");
  const [continueAdding, setContinueAdding] = React.useState(false);
  const [tagFocused, setTagFocused] = React.useState(false);
  const [deckMenuOpen, setDeckMenuOpen] = React.useState(false);
  const tagWrapRef = React.useRef<HTMLDivElement>(null);
  const deckMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) setEffectiveDeckId(card?.deck_id ?? deckId);
  }, [open, deckId, card?.deck_id]);

  const { data: deckCardsForTags = [] } = useQuery({
    queryKey: ["flashcards-cards", effectiveDeckId],
    enabled: open && Boolean(effectiveDeckId),
    queryFn: async () => (await api.get(`/flashcards?deck_id=${effectiveDeckId}`)).data as Flashcard[],
  });

  const tagSuggestions = React.useMemo(() => {
    const s = new Set<string>();
    for (const c of deckCardsForTags) {
      c.tags?.forEach((t) => s.add(t));
    }
    return Array.from(s).sort();
  }, [deckCardsForTags]);

  const filteredSuggestions = React.useMemo(() => {
    const q = tagInput.trim().toLowerCase();
    if (!q) return tagSuggestions.filter((t) => !tags.includes(t)).slice(0, 8);
    return tagSuggestions
      .filter((t) => !tags.includes(t) && t.toLowerCase().includes(q))
      .slice(0, 8);
  }, [tagInput, tagSuggestions, tags]);

  React.useEffect(() => {
    if (open) {
      setFrente(card?.frente ?? "<p></p>");
      setVerso(card?.verso ?? "<p></p>");
      setTags(card?.tags ?? []);
      setTagInput("");
      setActiveTab("frente");
      setContinueAdding(false);
      setDeckMenuOpen(false);
    }
  }, [open, card]);

  React.useEffect(() => {
    if (!tagFocused) return;
    const onDoc = (e: MouseEvent) => {
      if (tagWrapRef.current && !tagWrapRef.current.contains(e.target as Node)) setTagFocused(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [tagFocused]);

  React.useEffect(() => {
    if (!deckMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (deckMenuRef.current && !deckMenuRef.current.contains(e.target as Node)) setDeckMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [deckMenuOpen]);

  const addTag = (raw?: string) => {
    const t = (raw ?? tagInput).trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
    setTagFocused(false);
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const isEmpty = (html: string) =>
    !html || html === "<p></p>" || html === "<p><br></p>" || !html.replace(/<[^>]+>/g, "").trim();

  const charTotal = plainTextLen(frente) + plainTextLen(verso);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        deck_id: effectiveDeckId,
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
      qc.invalidateQueries({ queryKey: ["flashcards-cards", effectiveDeckId] });
      qc.invalidateQueries({ queryKey: ["flashcards-cards", deckId] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks"] });
      qc.invalidateQueries({ queryKey: ["flashcards-metrics"] });
      toast.success(isEdit ? "Cartão atualizado!" : "Cartão criado!");
      if (isEdit) {
        onClose();
        return;
      }
      if (continueAdding) {
        setFrente("<p></p>");
        setVerso("<p></p>");
        setTags([]);
        setTagInput("");
        setActiveTab("frente");
      } else {
        onClose();
      }
    },
    onError: () => toast.error("Erro ao salvar cartão."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty(frente)) {
      toast.error("A frente do cartão não pode estar vazia.");
      return;
    }
    if (isEmpty(verso)) {
      toast.error("O verso do cartão não pode estar vazio.");
      return;
    }
    saveMutation.mutate();
  };

  const selectDeck = (id: string) => {
    setEffectiveDeckId(id);
    setDeckMenuOpen(false);
    onDeckChange?.(id);
  };

  if (!open) return null;

  const deckLabel =
    decks.find((d) => d.id === effectiveDeckId)?.full_path?.trim() ||
    decks.find((d) => d.id === effectiveDeckId)?.nome?.trim() ||
    deckName?.trim() ||
    "Baralho";
  const canSwitchDeck = !isEdit && decks.length > 0 && Boolean(onDeckChange);

  const versoPreview =
    activeTab === "frente" && !isEmpty(verso) ? truncateText(stripHtml(verso), 72) : "";

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER fixo */}
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xl leading-none" aria-hidden>
              💳
            </span>
            <h2 id="card-form-title" className="min-w-0 truncate text-[18px] font-bold text-foreground">
              {isEdit ? "Editar cartão" : "Novo cartão"}
            </h2>
          </div>

          <div className="flex justify-center" ref={deckMenuRef}>
            {canSwitchDeck ? (
              <>
                <button
                  type="button"
                  onClick={() => setDeckMenuOpen((o) => !o)}
                  className="inline-flex max-w-[200px] items-center gap-1.5 truncate rounded-full bg-primary-muted px-3 py-1.5 text-sm font-semibold text-primary transition-colors duration-200 hover:opacity-90"
                  aria-haspopup="listbox"
                  aria-expanded={deckMenuOpen}
                >
                  <span aria-hidden>📚</span>
                  <span className="truncate">{deckLabel}</span>
                  <span className="shrink-0 text-xs opacity-80" aria-hidden>
                    ▾
                  </span>
                </button>
                {deckMenuOpen ? (
                  <ul
                    className="absolute left-1/2 top-full z-20 mt-2 max-h-48 min-w-[200px] -translate-x-1/2 overflow-auto rounded-[10px] border border-border bg-white py-1 shadow-lg"
                    role="listbox"
                  >
                    {decks.map((d) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={d.id === effectiveDeckId}
                          className="w-full px-3 py-2 text-left text-sm text-foreground transition-colors duration-200 hover:bg-primary-muted"
                          onClick={() => selectDeck(d.id)}
                        >
                          {d.full_path ?? d.nome}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <span
                className="inline-flex max-w-[200px] items-center gap-1.5 truncate rounded-full bg-primary-muted px-3 py-1.5 text-sm font-semibold text-primary"
              >
                <span aria-hidden>📚</span>
                <span className="truncate">{deckLabel}</span>
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1 text-[24px] leading-none text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Corpo rolável */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {/* Tabs pill — sempre (sem split) */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-[10px] bg-muted p-1">
                {(["frente", "verso"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={[
                      "rounded-lg px-4 py-2 text-sm transition-all duration-200 ease-out",
                      activeTab === tab
                        ? "bg-background font-semibold text-primary shadow-sm"
                        : "bg-transparent font-medium text-muted-foreground",
                    ].join(" ")}
                  >
                    {tab === "frente" ? "✏️ Frente" : "👁️ Verso"}
                  </button>
                ))}
              </div>
            </div>

            {versoPreview ? (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Verso: {versoPreview}
              </p>
            ) : (
              <div className="mt-2 h-4" aria-hidden />
            )}

            <div className="mt-3 min-w-0">
              {activeTab === "frente" ? (
                <RichTextEditor
                  value={frente}
                  onChange={setFrente}
                  placeholder="Digite o conteúdo da frente do cartão..."
                  minHeight={220}
                  maxHeight={380}
                />
              ) : (
                <RichTextEditor
                  value={verso}
                  onChange={setVerso}
                  placeholder="Digite o conteúdo do verso do cartão..."
                  minHeight={220}
                  maxHeight={380}
                />
              )}
            </div>

            <div ref={tagWrapRef} className="relative mt-6">
              <label className="mb-2 block text-[13px] font-medium text-muted-foreground">Tags</label>
              <div className="mb-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-muted px-2.5 py-1 text-sm font-medium text-primary"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="ml-0.5 rounded-full p-0.5 text-primary transition-colors duration-200 hover:bg-violet-200/60"
                      aria-label={`Remover ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div
                className="flex items-center gap-2 rounded-full border-[1.5px] border-dashed border-border bg-white px-3 py-2 transition-colors duration-200 focus-within:border-primary hover:border-primary"
              >
                <span className="text-sm" aria-hidden>
                  🏷️
                </span>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setTagFocused(true);
                  }}
                  onFocus={() => setTagFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                    if (e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Adicionar tag..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              {tagFocused && filteredSuggestions.length > 0 ? (
                <ul
                  className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-auto rounded-[10px] border border-border bg-white py-1 shadow-lg"
                  role="listbox"
                >
                  {filteredSuggestions.map((sug) => (
                    <li key={sug}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm text-foreground transition-colors duration-200 hover:bg-primary-muted"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addTag(sug)}
                      >
                        {sug}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {/* FOOTER fixo */}
          <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border px-4 py-3">
            {!isEdit ? (
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={continueAdding}
                  onChange={(e) => setContinueAdding(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                Continuar adicionando cartões
              </label>
            ) : (
              <span className="min-w-0 flex-1 sm:flex-none" />
            )}
            <span className="hidden min-w-[1ch] flex-1 sm:block" aria-hidden />
            <span className="text-[12px] tabular-nums text-muted-foreground">{charTotal}/500</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-200 ease-out hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-out hover:bg-primary-700 disabled:opacity-60"
            >
              {saveMutation.isPending ? "Salvando…" : isEdit ? "Salvar" : "Salvar cartão"}
              {!saveMutation.isPending ? <span aria-hidden>→</span> : null}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
}
