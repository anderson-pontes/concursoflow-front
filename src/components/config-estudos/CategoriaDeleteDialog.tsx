import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type CategoriaDeleteDialogProps = {
  open: boolean;
  nome: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
};

export function CategoriaDeleteDialog({
  open,
  nome,
  onClose,
  onConfirm,
  isPending = false,
}: CategoriaDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isPending) onClose();
      }}
    >
      <DialogContent
        hideClose
        className="w-full max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl"
      >
        <div className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold text-card-foreground">
            Excluir categoria?
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            A categoria “{nome}” será removida. Não é possível excluir se houver estudos vinculados.
          </DialogDescription>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="min-h-10 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isPending ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
