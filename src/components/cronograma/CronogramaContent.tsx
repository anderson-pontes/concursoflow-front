import { BarChart3, BookOpen, Calendar, Clock, ListChecks, MoreHorizontal, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { CronogramaWeekGrid } from "@/components/cronograma/CronogramaWeekGrid";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { fmtHorasStats } from "@/lib/cronograma/constants";
import type { Bloco, SessaoStats } from "@/lib/cronograma/types";

interface CronogramaContentProps {
  concursoAtivoId: string | null;
  calendarioMensalHref: string;
  totalBlocos: number;
  isLoading: boolean;
  stats?: SessaoStats;
  diaHoje: Bloco["dia_semana"];
  grouped: Record<Bloco["dia_semana"], Bloco[]>;
  disciplinaNome: (id: string) => string;
  clearPending: boolean;
  deletePending: boolean;
  extendPending: boolean;
  onAgenda: () => void;
  onRegistro: () => void;
  onClear: () => void;
  onCreate: () => void;
  onEdit: (bloco: Bloco) => void;
  onRemove: (bloco: Bloco, diaLabel: string) => void;
  onExtend: (bloco: Bloco) => void;
}

export function CronogramaContent({
  concursoAtivoId,
  calendarioMensalHref,
  totalBlocos,
  isLoading,
  stats,
  diaHoje,
  grouped,
  disciplinaNome,
  clearPending,
  deletePending,
  extendPending,
  onAgenda,
  onRegistro,
  onClear,
  onCreate,
  onEdit,
  onRemove,
  onExtend,
}: CronogramaContentProps) {
  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Cronograma</h1>
          <p className="text-sm text-muted-foreground">Planejamento semanal de estudos</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:max-w-[min(100%,42rem)] lg:justify-end">
          {concursoAtivoId ? (
            <Button asChild variant="outline" title="Replanejar concurso ativo">
              <Link to={`/planos/${concursoAtivoId}/replanejar`}>
                <RefreshCw />
                <span className="hidden sm:inline">Replanejar</span>
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={onAgenda}
            title="Ver o que está agendado para estudar na semana"
            aria-label="Ver o que está agendado para estudar na semana"
          >
            <ListChecks className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Agendado</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" aria-label="Mais ações do cronograma">
                <MoreHorizontal />
                <span className="hidden sm:inline">Mais ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuItem asChild className="min-h-10">
                <Link to={calendarioMensalHref}><Calendar />Calendário mensal</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-10" onSelect={onRegistro}>
                <BookOpen />Novo registro
              </DropdownMenuItem>
              {totalBlocos > 0 ? (
                <DropdownMenuItem
                  className="min-h-10"
                  variant="destructive"
                  disabled={clearPending}
                  onSelect={onClear}
                >
                  <Trash2 />{clearPending ? "Limpando…" : "Limpar cronograma"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          {totalBlocos > 0 ? (
            <Button type="button" onClick={onCreate}>
              <Plus />Criar cronograma
            </Button>
          ) : null}
        </div>
      </div>

      {!isLoading && totalBlocos === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum horário no cronograma"
          description="Escolha um modo: automático com IA, analítico com tópicos ou simplificado por disciplina."
          action={<Button type="button" onClick={onCreate}><Plus />Criar cronograma</Button>}
        />
      ) : null}

      {stats && totalBlocos > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
          {[
            { label: "Tempo total", value: fmtHorasStats(stats.tempo_total_horas), icon: Clock },
            { label: "Sessões", value: stats.sessoes_count != null ? String(stats.sessoes_count) : "—", icon: BarChart3 },
            { label: "Média diária", value: fmtHorasStats(stats.media_diaria_horas), icon: Calendar },
            { label: "Blocos", value: String(totalBlocos), icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-card p-3 shadow-sm sm:gap-3 sm:p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 sm:h-9 sm:w-9">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="truncate text-sm font-semibold tabular-nums text-card-foreground sm:text-base">{value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <CronogramaWeekGrid
        isLoading={isLoading}
        totalBlocos={totalBlocos}
        diaHoje={diaHoje}
        grouped={grouped}
        disciplinaNome={disciplinaNome}
        deletePending={deletePending}
        extendPending={extendPending}
        onEdit={onEdit}
        onRemove={onRemove}
        onExtend={onExtend}
      />
    </>
  );
}
