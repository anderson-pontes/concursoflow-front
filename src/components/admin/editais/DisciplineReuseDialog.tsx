import React from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { copyCatalogDisciplines, normalizeDisciplineName } from "@/lib/catalogDisciplineReuse";
import type { EditalCargoCatalogo } from "@/types/editaisCatalogo";

type Props = {
  cargo: EditalCargoCatalogo;
  sourceCargos: EditalCargoCatalogo[];
  editable: boolean;
  onChange: (cargo: EditalCargoCatalogo) => void;
};

export function DisciplineReuseDialog({ cargo, sourceCargos, editable, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [sourceId, setSourceId] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [includeTopics, setIncludeTopics] = React.useState(true);
  const labelId = React.useId();
  // The parent supplies only the current contest/version, never global search results.
  const sources = sourceCargos.filter((item) => item.id !== cargo.id);
  const source = sources.find((item) => item.id === sourceId);
  const currentNames = new Set(cargo.disciplinas.map((item) => normalizeDisciplineName(item.nome)));
  const eligible = source?.disciplinas.filter((item) => !currentNames.has(normalizeDisciplineName(item.nome))) ?? [];
  const count = eligible.filter((item) => selected.has(item.id)).length;

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) { setSourceId(""); setSelected(new Set()); setIncludeTopics(true); }
  };
  const confirm = () => {
    if (!editable || !count) return;
    try {
      const result = copyCatalogDisciplines(sourceCargos, cargo.id, sourceId, eligible.filter((item) => selected.has(item.id)).map((item) => item.id), includeTopics);
      if (!result.added) { toast.error("As matérias selecionadas já estão neste cargo."); return; }
      onChange(result.cargo);
      toast.success(`${result.added} ${result.added === 1 ? "matéria adicionada" : "matérias adicionadas"} ao rascunho. Salve pelo botão principal.`);
      setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível adicionar as matérias."); }
  };

  if (!editable) return null;
  return <div className="min-w-0">
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild><Button type="button" variant="outline" disabled={!sources.length} className="h-auto min-h-11 w-full whitespace-normal sm:w-auto"><Copy aria-hidden="true" /> Adicionar matérias de outro cargo</Button></DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] min-h-0 w-[calc(100%-2rem)] max-w-xl flex-col gap-3 overflow-hidden rounded-xl p-4 sm:p-6">
        <div className="shrink-0 space-y-2">
          <DialogHeader className="pr-10 text-left">
            <DialogTitle>Adicionar matérias de outro cargo</DialogTitle>
            <DialogDescription>Cópias independentes para {cargo.nome || "este cargo"}, sem alterar o cargo de origem.</DialogDescription>
          </DialogHeader>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor={`${labelId}-source`} className="text-sm font-medium">Cargo de origem</label>
              <Select value={sourceId} onValueChange={(id) => { setSourceId(id); setSelected(new Set()); }}>
                <SelectTrigger id={`${labelId}-source`}><SelectValue placeholder="Selecione outro cargo" /></SelectTrigger>
                <SelectContent>{sources.map((item) => <SelectItem key={item.id} value={item.id} className="min-h-11">{item.nome || "Cargo sem nome"}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor={`${labelId}-scope`} className="text-sm font-medium">O que copiar?</label>
              <Select value={includeTopics ? "content" : "subjects"} onValueChange={(value) => setIncludeTopics(value === "content")}>
                <SelectTrigger id={`${labelId}-scope`}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="content" className="min-h-11">Matérias + conteúdo programático</SelectItem><SelectItem value="subjects" className="min-h-11">Somente matérias</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{includeTopics ? "Inclui tópicos e subtópicos, preservando textos e pesos." : "Adiciona matérias sem tópicos para criar seu próprio conteúdo."}</p>
        </div>
        {/* A fieldset's intrinsic content box can overflow its flex allocation. */}
        <div data-reuse-list role="region" aria-label="Seleção de matérias" tabIndex={0} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-lg pb-1 pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
          {!source ? <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Escolha um cargo para visualizar suas matérias.</p> : !source.disciplinas.length ? <p role="status" className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Este cargo ainda não possui matérias cadastradas.</p> : <section aria-label="Matérias disponíveis" className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Selecione as matérias</h3>
              <div className="flex flex-wrap gap-1"><Button type="button" variant="ghost" className="min-h-11" disabled={!eligible.length} onClick={() => setSelected(new Set(eligible.map((item) => item.id)))}>Selecionar todas</Button><Button type="button" variant="ghost" className="min-h-11" disabled={!selected.size} onClick={() => setSelected(new Set())}>Desmarcar todas</Button></div>
            </div>
            {source.disciplinas.map((item) => {
              const duplicate = currentNames.has(normalizeDisciplineName(item.nome));
              return <label key={item.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                <Checkbox className="mt-1" disabled={duplicate} checked={!duplicate && selected.has(item.id)} onCheckedChange={(checked) => setSelected((current) => { const next = new Set(current); if (checked === true) next.add(item.id); else next.delete(item.id); return next; })} aria-label={item.nome} />
                <span className="min-w-0 text-sm"><span className="block break-words font-medium">{item.nome}</span><span className="mt-1 block text-xs text-muted-foreground">{duplicate ? `${item.nome} já está adicionada a este cargo.` : `${item.topicos.length} tópicos cadastrados`}</span></span>
              </label>;
            })}
          </section>}
        </div>
        <div className="shrink-0 space-y-2 border-t border-border pt-3">
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{count} {count === 1 ? "matéria selecionada" : "matérias selecionadas"}. Adicione ao rascunho e salve pelo botão principal.</p>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 sm:flex sm:justify-end"><Button type="button" variant="outline" className="min-h-11" onClick={() => setOpen(false)}>Cancelar</Button><Button type="button" className="h-auto min-h-11 whitespace-normal" disabled={!editable || !count} onClick={confirm}>Adicionar selecionadas</Button></div>
        </div>
      </DialogContent>
    </Dialog>
    {!sources.length ? <p className="mt-2 text-xs text-muted-foreground">Cadastre outro cargo neste concurso para reutilizar suas matérias.</p> : null}
  </div>;
}
