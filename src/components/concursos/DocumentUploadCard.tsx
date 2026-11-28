import React from "react";
import { Check, Eye, FileText, FileUp, ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DocumentKind = "logo" | "edital";
export type DocumentStatus = "uploading" | "uploaded" | "error";

const formats = {
  png: { mime: ["image/png"], prefix: "\x89PNG\r\n\x1a\n" },
  jpeg: { mime: ["image/jpeg"], prefix: "\xff\xd8\xff" },
  webp: { mime: ["image/webp"], prefix: "RIFF" },
  pdf: { mime: ["application/pdf"], prefix: "%PDF-" },
  docx: {
    mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/x-zip-compressed"],
    prefix: "PK\x03\x04",
  },
};

// Espelha os formatos e limites de LOGO_UPLOAD_POLICY e DOCUMENT_UPLOAD_POLICY.
const policies = {
  logo: { extensions: ["png", "jpg", "jpeg", "webp"], maxMiB: 2, hint: "PNG, JPG ou WebP" },
  edital: { extensions: ["pdf", "docx", "png", "jpg", "jpeg"], maxMiB: 10, hint: "PDF, DOCX, PNG ou JPG" },
};

async function validateFile(file: File, kind: DocumentKind) {
  const policy = policies[kind];
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !policy.extensions.includes(extension) || !file.name.includes(".")) {
    return `Formato incompatível. Use ${policy.hint}.`;
  }
  if (file.size > policy.maxMiB * 1024 ** 2) return `O arquivo excede o limite de ${policy.maxMiB} MB.`;
  if (!file.size) return "O arquivo está vazio.";
  const format = formats[(extension === "jpg" ? "jpeg" : extension) as keyof typeof formats];
  if (file.type && file.type !== "application/octet-stream" && !format.mime.includes(file.type)) {
    return "O tipo do arquivo não corresponde ao formato informado.";
  }
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const header = String.fromCharCode(...bytes);
  if (!header.startsWith(format.prefix) || (extension === "webp" && header.slice(8) !== "WEBP")) {
    return "O conteúdo do arquivo não corresponde ao formato informado.";
  }
  return null;
}

