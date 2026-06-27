import { useSearchParams } from "react-router-dom";

export function useDisciplinaDashboardDemoMode() {
  const [searchParams] = useSearchParams();
  const fromQuery =
    searchParams.get("mock") === "1" ||
    searchParams.get("mock")?.toLowerCase() === "true";
  const fromEnv = import.meta.env.VITE_DISCIPLINA_DASHBOARD_MOCK === "true";
  return fromEnv || fromQuery;
}
