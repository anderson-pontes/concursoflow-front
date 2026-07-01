import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Timer } from "lucide-react";

import { PomodoroConfigPanel } from "@/components/pomodoro/PomodoroConfigPanel";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { Button } from "@/components/ui/button";
import { usePomodoroConfigSync } from "@/hooks/usePomodoroConfigSync";
import { api } from "@/services/api";
import { useConcursoAtivoId } from "@/stores/concursoStore";
import { usePomodoroStore } from "@/stores/pomodoroStore";

type DisciplinaRow = {
  id: string;
  nome: string;
  concurso_ids?: string[];
};

export function Pomodoro() {
  const concursoAtivoId = useConcursoAtivoId();
  const { saveMutation } = usePomodoroConfigSync();

  const mode = usePomodoroStore((s) => s.mode);
  const focusHours = usePomodoroStore((s) => s.focusHours);
  const focusMinutes = usePomodoroStore((s) => s.focusMinutes);
  const shortBreakMinutes = usePomodoroStore((s) => s.shortBreakMinutes);
  const longBreakMinutes = usePomodoroStore((s) => s.longBreakMinutes);
  const cyclesTarget = usePomodoroStore((s) => s.cyclesTarget);
  const disciplinaId = usePomodoroStore((s) => s.disciplinaId);
  const topicoId = usePomodoroStore((s) => s.topicoId);

  const [openRegistro, setOpenRegistro] = React.useState(false);
  const [timerActive, setTimerActive] = React.useState(false);

  const persistConfig = React.useCallback(() => {
    saveMutation.mutate({
      mode,
      focus_hours: focusHours,
      focus_minutes: focusMinutes,
      short_break_minutes: shortBreakMinutes,
      long_break_minutes: longBreakMinutes,
      cycles_target: cyclesTarget,
      last_disciplina_id: disciplinaId,
      last_topico_id: topicoId,
    });
  }, [
    saveMutation,
    mode,
    focusHours,
    focusMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    cyclesTarget,
    disciplinaId,
    topicoId,
  ]);

  const { data: disciplinasCatalog = [], isLoading } = useQuery({
    queryKey: ["disciplinas", "pomodoro"],
    queryFn: async () => (await api.get("/disciplinas")).data as DisciplinaRow[],
  });

  const disciplinas = React.useMemo(() => {
    if (!concursoAtivoId) return disciplinasCatalog.map(({ id, nome }) => ({ id, nome }));
    const linked = disciplinasCatalog.filter((d) => d.concurso_ids?.includes(concursoAtivoId));
    const rest = disciplinasCatalog.filter((d) => !d.concurso_ids?.includes(concursoAtivoId));
    const ordered = linked.length > 0 ? [...linked, ...rest] : disciplinasCatalog;
    return ordered.map(({ id, nome }) => ({ id, nome }));
  }, [disciplinasCatalog, concursoAtivoId]);

  const { data: topicos } = useQuery({
    queryKey: ["pomodoro-topicos-page", disciplinaId],
    enabled: Boolean(disciplinaId),
    queryFn: async () => {
      const rows = (await api.get(`/disciplinas/${disciplinaId}/topicos`)).data as Array<{
        id: string;
        descricao: string;
      }>;
      return rows.map((t) => ({ id: String(t.id), descricao: t.descricao }));
    },
  });

  const disciplinaNome = disciplinas.find((d) => d.id === disciplinaId)?.nome;
  const topicoNome = topicos?.find((t) => t.id === topicoId)?.descricao;

  const pageTitle = mode === "cronometro" ? "Cronômetro" : "Pomodoro";

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3F0FF] text-[#6C3FC5] dark:bg-[#6C3FC5]/20 dark:text-[#A78BFA]">
            <Timer className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              {timerActive ? "Sessão em andamento" : pageTitle}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {timerActive
                ? "Foque no estudo — use Encerrar e salvar para registrar."
                : "Configure horas e minutos de foco, inicie o timer e registre seu progresso."}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" className="gap-2" onClick={() => setOpenRegistro(true)}>
          <BookOpen className="h-4 w-4" />
          Registro manual
        </Button>
      </div>

      {!timerActive ? (
        <PomodoroConfigPanel
          disciplinas={disciplinas}
          loadingDisciplinas={isLoading}
          onPersist={persistConfig}
        />
      ) : (
        <div className="rounded-xl border border-[#DDD6FE] bg-[#F3F0FF]/60 px-4 py-3 text-sm text-[#5B32AD] dark:border-[#6C3FC5]/30 dark:bg-[#6C3FC5]/10 dark:text-[#DDD6FE]">
          Configurações ocultas durante a sessão. Pause ou encerre para alterar duração, modo e disciplina.
        </div>
      )}

      <PomodoroTimer
        onActiveChange={setTimerActive}
        disciplinaNome={disciplinaNome}
        topicoNome={topicoNome}
      />

      <RegistroEstudoModal
        open={openRegistro}
        onClose={() => setOpenRegistro(false)}
        defaultDisciplinaId={disciplinaId}
        defaultTopicos={topicoId && topicoNome ? [{ id: topicoId, nome: topicoNome }] : null}
      />
    </div>
  );
}
