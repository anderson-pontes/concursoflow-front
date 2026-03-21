import React from "react";
import { Navigate } from "react-router-dom";

import { useConcursoSync } from "@/hooks/useConcursoSync";
import { fetchCurrentUser } from "@/services/currentUser";
import { useAuthStore } from "@/stores/authStore";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  useConcursoSync();

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
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
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

