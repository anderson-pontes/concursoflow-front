import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome muito curto"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Senha muito curta"),
  })
  .required();

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onSubmit",
  });

  const mutation = useMutation({
    mutationFn: async (values: RegisterForm) => {
      const res = await api.post("/auth/register", values);
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
    register: rhfRegister,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-4">
      <div className="w-full space-y-4 rounded-xl border border-border/40 bg-background/70 p-6">
        <div>
          <h1 className="text-xl font-semibold">Criar conta</h1>
          <p className="text-sm text-muted-foreground">Cadastre seus dados para começar.</p>
        </div>

        <form
          className="space-y-3"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <label className="block">
            <span className="text-sm font-medium">Nome</span>
            <input
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              type="text"
              aria-invalid={errors.name ? "true" : "false"}
              {...rhfRegister("name")}
            />
            {errors.name ? <div className="mt-1 text-xs text-danger-600">{errors.name.message}</div> : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium">E-mail</span>
            <input
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              type="email"
              aria-invalid={errors.email ? "true" : "false"}
              {...rhfRegister("email")}
            />
            {errors.email ? (
              <div className="mt-1 text-xs text-danger-600">{errors.email.message}</div>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Senha</span>
            <input
              className="mt-1 w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm outline-none"
              type="password"
              aria-invalid={errors.password ? "true" : "false"}
              {...rhfRegister("password")}
            />
            {errors.password ? (
              <div className="mt-1 text-xs text-danger-600">{errors.password.message}</div>
            ) : null}
          </label>

          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-800 disabled:opacity-60"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Criando..." : "Criar"}
          </button>

          {mutation.isError ? (
            <div className="text-sm text-danger-600">
              {mutation.error instanceof Error ? mutation.error.message : "Erro ao cadastrar"}
            </div>
          ) : null}
        </form>

        <button
          type="button"
          className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm hover:bg-muted"
          onClick={() => navigate("/login")}
        >
          Voltar ao login
        </button>
      </div>
    </div>
  );
}

