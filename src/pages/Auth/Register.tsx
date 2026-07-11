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
  AuthTextField,
} from "@/components/auth/AuthFields";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { isValidCpf } from "@/lib/cpfValidate";
import { maskCpf, maskPhoneBr, unmaskCpf, unmaskPhone } from "@/lib/inputMasks";
import { api } from "@/services/api";
import { STUDY_GOAL_OPTIONS, STUDY_LEVEL_OPTIONS } from "@/types/userManagement";
import { cn } from "@/lib/utils";

const strongPw = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const registerSchema = z
  .object({
    name: z.string().min(3, "Nome completo obrigatório"),
    cpf: z.string().optional(),
    birth_date: z.string().optional(),
    gender: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email("E-mail inválido"),
    email_confirm: z.string().email("Confirme o e-mail"),
    password: z.string().min(8, "Mínimo 8 caracteres").regex(strongPw, "Senha fraca"),
    password_confirm: z.string().min(8),
    study_goal: z.string().optional(),
    target_contest: z.string().optional(),
    desired_role: z.string().optional(),
    study_level: z.string().optional(),
    study_area: z.string().optional(),
    daily_study_time: z.string().optional(),
    referral_source: z.string().optional(),
    accept_terms: z.boolean(),
    accept_privacy: z.boolean(),
    marketing_opt_in: z.boolean().optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.accept_terms) {
      ctx.addIssue({ code: "custom", message: "Aceite os Termos de Uso", path: ["accept_terms"] });
    }
    if (!d.accept_privacy) {
      ctx.addIssue({ code: "custom", message: "Aceite a Política de Privacidade", path: ["accept_privacy"] });
    }
    if (d.email !== d.email_confirm) {
      ctx.addIssue({ code: "custom", message: "Os e-mails não coincidem", path: ["email_confirm"] });
    }
    if (d.password !== d.password_confirm) {
      ctx.addIssue({ code: "custom", message: "As senhas não coincidem", path: ["password_confirm"] });
    }
    const cpfDigits = d.cpf ? unmaskCpf(d.cpf) : "";
    if (cpfDigits && !isValidCpf(cpfDigits)) {
      ctx.addIssue({ code: "custom", message: "CPF inválido", path: ["cpf"] });
    }
  });

type RegisterForm = z.infer<typeof registerSchema>;

function registerErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { detail?: string | { msg: string }[] } | undefined;
    if (typeof d?.detail === "string") return d.detail;
    if (Array.isArray(d?.detail)) return d.detail.map((x) => x.msg).join(", ");
  }
  if (err instanceof Error) return err.message;
  return "Erro ao cadastrar";
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

