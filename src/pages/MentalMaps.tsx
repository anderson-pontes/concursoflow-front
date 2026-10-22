import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenCheck,
  BrainCircuit,
  FileText,
  Gift,
  Layers3,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MentalMapCard } from "@/components/mentalMaps/MentalMapCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listMentalMaps,
  requestMentalMapAccess,
  type MentalMap,
} from "@/services/mentalMaps";

function mapErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { detail?: unknown } } }).response;
    if (typeof response?.data?.detail === "string") return response.data.detail;
  }
  return "Não foi possível acessar este mapa agora.";
}

function MentalMapSkeleton() {
  return (
    <div role="status" aria-label="Carregando biblioteca">
    <span className="sr-only">Carregando biblioteca…</span>
    <div className="mental-maps-grid" aria-hidden>
      {[0, 1, 2].map((item) => (
        <Card key={item} className="gap-0 overflow-hidden py-0">
          <Skeleton className="h-28 w-full rounded-none sm:h-32" />
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <div className="grid grid-cols-2 gap-2 pt-3"><Skeleton className="h-11" /><Skeleton className="h-11" /></div>
          </CardContent>
        </Card>
      ))}
    </div>
    </div>
  );
}

export function MentalMaps() {
  const PAGE_SIZE = 6;
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("Todos");
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [busyAction, setBusyAction] = React.useState<string | null>(null);
  const catalog = useQuery({ queryKey: ["mental-maps"], queryFn: listMentalMaps });

  const categories = React.useMemo(
    () => ["Todos", ...Array.from(new Set((catalog.data?.items ?? []).map((item) => item.category)))],
    [catalog.data?.items],
  );
  const filtered = React.useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (catalog.data?.items ?? []).filter((item) => {
      const matchesCategory = category === "Todos" || item.category === category;
      const haystack = [item.title, item.category, item.description, ...item.topics]
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return matchesCategory && (!term || haystack.includes(term));
    });
  }, [catalog.data?.items, category, search]);
  const hasFilters = Boolean(search.trim()) || category !== "Todos";
  const visibleMaps = filtered.slice(0, visibleCount);

  const clearFilters = () => {
    setSearch("");
    setCategory("Todos");
  };

  const handleAccess = async (item: MentalMap, download: boolean) => {
    const popup = !download ? window.open("", "_blank") : null;
    if (popup) {
      popup.document.title = "Abrindo mapa mental…";
      popup.document.body.textContent = "Preparando seu mapa mental…";
      popup.opener = null;
    }
    setBusyAction(`${item.slug}:${download ? "download" : "view"}`);
    try {
      const access = await requestMentalMapAccess(item.slug, download);
      if (popup) popup.location.replace(access.url);
      else {
        const link = document.createElement("a");
        link.href = access.url;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      popup?.close();
      toast.error(mapErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="mental-maps-library w-full min-w-0 space-y-5 pb-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mapas Mentais</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">Revise conteúdos de forma visual e fortaleça sua preparação.</p>
      </header>
      <section className="mental-maps-hero relative overflow-hidden rounded-xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="max-w-3xl">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-foreground/90">
            <Gift className="h-3.5 w-3.5" aria-hidden /> Incluído no seu acesso
          </p>
          <h2 className="mt-1 text-lg font-semibold leading-snug tracking-tight sm:text-xl">Aprenda visualmente. Revise com eficiência.</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-primary-foreground/90">
            <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4" aria-hidden /> PDFs em alta resolução</span>
            {catalog.data?.total ? <span className="inline-flex items-center gap-1.5"><Layers3 className="h-4 w-4" aria-hidden /> {catalog.data.total} {catalog.data.total === 1 ? "mapa disponível" : "mapas disponíveis"}</span> : null}
          </div>
          </div>
          <div className="relative hidden h-24 rounded-xl border border-white/15 bg-white/10 lg:block" aria-hidden>
            <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white text-primary shadow-xl"><BrainCircuit className="size-7" /></span>
            <span className="absolute left-6 top-6 size-5 rounded-full border-4 border-white/60" />
            <span className="absolute bottom-7 left-10 size-4 rounded-full bg-warning" />
            <span className="absolute right-7 top-7 size-4 rounded-full bg-white/80" />
            <span className="absolute bottom-6 right-10 size-5 rounded-full border-4 border-white/50" />
            <span className="absolute left-11 top-10 h-px w-20 rotate-[24deg] bg-white/35" />
            <span className="absolute bottom-11 left-14 h-px w-16 -rotate-[20deg] bg-white/35" />
            <span className="absolute right-12 top-11 h-px w-16 -rotate-[24deg] bg-white/35" />
            <span className="absolute bottom-11 right-14 h-px w-16 rotate-[20deg] bg-white/35" />
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="biblioteca-heading">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Sua biblioteca</p>
            <h2 id="biblioteca-heading" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              Escolha um assunto para revisar
            </h2>
          </div>
          <label className="relative block w-full lg:max-w-md">
            <span className="sr-only">Buscar mapas mentais</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setVisibleCount(PAGE_SIZE); }}
              placeholder="Buscar por assunto…"
              className="min-h-11 bg-card pl-10 pr-11"
            />
            {search ? <Button type="button" variant="ghost" size="icon" className="absolute right-0.5 top-0.5 size-10" onClick={() => setSearch("")} aria-label="Limpar busca"><X /></Button> : null}
          </label>
        </div>

        <div className="mental-maps-controls">
        {categories.length > 1 ? (
          <>
          <div className="mental-maps-mobile-filter">
            <Select value={category} onValueChange={(value) => { setCategory(value); setVisibleCount(PAGE_SIZE); }}>
              <SelectTrigger aria-label="Filtrar por categoria" className="bg-card [&>span]:min-w-0 [&>span]:truncate"><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map(item => <SelectItem key={item} value={item}>{item === "Todos" ? "Todas as categorias" : item}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="mental-maps-desktop-filters" role="group" aria-label="Filtrar por categoria">
            {categories.map((item) => (
              <Button
                key={item}
                type="button"
                variant={category === item ? "default" : "outline"}
                onClick={() => { setCategory(item); setVisibleCount(PAGE_SIZE); }}
                aria-pressed={category === item}
                className="min-h-11 max-w-full whitespace-normal rounded-lg px-4 text-xs [overflow-wrap:anywhere]"
              >
                {item}
              </Button>
            ))}
          </div>
          </>
        ) : null}

        {!catalog.isLoading && !catalog.isError && catalog.data?.total ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <strong className="font-semibold text-foreground">{filtered.length}</strong> {filtered.length === 1 ? "mapa encontrado" : "mapas encontrados"}
            </p>
            {hasFilters ? <Button type="button" variant="ghost" size="sm" onClick={clearFilters}><X />Limpar filtros</Button> : null}
          </div>
        ) : null}
        </div>

        <div aria-live="polite">
          {catalog.isLoading ? <MentalMapSkeleton /> : null}
          {catalog.isError ? (
            <EmptyState icon={RefreshCw} title="Não foi possível carregar a biblioteca" description="Verifique sua conexão e tente novamente em alguns instantes." action={<Button type="button" onClick={() => void catalog.refetch()}><RefreshCw />Tentar novamente</Button>} />
          ) : null}
          {!catalog.isLoading && !catalog.isError && catalog.data?.total === 0 ? (
            <EmptyState icon={BookOpenCheck} title="A biblioteca está sendo preparada" description="Os primeiros mapas aparecerão aqui assim que forem publicados." />
          ) : null}
          {!catalog.isLoading && !catalog.isError && catalog.data?.total !== 0 && filtered.length === 0 ? (
            <EmptyState icon={Search} title="Nenhum mapa encontrado" description="Tente outro termo ou remova os filtros para ver toda a biblioteca." action={<Button type="button" variant="outline" onClick={clearFilters}><X />Limpar filtros</Button>} />
          ) : null}
          {filtered.length ? (
            <div className="mental-maps-grid">
              {visibleMaps.map((item) => (
                <MentalMapCard key={item.slug} item={item} busyAction={busyAction} onAccess={handleAccess} />
              ))}
            </div>
          ) : null}
          {visibleCount < filtered.length ? (
            <div className="mt-6 flex justify-center">
              <Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                Mostrar mais mapas ({filtered.length - visibleCount})
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
