import React from "react";
import { Navigate } from "react-router-dom";

import { initThemeFromStorage } from "@/hooks/useTheme";
import { useConcursoSync } from "@/hooks/useConcursoSync";
import { fetchCurrentUser } from "@/services/currentUser";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  useConcursoSync();

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

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div
        className={[
          "flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin-left] duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[260px]",
        ].join(" ")}
      >
        <Header onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
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

