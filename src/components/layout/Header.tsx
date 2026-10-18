import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { UserDropdown } from "@/components/layout/UserDropdown";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminPageLinks, pageBreadcrumb, pageLinks } from "@/lib/navigation";
import { isAdminUser } from "@/lib/authRoles";
import { useAuthStore } from "@/stores/authStore";

export function Header({ onOpenSidebar, mobileSidebarOpen = false }: { onOpenSidebar?: () => void; mobileSidebarOpen?: boolean }) {
  const user = useAuthStore(s => s.user);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchButton = React.useRef<HTMLButtonElement>(null);
  const breadcrumb = pageBreadcrumb(pathname,search);
  const actions = [...pageLinks, ...(isAdminUser(user) ? adminPageLinks : [])];
  const filtered = actions.filter(a => a.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR")));
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); setQuery(""); setOpen(true); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return <header data-app-header className="sticky top-0 z-50 shrink-0 border-b border-border bg-surface">
    <div className="flex h-16 min-w-0 items-center gap-2 px-4 md:gap-4 md:px-6">
      <Button variant="ghost" size="icon" className="h-11 w-11 md:hidden" onClick={onOpenSidebar} aria-label="Abrir menu" aria-controls="app-sidebar" aria-expanded={mobileSidebarOpen}><Menu aria-hidden /></Button>
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1 text-sm">
        <ol className="flex min-w-0 items-center gap-2">
          {breadcrumb.map((item,index)=>{
            const current=index===breadcrumb.length-1;
            const ancestorVisibility=breadcrumb.length>2&&index===0?'hidden xl:flex':'hidden lg:flex';
            return <li key={`${index}-${item.label}`} className={current?'min-w-0 truncate font-semibold':`${ancestorVisibility} min-w-0 items-center gap-2 text-muted-foreground`} aria-current={current?'page':undefined} title={item.label}>
              {item.to&&!current?<Link to={item.to} className="inline-flex min-h-11 min-w-0 items-center rounded hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="truncate">{item.label}</span></Link>:<span className="truncate">{item.label}</span>}
              {!current&&<ChevronRight className="size-4 shrink-0" aria-hidden/>}
            </li>;
          })}
        </ol>
      </nav>
      <Button ref={searchButton} variant="ghost" className="h-11 w-11 min-w-11 shrink-0 px-0 lg:w-60 lg:justify-start lg:bg-muted/50 lg:px-4" onClick={() => { setQuery(""); setOpen(true); }} aria-label="Buscar páginas (Ctrl+K)"><Search aria-hidden /><span className="hidden font-normal text-muted-foreground lg:inline">Buscar páginas…</span><kbd className="ml-auto hidden rounded border border-border px-1 text-xs text-muted-foreground lg:inline">Ctrl K</kbd></Button>
      <Button variant="ghost" size="icon-lg" className="hidden sm:inline-flex" onClick={toggle} aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}>{isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}</Button>
      <NotificationBell />
      <UserDropdown compact />
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent onCloseAutoFocus={event => { event.preventDefault(); searchButton.current?.focus(); }}>
      <DialogHeader><DialogTitle>Buscar páginas</DialogTitle><DialogDescription>Encontre uma área da plataforma pelo nome.</DialogDescription></DialogHeader>
      <Input autoFocus aria-label="Nome da página" placeholder="Cronograma, disciplinas, revisões…" value={query} onChange={e => setQuery(e.target.value)} />
      <div className="max-h-72 space-y-1 overflow-y-auto" aria-label="Resultados de páginas">{filtered.map(a => <Button key={a.to} variant="ghost" className="w-full justify-start" onClick={() => { setOpen(false); navigate(a.to); }}>{a.label}<ChevronRight className="ml-auto" aria-hidden /></Button>)}{!filtered.length && <p role="status" className="p-4 text-sm text-muted-foreground">Nenhuma página encontrada.</p>}</div>
    </DialogContent></Dialog>
  </header>;
}
