import React from "react";
import { createPortal } from "react-dom";
import { NavLink, matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart2,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileQuestion,
  FolderOpen,
  Layers,
  LayoutDashboard,
  Shield,
  Timer,
  Trophy,
} from "lucide-react";

import { AprovingoLogo } from "@/components/branding/AprovingoLogo";
import { PlanoSwitcher } from "@/components/planos/PlanoSwitcher";
import { resolvePublicUrl } from "@/lib/publicUrl";
import { primeiroNome } from "@/lib/userDisplay";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { usePlanoStore } from "@/stores/planoStore";

const navSections = [
  {
    label: "PRINCIPAL",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/concursos", label: "Meus Concursos", icon: Trophy, end: true },
      { to: "/disciplinas", label: "Disciplinas", icon: BookOpen },
      { to: "/concursos/planos", label: "Planos de Estudo", icon: ClipboardList, badgeKey: "planos" as const },
      { to: "/cronograma", label: "Cronograma", icon: CalendarDays },
    ],
  },
  {
    label: "ESTUDO",
    items: [
      { to: "/pomodoro", label: "Pomodoro", icon: Timer },
      { to: "/questoes", label: "Questões", icon: FileQuestion },
      { to: "/simulados", label: "Simulados", icon: BarChart2 },
      { to: "/flashcards", label: "Flashcards", icon: Layers },
    ],
  },
  {
    label: "OUTROS",
    items: [
      { to: "/avisos", label: "Avisos", icon: Bell },
      { to: "/materiais", label: "Materiais", icon: FolderOpen },
      { to: "/admin/estudos", label: "Admin Estudos", icon: Shield },
    ],
  },
] as const;

