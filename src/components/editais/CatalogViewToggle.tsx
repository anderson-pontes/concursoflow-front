import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";

export type CatalogViewMode = "cards" | "table";

type CatalogViewToggleProps = {
  value: CatalogViewMode;
  onValueChange: (value: CatalogViewMode) => void;
  className?: string;
};

export function CatalogViewToggle({ value, onValueChange, className }: CatalogViewToggleProps) {
  return (
    <div
      className={cn("inline-flex min-h-11 rounded-lg border border-border bg-muted/40 p-1", className)}
      role="group"
      aria-label="Modo de exibição do catálogo"
    >
      <ViewButton
        active={value === "cards"}
        label="Cards"
        icon={<LayoutGrid className="h-4 w-4" aria-hidden />}
        onClick={() => onValueChange("cards")}
      />
      <ViewButton
        active={value === "table"}
        label="Tabela"
        icon={<List className="h-4 w-4" aria-hidden />}
        onClick={() => onValueChange("table")}
      />
    </div>
  );
}

function ViewButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
