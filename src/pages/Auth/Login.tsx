import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha muito curta"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
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
    onSuccess: (data) => {
      setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
      navigate("/dashboard");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-900">
      <div className="hidden md:flex md:w-[42%] lg:w-[40%] bg-primary-600 p-10 flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-primary-400 opacity-40" />
          <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-primary-800 opacity-50" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-600" fill="none" aria-hidden="true">
                  <path d="M12 3 4 7.5 12 12l8-4.5L12 3Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M7 10.5V14c0 1.7 2.2 3 5 3s5-1.3 5-3v-3.5" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <span className="text-white font-medium text-lg">ConcursoFlow</span>
            </div>
            <h2 className="text-white text-2xl font-medium leading-snug mb-3">
              Sua aprovação começa com organização.
            </h2>
            <p className="text-primary-200 text-sm leading-relaxed">
              Gerencie seus estudos, acompanhe seu progresso e alcance sua meta com mais foco.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-2.5">
            {[
              { cor: "bg-success-400", texto: "+1.200 concurseiros já usam a plataforma" },
              { cor: "bg-warning-400", texto: "Pomodoro, cronograma e simulados em um só lugar" },
              { cor: "bg-primary-200", texto: "Heatmap e métricas para visualizar sua evolução" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5">
                <span className={`w-2 h-2 rounded-full ${item.cor} shrink-0`} />
                <span className="text-primary-100 text-xs">{item.texto}</span>
              </div>
            ))}
          </div>
      </div>

      <div className="flex-1 bg-white dark:bg-neutral-800 p-6 sm:p-10 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          <div className="mb-7">
            <h1 className="text-xl font-medium text-neutral-900 dark:text-neutral-50 mb-1">
              Entrar na sua conta
            </h1>
            <p className="text-sm text-neutral-400">Acesse sua conta para continuar estudando.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                aria-invalid={errors.email ? "true" : "false"}
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
                {...register("email")}
              />
              {errors.email ? <div className="mt-1 text-xs text-danger-600">{errors.email.message}</div> : null}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
                Senha
              </label>
              <input
                type="password"
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
                {...register("password")}
              />
              {errors.password ? <div className="mt-1 text-xs text-danger-600">{errors.password.message}</div> : null}
            </div>

            <div className="text-right">
              <button type="button" className="text-xs text-primary-600 hover:text-primary-800 transition-colors duration-150">
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-primary-600 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition-colors duration-150 active:scale-[.98] disabled:opacity-60"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Entrando..." : "Entrar"}
            </button>

            {mutation.isError ? (
              <div className="text-sm text-danger-600">
                {mutation.error instanceof Error ? mutation.error.message : "Erro ao entrar"}
              </div>
            ) : null}
          </form>

          <div className="flex items-center gap-3 my-3 text-xs text-neutral-400">
            <span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-600" />
            ou
            <span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-600" />
          </div>

          <button
            type="button"
            className="w-full h-10 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 2.7 14.6 2 12 2 6.9 2 2.8 6.3 2.8 11.5S6.9 21 12 21c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12Z" />
            </svg>
            Continuar com Google
          </button>

          <p className="text-center text-xs text-neutral-400 mt-5">
            Não tem conta?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-primary-600 hover:text-primary-800 transition-colors duration-150"
            >
              Criar conta grátis
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

