import React from "react";
import { createPortal } from "react-dom";
import { NavLink, matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  History,
  Layers,
  LayoutDashboard,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Sun,
  Timer,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AprovingoLogo } from "@/components/branding/AprovingoLogo";
import { ConcursoSwitcher } from "@/components/concursos/ConcursoSwitcher";
import { resolvePublicUrl } from "@/lib/publicUrl";
import { primeiroNome } from "@/lib/userDisplay";
import { cn } from "@/lib/utils";
import { isAdminUser } from "@/lib/authRoles";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";

const navSections = [
  {
    label: "PRINCIPAL",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/concursos", label: "Meus Concursos", icon: Trophy, end: true },
      { to: "/disciplinas", label: "Disciplinas", icon: BookOpen },
      { to: "/cronograma", label: "Cronograma", icon: CalendarDays },
    ],
  },
  {
    label: "ESTUDO",
    items: [
      { to: "/pomodoro", label: "Pomodoro", icon: Timer },
      { to: "/estudos/calendario", label: "Calendário", icon: CalendarDays },
      { to: "/estudos/historico", label: "Histórico", icon: History },
      { to: "/flashcards", label: "Flashcards", icon: Layers },
    ],
  },
  {
    label: "OUTROS",
    items: [
      { to: "/avisos", label: "Avisos", icon: Bell },
      { to: "/configuracoes/estudos", label: "Config. Estudos", icon: Settings2 },
    ],
  },
];

type NavSection = {
  label: string;
  items: { to: string; label: string; icon: LucideIcon; end?: boolean }[];
};

