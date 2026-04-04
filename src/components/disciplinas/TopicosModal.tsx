import React from "react";
import { X } from "lucide-react";

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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const previewItems = React.useMemo(() => parseTopicosLinhas(conteudo), [conteudo]);

  const selectionClass =
    DISCIPLINA_PALETTES[getDisciplinaPaletteIndex(disciplinaId)]?.selectionHighlight ?? DEFAULT_SELECTION;

  React.useEffect(() => {
    if (!open) return;
    setConteudo("");
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

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, saving]);

  const handleAdicionar = async () => {
    const topicos = parseTopicosLinhas(conteudo);
    if (topicos.length === 0 || disabled || saving) return;
    setSaving(true);
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
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const listaVazia = previewItems.length === 0;
  const adicionarDisabled = listaVazia || saving || disabled;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        disabled={saving}
        className="absolute inset-0 bg-black/50 dark:bg-black/60"
        onClick={() => {
          if (!saving) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="topicos-modal-title"
        className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-950"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <h2 id="topicos-modal-title" className="text-lg font-semibold text-slate-900 dark:text-neutral-50">
            Tópico
          </h2>
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-neutral-800"
            disabled={saving}
            onClick={() => onClose()}
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-5 md:grid-cols-2 md:gap-5">
          <div className="flex min-h-0 flex-col">
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">TÓPICOS</p>
            <ul
              className="min-h-[200px] flex-1 list-none overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/80 p-0 dark:border-neutral-700 dark:bg-neutral-900/50"
              aria-label="Pré-visualização dos tópicos"
            >
              {previewItems.length === 0 ? (
                <li className="p-3 text-sm text-slate-500 dark:text-neutral-500">Nenhum tópico ainda. Digite à direita.</li>
              ) : (
                previewItems.map((item, index) => {
                  const selected = selectedIndex === index;
                  return (
                    <li
                      key={`${index}-${item.slice(0, 48)}`}
                      className="border-b border-slate-200 last:border-b-0 dark:border-neutral-700"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full px-3 py-2.5 text-left text-sm text-slate-900 transition-colors dark:text-neutral-100",
                          selected ? selectionClass : "hover:bg-slate-100/80 dark:hover:bg-neutral-800/80",
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
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 dark:text-neutral-400">CONTEÚDO</p>
            <textarea
              ref={textareaRef}
              id="topicos-modal-conteudo"
              rows={10}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              disabled={disabled || saving}
              className={cn(
                "min-h-[200px] flex-1 resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition",
                "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100",
                (disabled || saving) && "cursor-not-allowed opacity-60",
              )}
              placeholder="Digite um tópico por linha…"
              aria-describedby="topicos-modal-dica"
            />
            <p id="topicos-modal-dica" className="mt-2 text-xs text-slate-500 dark:text-neutral-500">
              Você pode fazer quebra de linha com Enter para adicionar mais de um tópico.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={salvarEContinuar}
              onChange={(e) => setSalvarEContinuar(e.target.checked)}
              disabled={disabled || saving}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600"
            />
            Salvar e continuar
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
              disabled={saving}
              onClick={() => onClose()}
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
      </div>
    </div>
  );
}
