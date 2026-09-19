import React from "react";
import { BookCheck, BookOpen, ClipboardPlus, ExternalLink, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { findPrimaryEditalAction, mapEditalActions, type EditalAction, type EditalActionId } from "@/lib/edital/editalActions";
import { buildPomodoroLaunchUrlFromStudy, buildPomodoroRevisionLaunchUrl } from "@/lib/pomodoro/launchFromCronograma";
import { usePomodoroSessionStore } from "@/stores/pomodoroSessionStore";
import { useRevisaoPomodoroStore } from "@/stores/revisaoPomodoroStore";
import type { TopicoEditalItem } from "@/types/editalVerticalizado";

export type EditalReturnState = {
  editalContestId: string;
  editalSearch: string;
  editalPageCount: number;
  editalScrollY?: number;
  editalFocusId?: string;
};

type Props = {
  item: TopicoEditalItem;
  concursoId: string;
  concursoStatus: string;
  durationMinutes: number | null;
  returnTo: string;
  returnState: EditalReturnState;
  onRegister: (item: TopicoEditalItem) => void;
};

const labels: Record<EditalActionId, string> = {
  review: "Revisar",
  study: "Estudar agora",
  register: "Registrar atividade",
  open_topic: "Abrir tópico",
};

const disabledReasons = {
  CONTEST_NOT_ACTIVE: "Disponível apenas quando o concurso está ativo.",
  INVALID_DURATION: "Configure uma duração do Pomodoro entre 1 e 480 minutos.",
  REVIEW_NOT_ELIGIBLE: "A revisão não está elegível neste momento.",
} as const;

export function EditalTopicActions(props: Props) {
  const navigate = useNavigate();
  const hasSession = usePomodoroSessionStore((state) => state.hasSession);
  const [sessionDialogOpen, setSessionDialogOpen] = React.useState(false);
  const launchingRef = React.useRef(false);
  const actions = mapEditalActions({
    concursoStatus: props.concursoStatus,
    item: props.item,
    hasValidDuration: props.durationMinutes !== null,
  });
  const primary = findPrimaryEditalAction(actions)
    ?? actions.find((action) => action.id === "open_topic")!;
  const secondary = actions.filter((action) => action.id !== primary.id && action.state !== "hidden");

  const contextualReturnState = (): EditalReturnState => ({
    ...props.returnState,
    editalScrollY: window.scrollY,
    editalFocusId: props.item.id,
  });
  const contextualReturnTo = () => {
    const [pathname, rawSearch = ""] = props.returnTo.split("?");
    const search = new URLSearchParams(rawSearch);
    search.set("expandida", props.item.id);
    return `${pathname}?${search.toString()}`;
  };

  const openTopic = () => navigate(
    `/disciplinas/${props.item.disciplina_id}?topico=${props.item.id}`,
    { state: { editalReturnTo: contextualReturnTo(), editalReturnState: contextualReturnState() } },
  );

  const launch = (actionId: "study" | "review") => {
    if (hasSession) {
      setSessionDialogOpen(true);
      return;
    }
    if (!props.durationMinutes) {
      toast.error(disabledReasons.INVALID_DURATION);
      return;
    }
    if (launchingRef.current) return;
    launchingRef.current = true;
    if (actionId === "review") {
      if (!props.item.proxima_revisao_id || !props.item.proxima_revisao_versao) {
        launchingRef.current = false;
        return;
      }
      const context = {
        revisaoId: props.item.proxima_revisao_id,
        revisaoVersao: props.item.proxima_revisao_versao,
        concursoId: props.concursoId,
        disciplinaId: props.item.disciplina_id,
        topicoId: props.item.id,
        returnTo: contextualReturnTo(),
        returnState: contextualReturnState(),
      };
      useRevisaoPomodoroStore.getState().prepare(context);
      navigate(buildPomodoroRevisionLaunchUrl({ ...context, minutos: props.durationMinutes }));
      return;
    }
    navigate(buildPomodoroLaunchUrlFromStudy({
      source: "edital",
      concursoId: props.concursoId,
      disciplinaId: props.item.disciplina_id,
      topicoId: props.item.id,
      minutos: props.durationMinutes,
      returnTo: contextualReturnTo(),
    }));
  };

  const runAction = (action: EditalAction) => {
    if (action.state === "disabled") return;
    if (action.id === "open_topic") return openTopic();
    if (action.id === "register") {
      if (hasSession) toast.info("A sessão atual continuará em execução enquanto você registra a atividade.");
      props.onRegister(props.item);
      return;
    }
    launch(action.id);
  };

  return (
    <>
      <div className="flex min-w-max items-center justify-end gap-1.5">
        <Button
          data-edital-topic={props.item.id}
          size="sm"
          variant={primary.id === "open_topic" ? "outline" : "default"}
          disabled={primary.state === "disabled" || launchingRef.current}
          title={primary.reason ? disabledReasons[primary.reason] : undefined}
          onClick={() => runAction(primary)}
        >
          {primary.id === "review" ? <BookCheck aria-hidden="true" /> : primary.id === "study" ? <BookOpen aria-hidden="true" /> : <ExternalLink aria-hidden="true" />}
          {labels[primary.id]}
        </Button>
        {secondary.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={`Mais ações para ${props.item.descricao}`}>
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              {secondary.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  disabled={action.state === "disabled"}
                  title={action.reason ? disabledReasons[action.reason] : undefined}
                  onSelect={() => runAction(action)}
                >
                  {action.id === "review" ? <BookCheck /> : action.id === "study" ? <BookOpen /> : action.id === "register" ? <ClipboardPlus /> : <ExternalLink />}
                  <span className="flex flex-col">
                    <span>{labels[action.id]}</span>
                    {action.reason ? <span className="text-xs text-muted-foreground">{disabledReasons[action.reason]}</span> : null}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <AlertDialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você já tem uma sessão em andamento</AlertDialogTitle>
            <AlertDialogDescription>
              A sessão atual será preservada, inclusive se estiver pausada ou em intervalo. Continue nela ou permaneça no edital.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Permanecer no edital</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/pomodoro")}>Continuar sessão atual</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
