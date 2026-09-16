import { CalendarDays, CheckCircle2, Eye } from "lucide-react";

import { CatalogLogo } from "@/components/editais/CatalogLogo";
import type { CatalogViewMode } from "@/components/editais/CatalogViewToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { EditalCatalogo } from "@/types/editaisCatalogo";

type PublicCatalogResultsProps = {
  items: EditalCatalogo[];
  selectedId: string | null;
  viewMode: CatalogViewMode;
  onSelect: (id: string) => void;
  onViewDetails: (id: string, trigger: HTMLButtonElement) => void;
};

export function PublicCatalogResults(props: PublicCatalogResultsProps) {
  if (props.viewMode === "table") {
    return <><CatalogTable {...props} /><CatalogCards {...props} className="lg:hidden" /></>;
  }
  return <CatalogCards {...props} />;
}

function CatalogTable({ items, selectedId, onSelect, onViewDetails }: PublicCatalogResultsProps) {
  return (
    <div className="mt-4 hidden overflow-hidden rounded-xl border border-border lg:block">
      <Table>
        <caption className="sr-only">Editais publicados disponíveis para seleção</caption>
        <TableHeader><TableRow className="bg-muted/30"><TableHead>Edital</TableHead><TableHead>Banca</TableHead><TableHead>Publicação</TableHead><TableHead>Conteúdo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>{items.map((item) => {
          const { cargos, disciplinas } = catalogMetrics(item);
          const selected = selectedId === item.id;
          return <TableRow key={item.id} className={cn(selected && "bg-primary-muted")}>
            <TableCell><div className="flex items-center gap-3"><CatalogLogo src={item.logo_url} orgao={item.orgao} size="sm" /><div><strong className="block max-w-xs whitespace-normal">{item.nome}</strong><span className="text-xs text-muted-foreground">{item.orgao}</span></div></div></TableCell>
            <TableCell className="text-muted-foreground">{item.banca ?? "—"}</TableCell>
            <TableCell><Badge variant="secondary">Publicado</Badge><span className="mt-1 block text-xs text-muted-foreground">Versão {item.versao_atual?.numero ?? "publicada"}{item.versao_atual?.data_prova ? ` · prova ${formatDate(item.versao_atual.data_prova)}` : ""}</span></TableCell>
            <TableCell><strong className="block">{disciplinas} disciplinas</strong><span className="text-xs text-muted-foreground">{cargos} cargo{cargos === 1 ? "" : "s"}</span></TableCell>
            <TableCell><div className="flex justify-end gap-2"><Button type="button" variant="ghost" className="min-h-11" onClick={(event) => onViewDetails(item.id, event.currentTarget)}><Eye className="h-4 w-4" /> Detalhes</Button><Button type="button" variant={selected ? "default" : "outline"} className="min-h-11" aria-pressed={selected} onClick={() => onSelect(item.id)}>{selected ? <><CheckCircle2 className="h-4 w-4" /> Selecionado</> : "Selecionar"}</Button></div></TableCell>
          </TableRow>;
        })}</TableBody>
      </Table>
    </div>
  );
}

function CatalogCards({ items, selectedId, onSelect, onViewDetails, className }: PublicCatalogResultsProps & { className?: string }) {
  return (
    <div className={cn("mt-4 grid gap-3 md:grid-cols-2", className)} role="list">
      {items.map((item) => {
        const { cargos, disciplinas } = catalogMetrics(item);
        const selected = selectedId === item.id;
        return <Card key={item.id} role="listitem" className={cn("group flex min-h-52 flex-col gap-0 p-4 text-left transition", selected ? "border-primary bg-primary-muted ring-1 ring-primary" : "hover:border-primary/50 hover:bg-muted/30")}>
          <div className="flex items-start gap-4"><CatalogLogo src={item.logo_url} orgao={item.orgao} size="lg" /><div className="min-w-0 flex-1"><strong className="block text-base leading-snug">{item.nome}</strong><span className="mt-1 block text-sm text-muted-foreground">{item.orgao}{item.banca ? ` · ${item.banca}` : ""}</span></div>{selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-label="Edital selecionado" /> : null}</div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-3 text-xs text-muted-foreground"><Badge variant="secondary">Publicado</Badge><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Versão {item.versao_atual?.numero ?? "publicada"}</span>{item.versao_atual?.data_prova ? <span>Prova {formatDate(item.versao_atual.data_prova)}</span> : <span>Data da prova não informada</span>}<span>{cargos} cargo{cargos === 1 ? "" : "s"}</span><span>{disciplinas} disciplinas</span></div>
          <div className="mt-auto flex flex-col justify-end gap-2 pt-4 sm:flex-row"><Button type="button" variant="ghost" className="min-h-11" onClick={(event) => onViewDetails(item.id, event.currentTarget)}><Eye className="h-4 w-4" /> Ver detalhes</Button><Button type="button" variant={selected ? "default" : "outline"} className="min-h-11" aria-pressed={selected} onClick={() => onSelect(item.id)}>{selected ? "Selecionado" : "Selecionar edital"}</Button></div>
        </Card>;
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

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}
