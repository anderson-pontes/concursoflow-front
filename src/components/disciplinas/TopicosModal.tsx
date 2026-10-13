import React from "react";
import { X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { DISCIPLINA_PALETTES, getDisciplinaPaletteIndex } from "./disciplinaPalettes";

export type TopicosModalProps = {
  open: boolean;
  onClose: () => void;
  /** Chamado com os nomes dos tópicos (linhas não vazias). Pode ser assíncrono. */
  onSave: (topicos: string[]) => void | Promise<void>;
  /** Usado para a cor de destaque da lista; mesmo critério dos cards de disciplina. */
  disciplinaId?: string;
  /** Desativa ações (ex.: modo demonstração). */
  disabled?: boolean;
};

/** Uma linha do textarea vira um item; linhas só com espaços ou vazias são ignoradas. */
export function parseTopicosLinhas(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const DEFAULT_SELECTION = "bg-primary/15 dark:bg-primary/25";

export function TopicosModal({ open, onClose, onSave, disciplinaId = "", disabled = false }: TopicosModalProps) {
  const [conteudo, setConteudo] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [salvarEContinuar, setSalvarEContinuar] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const { requestConfirmation, confirmDialog } = useConfirmDialog();
  const requestClose = async () => {
    if (saving) return;
    if (!conteudo.trim() || await requestConfirmation({ title: "Descartar tópicos?", description: "Os tópicos digitados ainda não foram adicionados à disciplina.", confirmLabel: "Descartar", cancelLabel: "Continuar editando", variant: "destructive" })) onClose();
  };
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const previewItems = React.useMemo(() => parseTopicosLinhas(conteudo), [conteudo]);

  const selectionClass =
    DISCIPLINA_PALETTES[getDisciplinaPaletteIndex(disciplinaId)]?.selectionHighlight ?? DEFAULT_SELECTION;

  React.useEffect(() => {
    if (!open) return;
    setConteudo("");
    setSaveError(null);
    setSelectedIndex(null);
    setSalvarEContinuar(false);
    const t = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    if (selectedIndex === null) return;
    if (selectedIndex >= previewItems.length) {
      setSelectedIndex(previewItems.length > 0 ? previewItems.length - 1 : null);
    }
  }, [previewItems.length, selectedIndex]);

  const handleAdicionar = async () => {
    const topicos = parseTopicosLinhas(conteudo);
    if (topicos.length === 0 || disabled || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await Promise.resolve(onSave(topicos));
      if (salvarEContinuar) {
        setConteudo("");
        setSelectedIndex(null);
        window.setTimeout(() => textareaRef.current?.focus(), 0);
      } else {
        onClose();
      }
    } catch (e) {
      if (e instanceof Error && e.message === "DEMO_MODE") {
        return;
      }
      setSaveError("Não foi possível adicionar os tópicos. Seu conteúdo foi preservado; tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const listaVazia = previewItems.length === 0;
  const adicionarDisabled = listaVazia || saving || disabled;

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) void requestClose();
      }}
    >
      <DialogContent
        hideClose
        aria-describedby={undefined}
        className="flex max-h-[min(90vh,640px)] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xl border-border bg-card"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 border-border">
          <DialogTitle className="text-lg font-semibold text-foreground">Tópico</DialogTitle>
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50 dark:hover:bg-neutral-800"
            disabled={saving}
            onClick={() => void requestClose()}
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-5 md:grid-cols-2 md:gap-5">
          <div className="flex min-h-0 flex-col">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">TÓPICOS</p>
            <ul
              className="min-h-[200px] flex-1 list-none overflow-y-auto rounded-lg border border-border bg-muted/80 p-0 border-border bg-card/50"
              aria-label="Pré-visualização dos tópicos"
            >
              {previewItems.length === 0 ? (
                <li className="p-3 text-sm text-muted-foreground">Nenhum tópico ainda. Digite à direita.</li>
              ) : (
                previewItems.map((item, index) => {
                  const selected = selectedIndex === index;
                  return (
                    <li
                      key={`${index}-${item.slice(0, 48)}`}
                      className="border-b border-border last:border-b-0 border-border"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full px-3 py-2.5 text-left text-sm text-foreground transition-colors text-foreground",
                          selected ? selectionClass : "hover:bg-muted/80 dark:hover:bg-neutral-800/80",
                        )}
                        aria-pressed={selected}
                      >
                        <span className="line-clamp-3">{item}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="flex min-h-0 flex-col">
            <label htmlFor="topicos-modal-conteudo" className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">CONTEÚDO</label>
            <textarea
              ref={textareaRef}
              id="topicos-modal-conteudo"
              rows={10}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              disabled={disabled || saving}
              className={cn(
                "min-h-[200px] flex-1 resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-ring",
                "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 border-border bg-card text-foreground",
                (disabled || saving) && "cursor-not-allowed opacity-60",
              )}
              placeholder="Digite um tópico por linha…"
              aria-describedby="topicos-modal-dica"
            />
            <p id="topicos-modal-dica" className="mt-2 text-xs text-muted-foreground">
              Você pode fazer quebra de linha com Enter para adicionar mais de um tópico.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 border-border sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground text-muted-foreground">
            <input
              type="checkbox"
              checked={salvarEContinuar}
              onChange={(e) => setSalvarEContinuar(e.target.checked)}
              disabled={disabled || saving}
              className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500 border-border"
            />
            Salvar e continuar
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 border-border dark:text-neutral-200 dark:hover:bg-neutral-800"
              disabled={saving}
              onClick={() => void requestClose()}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex min-w-[7rem] items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={adicionarDisabled}
              aria-busy={saving}
              onClick={() => void handleAdicionar()}
            >
              {saving ? "Salvando…" : "Adicionar"}
            </button>
          </div>
        </div>
        {saveError ? <p role="alert" className="px-5 pb-4 text-sm text-destructive">{saveError}</p> : null}
      </DialogContent>
    </Dialog>
    {confirmDialog}
    </>
  );
}
