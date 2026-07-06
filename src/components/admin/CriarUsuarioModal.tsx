import React from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { createUserAdmin } from "@/services/adminUsers";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const strongPw = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const fieldClass =
  "mt-1 w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm outline-none focus:border-primary-500";

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-border/40 bg-background p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Criar usuário</h3>
          <button type="button" className="text-muted-foreground hover:text-foreground" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="font-medium">Nome completo</span>
            <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="font-medium">E-mail</span>
            <input className={fieldClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Senha</span>
            <input className={fieldClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <span className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, com maiúscula, número e símbolo.
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium">Perfil</span>
              <select className={fieldClass} value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")}>
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Status</span>
              <select className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="pendente">Pendente</option>
                <option value="bloqueado">Bloqueado</option>
                <option value="inativo">Inativo</option>
              </select>
            </label>
          </div>

          {role === "admin" ? (
            <p className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">
              Administradores têm acesso total e não dependem de assinatura.
            </p>
          ) : null}

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="rounded-md border border-border/40 px-4 py-2 text-sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-60"
            onClick={submit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Criando…" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
