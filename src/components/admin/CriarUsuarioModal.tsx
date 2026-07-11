import React from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { createUserAdmin } from "@/services/adminUsers";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const strongPw = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const fieldClass =
  "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CriarUsuarioModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"user" | "admin">("user");
  const [status, setStatus] = React.useState("ativo");
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("user");
    setStatus("ativo");
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: () => createUserAdmin({ name, email, password, role, status }),
    onSuccess: () => {
      toast.success(role === "admin" ? "Administrador criado" : "Usuário criado");
      reset();
      onCreated();
      onClose();
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? ((err.response?.data as { detail?: string } | undefined)?.detail ?? "Erro ao criar usuário")
        : "Erro ao criar usuário";
      setError(String(msg));
    },
  });

  const submit = () => {
    setError(null);
    if (name.trim().length < 3) return setError("Informe o nome completo.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("E-mail inválido.");
    if (!strongPw.test(password)) {
      return setError("Senha fraca: mínimo 8 caracteres, com maiúscula, número e símbolo.");
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        hideClose
        aria-describedby={undefined}
        className="flex max-h-[min(92dvh,720px)] w-full max-w-md flex-col gap-0 overflow-hidden rounded-t-2xl border border-border bg-card p-0 shadow-xl sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold text-foreground">Criar usuário</DialogTitle>
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="font-medium text-foreground">Nome completo</span>
              <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-foreground">E-mail</span>
              <input className={fieldClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-foreground">Senha</span>
              <input className={fieldClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <span className="text-xs text-muted-foreground">
                Mínimo 8 caracteres, com maiúscula, número e símbolo.
              </span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-foreground">Perfil</span>
                <select className={fieldClass} value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")}>
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-foreground">Status</span>
                <select className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="bloqueado">Bloqueado</option>
                  <option value="inativo">Inativo</option>
                </select>
              </label>
            </div>

            {role === "admin" ? (
              <p className="rounded-lg bg-primary-muted px-3 py-2 text-xs text-accent-foreground">
                Administradores têm acesso total e não dependem de assinatura.
              </p>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            className="min-h-11 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-700 disabled:opacity-60"
            onClick={submit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Criando…" : "Criar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
