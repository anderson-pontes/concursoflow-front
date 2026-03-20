import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Moon, Search, Sun } from "lucide-react";

import { useAuthStore } from "@/stores/authStore";
import { PlanoSwitcher } from "@/components/planos/PlanoSwitcher";

export function Header({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [isDark, setIsDark] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [cmdQuery, setCmdQuery] = React.useState("");
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

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
  const initials = (user?.name ?? "CF")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 border-b border-primary-700 bg-primary-600 px-6 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-400 text-primary-100 hover:bg-primary-500 md:hidden"
            onClick={onOpenSidebar}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white dark:text-neutral-100">
              Bom dia, {user?.name ?? "Concurseiro"}!
            </span>
            <span className="text-xs text-primary-200">Estude com foco e consistência.</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <PlanoSwitcher />

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-400 text-primary-100 hover:bg-primary-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <Bell className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-400 text-primary-100 hover:bg-primary-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
            onClick={() => {
              setCmdOpen(true);
              setCmdQuery("");
            }}
            title="Buscar (⌘K)"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-400 text-primary-100 hover:bg-primary-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
            onClick={() => {
              const next = !isDark;
              setIsDark(next);
              document.documentElement.classList.toggle("dark", next);
              window.localStorage.setItem("theme", next ? "dark" : "light");
            }}
            title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-medium text-white"
              onClick={() => setUserMenuOpen((v) => !v)}
              title="Menu do usuário"
            >
              {initials}
            </button>

            {userMenuOpen ? (
              <div className="absolute right-0 z-[120] mt-2 w-44 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-md dark:border-neutral-700 dark:bg-neutral-800">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-danger-600 hover:bg-danger-50"
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            ) : null}
          </div>
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

            <div className="mt-3 space-y-1 max-h-64 overflow-auto">
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

      {userMenuOpen ? (
        <button
          type="button"
          aria-label="Fechar menu do usuário"
          className="fixed inset-0 z-[110] cursor-default bg-transparent"
          onClick={() => setUserMenuOpen(false)}
        />
      ) : null}
    </header>
  );
}

