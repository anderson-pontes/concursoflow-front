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
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

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
        <div key={item} className="h-72 animate-pulse rounded-2xl border border-border bg-card p-5">
          <div className="h-11 w-11 rounded-xl bg-muted" />
          <div className="mt-5 h-4 w-2/3 rounded bg-muted" />
          <div className="mt-3 h-3 w-full rounded bg-muted" />
          <div className="mt-2 h-3 w-4/5 rounded bg-muted" />
        </div>
      ))}
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

  return (
    <article
      className={cn(
        "group flex min-h-72 flex-col rounded-2xl border bg-card p-5 shadow-sm transition duration-200",
        item.available ? "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md" : "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-muted text-primary">
          <BrainCircuit className="h-5 w-5" aria-hidden />
        </span>
        {item.featured ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
            <Sparkles className="h-3 w-3" aria-hidden /> Destaque
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-primary">{item.category}</p>
      <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">{item.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

      {item.topics.length ? (
        <ul className="mt-4 flex list-none flex-wrap gap-1.5" aria-label="Assuntos abordados">
          {item.topics.slice(0, 4).map((topic) => (
            <li key={topic} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {topic}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-5 text-xs text-muted-foreground">
        {item.page_count ? <span>{item.page_count} páginas</span> : null}
        {item.updated_at ? (
          <span>Atualizado em {format(parseISO(item.updated_at), "MMM 'de' yyyy", { locale: ptBR })}</span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
        <button
          type="button"
          disabled={!item.available || Boolean(busyAction)}
          onClick={() => onAccess(item, false)}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none transition hover:border-primary/30 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden /> {viewing ? "Abrindo…" : "Visualizar"}
        </button>
        <button
          type="button"
          disabled={!item.available || Boolean(busyAction)}
          onClick={() => onAccess(item, true)}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground outline-none transition hover:bg-primary-500 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" aria-hidden /> {downloading ? "Baixando…" : "Baixar PDF"}
        </button>
      </div>
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
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
            <Gift className="h-3.5 w-3.5" aria-hidden /> Bônus da sua assinatura ClickEdital
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Mapas Mentais de TI</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-violet-100 sm:text-base">
            Revise conteúdos extensos de forma visual, conecte conceitos e encontre mais rápido os assuntos que aparecem nas provas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium text-violet-100">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" aria-hidden /> Acesso exclusivo para assinantes</span>
            <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4" aria-hidden /> PDFs em alta resolução</span>
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
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Buscar mapas mentais</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por assunto…"
              className="min-h-11 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>

        {categories.length > 1 ? (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar por categoria">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={cn(
                  "min-h-9 shrink-0 rounded-full border px-4 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                  category === item
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6" aria-live="polite">
          {catalog.isLoading ? <MentalMapSkeleton /> : null}
          {catalog.isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-card p-8 text-center">
              <p className="font-semibold text-foreground">Não foi possível carregar a biblioteca.</p>
              <p className="mt-2 text-sm text-muted-foreground">Tente novamente em alguns instantes.</p>
              <button type="button" onClick={() => void catalog.refetch()} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Tentar novamente
              </button>
            </div>
          ) : null}
          {!catalog.isLoading && !catalog.isError && catalog.data?.total === 0 ? (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary-muted/50 p-10 text-center">
              <BookOpenCheck className="mx-auto h-10 w-10 text-primary" aria-hidden />
              <p className="mt-4 font-semibold text-foreground">A biblioteca está sendo preparada.</p>
              <p className="mt-2 text-sm text-muted-foreground">Os primeiros mapas aparecerão aqui assim que forem publicados.</p>
            </div>
          ) : null}
          {!catalog.isLoading && !catalog.isError && catalog.data?.total !== 0 && filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhum mapa encontrado com esses filtros.
            </div>
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
