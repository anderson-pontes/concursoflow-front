import { Check, Clock3, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { TodaySession } from "@/lib/dashboard/analysis";
import { cn } from "@/lib/utils";

const appearances = {
  em_andamento: { label: "Em andamento", icon: Play, color: "bg-info/10 text-info-text" },
  atrasada: { label: "Atrasada", icon: Clock3, color: "bg-warning/10 text-warning-foreground" },
  planejada: { label: "Planejada", icon: null, color: "bg-primary/10 text-primary" },
  concluida: { label: "Concluída", icon: Check, color: "bg-success/10 text-success-text" },
} as const;

export function DashboardSessionStatus({ status }: { status: TodaySession["status"] }) {
  const { label, icon: Icon, color } = appearances[status];
  return (
    <Badge variant="outline" className={cn("gap-1 border-transparent py-0.5", color)}>
      {Icon && <Icon aria-hidden />}
      {label}
    </Badge>
  );
}
