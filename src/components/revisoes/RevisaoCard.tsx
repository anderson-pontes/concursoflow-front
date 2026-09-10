import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ArrowUpRight, CalendarClock, Ellipsis, Play } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDisciplinaDashboardUrl } from "@/lib/pomodoro/launchFromCronograma";
import type { RevisaoGrupo, RevisaoItem } from "@/types/revisao";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { RevisaoDialogAction } from "@/components/revisoes/RevisaoActionDialogs";

const groupLabels: Record<RevisaoGrupo, string> = {
  hoje: "Para hoje",
  atrasadas: "Atrasada",
  proximas: "Próxima",
  concluidas: "Concluída",
  ignoradas: "Ignorada",
};

function formatDateTime(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Data indisponível";
}

type Props = {
  item: RevisaoItem;
  grupo: RevisaoGrupo;
  conflict?: boolean;
  onStart: (item: RevisaoItem) => void;
  onAction: (item: RevisaoItem, action: RevisaoDialogAction) => void;
  onRefreshConflict: (itemId: string) => void;
};

export function RevisaoCard({ item, grupo, conflict, onStart, onAction, onRefreshConflict }: Props) {
  const pending = item.status === "pendente";
  return (
    <Card size="sm" className="gap-3">
      <CardHeader className="gap-x-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-primary">
            {item.disciplina_nome}
          </p>
          <CardTitle className="mt-1 line-clamp-3 sm:line-clamp-2">{item.topico_nome}</CardTitle>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {groupLabels[grupo]}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-4 text-primary" aria-hidden="true" />
          Prevista para {format(parseISO(item.data_prevista_atual), "dd/MM/yyyy", { locale: ptBR })}
        </span>
        <span>Última alteração em {formatDateTime(item.ultima_transicao_em)}</span>
        {conflict ? (
          <Alert variant="destructive" className="mt-2 basis-full">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>A revisão foi atualizada</AlertTitle>
            <AlertDescription>
              Confira o estado atual antes de tentar novamente.
              <Button type="button" variant="outline" size="sm" className="mt-2 block" onClick={() => onRefreshConflict(item.id)}>
                Atualizar revisão
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
      <CardFooter className="gap-2 border-t bg-muted/30 px-3 py-3 sm:justify-end sm:px-4">
        {pending ? (
          <Button type="button" className="min-h-11 flex-1 sm:flex-none" onClick={() => onStart(item)}>
            <Play className="size-4" aria-hidden="true" />
            Iniciar revisão
          </Button>
        ) : (
          <Button asChild variant="outline" className="min-h-11 flex-1 sm:flex-none">
            <Link to={buildDisciplinaDashboardUrl(item.disciplina_id, item.topico_id)}>
              Abrir tópico
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="icon" className="size-11" aria-label={`Mais ações para ${item.topico_nome}`}>
              <Ellipsis className="size-5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuItem asChild>
              <Link to={buildDisciplinaDashboardUrl(item.disciplina_id, item.topico_id)}>
                <ArrowUpRight aria-hidden="true" /> Abrir tópico
              </Link>
            </DropdownMenuItem>
            {pending ? (
              <>
                <DropdownMenuItem onSelect={() => onAction(item, "concluir")}>Registrar conclusão</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAction(item, "reagendar")}>Reagendar</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => onAction(item, "ignorar")}>Ignorar revisão</DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
