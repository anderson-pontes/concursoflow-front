import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, BookOpen, Timer } from "lucide-react";
import { toast } from "sonner";

import { PomodoroConfigPanel } from "@/components/pomodoro/PomodoroConfigPanel";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { completePomodoroRevision } from "@/lib/revisoes/completePomodoroRevision";
import { usePomodoroConfigSync } from "@/hooks/usePomodoroConfigSync";
import {
  applyPomodoroLaunchToStore,
  hasPomodoroLaunchParams,
  parsePomodoroLaunchParams,
  pomodoroLaunchSignature,
} from "@/lib/pomodoro/launchFromCronograma";
import { api } from "@/services/api";
import { useConcursoAtivoId } from "@/stores/concursoStore";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { useRevisaoPomodoroStore } from "@/stores/revisaoPomodoroStore";

type DisciplinaRow = {
  id: string;
  nome: string;
  concurso_ids?: string[];
};

export function Pomodoro() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const launchParams = React.useMemo(() => parsePomodoroLaunchParams(searchParams), [searchParams]);
  const launchSignature = launchParams ? pomodoroLaunchSignature(launchParams) : null;
  const hasLaunch = hasPomodoroLaunchParams(searchParams);

  const concursoAtivoId = useConcursoAtivoId();
  const { saveMutation } = usePomodoroConfigSync({ skipInitialHydration: hasLaunch });

  const mode = usePomodoroStore((s) => s.mode);
  const focusHours = usePomodoroStore((s) => s.focusHours);
  const focusMinutes = usePomodoroStore((s) => s.focusMinutes);
  const shortBreakMinutes = usePomodoroStore((s) => s.shortBreakMinutes);
  const longBreakMinutes = usePomodoroStore((s) => s.longBreakMinutes);
  const cyclesTarget = usePomodoroStore((s) => s.cyclesTarget);
  const disciplinaId = usePomodoroStore((s) => s.disciplinaId);
  const topicoId = usePomodoroStore((s) => s.topicoId);
  const revisaoContext = useRevisaoPomodoroStore((s) => s.context);
  const revisaoConflict = useRevisaoPomodoroStore((s) => s.conflict);
  const prepareRevisao = useRevisaoPomodoroStore((s) => s.prepare);
  const clearRevisao = useRevisaoPomodoroStore((s) => s.clear);

  const [openRegistro, setOpenRegistro] = React.useState(false);
  const [timerActive, setTimerActive] = React.useState(false);
  const lastAppliedLaunchRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!launchParams || !launchSignature) return;
    if (lastAppliedLaunchRef.current === launchSignature) return;
    lastAppliedLaunchRef.current = launchSignature;

    const { focusHours: h, focusMinutes: m } = applyPomodoroLaunchToStore(launchParams);

    if (
      launchParams.source === "revisao"
      && launchParams.revisaoId
      && launchParams.revisaoVersao
      && launchParams.concursoId
      && launchParams.topicoId
    ) {
      const current = useRevisaoPomodoroStore.getState().context;
      if (current?.revisaoId !== launchParams.revisaoId || current.revisaoVersao !== launchParams.revisaoVersao) {
        prepareRevisao({
          revisaoId: launchParams.revisaoId,
          revisaoVersao: launchParams.revisaoVersao,
          concursoId: launchParams.concursoId,
          disciplinaId: launchParams.disciplinaId,
          topicoId: launchParams.topicoId,
          returnTo: launchParams.returnTo || "/revisoes",
        });
      }
    }

    void qc.invalidateQueries({ queryKey: ["pomodoro-topicos"] });
    void qc.invalidateQueries({ queryKey: ["pomodoro-topicos-page"] });
    void qc.invalidateQueries({ queryKey: ["pomodoro-topicos-timer"] });

    saveMutation.mutate({
      mode: "livre",
      focus_hours: h,
      focus_minutes: m,
      short_break_minutes: shortBreakMinutes,
      long_break_minutes: longBreakMinutes,
      cycles_target: cyclesTarget,
      last_disciplina_id: launchParams.disciplinaId,
      last_topico_id: launchParams.topicoId,
    });

    navigate("/pomodoro", { replace: true });
    const launchLabel = launchParams.source === "revisao"
      ? "Revisão"
      : launchParams.source === "dashboard" ? "Próxima ação" : "Sessão do cronograma";
    toast.success(`${launchLabel} carregada — clique em Iniciar quando estiver pronto.`);
  }, [
    launchParams,
    launchSignature,
    navigate,
    qc,
    saveMutation,
    shortBreakMinutes,
    longBreakMinutes,
    cyclesTarget,
    prepareRevisao,
  ]);

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

  const pageTitle = revisaoContext ? "Revisão" : mode === "cronometro" ? "Cronômetro" : "Pomodoro";

  const finishRevision = React.useCallback(async (session: {
    inicio: string;
    fim: string;
    tempoEstudoSegundos: number;
  }) => {
    const returnTo = useRevisaoPomodoroStore.getState().context?.returnTo || "/revisoes";
    const result = await completePomodoroRevision(qc, session);
    if (result === "success") {
      toast.success("Revisão concluída e registrada.");
      navigate(returnTo);
      return true;
    }
    toast.error(result === "conflict"
      ? "A revisão foi alterada. Volte à Central e atualize os dados antes de tentar novamente."
      : "Não foi possível concluir a revisão. Tente novamente sem perder o tempo registrado.");
    return false;
  }, [navigate, qc]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-muted text-primary">
            <Timer className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {timerActive ? "Sessão em andamento" : pageTitle}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {timerActive
                ? revisaoContext
                  ? "Foque no estudo — use Concluir revisão para registrar."
                  : "Foque no estudo — use Encerrar e salvar para registrar."
                : "Configure horas e minutos de foco, inicie o timer e registre seu progresso."}
            </p>
          </div>
        </div>
        {!revisaoContext ? (
          <Button type="button" variant="outline" className="gap-2" onClick={() => setOpenRegistro(true)}>
            <BookOpen className="h-4 w-4" />
            Registro manual
          </Button>
        ) : null}
      </div>

      {revisaoContext && revisaoConflict ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Esta revisão foi atualizada em outro contexto</AlertTitle>
          <AlertDescription>
            O tempo continua preservado localmente. Volte à Central, atualize a revisão e inicie uma nova tentativa com a versão atual.
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 block"
              onClick={() => navigate(revisaoContext.returnTo || "/revisoes")}
            >
              Voltar à Central de revisões
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className={cn("grid items-start gap-6", !timerActive && "lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]")}>
        <div className="lg:sticky lg:top-20">
          <PomodoroTimer
            onActiveChange={setTimerActive}
            disciplinaNome={disciplinaNome}
            topicoNome={topicoNome}
            revisionMode={Boolean(revisaoContext)}
            onRevisionFinish={finishRevision}
            onRevisionDiscard={clearRevisao}
          />
        </div>

        {!timerActive && !revisaoContext ? (
          <PomodoroConfigPanel
            key={`${disciplinaId ?? ""}-${topicoId ?? ""}`}
            disciplinas={disciplinas}
            loadingDisciplinas={isLoading}
            onPersist={persistConfig}
          />
        ) : revisaoContext ? (
          <div className="rounded-xl border border-primary/30 bg-primary-muted/60 px-4 py-3 text-sm text-accent-foreground dark:bg-primary/10 dark:text-primary-200">
            Disciplina e tópico estão vinculados à revisão e não podem ser alterados durante esta sessão.
          </div>
        ) : (
          <div className="rounded-xl border border-primary/30 bg-primary-muted/60 px-4 py-3 text-sm text-accent-foreground dark:bg-primary/10 dark:text-primary-200">
            Configurações ocultas durante a sessão. Pause ou encerre para alterar duração, modo e disciplina.
          </div>
        )}
      </div>

      {!revisaoContext ? (
        <RegistroEstudoModal
          open={openRegistro}
          onClose={() => setOpenRegistro(false)}
          defaultDisciplinaId={disciplinaId}
          defaultTopicos={topicoId && topicoNome ? [{ id: topicoId, nome: topicoNome }] : null}
        />
      ) : null}
    </div>
  );
}
