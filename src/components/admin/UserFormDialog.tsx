import React from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { createUserAdmin, updateUserAdmin } from "@/services/adminUsers";
import type { AdminUserListItem, UserStatus } from "@/types/userManagement";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUserListItem | null;
  onSaved: () => void;
};

const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function apiMessage(error: unknown) {
  if (isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    if (typeof detail === "string") return detail;
  }
  return "Não foi possível salvar o usuário.";
}

export function UserFormDialog({ open, onOpenChange, user, onSaved }: Props) {
  const editing = Boolean(user);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"user" | "admin">("user");
  const [status, setStatus] = React.useState<UserStatus>("ativo");
  const [error, setError] = React.useState<string | null>(null);
  const initialized = React.useRef(false);
  const baseline = React.useRef({ name: "", email: "", role: "user", status: "ativo" });
  const targetId = React.useRef<string | undefined>(user?.id);
  const { requestConfirmation, confirmDialog } = useConfirmDialog();

  React.useEffect(() => {
    if (!open) { initialized.current = false; return; }
    if (initialized.current) return;
    initialized.current = true;
    targetId.current = user?.id;
    baseline.current = { name: user?.name ?? "", email: user?.email ?? "", role: user?.role === "admin" ? "admin" : "user", status: user?.status ?? "ativo" };
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
    setRole(user?.role === "admin" ? "admin" : "user");
    setStatus(user?.status ?? "ativo");
    setError(null);
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: async () => {
      const common = { name: name.trim(), email: email.trim(), role, status };
      if (targetId.current) return updateUserAdmin(targetId.current, common);
      return createUserAdmin({ ...common, password });
    },
    onSuccess: () => {
      toast.success(editing ? "Usuário atualizado" : "Usuário criado");
      onSaved();
      onOpenChange(false);
    },
    onError: (requestError) => setError(apiMessage(requestError)),
  });

  const dirty = name !== baseline.current.name || email !== baseline.current.email || role !== baseline.current.role || status !== baseline.current.status || Boolean(password);
  const requestClose = async () => {
    if (mutation.isPending) return;
    if (!dirty || await requestConfirmation({ title: "Descartar alterações?", description: "Os dados do usuário ainda não foram salvos.", confirmLabel: "Descartar", cancelLabel: "Continuar editando", variant: "destructive" })) onOpenChange(false);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 3) return setError("Informe o nome completo.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Informe um e-mail válido.");
    if (!editing && !strongPassword.test(password)) {
      return setError("A senha deve ter 8 caracteres, maiúscula, número e símbolo.");
    }
    mutation.mutate();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(next) => { if (!next) void requestClose(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {editing ? "Atualize os dados de acesso e permissão." : "Crie manualmente uma conta com acesso ao ClickEdital."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <fieldset disabled={mutation.isPending} className="min-w-0 space-y-4">
          <div className="space-y-2"><Label htmlFor="user-name">Nome completo <span aria-hidden>*</span></Label><Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></div>
          <div className="space-y-2"><Label htmlFor="user-email">E-mail <span aria-hidden>*</span></Label><Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
          {!editing ? <div className="space-y-2"><Label htmlFor="user-password">Senha temporária <span aria-hidden>*</span></Label><Input id="user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /><p className="text-xs text-muted-foreground">Mínimo de 8 caracteres, com maiúscula, número e símbolo.</p></div> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="user-role">Perfil</Label><SelectField id="user-role" aria-label="Perfil" value={role} onValueChange={(v) => setRole(v as "user" | "admin")} options={[{ value: "user", label: "Usuário" }, { value: "admin", label: "Administrador" }]} /></div>
            <div className="space-y-2"><Label htmlFor="user-status">Status</Label><SelectField id="user-status" aria-label="Status" value={status} onValueChange={(v) => setStatus(v as UserStatus)} options={[{ value: "ativo", label: "Ativo" }, { value: "pendente", label: "Pendente" }, { value: "bloqueado", label: "Bloqueado" }, { value: "inativo", label: "Inativo" }]} /></div>
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => void requestClose()}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Salvando..." : "Salvar usuário"}</Button>
          </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
    {confirmDialog}
    </>
  );
}