export function Register() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = React.useState(false);
  const [shakeForm, setShakeForm] = React.useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      cpf: "",
      birth_date: "",
      gender: "",
      phone: "",
      whatsapp: "",
      email: "",
      email_confirm: "",
      password: "",
      password_confirm: "",
      study_goal: "",
      target_contest: "",
      desired_role: "",
      study_level: "",
      study_area: "",
      daily_study_time: "",
      referral_source: "",
      accept_terms: false,
      accept_privacy: false,
      marketing_opt_in: false,
    },
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: async (values: RegisterForm) => {
      const cpf = values.cpf ? unmaskCpf(values.cpf) : null;
      const payload = {
        name: values.name,
        cpf: cpf || null,
        birth_date: values.birth_date || null,
        gender: values.gender || null,
        phone: values.phone ? unmaskPhone(values.phone) : null,
        whatsapp: values.whatsapp ? unmaskPhone(values.whatsapp) : null,
        email: values.email,
        email_confirm: values.email_confirm,
        password: values.password,
        password_confirm: values.password_confirm,
        study_goal: values.study_goal || null,
        target_contest: values.target_contest || null,
        desired_role: values.desired_role || null,
        study_level: values.study_level || null,
        study_area: values.study_area || null,
        daily_study_time: values.daily_study_time || null,
        referral_source: values.referral_source || null,
        accept_terms: true,
        accept_privacy: true,
        marketing_opt_in: Boolean(values.marketing_opt_in),
      };
      const res = await api.post("/auth/register", payload);
      return res.data as { message: string; user_id: string; checkout_url?: string | null };
    },
    onSuccess: (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      setSubmitted(true);
    },
    onError: () => {
      setShakeForm(true);
      window.setTimeout(() => setShakeForm(false), 450);
    },
  });

  const { register, handleSubmit, watch, formState: { errors } } = form;
  const password = watch("password");

  if (submitted) {
    return (
      <AuthShell>
        <div className="mx-auto max-w-md text-center">
          <div className="mb-6 text-4xl" aria-hidden>
            ✅
          </div>
          <h1 className="text-2xl font-bold text-foreground">Cadastro concluído!</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sua conta foi criada. Para liberar o acesso, conclua o pagamento da assinatura. Assim que o pagamento for
            confirmado, você poderá entrar com seu e-mail e senha.
          </p>
          <AuthLinkButton onClick={() => navigate("/login")} className="mt-8 font-bold">
            Ir para o login
          </AuthLinkButton>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-[28px]">Criar sua conta</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Preencha os dados e conclua a assinatura para acessar a plataforma.
        </p>
      </div>

      <form
        className={cn("max-h-[min(70vh,640px)] space-y-6 overflow-y-auto pr-1", shakeForm && "auth-form-shake")}
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
      >
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Dados pessoais</h2>
          <AuthTextField id="reg-name" label="Nome completo *" icon="👤" registration={register("name")} error={errors.name?.message} />
          <label className="block text-sm">
            <span className="font-medium text-foreground">CPF</span>
            <input
              className={fieldClass}
              {...register("cpf", {
                onChange: (e) => {
                  e.target.value = maskCpf(e.target.value);
                },
              })}
            />
            {errors.cpf ? <span className="text-xs text-destructive">{errors.cpf.message}</span> : null}
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Data de nascimento</span>
            <input type="date" className={fieldClass} {...register("birth_date")} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Sexo</span>
            <select className={fieldClass} {...register("gender")}>
              <option value="">Selecione</option>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
              <option value="outro">Outro</option>
              <option value="prefiro_nao_informar">Prefiro não informar</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Telefone celular</span>
            <input
              className={fieldClass}
              {...register("phone", {
                onChange: (e) => {
                  e.target.value = maskPhoneBr(e.target.value);
                },
              })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">WhatsApp</span>
            <input
              className={fieldClass}
              {...register("whatsapp", {
                onChange: (e) => {
                  e.target.value = maskPhoneBr(e.target.value);
                },
              })}
            />
          </label>
          <AuthEmailField id="reg-email" registration={register("email")} error={errors.email?.message} />
          <AuthEmailField id="reg-email2" registration={register("email_confirm")} error={errors.email_confirm?.message} />
          <AuthPasswordField id="reg-password" registration={register("password")} error={errors.password?.message} />
          <PasswordStrength password={password} />
          <AuthPasswordField
            id="reg-confirm"
            label="Confirmar senha *"
            registration={register("password_confirm")}
            error={errors.password_confirm?.message}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Informações do estudante</h2>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Objetivo principal</span>
            <select className={fieldClass} {...register("study_goal")}>
              <option value="">Selecione</option>
              {STUDY_GOAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Concurso alvo</span>
            <input className={fieldClass} {...register("target_contest")} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Cargo desejado</span>
            <input className={fieldClass} {...register("desired_role")} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Nível</span>
            <select className={fieldClass} {...register("study_level")}>
              <option value="">Selecione</option>
              {STUDY_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Área de estudo</span>
            <input className={fieldClass} {...register("study_area")} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Tempo disponível por dia</span>
            <input className={fieldClass} placeholder="Ex: 2 horas" {...register("daily_study_time")} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Como conheceu a plataforma</span>
            <input className={fieldClass} {...register("referral_source")} />
          </label>
        </section>

        <section className="space-y-2 text-sm text-foreground">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1 accent-primary" {...register("accept_terms")} />
            <span>Aceito os Termos de Uso *</span>
          </label>
          {errors.accept_terms ? <span className="text-xs text-destructive">{errors.accept_terms.message}</span> : null}
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1 accent-primary" {...register("accept_privacy")} />
            <span>Aceito a Política de Privacidade *</span>
          </label>
          {errors.accept_privacy ? <span className="text-xs text-destructive">{errors.accept_privacy.message}</span> : null}
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1 accent-primary" {...register("marketing_opt_in")} />
            <span>Desejo receber novidades</span>
          </label>
        </section>

        <AuthPrimaryButton loading={mutation.isPending} loadingLabel="Processando...">
          Continuar para o pagamento
        </AuthPrimaryButton>

        {mutation.isError ? (
          <div className="text-sm text-destructive" role="alert">
            {registerErrorMessage(mutation.error)}
          </div>
        ) : null}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <AuthLinkButton onClick={() => navigate("/login")} className="font-bold">
          Entrar
        </AuthLinkButton>
      </p>
    </AuthShell>
  );
}
