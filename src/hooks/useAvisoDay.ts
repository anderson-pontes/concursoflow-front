import { useEffect, useState } from "react";
import { dashboardDayISO } from "@/lib/dashboard/analysis";

export function useAvisoDay() {
  const [day, setDay] = useState(() => dashboardDayISO());
  useEffect(() => {
    const refresh = () => setDay(dashboardDayISO());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return day;
}
