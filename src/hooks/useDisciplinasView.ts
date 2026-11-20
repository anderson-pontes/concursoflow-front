import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export type DisciplinasView = "cards" | "list" | "table";

export function useDisciplinasView() {
  const userId = useAuthStore((state) => state.user?.id);
  const key = userId ? `cf:disciplinas:view:v1:${userId}` : null;
  const [selection, setSelection] = useState<{ key: typeof key; mode: DisciplinasView }>();
  let stored: string | null = null;
  try {
    if (key && selection?.key !== key) stored = localStorage.getItem(key);
  } catch {
    // Browsers may disable storage.
  }
  const mode = selection?.key === key ? selection.mode : stored === "list" || stored === "table" ? stored : "cards";
  return [mode, (next: DisciplinasView) => {
    setSelection({ key, mode: next });
    try {
      if (key) localStorage.setItem(key, next);
    } catch {
      // Keep the in-memory selection available.
    }
  }] as const;
}