type NavItemDef = (typeof navSections)[number]["items"][number];

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
      className="pointer-events-none fixed z-[9999] max-w-[240px] rounded-lg px-3 py-1.5 text-[13px] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
      style={{
        left: 80,
        top: anchorTop,
        transform: "translateY(-50%)",
        backgroundColor: "var(--tooltip-bg)",
        color: "var(--tooltip-fg)",
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
  const planosCount = usePlanoStore((s) => s.planos.length);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [isDark, setIsDark] = React.useState(false);
  const [tooltip, setTooltip] = React.useState<{ text: string; top: number } | null>(null);

  const showLabels = !collapsed || Boolean(mobileOpen);
  const desktopCollapsed = collapsed && !mobileOpen;

  React.useEffect(() => {
    const el = document.documentElement;
    const sync = () => setIsDark(el.classList.contains("dark"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  const toggleTheme = React.useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
  }, [isDark]);

  const nomeCurto = primeiroNome(user?.name, "Concurseiro");
  const avatarSrc = resolvePublicUrl(user?.avatar_url ?? null);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[90] bg-black/30 transition-opacity md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
        onClick={onMobileClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-[100] flex h-screen flex-col overflow-hidden border-r font-[Inter,sans-serif] transition-[width,transform] duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
          "bg-[#FFFFFF] dark:bg-[#13111A]",
          "border-[var(--sidebar-ap-border)]",
          "shadow-[var(--sidebar-ap-shadow)]",
          mobileOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full md:translate-x-0",
          desktopCollapsed ? "md:w-[72px]" : "md:w-[260px]",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b px-4 transition-all duration-200 [border-color:var(--sidebar-ap-header-border)]",
            desktopCollapsed && !mobileOpen ? "justify-center" : "justify-between",
          )}
        >
          {(!desktopCollapsed || mobileOpen) && (
            <AprovingoLogo className="h-8 max-h-8 w-auto max-w-full shrink-0 object-contain object-left" />
          )}

          <button
            type="button"
            aria-label={desktopCollapsed && !mobileOpen ? "Expandir menu" : "Recolher menu"}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition-[transform,color,background-color] duration-[250ms] ease-out hover:bg-[#F3F0FF] hover:text-[#6C3FC5] dark:text-[#6B7280] dark:hover:bg-[#1E1A2E] dark:hover:text-[#A78BFA] md:inline-flex"
            onClick={() => onCollapsedChange(!collapsed)}
          >
            <span
              className="inline-block text-base leading-none transition-transform duration-[250ms] ease-out"
              aria-hidden
            >
              {desktopCollapsed && !mobileOpen ? "»" : "«"}
            </span>
          </button>
        </div>

        <PlanoSwitcher collapsed={desktopCollapsed} onAfterPick={onMobileClose} />

        <nav
          className="sidebar-nav-scroll flex flex-1 flex-col overflow-y-auto overflow-x-hidden py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={() => setTooltip(null)}
        >
          {navSections.map((section) => (
            <div key={section.label}>
              {showLabels ? (
                <div className="px-5 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[1.5px] text-[var(--group-label)] transition-opacity duration-200">
                  {section.label}
                </div>
              ) : null}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarNavRow
                    key={item.to}
                    item={item}
                    planosCount={planosCount}
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

        <footer
          className="shrink-0 border-t px-2 py-3 [border-color:var(--footer-border)] transition-colors duration-300 ease-out"
        >
          {desktopCollapsed ? (
            <button
              type="button"
              className="flex w-full items-center justify-center rounded-[10px] py-2.5 text-lg transition-[transform,background-color,color] duration-200 ease-out hover:bg-[var(--nav-bg-hover)]"
              title={isDark ? "Modo claro" : "Modo escuro"}
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              onClick={toggleTheme}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              className={cn(
                "mx-2 mb-1 flex w-[calc(100%-16px)] cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[var(--nav-text)] transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-[var(--nav-bg-hover)] hover:text-[#6C3FC5] dark:hover:text-[#A78BFA]",
              )}
              onClick={toggleTheme}
            >
              <span className="text-lg leading-none" aria-hidden>
                {isDark ? "☀️" : "🌙"}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium">{isDark ? "Modo claro" : "Modo escuro"}</span>
              <span
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-out",
                  isDark ? "bg-[#6C3FC5]" : "bg-[#D1D5DB] dark:bg-[#374151]",
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
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
  planosCount,
  collapsed,
  showLabels,
  onMobileClose,
  onEnterTooltip,
  onLeaveTooltip,
}: {
  item: NavItemDef;
  planosCount: number;
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

  const badge =
    "badgeKey" in item && item.badgeKey === "planos" ? (
      <span
        key={planosCount}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-[#6C3FC5] text-[11px] font-bold text-white dark:bg-[#7C3AED]",
          "min-h-5 min-w-5 px-1.5",
          "animate-[sidebar-badge-pulse_0.3s_ease]",
          collapsed && "absolute right-1.5 top-1.5 !h-4 !min-h-0 !min-w-0 !w-4 !px-0 !text-[9px]",
        )}
      >
        {planosCount}
      </span>
    ) : null;

  return (
    <NavLink
      to={item.to}
      end={Boolean(end)}
      onClick={() => onMobileClose?.()}
      title={collapsed ? item.label : undefined}
      onMouseEnter={(e) => onEnterTooltip(e.currentTarget, item.label)}
      onMouseLeave={onLeaveTooltip}
      className={cn(
        "group relative mx-2 flex cursor-pointer select-none items-center gap-3 overflow-hidden whitespace-nowrap rounded-[10px] px-3 py-2.5 text-sm transition-all duration-150 ease-out",
        "text-[var(--nav-text)]",
        !isActive && "hover:translate-x-0.5 hover:bg-[var(--nav-bg-hover)] hover:text-[#6C3FC5] dark:hover:text-[#A78BFA]",
        isActive && [
          "translate-x-0.5 border font-semibold text-[var(--nav-text-active)]",
          "border-[var(--nav-border-active)] shadow-[var(--nav-active-shadow)]",
          "[background-image:var(--nav-bg-active)]",
        ],
      )}
    >
      {isActive ? (
        <span
          className="absolute left-0 top-[20%] h-[60%] w-[3px] rounded-r-[3px] bg-[#6C3FC5] [transform-origin:center] [animation:sidebar-nav-bar-in_0.15s_ease_forwards]"
          aria-hidden
        />
      ) : null}
      <Icon
        className="relative z-[1] h-[18px] w-[18px] shrink-0 text-current transition-colors duration-150 ease-out"
        strokeWidth={2}
        aria-hidden
      />
      {showLabels ? (
        <span
          className={cn(
            "relative z-[1] min-w-0 flex-1 truncate text-sm transition-[opacity,max-width] duration-200 ease-out",
            collapsed ? "pointer-events-none max-w-0 opacity-0" : "max-w-[1000px] opacity-100",
          )}
        >
          {item.label}
        </span>
      ) : (
        <span className="sr-only">{item.label}</span>
      )}
      {badge && showLabels && !collapsed ? badge : null}
      {badge && collapsed ? badge : null}
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
        "relative mx-2 mt-1 flex w-[calc(100%-16px)] cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-all duration-200 ease-out",
        "text-[var(--nav-text)] hover:translate-x-0.5 hover:bg-[#F3F0FF] hover:text-[#6C3FC5] dark:hover:bg-[#1E1A2E] dark:hover:text-[#A78BFA]",
        collapsed && "justify-center px-0",
      )}
      onClick={onOpen}
      onMouseEnter={(e) => onEnterTooltip(e.currentTarget)}
      onMouseLeave={onLeaveTooltip}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-[#13111A]"
        />
      ) : (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6C3FC5] text-[13px] font-bold text-white"
          aria-hidden
        >
          {initials}
        </span>
      )}
      {!collapsed ? (
        <>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="truncate text-[13px] font-bold text-[#1A1A2E] dark:text-[#F1F0FF]">{nomeCurto}</div>
            <div className="truncate text-[11px] text-[#9CA3AF]">Ver perfil</div>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        </>
      ) : null}
    </button>
  );
}
