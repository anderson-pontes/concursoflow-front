import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BookOpenCheck,
  BrainCircuit,
  Download,
  ExternalLink,
  FileText,
  Gift,
  Layers3,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((item) => (
        <Card key={item} className="min-h-80">
          <CardHeader><Skeleton className="h-24 w-full rounded-xl" /></CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MentalMapPreview({ category }: { category: string }) {
  return (
    <div className="relative h-24 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/10 via-primary/5 to-background" aria-hidden>
      <div className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
        <BrainCircuit className="size-5" />
      </div>
      {["left-5 top-4", "left-7 bottom-3", "right-5 top-4", "right-7 bottom-3"].map((position) => (
        <span key={position} className={cn("absolute size-3 rounded-full border-2 border-primary/40 bg-card", position)} />
      ))}
      <span className="absolute left-[2.7rem] top-[1.7rem] h-px w-[calc(50%-4rem)] rotate-[14deg] bg-primary/30" />
      <span className="absolute bottom-[1.7rem] left-[3.2rem] h-px w-[calc(50%-4.5rem)] -rotate-[12deg] bg-primary/30" />
      <span className="absolute right-[2.7rem] top-[1.7rem] h-px w-[calc(50%-4rem)] -rotate-[14deg] bg-primary/30" />
      <span className="absolute bottom-[1.7rem] right-[3.2rem] h-px w-[calc(50%-4.5rem)] rotate-[12deg] bg-primary/30" />
      <span className="absolute bottom-2 left-2 rounded-md bg-background/85 px-2 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur">{category}</span>
    </div>
  );
}

function MentalMapCard({
  item,
  busyAction,
  onAccess,
}: {
  item: MentalMap;
  busyAction: string | null;
  onAccess: (item: MentalMap, download: boolean) => void;
}) {
  const viewing = busyAction === `${item.slug}:view`;
  const downloading = busyAction === `${item.slug}:download`;
  const extraTopics = Math.max(0, item.topics.length - 3);

  return (
    <article className="h-full">
      <Card className={cn("group h-full gap-0 py-0 transition duration-200", item.available ? "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md" : "bg-muted/20")}>
        <CardHeader className="block p-4 pb-0">
          <MentalMapPreview category={item.category} />
          <div className="mt-4 flex items-center justify-between gap-2">
            <Badge variant="secondary" className="max-w-[70%] truncate">{item.category}</Badge>
            {item.featured ? <Badge className="bg-warning text-warning-foreground hover:bg-warning"><Sparkles />Destaque</Badge> : !item.available ? <Badge variant="outline">Em breve</Badge> : null}
          </div>
          <CardTitle className="mt-3 text-lg font-bold tracking-tight text-foreground">{item.title}</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col px-4 pb-4 pt-2">
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

          {item.topics.length ? (
            <ul className="mt-4 flex list-none flex-wrap gap-1.5" aria-label="Assuntos abordados">
              {item.topics.slice(0, 3).map((topic) => <li key={topic}><Badge variant="outline" className="font-medium text-muted-foreground">{topic}</Badge></li>)}
              {extraTopics > 0 ? <li><Badge variant="outline" className="font-medium text-primary">+{extraTopics}</Badge></li> : null}
            </ul>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-5 text-xs text-muted-foreground">
            {item.page_count ? <span className="inline-flex items-center gap-1"><FileText className="size-3.5" aria-hidden />{item.page_count} páginas</span> : null}
            {item.updated_at ? <span>Atualizado em {format(parseISO(item.updated_at), "MMM 'de' yyyy", { locale: ptBR })}</span> : null}
          </div>
        </CardContent>

        <CardFooter className="grid grid-cols-2 gap-2 bg-muted/30 p-4">
          <Button type="button" variant="outline" className="min-h-10" disabled={!item.available || Boolean(busyAction)} onClick={() => onAccess(item, false)}>
            <ExternalLink />{viewing ? "Abrindo…" : "Visualizar"}
          </Button>
          <Button type="button" className="min-h-10" disabled={!item.available || Boolean(busyAction)} onClick={() => onAccess(item, true)}>
            <Download />{downloading ? "Baixando…" : "Baixar PDF"}
          </Button>
        </CardFooter>
      </Card>
    </article>
  );
}

export function MentalMaps() {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("Todos");
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
    <div className="mx-auto w-full max-w-7xl pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-violet-700 to-indigo-900 px-5 py-8 text-primary-foreground shadow-lg sm:px-8 md:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
            <Gift className="h-3.5 w-3.5" aria-hidden /> Bônus da sua assinatura ClickEdital
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Mapas Mentais de TI</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-violet-100 sm:text-base">
            Revise conteúdos extensos de forma visual, conecte conceitos e encontre mais rápido os assuntos que aparecem nas provas.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-violet-100">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" aria-hidden /> Acesso seguro para assinantes</span>
            <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4" aria-hidden /> PDFs em alta resolução</span>
            {catalog.data?.total ? <span className="inline-flex items-center gap-1.5"><Layers3 className="h-4 w-4" aria-hidden /> {catalog.data.total} {catalog.data.total === 1 ? "mapa disponível" : "mapas disponíveis"}</span> : null}
          </div>
          </div>
          <div className="relative hidden h-44 rounded-2xl border border-white/15 bg-white/10 p-5 shadow-inner backdrop-blur-sm lg:block" aria-hidden>
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

      <section className="mt-8" aria-labelledby="biblioteca-heading">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Sua biblioteca</p>
            <h2 id="biblioteca-heading" className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Escolha um assunto para revisar
            </h2>
          </div>
          <label className="relative block w-full lg:max-w-md">
            <span className="sr-only">Buscar mapas mentais</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por assunto…"
              className="min-h-11 bg-card pl-10 pr-11"
            />
            {search ? <Button type="button" variant="ghost" size="icon" className="absolute right-0.5 top-0.5 size-10" onClick={() => setSearch("")} aria-label="Limpar busca"><X /></Button> : null}
          </label>
        </div>

        {categories.length > 1 ? (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filtrar por categoria">
            {categories.map((item) => (
              <Button
                key={item}
                type="button"
                variant={category === item ? "default" : "outline"}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className="min-h-10 shrink-0 rounded-full px-4 text-xs"
              >
                {item}
              </Button>
            ))}
          </div>
        ) : null}

        {!catalog.isLoading && !catalog.isError && catalog.data?.total ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <strong className="font-semibold text-foreground">{filtered.length}</strong> {filtered.length === 1 ? "mapa encontrado" : "mapas encontrados"}
            </p>
            {hasFilters ? <Button type="button" variant="ghost" size="sm" onClick={clearFilters}><X />Limpar filtros</Button> : null}
          </div>
        ) : null}

        <div className="mt-6" aria-live="polite">
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <MentalMapCard key={item.slug} item={item} busyAction={busyAction} onAccess={handleAccess} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
