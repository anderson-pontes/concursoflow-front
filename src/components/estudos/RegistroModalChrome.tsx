import { Calendar, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

export function RegistroDateSelector({ kind, customDate, onKindChange, onCustomDateChange }: { kind: "hoje" | "ontem" | "outro"; customDate: string; onKindChange: (kind: "hoje" | "ontem" | "outro") => void; onCustomDateChange: (date: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="h-4 w-4 text-primary" aria-hidden />
      {(["hoje", "ontem", "outro"] as const).map((option) => (
        <Button key={option} type="button" variant={kind === option ? "default" : "outline"} onClick={() => onKindChange(option)} className="min-h-11">
          {option === "hoje" ? "Hoje" : option === "ontem" ? "Ontem" : "Outro"}
        </Button>
      ))}
      {kind === "outro" ? <DatePicker value={customDate} onValueChange={onCustomDateChange} className="min-w-48" /> : null}
    </div>
  );
}

export function RegistroModalHeader({ editing, onClose }: { editing: boolean; onClose: () => void }) {
  return (
    <div className="border-b border-border px-6 py-5">
      <div className="flex items-center justify-between gap-3">
        <DialogTitle className="text-2xl font-semibold text-foreground">{editing ? "Editar registro de estudo" : "Registro de estudo"}</DialogTitle>
        <Button type="button" variant="outline" size="icon" onClick={onClose} aria-label="Fechar"><X /></Button>
      </div>
    </div>
  );
}

export function RegistroModalFooter({ editing, busy, onClose, onSave }: { editing: boolean; busy: boolean; onClose: () => void; onSave: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-5">
      <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
      <Button type="button" onClick={onSave} disabled={busy}>{editing ? "Salvar alterações" : "Salvar registro"}</Button>
    </div>
  );
}

export function NovaCategoriaDialog({ open, name, busy, onOpenChange, onNameChange, onSubmit }: { open: boolean; name: string; busy: boolean; onOpenChange: (open: boolean) => void; onNameChange: (name: string) => void; onSubmit: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nova categoria</DialogTitle><DialogDescription>Crie uma categoria para organizar este registro de estudo.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          <div className="space-y-2">
            <Label htmlFor="nova-categoria-nome">Nome da categoria</Label>
            <Input id="nova-categoria-nome" autoFocus value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Ex.: Simulado" maxLength={80} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!name.trim() || busy}>{busy ? "Criando…" : "Criar categoria"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
