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
  GoogleSignInButton,
} from "@/components/auth/AuthFields";
import { AuthShell } from "@/components/auth/AuthShell";
import { AprovingoLogo } from "@/components/branding/AprovingoLogo";
import { api } from "@/services/api";
import { fetchCurrentUser } from "@/services/currentUser";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha muito curta"),
});

type LoginForm = z.infer<typeof loginSchema>;

const forgotSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

function loginErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { detail?: string | unknown } | undefined;
    if (typeof d?.detail === "string") return d.detail;
  }
  if (err instanceof Error) return err.message;
  return "Erro ao entrar";
}

export function Login() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [authMode, setAuthMode] = React.useState<"login" | "forgot">("login");
  const [shakeLogin, setShakeLogin] = React.useState(false);
  const [forgotSent, setForgotSent] = React.useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const forgotForm = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: async (values: LoginForm) => {
      const body = new URLSearchParams();
      body.append("username", values.email);
      body.append("password", values.password);

      const res = await api.post("/auth/login", body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
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
      setShakeLogin(true);
      window.setTimeout(() => setShakeLogin(false), 450);
    },
  });

  const forgotMutation = useMutation({
    mutationFn: async (_email: string) => {
      /* Endpoint de recuperação ainda não exposto na API; delay apenas para UX */
      await new Promise((r) => setTimeout(r, 500));
    },
    onSuccess: () => setForgotSent(true),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const {
    register: regForgot,
    handleSubmit: submitForgot,
    formState: { errors: forgotErrors },
    reset: resetForgot,
  } = forgotForm;

  const goForgot = () => {
    setAuthMode("forgot");
    setForgotSent(false);
    resetForgot();
  };

  const goLogin = () => {
    setAuthMode("login");
    setForgotSent(false);
    resetForgot();
  };

  return (
    <AuthShell>
      {/* Mobile: logo compacta no topo */}
      <div className="mb-8 flex justify-center md:hidden">
        <AprovingoLogo className="h-10 w-auto max-w-[200px] shrink-0" />
      </div>

      {authMode === "forgot" ? (
        <div className="pb-16 md:pb-8">
          <button
            type="button"
            onClick={goLogin}
            className="mb-6 text-[13px] font-medium text-[#6C3FC5] transition-colors hover:text-[#5B32A8] hover:underline"
          >
            ← Voltar ao login
          </button>

          {!forgotSent ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#F3F0FF]">
                  <span className="text-[28px]" aria-hidden>
                    ✉️
                  </span>
                </div>
              </div>
              <h1 className="text-center text-2xl font-bold text-[#1A1A2E]">Recuperar senha</h1>
              <p className="mx-auto mt-2 max-w-sm text-center text-sm text-[#6B7280]">
                Digite seu e-mail e enviaremos um link de redefinição.
              </p>

              <form
                className="mt-8 space-y-[18px]"
                onSubmit={submitForgot((vals) => forgotMutation.mutate(vals.email))}
              >
                <AuthEmailField id="forgot-email" registration={regForgot("email")} error={forgotErrors.email?.message} />
                <AuthPrimaryButton loading={forgotMutation.isPending} loadingLabel="Enviando...">
                  Enviar link de recuperação
                </AuthPrimaryButton>
              </form>
            </>
          ) : (
            <div
              className="mt-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-center"
              role="status"
            >
              <p className="text-lg" aria-hidden>
                ✅
              </p>
              <p className="mt-2 text-sm font-semibold text-[#166534]">Link enviado! Verifique seu e-mail.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-9">
            <h1 className="text-[28px] font-bold text-[#1A1A2E]">Entrar na sua conta</h1>
            <p className="mt-1.5 text-sm text-[#6B7280]">Acesse sua conta para continuar estudando.</p>
          </div>

          <form
            className={cn("space-y-[18px]", shakeLogin && "auth-form-shake")}
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
          >
            <AuthEmailField id="login-email" registration={register("email")} error={errors.email?.message} />
            <div>
              <AuthPasswordField id="login-password" registration={register("password")} error={errors.password?.message} />
              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={goForgot}
                  className="text-[13px] font-medium text-[#6C3FC5] transition-colors hover:text-[#5B32A8] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>

            <div className="pt-2">
              <AuthPrimaryButton loading={mutation.isPending} loadingLabel="Entrando...">
                Entrar
              </AuthPrimaryButton>
            </div>

            {mutation.isError ? (
              <div className="text-sm text-[#EF4444]" role="alert">
                {loginErrorMessage(mutation.error)}
              </div>
            ) : null}
          </form>

          <AuthSeparatorOu />

          <GoogleSignInButton />

          <p className="mt-7 text-center text-sm text-[#6B7280]">
            Não tem conta?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-bold text-[#6C3FC5] transition-colors hover:underline"
            >
              Criar conta grátis
            </button>
          </p>
        </>
      )}
    </AuthShell>
  );
}
