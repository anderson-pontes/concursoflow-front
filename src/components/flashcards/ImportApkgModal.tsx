import React from "react";
import ReactDOM from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, UploadCloud, FileArchive, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/services/api";

type Disciplina = { id: string; nome: string };

type ImportResult = {
  decks_criados: number;
  decks_reaproveitados: number;
  cards_importados: number;
  cards_ignorados: number;
  midias_importadas: number;
  mensagens: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ImportApkgModal({ open, onClose }: Props) {
  const qc = useQueryClient();

  const [file, setFile] = React.useState<File | null>(null);
  const [disciplinaId, setDisciplinaId] = React.useState("");
  const [dragOver, setDragOver] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { data: disciplinas } = useQuery({
    queryKey: ["disciplinas-all"],
    queryFn: async () => (await api.get("/disciplinas")).data as Disciplina[],
    enabled: open,
  });

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setDisciplinaId("");
      setDragOver(false);
      setResult(null);
    }
  }, [open]);

  const importMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("file", file as File);
      const url = disciplinaId
        ? `/flashcards/import-apkg?disciplina_id=${disciplinaId}`
        : "/flashcards/import-apkg";
      return (await api.post(url, form)).data as ImportResult;
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["flashcards-decks"] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks-flat"] });
      qc.invalidateQueries({ queryKey: ["flashcards-decks-tree"] });
      qc.invalidateQueries({ queryKey: ["flashcards-metrics"] });
      toast.success(`${data.cards_importados} cartões importados!`);
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Erro ao importar o arquivo .apkg.";
      toast.error(detail);
    },
  });

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".apkg")) {
      toast.error("Selecione um arquivo .apkg exportado do Anki.");
      return;
    }
    setFile(f);
    setResult(null);
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-apkg-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <FileArchive className="h-5 w-5 text-primary" />
            <h2 id="import-apkg-title" className="text-base font-semibold text-card-foreground">
              Importar baralho do Anki
            </h2>
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

        <div className="space-y-4 px-6 py-5">
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-semibold">Importação concluída</p>
              </div>
              <ul className="space-y-1.5 rounded-xl border border-border bg-background p-4 text-sm text-card-foreground">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Cartões importados</span>
                  <span className="tabular-nums font-semibold">{result.cards_importados}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Baralhos criados</span>
                  <span className="tabular-nums font-semibold">{result.decks_criados}</span>
                </li>
                {result.decks_reaproveitados > 0 ? (
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Baralhos reaproveitados</span>
                    <span className="tabular-nums font-semibold">{result.decks_reaproveitados}</span>
                  </li>
                ) : null}
                {result.midias_importadas > 0 ? (
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Imagens importadas</span>
                    <span className="tabular-nums font-semibold">{result.midias_importadas}</span>
                  </li>
                ) : null}
                {result.cards_ignorados > 0 ? (
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Cartões ignorados</span>
                    <span className="tabular-nums font-semibold">{result.cards_ignorados}</span>
                  </li>
                ) : null}
              </ul>
              {result.mensagens.length > 0 ? (
                <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <ul className="space-y-1">
                    {result.mensagens.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  pickFile(e.dataTransfer.files?.[0] ?? null);
                }}
                className={[
                  "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                  dragOver
                    ? "border-primary-500 bg-primary-50/60 dark:bg-primary-950/20"
                    : "border-border bg-background hover:border-primary-400",
                ].join(" ")}
              >
                <UploadCloud className="h-8 w-8 text-primary-500" />
                {file ? (
                  <p className="text-sm font-medium text-card-foreground">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-card-foreground">
                      Arraste o arquivo .apkg ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Exporte do Anki em &ldquo;Arquivo → Exportar&rdquo; (formato .apkg)
                    </p>
                  </>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".apkg"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                  Disciplina (opcional)
                </label>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary-500"
                  value={disciplinaId}
                  onChange={(e) => setDisciplinaId(e.target.value)}
                >
                  <option value="">Nenhuma</option>
                  {(disciplinas ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Os baralhos do pacote mantêm a estrutura original do Anki.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!file || importMutation.isPending}
                  onClick={() => importMutation.mutate()}
                  className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {importMutation.isPending ? "Importando..." : "Importar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
