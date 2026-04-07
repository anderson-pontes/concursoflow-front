import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  AuthEmailField,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthSeparatorOu,
  AuthTextField,
  GoogleSignInButton,
} from "@/components/auth/AuthFields";
import { AuthShell } from "@/components/auth/AuthShell";
import { AprovingoLogo } from "@/components/branding/AprovingoLogo";
import { api } from "@/services/api";
import { fetchCurrentUser } from "@/services/currentUser";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome muito curto"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Senha muito curta"),
    confirmPassword: z.string().min(6, "Confirme a senha"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function registerErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { detail?: string | unknown } | undefined;
    if (typeof d?.detail === "string") return d.detail;
  }
  if (err instanceof Error) return err.message;
  return "Erro ao cadastrar";
}

export function Register() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [shakeForm, setShakeForm] = React.useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: async (values: RegisterForm) => {
      const { confirmPassword: _c, ...payload } = values;
      const res = await api.post("/auth/register", payload);
      return res.data as {
        access_token: string;
        refresh_token: string;
      };
    },
    onSuccess: async (data) => {
      setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
      try {
        const user = await fetchCurrentUser();
        setUser(user);
      } catch {
        setUser(null);
      }
      navigate("/dashboard");
    },
    onError: () => {
      setShakeForm(true);
      window.setTimeout(() => setShakeForm(false), 450);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <AuthShell>
      <div className="mb-8 flex justify-center md:hidden">
        <AprovingoLogo className="h-10 w-auto max-w-[200px] shrink-0" />
      </div>

      <div className="mb-9">
        <h1 className="text-[28px] font-bold text-[#1A1A2E]">Criar sua conta grátis</h1>
        <p className="mt-1.5 text-sm text-[#6B7280]">Comece a estudar com mais organização hoje.</p>
      </div>

      <form className={cn("space-y-[18px]", shakeForm && "auth-form-shake")} onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <AuthTextField
          id="reg-name"
          label="Nome completo"
          icon="👤"
          autoComplete="name"
          registration={register("name")}
          error={errors.name?.message}
        />
        <AuthEmailField id="reg-email" registration={register("email")} error={errors.email?.message} />
        <AuthPasswordField id="reg-password" registration={register("password")} error={errors.password?.message} />
        <AuthPasswordField
          id="reg-confirm"
          label="Confirmar senha"
          registration={register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <div className="pt-2">
          <AuthPrimaryButton loading={mutation.isPending} loadingLabel="Criando...">
            Criar minha conta →
          </AuthPrimaryButton>
        </div>

        {mutation.isError ? (
          <div className="text-sm text-[#EF4444]" role="alert">
            {registerErrorMessage(mutation.error)}
          </div>
        ) : null}
      </form>

      <AuthSeparatorOu />

      <GoogleSignInButton />

      <p className="mt-7 text-center text-sm text-[#6B7280]">
        Já tem conta?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="font-bold text-[#6C3FC5] transition-colors hover:underline"
        >
          Entrar
        </button>
      </p>
    </AuthShell>
  );
}
