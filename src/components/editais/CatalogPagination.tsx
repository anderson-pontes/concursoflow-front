import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CatalogPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return total ? <p className="text-xs text-muted-foreground">{total} edital{total === 1 ? "" : "is"} encontrado{total === 1 ? "" : "s"}.</p> : null;
  return (
    <nav className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Paginação do catálogo">
      <p className="text-xs text-muted-foreground">Página {page} de {totalPages} · {total} editais</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="min-h-11" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button type="button" variant="outline" className="min-h-11" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Próxima <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
