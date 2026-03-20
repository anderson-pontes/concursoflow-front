import React from "react";
import { Navigate } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function Layout({
  children,
  requireAuth,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  if (requireAuth) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onOpenSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

