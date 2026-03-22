import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInYears, parseISO } from "date-fns";
import { ArrowLeft, CreditCard, MapPin, UserCircle } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/FormSection";
import { Label } from "@/components/ui/label";
import { BR_UFS } from "@/lib/brasilUfs";
import { isValidCpf } from "@/lib/cpfValidate";
import { maskCep, maskCpf, maskPhoneBr, unmaskCep, unmaskCpf, unmaskPhone } from "@/lib/inputMasks";
import { getMeApi, mapMeToAuthUser, updateMeApi, type MeApiResponse } from "@/services/profileApi";
import { fetchViaCep } from "@/services/viaCep";
import { useAuthStore } from "@/stores/authStore";
import { isAxiosError } from "axios";

function formatDateForInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = parseISO(iso.includes("T") ? iso : `${iso}T12:00:00`);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

const profileSchema = z
  .object({
    name: z.string().min(3, "Mínimo 3 caracteres").max(100),
    cpf: z.string().optional(),
    phone: z.string().optional(),
    birth_date: z.string().optional(),
    address_cep: z.string().optional(),
    address_street: z.string().optional(),
    address_number: z.string().optional(),
    address_complement: z.string().optional(),
    address_neighborhood: z.string().optional(),
    address_city: z.string().optional(),
    address_state: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const cpfDigits = unmaskCpf(data.cpf ?? "");
    if (cpfDigits.length > 0 && (cpfDigits.length !== 11 || !isValidCpf(cpfDigits))) {
      ctx.addIssue({ code: "custom", message: "CPF inválido", path: ["cpf"] });
    }
    if (data.birth_date) {
      try {
        const d = parseISO(data.birth_date);
        if (Number.isNaN(d.getTime())) {
          ctx.addIssue({ code: "custom", message: "Data inválida", path: ["birth_date"] });
        } else if (differenceInYears(new Date(), d) < 18) {
          ctx.addIssue({ code: "custom", message: "É necessário ter pelo menos 18 anos", path: ["birth_date"] });
        }
      } catch {
        ctx.addIssue({ code: "custom", message: "Data inválida", path: ["birth_date"] });
      }
    }
  });

type ProfileForm = z.infer<typeof profileSchema>;

function meToForm(m: MeApiResponse): ProfileForm {
  return {
    name: m.name ?? "",
    cpf: m.cpf ? maskCpf(m.cpf) : "",
    phone: m.phone ? maskPhoneBr(m.phone) : "",
    birth_date: formatDateForInput(m.birth_date),
    address_cep: m.address_cep ? maskCep(m.address_cep.replace(/\D/g, "")) : "",
    address_street: m.address_street ?? "",
    address_number: m.address_number ?? "",
    address_complement: m.address_complement ?? "",
    address_neighborhood: m.address_neighborhood ?? "",
    address_city: m.address_city ?? "",
    address_state: m.address_state ?? "",
  };
}

type PerfilFormContentProps = {
  serverMe: MeApiResponse;
  onCancel: () => void;
};