function getStoredDocument(storedUrl?: string | null) {
  if (!storedUrl?.trim()) return null;
  try {
    const url = new URL(storedUrl, window.location.origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const href = url.origin === window.location.origin ? url.pathname + url.search + url.hash : url.href;
    const encodedName = url.pathname.split("/").pop() ?? "";
    let name = encodedName;
    try {
      name = decodeURIComponent(encodedName);
    } catch {
      // Older filenames can contain a literal percent sign.
    }
    return { href, name };
  } catch {
    return null;
  }
}

type Props = {
  kind: DocumentKind;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onValidationChange: (checking: boolean) => void;
  storedUrl?: string | null;
  disabled: boolean;
  status?: DocumentStatus;
  uploadError?: string;
};

export function DocumentUploadCard({ kind, file, onFileChange, onValidationChange, storedUrl, disabled, status, uploadError }: Props) {
  const id = React.useId();
  const picker = React.useRef<HTMLInputElement>(null);
  const selection = React.useRef(0);
  const [validation, setValidation] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<{ file: File; url: string } | null>(null);
  const isLogo = kind === "logo";
  const title = isLogo ? "Logo do órgão" : "Edital em PDF";
  const addLabel = isLogo ? "Adicionar logo" : "Adicionar edital";
  const Icon = isLogo ? ImagePlus : FileText;
  const DropIcon = isLogo ? ImagePlus : FileUp;
  const policy = policies[kind];
  const localPreview = preview && preview.file === file ? preview.url : null;
  const storedDocument = getStoredDocument(storedUrl);
  const existingUrl = storedDocument?.href ?? null;
  const filename = file?.name ?? storedDocument?.name ?? "";
  const extensionIndex = filename.search(/\.[a-z0-9]{1,8}$/i);
  const imageUrl = isLogo ? (file ? localPreview : existingUrl) : null;
  const error = validation ?? uploadError;
  const stateLabel = status === "uploading" ? "Enviando arquivo…" : status === "uploaded" ? "Upload concluído" : file ? "Arquivo selecionado" : existingUrl ? "Arquivo armazenado" : "";

  React.useEffect(() => {
    if (!file || (!isLogo && !file.name.toLowerCase().endsWith(".pdf"))) return;
    const url = URL.createObjectURL(isLogo || file.type === "application/pdf" ? file : file.slice(0, file.size, "application/pdf"));
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file, isLogo]);

  React.useEffect(() => () => { selection.current += 1; }, []);

  async function chooseFile(next?: File) {
    if (!next || disabled) return;
    const attempt = ++selection.current;
    onValidationChange(true);
    const error = await validateFile(next, kind).catch(() => "Não foi possível ler o arquivo.");
    if (attempt !== selection.current) return;
    onValidationChange(false);
    setValidation(error);
    if (!error) onFileChange(next);
  }

  function removeFile() {
    selection.current += 1;
    onValidationChange(false);
    setValidation(null);
    onFileChange(null);
  }

  const hasAsset = Boolean(file || existingUrl);
  const viewUrl = file ? localPreview : existingUrl;

  return (
    <article aria-labelledby={id} aria-busy={status === "uploading"} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-gradient-to-b from-card to-muted/30 p-3.5 shadow-[var(--shadow-sm)] sm:p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-muted text-primary shadow-[var(--shadow-sm)]">
          <Icon size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 id={id} className="text-sm font-semibold">{title}</h3>
          <p id={`${id}-formats`} className="text-xs text-muted-foreground">{policy.hint} · Até {policy.maxMiB} MB</p>
        </div>
      </div>
      <input ref={picker} type="file" aria-label={title} className="hidden" disabled={disabled} accept={policy.extensions.map((ext) => `.${ext}`).join(",")}
        onChange={(event) => { void chooseFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
      <div
        className={cn("flex h-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-primary-muted/30", hasAsset ? "border-border" : "border-dashed border-primary/40", dragging && "border-primary bg-primary-muted")}
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void chooseFile(event.dataTransfer.files[0]); }}
      >
        {hasAsset ? (
          imageUrl ? <img src={imageUrl} alt="Prévia da logo do órgão" className="h-full w-full object-contain p-2" /> : (
            <div className="flex flex-col items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icon size={28} className="text-primary" aria-hidden />
              {isLogo ? "Logo do órgão" : "Documento do concurso"}
            </div>
          )
        ) : (
          <button type="button" disabled={disabled} onClick={() => picker.current?.click()} aria-describedby={`${id}-formats`}
            className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl px-2 text-sm font-semibold outline-none hover:bg-primary-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-50">
            <DropIcon size={21} className="mb-1 text-primary" aria-hidden />
            {addLabel}
            <span className="text-xs font-normal text-muted-foreground">Selecione ou arraste um arquivo</span>
          </button>
        )}
      </div>
      {hasAsset ? (
        <>
          <div className="min-w-0 space-y-1">
            {filename ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" title={filename} className="flex min-w-0 max-w-full rounded text-left text-sm font-medium hover:underline focus-visible:outline focus-visible:outline-ring">
                    <span className="truncate">{extensionIndex < 0 ? filename : filename.slice(0, extensionIndex)}</span>
                    {extensionIndex >= 0 ? <span className="shrink-0">{filename.slice(extensionIndex)}</span> : null}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" aria-label="Nome completo do arquivo" onOpenAutoFocus={(event) => event.preventDefault()}
                  className="w-[min(24rem,calc(100vw-2rem))] [overflow-wrap:anywhere] motion-reduce:animate-none">{filename}</PopoverContent>
              </Popover>
            ) : null}
            <p role="status" className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
              {status === "uploading" ? <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden /> : status === "uploaded" || !file ? <Check size={14} className="text-[var(--success-text)]" aria-hidden /> : null}
              {stateLabel}{file ? ` · ${file.size < 1024 ** 2 ? Math.max(1, Math.round(file.size / 1024)) + " KB" : (file.size / 1024 ** 2).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " MB"}` : ""}
            </p>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-x-1 border-t border-border pt-1">
            <Button type="button" variant="ghost" className="min-h-11 px-2" disabled={disabled} title={`Substituir ${title.toLowerCase()}`} onClick={() => picker.current?.click()}><RefreshCw aria-hidden />Substituir</Button>
            {viewUrl && !isLogo ? (
              <Button asChild variant="ghost" className="min-h-11 px-2">
                <a href={viewUrl} target="_blank" rel="noopener noreferrer" title="Visualizar edital em nova aba"><Eye aria-hidden />Visualizar</a>
              </Button>
            ) : null}
            {file && status !== "uploaded" ? (
              <Button type="button" variant="ghost" size="icon" className="ml-auto size-11 text-destructive" disabled={disabled} aria-label={`Remover ${title.toLowerCase()}`} title={`Remover ${title.toLowerCase()}`} onClick={removeFile}><Trash2 aria-hidden /></Button>
            ) : null}
          </div>
        </>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </article>
  );
}
