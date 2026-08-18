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
import { DatePicker } from "@/components/ui/date-picker";
import { SelectField } from "@/components/ui/select-field";
import { isValidCpf } from "@/lib/cpfValidate";
import {
  maskCpf,
  maskPhoneBr,
  unmaskCpf,
  unmaskPhone,
} from "@/lib/inputMasks";
import { api } from "@/services/api";
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
  })
  .superRefine((d, ctx) => {
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
    },
    mode: "onBlur",
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const password = watch("password");

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

  if (submitted) {
    return (
      <AuthShell logoAsLink>
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
    <AuthShell logoAsLink>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-[28px]">Criar sua conta</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Preencha os dados e conclua a assinatura para acessar a plataforma.
        </p>
      </div>

      <form
        className={cn("space-y-6", shakeForm && "auth-form-shake")}
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
      >
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Dados pessoais</h2>
          <AuthTextField
            id="reg-name"
            label="Nome completo *"
            icon="👤"
            registration={register("name")}
            error={errors.name?.message}
          />
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
            <DatePicker className="mt-1" value={watch("birth_date")} onValueChange={(value) => setValue("birth_date", value, { shouldDirty: true, shouldValidate: true })} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">Sexo</span>
            <SelectField className="mt-1" value={watch("gender") ?? ""} onValueChange={(value) => setValue("gender", value, { shouldDirty: true, shouldValidate: true })} options={[{ value: "", label: "Selecione" }, { value: "feminino", label: "Feminino" }, { value: "masculino", label: "Masculino" }, { value: "outro", label: "Outro" }, { value: "prefiro_nao_informar", label: "Prefiro não informar" }]} />
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
          <AuthEmailField
            id="reg-email"
            label="E-mail"
            registration={register("email")}
            error={errors.email?.message}
          />
          <AuthEmailField
            id="reg-email2"
            label="Confirmar e-mail"
            registration={register("email_confirm")}
            error={errors.email_confirm?.message}
          />
          <AuthPasswordField id="reg-password" registration={register("password")} error={errors.password?.message} />
          <PasswordStrength password={password} />
          <AuthPasswordField
            id="reg-confirm"
            label="Confirmar senha *"
            registration={register("password_confirm")}
            error={errors.password_confirm?.message}
          />
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
