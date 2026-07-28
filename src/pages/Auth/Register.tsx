import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";

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
import {
  maskCep,
  maskCpf,
  maskPhoneBr,
  unmaskCep,
  unmaskCpf,
  unmaskPhone,
} from "@/lib/inputMasks";
import { api } from "@/services/api";
import { lookupCep } from "@/services/viaCep";
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
    address_cep: z.string().min(1, "CEP obrigatório"),
    address_street: z.string().min(1, "Logradouro obrigatório"),
    address_number: z.string().min(1, "Número obrigatório"),
    address_complement: z.string().optional(),
    address_neighborhood: z.string().min(1, "Bairro obrigatório"),
    address_city: z.string().min(1, "Cidade obrigatória"),
    address_state: z.string().min(1, "UF obrigatória"),
    accept_terms: z.boolean(),
    accept_privacy: z.boolean(),
    marketing_opt_in: z.boolean().optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.accept_terms) {
      ctx.addIssue({ code: "custom", message: "Aceite os Termos de Uso", path: ["accept_terms"] });
    }
    if (!d.accept_privacy) {
      ctx.addIssue({
        code: "custom",
        message: "Aceite a Política de Privacidade",
        path: ["accept_privacy"],
      });
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
    const cepDigits = unmaskCep(d.address_cep);
    if (cepDigits.length !== 8) {
      ctx.addIssue({ code: "custom", message: "CEP deve ter 8 dígitos", path: ["address_cep"] });
    }
    const uf = d.address_state.trim().toUpperCase();
    if (uf.length !== 2 || !/^[A-Z]{2}$/.test(uf)) {
      ctx.addIssue({ code: "custom", message: "UF inválida", path: ["address_state"] });
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
  const [cepLoading, setCepLoading] = React.useState(false);
  const [cepStatusMsg, setCepStatusMsg] = React.useState<string | null>(null);
  const [cepError, setCepError] = React.useState<string | null>(null);
  const numberRef = React.useRef<HTMLInputElement | null>(null);
  const lastAttemptedCep = React.useRef<string>("");
  const cepAbortRef = React.useRef<AbortController | null>(null);

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
      address_cep: "",
      address_street: "",
      address_number: "",
      address_complement: "",
      address_neighborhood: "",
      address_city: "",
      address_state: "",
      accept_terms: false,
      accept_privacy: false,
      marketing_opt_in: false,
    },
    mode: "onBlur",
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const password = watch("password");
  const addressCep = watch("address_cep");

  const runCepLookup = React.useCallback(
    async (rawCep: string, opts?: { force?: boolean }) => {
      const digits = unmaskCep(rawCep);
      if (digits.length !== 8) return;
      if (!opts?.force && digits === lastAttemptedCep.current) return;

      lastAttemptedCep.current = digits;
      cepAbortRef.current?.abort();
      const ac = new AbortController();
      cepAbortRef.current = ac;

      setCepLoading(true);
      setCepError(null);
      setCepStatusMsg("Buscando…");

      const result = await lookupCep(digits, ac.signal);
      if (result.ok === false && result.reason === "aborted") return;

      setCepLoading(false);
      setCepStatusMsg(null);

      if (!result.ok) {
        if (result.reason === "not_found") {
          setCepError("CEP não encontrado. Preencha o endereço manualmente.");
        } else if (result.reason === "network") {
          setCepError("Não foi possível buscar o CEP. Tente de novo ou preencha manualmente.");
        }
        return;
      }

      setCepError(null);
      setValue("address_street", result.data.logradouro || "", { shouldValidate: true });
      setValue("address_neighborhood", result.data.bairro || "", { shouldValidate: true });
      setValue("address_city", result.data.localidade || "", { shouldValidate: true });
      setValue("address_state", (result.data.uf || "").toUpperCase(), { shouldValidate: true });
      if (result.data.complemento) {
        setValue("address_complement", result.data.complemento, { shouldValidate: true });
      }
      window.setTimeout(() => numberRef.current?.focus(), 0);
    },
    [setValue],
  );

  React.useEffect(() => {
    const digits = unmaskCep(addressCep ?? "");
    if (digits.length !== 8) {
      lastAttemptedCep.current = "";
      return;
    }
    const t = window.setTimeout(() => {
      void runCepLookup(digits);
    }, 400);
    return () => window.clearTimeout(t);
  }, [addressCep, runCepLookup]);

  React.useEffect(() => {
    return () => cepAbortRef.current?.abort();
  }, []);

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
        address_cep: unmaskCep(values.address_cep),
        address_street: values.address_street.trim(),
        address_number: values.address_number.trim(),
        address_complement: values.address_complement?.trim() || null,
        address_neighborhood: values.address_neighborhood.trim(),
        address_city: values.address_city.trim(),
        address_state: values.address_state.trim().toUpperCase(),
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

  const numberReg = register("address_number");

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
          <AuthEmailField
            id="reg-email2"
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

        <section className="space-y-3" aria-labelledby="reg-address-heading">
          <div>
            <h2 id="reg-address-heading" className="text-sm font-semibold text-foreground">
              Endereço
            </h2>
            <p id="reg-address-hint" className="mt-0.5 text-xs text-muted-foreground">
              Digite o CEP para preencher o endereço.
            </p>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-foreground">CEP *</span>
            <div className="relative">
              <input
                className={cn(fieldClass, cepLoading && "pr-28")}
                inputMode="numeric"
                autoComplete="postal-code"
                aria-describedby="reg-address-hint"
                aria-busy={cepLoading}
                {...register("address_cep", {
                  onChange: (e) => {
                    e.target.value = maskCep(e.target.value);
                    setCepError(null);
                  },
                  onBlur: (e) => {
                    void runCepLookup(e.target.value, { force: true });
                  },
                })}
              />
              {cepLoading ? (
                <span
                  className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Buscando…
                </span>
              ) : null}
            </div>
            {cepStatusMsg && !cepLoading ? (
              <span className="sr-only" aria-live="polite">
                {cepStatusMsg}
              </span>
            ) : null}
            {cepError ? (
              <span className="mt-1 block text-xs text-destructive" role="alert">
                {cepError}
              </span>
            ) : null}
            {errors.address_cep ? (
              <span className="mt-1 block text-xs text-destructive">{errors.address_cep.message}</span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="font-medium text-foreground">Logradouro *</span>
            <input className={fieldClass} autoComplete="street-address" {...register("address_street")} />
            {errors.address_street ? (
              <span className="text-xs text-destructive">{errors.address_street.message}</span>
            ) : null}
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-1 block text-sm">
              <span className="font-medium text-foreground">Número *</span>
              <input
                className={fieldClass}
                {...numberReg}
                ref={(el) => {
                  numberReg.ref(el);
                  numberRef.current = el;
                }}
              />
              {errors.address_number ? (
                <span className="text-xs text-destructive">{errors.address_number.message}</span>
              ) : null}
            </label>
            <label className="col-span-2 block text-sm">
              <span className="font-medium text-foreground">Complemento</span>
              <input className={fieldClass} {...register("address_complement")} />
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-foreground">Bairro *</span>
            <input className={fieldClass} {...register("address_neighborhood")} />
            {errors.address_neighborhood ? (
              <span className="text-xs text-destructive">{errors.address_neighborhood.message}</span>
            ) : null}
          </label>

          <div className="grid grid-cols-[1fr_4.5rem] gap-3">
            <label className="block text-sm">
              <span className="font-medium text-foreground">Cidade *</span>
              <input className={fieldClass} autoComplete="address-level2" {...register("address_city")} />
              {errors.address_city ? (
                <span className="text-xs text-destructive">{errors.address_city.message}</span>
              ) : null}
            </label>
            <label className="block text-sm">
              <span className="font-medium text-foreground">UF *</span>
              <input
                className={cn(fieldClass, "uppercase")}
                maxLength={2}
                autoComplete="address-level1"
                {...register("address_state", {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
                  },
                })}
              />
              {errors.address_state ? (
                <span className="text-xs text-destructive">{errors.address_state.message}</span>
              ) : null}
            </label>
          </div>
        </section>

        <section className="space-y-2 text-sm text-foreground">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1 accent-primary" {...register("accept_terms")} />
            <span>Aceito os Termos de Uso *</span>
          </label>
          {errors.accept_terms ? (
            <span className="text-xs text-destructive">{errors.accept_terms.message}</span>
          ) : null}
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1 accent-primary" {...register("accept_privacy")} />
            <span>Aceito a Política de Privacidade *</span>
          </label>
          {errors.accept_privacy ? (
            <span className="text-xs text-destructive">{errors.accept_privacy.message}</span>
          ) : null}
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
