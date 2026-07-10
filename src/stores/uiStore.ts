import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  disciplinasViewMode: "cards" | "table";
  setDisciplinasViewMode: (mode: "cards" | "table") => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebarCollapsed: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      disciplinasViewMode: "cards",
      setDisciplinasViewMode: (disciplinasViewMode) => set({ disciplinasViewMode }),
    }),
    { name: "cf-ui" },
  ),
);