function PerfilFormContent({ serverMe, onCancel }: PerfilFormContentProps) {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: meToForm(serverMe),
  });

  const mutation = useMutation({
    mutationFn: async (values: ProfileForm) => {
      const cpfDigits = unmaskCpf(values.cpf ?? "");
      const body = {
        name: values.name,
        cpf: cpfDigits.length === 11 ? cpfDigits : null,
        phone: unmaskPhone(values.phone ?? "").length ? unmaskPhone(values.phone ?? "") : null,
        birth_date: values.birth_date || null,
        address_cep: unmaskCep(values.address_cep ?? "").length ? unmaskCep(values.address_cep ?? "") : null,
        address_street: values.address_street?.trim() || null,
        address_number: values.address_number?.trim() || null,
        address_complement: values.address_complement?.trim() || null,
        address_neighborhood: values.address_neighborhood?.trim() || null,
        address_city: values.address_city?.trim() || null,
        address_state: values.address_state?.trim().toUpperCase() || null,
      };
      return updateMeApi(body);
    },
    onSuccess: (res) => {
      setUser(mapMeToAuthUser(res));
      queryClient.setQueryData(["auth-me-profile"], res);
      queryClient.invalidateQueries({ queryKey: ["auth-me-profile"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (e) => {
      const msg = isAxiosError(e)
        ? (e.response?.data as { detail?: string | unknown })?.detail
        : null;
      toast.error(typeof msg === "string" ? msg : "Não foi possível salvar o perfil.");
    },
  });

  const onCepLookup = async () => {
    const cep = unmaskCep(getValues("address_cep") ?? "");
    if (cep.length !== 8) {
      toast.error("Informe um CEP com 8 dígitos.");
      return;
    }
    const r = await fetchViaCep(cep);
    if (!r) {
      toast.error("CEP não encontrado.");
      return;
    }
    setValue("address_street", r.logradouro || "");
    setValue("address_neighborhood", r.bairro || "");
    setValue("address_city", r.localidade || "");
    setValue("address_state", r.uf || "");
    toast.success("Endereço preenchido pelo CEP.");
  };

  const onSubmit = handleSubmit((v) => mutation.mutate(v));

  const handleCancelClick = () => {
    onCancel();
  };

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <FormSection title="Dados pessoais" icon={<UserCircle className="h-4 w-4" />}>
        <div>
          <Label htmlFor="pf-name">Nome completo</Label>
          <input
            id="pf-name"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={mutation.isPending}
            {...register("name")}
          />
          {formState.errors.name ? (
            <p className="mt-1 text-xs text-danger-600">{formState.errors.name.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="pf-email">E-mail</Label>
          <input
            id="pf-email"
            readOnly
            value={serverMe.email ?? ""}
            className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pf-cpf">CPF</Label>
            <input
              id="pf-cpf"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              value={watch("cpf") ?? ""}
              onChange={(e) => setValue("cpf", maskCpf(e.target.value), { shouldValidate: true })}
            />
            {formState.errors.cpf ? (
              <p className="mt-1 text-xs text-danger-600">{formState.errors.cpf.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="pf-phone">Telefone</Label>
            <input
              id="pf-phone"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              value={watch("phone") ?? ""}
              onChange={(e) => setValue("phone", maskPhoneBr(e.target.value), { shouldValidate: true })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="pf-birth">Data de nascimento</Label>
          <input
            id="pf-birth"
            type="date"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={mutation.isPending}
            {...register("birth_date")}
          />
          {formState.errors.birth_date ? (
            <p className="mt-1 text-xs text-danger-600">{formState.errors.birth_date.message}</p>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Endereço" icon={<MapPin className="h-4 w-4" />}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Label htmlFor="pf-cep">CEP</Label>
            <input
              id="pf-cep"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              value={watch("address_cep") ?? ""}
              onChange={(e) => setValue("address_cep", maskCep(e.target.value))}
              onBlur={() => {
                const c = unmaskCep(getValues("address_cep") ?? "");
                if (c.length === 8) void onCepLookup();
              }}
            />
          </div>
          <Button type="button" variant="outline" className="shrink-0" onClick={onCepLookup}>
            Buscar
          </Button>
        </div>
        <div>
          <Label htmlFor="pf-street">Logradouro</Label>
          <input
            id="pf-street"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={mutation.isPending}
            {...register("address_street")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pf-num">Número</Label>
            <input
              id="pf-num"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              {...register("address_number")}
            />
          </div>
          <div>
            <Label htmlFor="pf-comp">Complemento</Label>
            <input
              id="pf-comp"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              {...register("address_complement")}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="pf-bairro">Bairro</Label>
          <input
            id="pf-bairro"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={mutation.isPending}
            {...register("address_neighborhood")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pf-city">Cidade</Label>
            <input
              id="pf-city"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              {...register("address_city")}
            />
          </div>
          <div>
            <Label htmlFor="pf-uf">Estado (UF)</Label>
            <select
              id="pf-uf"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              {...register("address_state")}
            >
              <option value="">Selecione</option>
              {BR_UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      <section className="rounded-xl border border-dashed border-border bg-muted/30 p-5 opacity-80 dark:border-neutral-600 dark:bg-neutral-900/30">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Forma de pagamento</h2>
          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
            Em breve
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Integração com Stripe — cartão de crédito e débito.
        </p>
        <Button type="button" className="mt-4" disabled>
          Configurar pagamento
        </Button>
        {/* TODO: Stripe integration — ver PLANO_STRIPE.md */}
      </section>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
        <Button type="button" variant="outline" onClick={handleCancelClick} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

export function Perfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverMe, setServerMe] = React.useState<MeApiResponse | null>(null);
  const [formResetKey, setFormResetKey] = React.useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["auth-me-profile"],
    queryFn: getMeApi,
  });

  React.useEffect(() => {
    if (data) setServerMe(data);
  }, [data]);

  const handleCancel = React.useCallback(() => {
    const cached = queryClient.getQueryData<MeApiResponse>(["auth-me-profile"]);
    const src = cached ?? data;
    if (!src) return;
    setServerMe({ ...src });
    setFormResetKey((k) => k + 1);
  }, [queryClient, data]);

  if (isLoading && !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-1">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const meForForm = serverMe ?? data;
  if (!meForForm) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-1">
        <p className="text-sm text-muted-foreground">Não foi possível carregar o perfil.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Meu perfil</h1>
      </div>

      <PerfilFormContent key={formResetKey} serverMe={meForForm} onCancel={handleCancel} />
    </div>
  );
}
