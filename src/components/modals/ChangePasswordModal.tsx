import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { changePasswordApi } from "@/services/profileApi";
import { isAxiosError } from "axios";

const strongPw = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula")
  .regex(/\d/, "Inclua um número")
  .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial");

const schema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: strongPw,
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordModal({ open, onOpenChange }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPw = form.watch("newPassword");

  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await changePasswordApi(values.currentPassword, values.newPassword);
      toast.success("Senha alterada com sucesso.");
      onOpenChange(false);
      form.reset();
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { detail?: string })?.detail ?? e.message
        : "Não foi possível alterar a senha.";
      toast.error(typeof msg === "string" ? msg : "Erro ao alterar senha.");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="pwd-desc">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription id="pwd-desc">
            Use uma senha forte com maiúscula, número e caractere especial.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="cp-current">Senha atual</Label>
            <input
              id="cp-current"
              type="password"
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register("currentPassword")}
            />
            {form.formState.errors.currentPassword ? (
              <p className="mt-1 text-xs text-danger-600">{form.formState.errors.currentPassword.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="cp-new">Nova senha</Label>
            <input
              id="cp-new"
              type="password"
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register("newPassword")}
            />
            <PasswordStrength password={newPw} className="mt-2" />
            {form.formState.errors.newPassword ? (
              <p className="mt-1 text-xs text-danger-600">{form.formState.errors.newPassword.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="cp-confirm">Confirmar nova senha</Label>
            <input
              id="cp-confirm"
              type="password"
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="mt-1 text-xs text-danger-600">{form.formState.errors.confirmPassword.message}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
