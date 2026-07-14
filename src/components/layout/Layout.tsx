import React from "react";
import { Navigate } from "react-router-dom";

import { initThemeFromStorage } from "@/hooks/useTheme";
import { useConcursoSync } from "@/hooks/useConcursoSync";
import { usePomodoroSessionKeeper } from "@/hooks/usePomodoroSessionKeeper";
import { fetchCurrentUser } from "@/services/currentUser";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PomodoroSessionBadge } from "./PomodoroSessionBadge";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  useConcursoSync();
  usePomodoroSessionKeeper();

  React.useEffect(() => {
    initThemeFromStorage();
  }, []);

  React.useEffect(() => {
    if (!accessToken || user) return;
    let cancelled = false;
    void (async () => {
      try {
        const u = await fetchCurrentUser();
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user, setUser]);

  React.useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSidebarOpen]);

  const closeMobileSidebar = React.useCallback(() => setMobileSidebarOpen(false), []);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Pular para o conteúdo
      </a>
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin-left] duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[260px]",
        )}
      >
        <Header mobileSidebarOpen={mobileSidebarOpen} onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <PomodoroSessionBadge />
        <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function Layout({
  children,
  requireAuth,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  if (requireAuth) return <Navigate to="/login" replace />;

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
