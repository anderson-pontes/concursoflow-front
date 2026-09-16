import * as React from "react";
import { BookOpenCheck, Search, X } from "lucide-react";
import { Link } from "react-router-dom";

import { CatalogDetailsDialog } from "@/components/editais/CatalogDetailsDialog";
import { CatalogLogo } from "@/components/editais/CatalogLogo";
import { CatalogPagination } from "@/components/editais/CatalogPagination";
import { PublicCatalogResults } from "@/components/editais/PublicCatalogResults";
import { CatalogViewToggle, type CatalogViewMode } from "@/components/editais/CatalogViewToggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogDiscovery } from "@/hooks/useCatalogDiscovery";
import type { EditalCatalogo } from "@/types/editaisCatalogo";

type CatalogDiscoveryProps = {
  selectedId: string | null;
  selectedEdital?: EditalCatalogo | null;
  onSelect: (id: string) => void;
  onSelectionInvalidated: () => void;
  onItemOpened?: (id: string) => void;
  onSearchResult?: (total: number) => void;
  onAppliedSearchChange?: (search: string) => void;
  selectionAlert?: string | null;
};

export function CatalogDiscovery({
  selectedId,
  selectedEdital,
  onSelect,
  onSelectionInvalidated,
  onItemOpened,
  onSearchResult,
  onAppliedSearchChange,
  selectionAlert,
}: CatalogDiscoveryProps) {
  const discovery = useCatalogDiscovery(onSelectionInvalidated);
  const [viewMode, setViewMode] = React.useState<CatalogViewMode>("cards");
  const [detailsId, setDetailsId] = React.useState<string | null>(null);
  const resultsRef = React.useRef<HTMLHeadingElement>(null);
  const previousPage = React.useRef(discovery.query.page);
  const trackedSearch = React.useRef("");
  const detailsTrigger = React.useRef<HTMLButtonElement | null>(null);
  const data = discovery.result.data;

  React.useEffect(() => {
    onAppliedSearchChange?.(discovery.query.search);
  }, [discovery.query.search, onAppliedSearchChange]);

  React.useEffect(() => {
    if (!data || !discovery.query.search || trackedSearch.current === discovery.query.search) return;
    trackedSearch.current = discovery.query.search;
    onSearchResult?.(data.total);
  }, [data, discovery.query.search, onSearchResult]);

  React.useEffect(() => {
    if (!data || previousPage.current === discovery.query.page) return;
    previousPage.current = discovery.query.page;
    resultsRef.current?.focus();
  }, [data, discovery.query.page]);

  const openDetails = (id: string, trigger: HTMLButtonElement) => {
    onItemOpened?.(id);
    detailsTrigger.current = trigger;
    setDetailsId(id);
  };
  const returnDetailsFocus = () => {
    const trigger = detailsTrigger.current;
    window.setTimeout(() => {
      if (trigger && document.contains(trigger)) trigger.focus();
      else resultsRef.current?.focus();
    }, 0);
  };
  const select = (id: string) => {
    onItemOpened?.(id);
    onSelect(id);
  };
  const first = data?.total ? (data.page - 1) * data.page_size + 1 : 0;
  const last = data ? Math.min(data.page * data.page_size, data.total) : 0;

  return (
    <section aria-labelledby="catalog-results-title">
      <form
        className="mt-5 flex flex-col gap-2 sm:flex-row"
        role="search"
        onSubmit={(event) => { event.preventDefault(); discovery.applySearch(); }}
      >
        <label className="relative flex-1">
          <span className="sr-only">Buscar edital</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={discovery.draftSearch}
            maxLength={200}
            onChange={(event) => discovery.setDraftSearch(event.target.value)}
            placeholder="Concurso, órgão, banca ou cargo"
            className="min-h-11 pl-9"
          />
        </label>
        <Button type="submit" className="min-h-11 sm:min-w-28">Buscar</Button>
      </form>

      {discovery.query.search ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="min-h-9 max-w-full gap-2 px-3">
            <span className="truncate">Busca: {discovery.query.search}</span>
            <button type="button" onClick={discovery.clearSearch} className="rounded-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Remover busca">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </Badge>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <h3 id="catalog-results-title" ref={resultsRef} tabIndex={-1} className="text-sm font-semibold outline-none">
          Resultados do catálogo{data ? ` — ${data.total} ${data.total === 1 ? "edital" : "editais"}` : ""}
        </h3>
        <CatalogViewToggle value={viewMode} onValueChange={setViewMode} className="hidden lg:inline-flex" />
      </div>
      {data?.total ? <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">Exibindo {first}–{last} de {data.total} {data.total === 1 ? "edital" : "editais"}</p> : null}

      {selectedId && selectedEdital ? (
        <div data-catalog-selection-summary className="mt-4 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary-muted p-4 sm:flex-row sm:items-center">
          <CatalogLogo src={selectedEdital.logo_url} orgao={selectedEdital.orgao} size="sm" />
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">Seleção atual</span>
            <strong className="mt-1 block">{selectedEdital.nome}</strong>
            <span className="text-sm text-muted-foreground">{selectedEdital.orgao} · Versão {selectedEdital.versao_atual?.numero ?? "publicada"}</span>
          </div>
          <Button type="button" variant="outline" className="min-h-11" onClick={onSelectionInvalidated}>Remover seleção</Button>
        </div>
      ) : null}

      {selectionAlert ? (
        <Alert variant="destructive" className="mt-4" role="alert">
          <AlertTitle>Seleção indisponível</AlertTitle>
          <AlertDescription>{selectionAlert}</AlertDescription>
        </Alert>
      ) : null}

      {discovery.result.isPending ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2" role="status" aria-label="Carregando catálogo">
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-52 rounded-xl" />)}
        </div>
      ) : null}

      {discovery.result.isError ? (
        <Alert variant="destructive" className="mt-4">
          <Search aria-hidden />
          <AlertTitle>Não foi possível carregar os editais</AlertTitle>
          <AlertDescription><Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => void discovery.result.refetch()}>Tentar novamente</Button></AlertDescription>
        </Alert>
      ) : null}

      {data?.items.length ? (
        <PublicCatalogResults items={data.items} selectedId={selectedId} viewMode={viewMode} onSelect={select} onViewDetails={openDetails} />
      ) : null}

      {data && !data.items.length && !discovery.result.isError ? (
        <div className="py-12 text-center">
          <BookOpenCheck className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
          <h3 className="mt-3 font-semibold">{discovery.query.search ? `Nenhum edital encontrado para “${discovery.query.search}”.` : "O catálogo ainda não possui editais publicados."}</h3>
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            {discovery.query.search ? <Button type="button" onClick={discovery.clearSearch}>Limpar busca</Button> : null}
            <Button asChild variant="outline"><Link to="/concursos?novo=manual">Cadastrar concurso manualmente</Link></Button>
          </div>
        </div>
      ) : null}

      {data?.items.length ? (
        <div className="mt-5"><CatalogPagination page={data.page} totalPages={data.total_pages} total={data.total} onPageChange={discovery.setPage} /></div>
      ) : null}

      <CatalogDetailsDialog editalId={detailsId} scope="public" open={Boolean(detailsId)} onOpenChange={(open) => { if (!open) setDetailsId(null); }} onReturnFocus={returnDetailsFocus} />
    </section>
  );
}
