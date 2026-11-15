import React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Planejamento } from "@/lib/cronograma/types";

type Props = {
  open: boolean;
  plan: Planejamento;
  contestName: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ExcluirPlanejamentoDialog({ open, plan, contestName, pending, onClose, onConfirm }: Props) {
  const [confirmed, setConfirmed] = React.useState(false);
  React.useEffect(() => {
    if (open) setConfirmed(false);
  }, [open]);

  return <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Excluir cronograma?</DialogTitle>
        <DialogDescription>
          O cronograma {plan.nome} ({plan.tipo === "manual" ? "Manual" : "Automático"}) de {contestName} será arquivado. A programação futura será retirada; sessões realizadas e histórico de estudos serão preservados.
        </DialogDescription>
      </DialogHeader>
      <label className="flex min-h-11 items-start gap-2 text-sm">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        <span>Confirmo a exclusão deste cronograma e a preservação do meu histórico.</span>
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant="destructive" disabled={!confirmed || pending} onClick={onConfirm}>{pending ? "Excluindo…" : "Excluir cronograma"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