type NavItemDef = NavSection["items"][number];

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function initialsFromName(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

type SidebarTooltipProps = {
  text: string;
  anchorTop: number;
  visible: boolean;
};

function SidebarTooltip({ text, anchorTop, visible }: SidebarTooltipProps) {
  if (!visible) return null;
  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] max-w-[240px] rounded-lg bg-[var(--tooltip-bg)] px-3 py-1.5 text-[13px] font-semibold text-[var(--tooltip-fg)] shadow-lg"
      style={{
        left: 80,
        top: anchorTop,
        transform: "translateY(-50%)",
        animation: "sidebar-tooltip-in 100ms ease forwards",
      }}
      role="tooltip"
    >
      <span
        className="absolute left-0 top-1/2 h-0 w-0 -translate-x-full -translate-y-1/2 border-y-[6px] border-r-8 border-y-transparent border-r-[var(--tooltip-bg)]"
        aria-hidden
      />
      {text}
    </div>,
    document.body,
  );
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
  collapsed,
  onCollapsedChange,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const asideRef = React.useRef<HTMLElement>(null);

  const { isDark, toggle: toggleTheme } = useTheme();
  const [tooltip, setTooltip] = React.useState<{ text: string; top: number } | null>(null);

  const showLabels = !collapsed || Boolean(mobileOpen);
  const desktopCollapsed = collapsed && !mobileOpen;

  const nomeCurto = primeiroNome(user?.name, "Concurseiro");
  const avatarSrc = resolvePublicUrl(user?.avatar_url ?? null);

  const sections = React.useMemo((): NavSection[] => {
    const base: NavSection[] = navSections.map((s) => ({
      label: s.label,
      items: s.items.map((i) => ({ ...i })),
    }));
    if (isAdminUser(user)) {
      base.push({
        label: "ADMINISTRAÇÃO",
        items: [{ to: "/admin/usuarios", label: "Gestão de Usuários", icon: Users }],
      });
    }
    return base;
  }, [user]);

  React.useEffect(() => {
    if (!mobileOpen || !asideRef.current) return;

    const aside = asideRef.current;
    const focusables = Array.from(aside.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onMobileClose?.();
        return;
      }
      if (e.key !== "Tab" || focusables.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px] transition-opacity md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
        onClick={onMobileClose}
      />

      <aside
        ref={asideRef}
        id="app-sidebar"
        aria-hidden={!mobileOpen ? undefined : false}
        className={cn(
          "fixed left-0 top-0 z-[100] flex h-[100dvh] flex-col overflow-hidden border-r border-[var(--sidebar-ap-border)] bg-sidebar font-sans shadow-[var(--sidebar-ap-shadow)] transition-[width,transform] duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
          mobileOpen ? "w-[min(280px,100vw)] translate-x-0" : "w-[260px] -translate-x-full md:translate-x-0",
          desktopCollapsed ? "md:w-[72px]" : "md:w-[260px]",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-[var(--sidebar-ap-header-border)] px-3 transition-all duration-200 sm:px-4",
            desktopCollapsed && !mobileOpen ? "justify-center" : "justify-between gap-2",
          )}
        >
          {(!desktopCollapsed || mobileOpen) && (
            <AprovingoLogo fetchPriority="high" className="h-8 max-h-8 w-auto max-w-[min(100%,180px)] shrink-0 object-contain object-left" />
          )}

          <button
            type="button"
            aria-label={desktopCollapsed && !mobileOpen ? "Expandir menu" : "Recolher menu"}
            className="hidden min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-primary md:inline-flex"
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {desktopCollapsed && !mobileOpen ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>

        <ConcursoSwitcher collapsed={desktopCollapsed} onAfterPick={onMobileClose} mobileOpen={mobileOpen} />

        <nav
          className="sidebar-nav-scroll flex flex-1 flex-col overflow-y-auto overflow-x-hidden py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Navegação principal"
          onScroll={() => setTooltip(null)}
        >
          {sections.map((section) => (
            <div key={section.label}>
              {showLabels ? (
                <div className="px-4 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--group-label)]">
                  {section.label}
                </div>
              ) : null}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarNavRow
                    key={item.to}
                    item={item}
                    collapsed={desktopCollapsed}
                    showLabels={showLabels}
                    onMobileClose={onMobileClose}
                    onEnterTooltip={(el, text) => {
                      if (!desktopCollapsed) return;
                      const r = el.getBoundingClientRect();
                      setTooltip({ text, top: r.top + r.height / 2 });
                    }}
                    onLeaveTooltip={() => setTooltip(null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <SidebarTooltip
          text={tooltip?.text ?? ""}
          anchorTop={tooltip?.top ?? 0}
          visible={Boolean(tooltip && desktopCollapsed)}
        />

        <footer className="shrink-0 border-t border-[var(--footer-border)] px-2 py-3">
          {desktopCollapsed ? (
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-center rounded-lg text-primary transition-colors hover:bg-surface-hover"
              title={isDark ? "Modo claro" : "Modo escuro"}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
            </button>
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              className="mx-2 mb-1 flex min-h-11 w-[calc(100%-16px)] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-[var(--nav-text)] transition-colors hover:bg-surface-hover hover:text-primary"
              onClick={toggleTheme}
            >
              {isDark ? (
                <Sun className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              ) : (
                <Moon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              )}
              <span className="min-w-0 flex-1 text-sm font-medium">{isDark ? "Modo claro" : "Modo escuro"}</span>
              <span
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  isDark ? "bg-primary" : "bg-muted-foreground/30",
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    isDark ? "translate-x-[18px]" : "translate-x-0.5",
                  )}
                />
              </span>
            </button>
          )}

          {user ? (
            <SidebarProfileRow
              collapsed={desktopCollapsed}
              nomeCurto={nomeCurto}
              fullName={user.name}
              email={user.email}
              avatarSrc={avatarSrc}
              onOpen={() => {
                navigate("/perfil");
                onMobileClose?.();
              }}
              onEnterTooltip={(el) => {
                if (!desktopCollapsed) return;
                const r = el.getBoundingClientRect();
                setTooltip({ text: `${nomeCurto} · Ver perfil`, top: r.top + r.height / 2 });
              }}
              onLeaveTooltip={() => setTooltip(null)}
            />
          ) : null}
        </footer>
      </aside>
    </>
  );
}

function SidebarNavRow({
  item,
  collapsed,
  showLabels,
  onMobileClose,
  onEnterTooltip,
  onLeaveTooltip,
}: {
  item: NavItemDef;
  collapsed: boolean;
  showLabels: boolean;
  onMobileClose?: () => void;
  onEnterTooltip: (el: HTMLElement, text: string) => void;
  onLeaveTooltip: () => void;
}) {
  const location = useLocation();
  const Icon = item.icon;
  const end = "end" in item ? item.end : false;
  const isActive = Boolean(matchPath({ path: item.to, end: Boolean(end) }, location.pathname));

  return (
    <NavLink
      to={item.to}
      end={Boolean(end)}
      onClick={() => onMobileClose?.()}
      title={collapsed ? item.label : undefined}
      onMouseEnter={(e) => onEnterTooltip(e.currentTarget, item.label)}
      onMouseLeave={onLeaveTooltip}
      className={cn(
        "group relative mx-2 flex min-h-11 cursor-pointer select-none items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        "text-[var(--nav-text)]",
        !isActive && "hover:bg-surface-hover hover:text-primary",
        isActive && [
          "border border-[var(--nav-border-active)] font-semibold text-[var(--nav-text-active)] shadow-[var(--nav-active-shadow)]",
          "[background-image:var(--nav-bg-active)]",
        ],
      )}
    >
      {isActive ? (
        <span
          className="absolute left-0 top-[20%] h-[60%] w-[3px] rounded-r-sm bg-primary [transform-origin:center] [animation:sidebar-nav-bar-in_0.15s_ease_forwards]"
          aria-hidden
        />
      ) : null}
      <Icon className="relative z-[1] h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
      {showLabels ? (
        <span
          className={cn(
            "relative z-[1] min-w-0 flex-1 truncate text-sm transition-[opacity,max-width] duration-200",
            collapsed ? "pointer-events-none max-w-0 opacity-0" : "max-w-[1000px] opacity-100",
          )}
        >
          {item.label}
        </span>
      ) : (
        <span className="sr-only">{item.label}</span>
      )}
    </NavLink>
  );
}

function SidebarProfileRow({
  collapsed,
  nomeCurto,
  fullName,
  email,
  avatarSrc,
  onOpen,
  onEnterTooltip,
  onLeaveTooltip,
}: {
  collapsed: boolean;
  nomeCurto: string;
  fullName: string;
  email: string;
  avatarSrc: string | null;
  onOpen: () => void;
  onEnterTooltip: (el: HTMLElement) => void;
  onLeaveTooltip: () => void;
}) {
  const initials = initialsFromName(fullName || email || "?");

  return (
    <button
      type="button"
      className={cn(
        "relative mx-2 mt-1 flex min-h-11 w-[calc(100%-16px)] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        "text-[var(--nav-text)] hover:bg-surface-hover hover:text-primary",
        collapsed && "justify-center px-0",
      )}
      onClick={onOpen}
      aria-label={collapsed ? `${nomeCurto}, ver perfil` : undefined}
      onMouseEnter={(e) => onEnterTooltip(e.currentTarget)}
      onMouseLeave={onLeaveTooltip}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-sidebar"
        />
      ) : (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          aria-hidden
        >
          {initials}
        </span>
      )}
      {!collapsed ? (
        <>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="truncate text-sm font-semibold text-foreground">{nomeCurto}</div>
            <div className="truncate text-xs text-muted-foreground">Ver perfil</div>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </>
      ) : null}
    </button>
  );
}
