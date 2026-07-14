import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Moon, Search, Sun, X } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";
import { UserDropdown } from "@/components/layout/UserDropdown";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { primeiroNome } from "@/lib/userDisplay";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

function saudacaoPorHora(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const iconBtnClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-10 sm:w-10";

const cmdItemClass =
  "flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-foreground hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

export function Header({
  onOpenSidebar,
  mobileSidebarOpen = false,
}: {
  onOpenSidebar?: () => void;
  mobileSidebarOpen?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { isDark, toggle: toggleTheme } = useTheme();

  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [cmdQuery, setCmdQuery] = React.useState("");
  const cmdInputRef = React.useRef<HTMLInputElement>(null);

  const actions = React.useMemo(
    () => [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Concursos", to: "/concursos" },
      { label: "Disciplinas", to: "/disciplinas" },
      { label: "Cronograma", to: "/cronograma" },
      { label: "Calendário", to: "/estudos/calendario" },
      { label: "Histórico", to: "/estudos/historico" },
      { label: "Pomodoro", to: "/pomodoro" },
      { label: "Avisos", to: "/avisos" },
      { label: "Flashcards", to: "/flashcards" },
      { label: "Perfil", to: "/perfil" },
    ],
    [],
  );

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCmdOpen(true);
        setCmdQuery("");
      }
      if (key === "Escape" && cmdOpen) {
        e.preventDefault();
        setCmdOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cmdOpen]);

  React.useEffect(() => {
    if (cmdOpen) {
      requestAnimationFrame(() => cmdInputRef.current?.focus());
    }
  }, [cmdOpen]);

  const filteredActions = actions.filter((a) => a.label.toLowerCase().includes(cmdQuery.toLowerCase()));
  const nomeSaudacao = primeiroNome(user?.name, "Concurseiro");
  const saudacao = saudacaoPorHora();

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border bg-surface/95 backdrop-blur-sm supports-[backdrop-filter]:bg-surface/80">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4 md:pl-6 md:pr-6 lg:h-16">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className={cn(iconBtnClass, "md:hidden")}
            onClick={onOpenSidebar}
            aria-label="Abrir menu"
            aria-controls="app-sidebar"
            aria-expanded={mobileSidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold leading-tight text-foreground sm:text-base">
              <span className="sm:hidden">
                {saudacao}, {nomeSaudacao}
              </span>
              <span className="hidden sm:inline">
                {saudacao}, {nomeSaudacao}!
              </span>
            </h1>
            <p className="mt-0.5 hidden truncate text-xs text-muted-foreground lg:block">
              Estude com foco e consistência.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className={cn(iconBtnClass, "hidden sm:inline-flex")}
            onClick={toggleTheme}
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            title={isDark ? "Modo claro" : "Modo escuro"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <NotificationBell />

          <button
            type="button"
            className={iconBtnClass}
            onClick={() => {
              setCmdOpen(true);
              setCmdQuery("");
            }}
            title="Buscar (Ctrl+K)"
            aria-label="Buscar páginas"
          >
            <Search className="h-4 w-4" />
          </button>

          <UserDropdown compact />

        </div>
      </div>

      {cmdOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 p-4 pt-[max(1rem,10vh)] backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCmdOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-4 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Paleta de comandos"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">Ir para…</div>
              <button
                type="button"
                className={cn(iconBtnClass, "h-9 w-9")}
                onClick={() => setCmdOpen(false)}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              ref={cmdInputRef}
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Digite para buscar…"
              value={cmdQuery}
              onChange={(e) => setCmdQuery(e.target.value)}
              aria-label="Buscar página"
            />

            <div className="mt-3 max-h-64 space-y-1 overflow-auto">
              <button
                type="button"
                className={cmdItemClass}
                onClick={() => {
                  toggleTheme();
                  setCmdOpen(false);
                }}
              >
                Alternar tema {isDark ? "claro" : "escuro"}
              </button>

              {filteredActions.map((a) => (
                <button
                  key={a.to}
                  type="button"
                  className={cmdItemClass}
                  onClick={() => {
                    setCmdOpen(false);
                    navigate(a.to);
                  }}
                >
                  {a.label}
                </button>
              ))}

              {filteredActions.length === 0 ? (
                <div className="rounded-lg px-3 py-2 text-sm text-muted-foreground">Nenhum resultado.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
