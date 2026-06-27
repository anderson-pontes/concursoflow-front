import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

import { AuthPasswordField, AuthPrimaryButton } from "@/components/auth/AuthFields";
import { AuthShell } from "@/components/auth/AuthShell";
import { api } from "@/services/api";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Inclua uma maiúscula")
      .regex(/\d/, "Inclua um número")
      .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type Form = z.infer<typeof schema>;

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const [done, setDone] = React.useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: Form) => {
      await api.post("/auth/reset-password", { token, new_password: values.newPassword });
    },
    onSuccess: () => setDone(true),
  });

  if (!token) {
    return (
      <AuthShell>
        <p className="text-sm text-rose-600">Link inválido. Solicite uma nova recuperação de senha.</p>
        <button type="button" className="mt-4 text-[#6C3FC5] font-bold" onClick={() => navigate("/login")}>
          Voltar ao login
        </button>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <h1 className="text-2xl font-bold">Senha redefinida</h1>
        <p className="mt-2 text-sm text-muted-foreground">Você já pode entrar com a nova senha.</p>
        <button type="button" className="mt-6 text-[#6C3FC5] font-bold" onClick={() => navigate("/login")}>
          Ir para o login
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-[#1A1A2E]">Nova senha</h1>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
        <AuthPasswordField
          id="new-password"
          label="Nova senha"
          registration={form.register("newPassword")}
          error={form.formState.errors.newPassword?.message}
        />
        <AuthPasswordField
          id="confirm-password"
          label="Confirmar senha"
          registration={form.register("confirmPassword")}
          error={form.formState.errors.confirmPassword?.message}
        />
        <AuthPrimaryButton loading={mutation.isPending}>Salvar nova senha</AuthPrimaryButton>
        {mutation.isError && axios.isAxiosError(mutation.error) ? (
          <p className="text-sm text-rose-600">{(mutation.error.response?.data as { detail?: string })?.detail ?? "Erro"}</p>
        ) : null}
      </form>
    </AuthShell>
  );
}
