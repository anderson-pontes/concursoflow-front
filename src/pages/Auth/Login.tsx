import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  AuthEmailField,
  AuthLinkButton,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthSeparatorOu,
  GoogleSignInButton,
} from "@/components/auth/AuthFields";
import { AuthShell } from "@/components/auth/AuthShell";
import { AprovingoLogo } from "@/components/branding/AprovingoLogo";
import { api } from "@/services/api";
import { startCheckout } from "@/services/billing";
import { fetchCurrentUser } from "@/services/currentUser";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
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
  const [paywall, setPaywall] = React.useState<{ message: string } | null>(null);

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
    onError: (err) => {
      setShakeLogin(true);
      window.setTimeout(() => setShakeLogin(false), 450);
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setPaywall({ message: loginErrorMessage(err) });
      } else {
        setPaywall(null);
      }
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const { email, password } = form.getValues();
      return startCheckout(email, password);
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const forgotMutation = useMutation({
    mutationFn: async (email: string) => {
      await api.post("/auth/forgot-password", { email });
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
      <div className="mb-6 hidden justify-center md:flex">
        <AprovingoLogo className="h-10 w-auto max-w-[200px] shrink-0 md:hidden" />
      </div>

      {authMode === "forgot" ? (
        <div className="pb-8">
          <AuthLinkButton onClick={goLogin} className="mb-6">
            ← Voltar ao login
          </AuthLinkButton>

          {!forgotSent ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-muted">
                  <span className="text-2xl" aria-hidden>
                    ✉️
                  </span>
                </div>
              </div>
              <h1 className="text-center text-2xl font-bold text-foreground">Recuperar senha</h1>
              <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Digite seu e-mail e enviaremos um link de redefinição.
              </p>

              <form
                className="mt-8 space-y-4"
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
              className="mt-4 rounded-xl border border-success/30 bg-success/10 p-4 text-center"
              role="status"
            >
              <p className="text-lg" aria-hidden>
                ✅
              </p>
              <p className="mt-2 text-sm font-semibold text-success">
                Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-[28px]">Entrar na sua conta</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Acesse sua conta para continuar estudando.</p>
          </div>

          <form
            className={cn("space-y-4", shakeLogin && "auth-form-shake")}
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
          >
            <AuthEmailField id="login-email" registration={register("email")} error={errors.email?.message} />
            <div>
              <AuthPasswordField id="login-password" registration={register("password")} error={errors.password?.message} />
              <div className="-mt-1 flex justify-end">
                <AuthLinkButton onClick={goForgot}>Esqueci minha senha</AuthLinkButton>
              </div>
            </div>

            <div className="pt-1">
              <AuthPrimaryButton loading={mutation.isPending} loadingLabel="Entrando...">
                Entrar
              </AuthPrimaryButton>
            </div>

            {mutation.isError && !paywall ? (
              <div className="text-sm text-destructive" role="alert">
                {loginErrorMessage(mutation.error)}
              </div>
            ) : null}

            {paywall ? (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4" role="alert">
                <p className="text-sm font-semibold text-warning-800 dark:text-warning">{paywall.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Conclua o pagamento da assinatura para liberar seu acesso.
                </p>
                <button
                  type="button"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-700 disabled:opacity-60"
                >
                  {checkoutMutation.isPending ? "Redirecionando..." : "Assinar / renovar agora"}
                </button>
                {checkoutMutation.isError ? (
                  <p className="mt-2 text-xs text-destructive">{loginErrorMessage(checkoutMutation.error)}</p>
                ) : null}
              </div>
            ) : null}
          </form>

          <AuthSeparatorOu />

          <AuthSecondaryButton onClick={() => navigate("/register")}>Criar Conta</AuthSecondaryButton>

          <div className="mt-4">
            <GoogleSignInButton disabled />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground sm:mt-7">
            Não tem conta?{" "}
            <AuthLinkButton onClick={() => navigate("/register")} className="font-bold">
              Criar conta grátis
            </AuthLinkButton>
          </p>
        </>
      )}
    </AuthShell>
  );
}
