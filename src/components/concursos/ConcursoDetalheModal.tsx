import React from "react";
import { Building2, Calendar, ExternalLink, FileText, Landmark, User, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { isImageUrl, isPdfUrl, resolvePublicUrl } from "@/lib/publicUrl";

type ConcursoRow = {
  id: string;
  nome: string;
  orgao: string;
  cargo: string | null;
  banca: string | null;
  edital_url: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
};

type ConcursoDetalheModalProps = {
  concurso: ConcursoRow | null;
  onClose: () => void;
};

function statusLabel(status: string) {
  const map: Record<string, string> = {
    ativo: "Ativo",
    suspenso: "Suspenso",
    realizado: "Realizado",
    eliminado: "Eliminado",
  };
  return map[status] ?? status;
}

export function ConcursoDetalheModal({ concurso, onClose }: ConcursoDetalheModalProps) {
  if (!concurso) return null;

  const logoSrc = resolvePublicUrl(concurso.logo_url);
  const editalSrc = resolvePublicUrl(concurso.edital_url);
  const created = (() => {
    try {
      return format(parseISO(concurso.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return concurso.created_at;
    }
  })();

  return (
    <div
      className="fixed inset-0 z-[145] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] dark:bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detalhe-concurso-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "relative flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
          "dark:border-neutral-700 dark:bg-neutral-950",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-100 px-6 pb-4 pt-6 pr-14 dark:border-neutral-800">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900">
              {logoSrc ? (
                <img src={logoSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-slate-300 dark:text-neutral-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="detalhe-concurso-title" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-neutral-50">
                {concurso.nome}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Informações cadastradas e documentos anexados</p>
              <span className="mt-3 inline-flex rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-950/60 dark:text-primary-200">
                {statusLabel(concurso.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Dados do concurso</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <dt className="text-xs text-slate-500 dark:text-neutral-400">Órgão</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-neutral-100">{concurso.orgao}</dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <dt className="text-xs text-slate-500 dark:text-neutral-400">Cargo</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-neutral-100">{concurso.cargo ?? "—"}</dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <dt className="text-xs text-slate-500 dark:text-neutral-400">Banca</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-neutral-100">{concurso.banca ?? "—"}</dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <dt className="text-xs text-slate-500 dark:text-neutral-400">Cadastrado em</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-neutral-100">{created}</dd>
              </div>
            </div>
          </dl>

          <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Edital</h3>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
            {!editalSrc ? (
              <p className="text-sm text-slate-500 dark:text-neutral-400">Nenhum edital foi anexado a este concurso.</p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-neutral-200">Visualização do documento</p>
                  <a
                    href={editalSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-slate-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-primary-300 dark:hover:bg-neutral-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir em nova aba
                  </a>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-950">
                  {isPdfUrl(editalSrc) ? (
                    <iframe title="Pré-visualização do edital" src={editalSrc} className="h-[min(55vh,520px)] w-full" />
                  ) : isImageUrl(editalSrc) ? (
                    <div className="flex max-h-[min(55vh,520px)] items-center justify-center overflow-auto p-2">
                      <img src={editalSrc} alt="Edital" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                      <FileText className="h-10 w-10 text-slate-400" />
                      <p className="text-sm text-slate-600 dark:text-neutral-300">
                        Pré-visualização indisponível para este tipo de arquivo.
                      </p>
                      <a
                        href={editalSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                      >
                        Baixar / abrir arquivo
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
