import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  Clock3,
  FileText,
  Folder,
  Grid2x2,
  List,
  SquareStack,
  Timer,
} from "lucide-react";
import { usePlanoStore } from "@/stores/planoStore";

import { useAuthStore } from "@/stores/authStore";

const navSections = [
  {
    label: "PRINCIPAL",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: Grid2x2 },
      { to: "/cronograma", label: "Cronograma", icon: Clock3 },
      { to: "/disciplinas", label: "Disciplinas", icon: List },
    ],
  },
  {
    label: "ESTUDO",
    items: [
      { to: "/pomodoro", label: "Pomodoro", icon: Timer },
      { to: "/questoes", label: "Questões", icon: FileText },
      { to: "/simulados", label: "Simulados", icon: BarChart3 },
      { to: "/flashcards", label: "Flashcards", icon: SquareStack },
    ],
  },
  {
    label: "OUTROS",
    items: [
      { to: "/concursos", label: "Concursos", icon: BriefcaseBusiness },
      { to: "/avisos", label: "Avisos", icon: Bell },
      { to: "/materiais", label: "Materiais", icon: Folder },
    ],
  },
];

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const planosCount = usePlanoStore((s) => s.planos.length);
  const navigate = useNavigate();
  const initials = (user?.name ?? "CF")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 md:hidden ${mobileOpen ? "block" : "hidden"}`}
        onClick={onMobileClose}
      />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-[220px] transform border-r border-primary-700 bg-primary-600 transition-transform duration-200 dark:border-neutral-700 dark:bg-neutral-800 md:static md:flex md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full w-full flex-col">
          <div className="border-b border-primary-700 p-4 dark:border-neutral-700">
            <div className="flex items-center gap-2.5">
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-600" fill="none" aria-hidden="true">
                  <path d="M12 3 4 7.5 12 12l8-4.5L12 3Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M7 10.5V14c0 1.7 2.2 3 5 3s5-1.3 5-3v-3.5" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white dark:text-neutral-100">ConcursoFlow</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {navSections.map((section) => (
              <div key={section.label} className="mt-3 first:mt-0">
                <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wide text-primary-200">
                  {section.label}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        [
                          "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-white/15 font-medium text-white [&>svg]:text-white"
                            : "text-primary-100 hover:bg-primary-500 hover:text-white dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
                        ].join(" ")
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-primary-200" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                  {section.label === "OUTROS" ? (
                    <div className="ml-3 mt-1 space-y-0.5 border-l border-primary-500 pl-3 dark:border-neutral-700">
                      <NavLink
                        to="/concursos"
                        onClick={onMobileClose}
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
                            isActive
                              ? "bg-white/15 text-white"
                              : "text-primary-100 hover:bg-primary-500 hover:text-white dark:text-neutral-300 dark:hover:bg-neutral-700",
                          ].join(" ")
                        }
                      >
                        Meus Concursos
                      </NavLink>
                      <NavLink
                        to="/concursos/planos"
                        onClick={onMobileClose}
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
                            isActive
                              ? "bg-white/15 text-white"
                              : "text-primary-100 hover:bg-primary-500 hover:text-white dark:text-neutral-300 dark:hover:bg-neutral-700",
                          ].join(" ")
                        }
                      >
                        <span>Planos de Estudo</span>
                        <span className="ml-auto rounded-full bg-white/15 px-1.5 text-[10px] text-white">
                          {planosCount}
                        </span>
                      </NavLink>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-primary-700 p-2 dark:border-neutral-700">
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-primary-500 dark:hover:bg-neutral-700"
              onClick={() => navigate("/dashboard")}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-medium text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-white dark:text-neutral-100">
                  {user?.name ?? "Usuário"}
                </div>
                <div className="truncate text-[10px] text-primary-200">CGU — TI · ativo</div>
              </div>
              <ChevronRight className="h-4 w-4 text-primary-200" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

