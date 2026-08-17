import { CalendarDays, CheckCircle2, Eye } from "lucide-react";

import { CatalogLogo } from "@/components/editais/CatalogLogo";
import type { CatalogViewMode } from "@/components/editais/CatalogViewToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditalCatalogo } from "@/types/editaisCatalogo";

type PublicCatalogResultsProps = {
  items: EditalCatalogo[];
  selectedId: string | null;
  viewMode: CatalogViewMode;
  onSelect: (id: string) => void;
  onViewDetails: (id: string) => void;
};

export function PublicCatalogResults({ items, selectedId, viewMode, onSelect, onViewDetails }: PublicCatalogResultsProps) {
  if (viewMode === "table") {
    return (
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-4">Edital</th>
              <th className="p-4">Banca</th>
              <th className="p-4">Versão</th>
              <th className="p-4">Conteúdo</th>
              <th className="p-4 text-right">Seleção</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const { cargos, disciplinas } = catalogMetrics(item);
              const selected = selectedId === item.id;
              return (
                <tr key={item.id} className={cn("border-b border-border/70 last:border-0", selected && "bg-primary-muted")}>
                  <td className="p-4"><div className="flex items-center gap-3"><CatalogLogo src={item.logo_url} orgao={item.orgao} size="sm" /><div><strong className="block max-w-xs truncate">{item.nome}</strong><span className="text-xs text-muted-foreground">{item.orgao}</span></div></div></td>
                  <td className="p-4 text-muted-foreground">{item.banca ?? "—"}</td>
                  <td className="p-4">{item.versao_atual?.numero ?? "Publicada"}</td>
                  <td className="p-4"><strong className="block">{disciplinas} disciplinas</strong><span className="text-xs text-muted-foreground">{cargos} cargo{cargos === 1 ? "" : "s"}</span></td>
                  <td className="p-4"><div className="flex justify-end gap-2"><Button type="button" variant="ghost" className="min-h-10" onClick={() => onViewDetails(item.id)}><Eye className="h-4 w-4" /> Detalhes</Button><Button type="button" variant={selected ? "default" : "outline"} className="min-h-10" aria-pressed={selected} onClick={() => onSelect(item.id)}>{selected ? <><CheckCircle2 className="h-4 w-4" /> Selecionado</> : "Selecionar"}</Button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {items.map((item) => {
        const { cargos, disciplinas } = catalogMetrics(item);
        const selected = selectedId === item.id;
        return (
          <article key={item.id} className={cn("group flex min-h-52 flex-col rounded-xl border p-4 text-left transition", selected ? "border-primary bg-primary-muted ring-1 ring-primary" : "border-border hover:border-primary/50 hover:bg-muted/30")}>
            <div className="flex items-start gap-4"><CatalogLogo src={item.logo_url} orgao={item.orgao} size="lg" /><div className="min-w-0 flex-1"><strong className="block text-base leading-snug">{item.nome}</strong><span className="mt-1 block text-sm text-muted-foreground">{item.orgao}{item.banca ? ` · ${item.banca}` : ""}</span></div>{selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-label="Edital selecionado" /> : null}</div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/70 pt-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Versão {item.versao_atual?.numero ?? "publicada"}</span><span>{cargos} cargo{cargos === 1 ? "" : "s"}</span><span>{disciplinas} disciplinas</span></div>
            <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4"><Button type="button" variant="ghost" className="min-h-10" onClick={() => onViewDetails(item.id)}><Eye className="h-4 w-4" /> Ver detalhes</Button><Button type="button" variant={selected ? "default" : "outline"} className="min-h-10" aria-pressed={selected} onClick={() => onSelect(item.id)}>{selected ? "Selecionado" : "Selecionar edital"}</Button></div>
          </article>
        );
      })}
    </div>
  );
}

function catalogMetrics(item: EditalCatalogo) {
  return {
    cargos: item.versao_atual?.cargos.length ?? 0,
    disciplinas: item.versao_atual?.cargos.reduce((sum, cargo) => sum + cargo.disciplinas.length, 0) ?? 0,
  };
}
