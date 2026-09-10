import React from "react";
import { isAxiosError } from "axios";
import { format, subMinutes } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";

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
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { invalidateRevisaoContext } from "@/lib/revisoes/queryKeys";
import { concluirRevisao, ignorarRevisao, reagendarRevisao } from "@/services/revisoes";
import type { RevisaoItem } from "@/types/revisao";
import { useQueryClient } from "@tanstack/react-query";

export type RevisaoDialogAction = "concluir" | "reagendar" | "ignorar";

type Props = {
  item: RevisaoItem | null;
  action: RevisaoDialogAction | null;
  onClose: () => void;
  onConflict: (itemId: string) => void;
};

const manualSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data."),
  inicio: z.string().regex(/^\d{2}:\d{2}$/, "Informe o horário inicial."),
  fim: z.string().regex(/^\d{2}:\d{2}$/, "Informe o horário final."),
}).superRefine((value, context) => {
  const inicio = new Date(`${value.data}T${value.inicio}:00`);
  const fim = new Date(`${value.data}T${value.fim}:00`);
  if (fim <= inicio) context.addIssue({ code: "custom", path: ["fim"], message: "O fim deve ser posterior ao início." });
  if (fim > new Date()) context.addIssue({ code: "custom", path: ["fim"], message: "O fim não pode estar no futuro." });
});

function apiMessage(error: unknown) {
  if (!isAxiosError(error)) return "Não foi possível concluir a ação.";
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail.message === "string") return detail.message;
  return "Não foi possível concluir a ação.";
}

function commandContext(item: RevisaoItem, idempotencyKey: string) {
  return {
    revisaoId: item.id,
    concursoId: item.concurso_id,
    versaoEsperada: item.versao,
    idempotencyKey,
  };
}

export function RevisaoActionDialogs({ item, action, onClose, onConflict }: Props) {
  const queryClient = useQueryClient();
  const [data, setData] = React.useState(() => format(new Date(), "yyyy-MM-dd"));
  const [inicio, setInicio] = React.useState(() => format(subMinutes(new Date(), 25), "HH:mm"));
  const [fim, setFim] = React.useState(() => format(new Date(), "HH:mm"));
  const [novaData, setNovaData] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const keyRef = React.useRef(crypto.randomUUID());

  React.useEffect(() => {
    const current = new Date();
    setData(format(current, "yyyy-MM-dd"));
    setInicio(format(subMinutes(current, 25), "HH:mm"));
    setFim(format(current, "HH:mm"));
    setNovaData("");
    setError(null);
    keyRef.current = crypto.randomUUID();
  }, [item?.id, action]);

  const run = async () => {
    if (!item || !action || action === "ignorar") return;
    setError(null);
    setPending(true);
    try {
      if (action === "reagendar") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
          setError("Escolha a nova data da revisão.");
          return;
        }
        await reagendarRevisao(commandContext(item, keyRef.current), novaData);
        toast.success("Revisão reagendada.");
      } else {
        const parsed = manualSchema.safeParse({ data, inicio, fim });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message || "Revise os horários informados.");
          return;
        }
        const inicioDate = new Date(`${data}T${inicio}:00`);
        const fimDate = new Date(`${data}T${fim}:00`);
        await concluirRevisao(commandContext(item, keyRef.current), {
          inicio: inicioDate.toISOString(),
          fim: fimDate.toISOString(),
          tempo_estudo_segundos: Math.round((fimDate.getTime() - inicioDate.getTime()) / 1000),
        });
        toast.success("Revisão concluída e registrada.");
      }
      await invalidateRevisaoContext(queryClient, item.concurso_id);
      onClose();
    } catch (caught) {
      if (isAxiosError(caught) && caught.response?.status === 409) {
        onConflict(item.id);
        await queryClient.invalidateQueries({ queryKey: ["revisoes", item.concurso_id] });
        onClose();
      } else {
        setError(apiMessage(caught));
      }
    } finally {
      setPending(false);
    }
  };

  const confirmIgnore = async () => {
    if (!item) return;
    setPending(true);
    try {
      await ignorarRevisao(commandContext(item, keyRef.current));
      await invalidateRevisaoContext(queryClient, item.concurso_id);
      toast.success("Revisão ignorada. O histórico auditável foi preservado.");
      onClose();
    } catch (caught) {
      if (isAxiosError(caught) && caught.response?.status === 409) {
        onConflict(item.id);
        await queryClient.invalidateQueries({ queryKey: ["revisoes", item.concurso_id] });
        onClose();
      } else {
        toast.error(apiMessage(caught));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Dialog open={Boolean(item && action && action !== "ignorar")} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "reagendar" ? "Reagendar revisão" : "Registrar conclusão"}</DialogTitle>
            <DialogDescription>
              {item?.disciplina_nome} · {item?.topico_nome}
            </DialogDescription>
          </DialogHeader>
          {action === "reagendar" ? (
            <div className="space-y-2">
              <Label htmlFor="revisao-nova-data">Nova data</Label>
              <DatePicker id="revisao-nova-data" value={novaData} onValueChange={setNovaData} min={format(new Date(), "yyyy-MM-dd")} aria-label="Nova data da revisão" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="revisao-data-conclusao">Data</Label>
                <DatePicker id="revisao-data-conclusao" value={data} onValueChange={setData} max={format(new Date(), "yyyy-MM-dd")} aria-label="Data da conclusão" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revisao-inicio">Início</Label>
                <TimePicker id="revisao-inicio" value={inicio} onValueChange={setInicio} aria-label="Horário inicial" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revisao-fim">Fim</Label>
                <TimePicker id="revisao-fim" value={fim} onValueChange={setFim} aria-label="Horário final" />
              </div>
            </div>
          )}
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button>
            <Button type="button" disabled={pending} onClick={() => void run()}>
              {pending ? "Salvando…" : action === "reagendar" ? "Confirmar reagendamento" : "Registrar conclusão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(item && action === "ignorar")} onOpenChange={(open) => !open && onClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ignorar esta revisão?</AlertDialogTitle>
            <AlertDialogDescription>
              Ela sairá da fila ativa, mas a decisão continuará registrada no histórico auditável.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Manter revisão</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={(event) => {
              event.preventDefault();
              void confirmIgnore();
            }}>
              {pending ? "Ignorando…" : "Ignorar revisão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
