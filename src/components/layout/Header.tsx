import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";

import { UserDropdown } from "@/components/layout/UserDropdown";
import { PlanoSwitcher } from "@/components/planos/PlanoSwitcher";
import { primeiroNome } from "@/lib/userDisplay";
import { useAuthStore } from "@/stores/authStore";

function saudacaoPorHora(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function Header({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [isDark, setIsDark] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [cmdQuery, setCmdQuery] = React.useState("");

  const actions = React.useMemo(
    () => [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Concursos", to: "/concursos" },
      { label: "Disciplinas", to: "/disciplinas" },
      { label: "Cronograma", to: "/cronograma" },
      { label: "Pomodoro", to: "/pomodoro" },
      { label: "Questões", to: "/questoes" },
      { label: "Simulados", to: "/simulados" },
      { label: "Avisos", to: "/avisos" },
      { label: "Flashcards", to: "/flashcards" },
      { label: "Materiais", to: "/materiais" },
    ],
    [],
  );

  React.useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const initial = stored ? stored === "dark" : document.documentElement.classList.contains("dark");
    setIsDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isK = key === "k";
      if (!isK) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setCmdOpen(true);
      setCmdQuery("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredActions = actions.filter((a) => a.label.toLowerCase().includes(cmdQuery.toLowerCase()));
  const nomeSaudacao = primeiroNome(user?.name, "Concurseiro");
  const iconBtn =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-200 dark:hover:bg-neutral-900";

  return (
    <header className="border-b border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex min-h-14 flex-col gap-3 px-4 py-3 md:h-14 md:flex-row md:items-center md:justify-between md:py-0 md:pl-6 md:pr-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className={`${iconBtn} md:hidden`}
            onClick={onOpenSidebar}
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex flex-col">
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-50">
              {saudacaoPorHora()}, {nomeSaudacao}!
            </span>
            <span className="hidden text-xs text-slate-500 dark:text-neutral-300 sm:block">
              Estude com foco e consistência.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <PlanoSwitcher />

          <button type="button" className={iconBtn} title="Notificações" aria-label="Notificações">
            <Bell className="h-4 w-4" />
          </button>

          <button
            type="button"
            className={iconBtn}
            onClick={() => {
              setCmdOpen(true);
              setCmdQuery("");
            }}
            title="Buscar (Ctrl+K)"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            className={iconBtn}
            onClick={() => {
              const next = !isDark;
              setIsDark(next);
              document.documentElement.classList.toggle("dark", next);
              window.localStorage.setItem("theme", next ? "dark" : "light");
            }}
            title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <UserDropdown />
        </div>
      </div>

      {cmdOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCmdOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-border/40 bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Comandos</div>
              <button
                type="button"
                className="rounded-lg border border-border/40 bg-background px-2 py-1 text-xs hover:bg-muted"
                onClick={() => setCmdOpen(false)}
              >
                Fechar
              </button>
            </div>

            <input
              autoFocus
              className="mt-3 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              placeholder="Digite para buscar..."
              value={cmdQuery}
              onChange={(e) => setCmdQuery(e.target.value)}
            />

            <div className="mt-3 max-h-64 space-y-1 overflow-auto">
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  const next = !isDark;
                  setIsDark(next);
                  document.documentElement.classList.toggle("dark", next);
                  window.localStorage.setItem("theme", next ? "dark" : "light");
                }}
              >
                Tema: {isDark ? "Escuro" : "Claro"}
              </button>

              {filteredActions.map((a) => (
                <button
                  key={a.to}
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
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
