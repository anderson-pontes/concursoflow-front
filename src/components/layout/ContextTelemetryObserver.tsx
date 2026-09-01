import React from "react";
import { useLocation } from "react-router-dom";

import { trackTelemetry } from "@/services/telemetry";
import { useConcursoStore } from "@/stores/concursoStore";

const SURFACES = [
  { path: "/dashboard", surface: "dashboard" },
  { path: "/cronograma", surface: "schedule" },
  { path: "/estudos/calendario", surface: "calendar" },
  { path: "/disciplinas", surface: "subjects" },
] as const;

export function ContextTelemetryObserver() {
  const { pathname } = useLocation();
  const concursoAtivoId = useConcursoStore((state) => state.concursoAtivoId);
  const contextResolved = useConcursoStore((state) => state.contextResolved);
  const contextError = useConcursoStore((state) => state.contextError);
  const surface = SURFACES.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`))?.surface;

  React.useEffect(() => {
    if (!surface || !contextResolved) return;
    trackTelemetry("context_state_viewed", {
      surface,
      state: contextError ? "recoverable_error" : concursoAtivoId ? "ready" : "no_contest",
    });
  }, [concursoAtivoId, contextError, contextResolved, surface]);

  return null;
}
