import { cn } from "@/lib/utils";

type ActivityType = "estudo" | "exercicio" | "revisao";

type Activity = {
  id: string;
  disciplina: string;
  horario: string;
  tipo: ActivityType;
};

const typeStyles: Record<ActivityType, { dot: string; tag: string; label: string }> = {
  estudo: {
    dot: "bg-primary-600",
    tag: "bg-primary-50 text-primary-800",
    label: "estudo",
  },
  exercicio: {
    dot: "bg-success-600",
    tag: "bg-success-50 text-success-800",
    label: "exercício",
  },
  revisao: {
    dot: "bg-warning-600",
    tag: "bg-warning-50 text-warning-800",
    label: "revisão",
  },
};

export function ProximasAtividades({ atividades }: { atividades: Activity[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-100">Próximas atividades</h3>
      <p className="mb-3 text-xs text-neutral-400">Blocos de hoje no cronograma</p>

      <div className="space-y-2">
        {atividades.length === 0 ? (
          <div className="rounded-lg bg-neutral-50 p-2 text-xs text-neutral-400">Sem blocos para hoje.</div>
        ) : null}

        {atividades.map((item) => {
          const style = typeStyles[item.tipo];
          return (
            <div key={item.id} className="flex items-center gap-2.5 rounded-lg bg-neutral-50 p-2 dark:bg-neutral-700/40">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-100">{item.disciplina}</div>
                <div className="text-[10px] text-neutral-400">{item.horario}</div>
              </div>
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", style.tag)}>{style.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

