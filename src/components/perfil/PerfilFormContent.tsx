import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, UserCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { MinhaAssinatura } from "@/components/perfil/MinhaAssinatura";
import { FormSection } from "@/components/ui/FormSection";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectField } from "@/components/ui/select-field";
import { BR_UFS } from "@/lib/brasilUfs";
import { maskCep, maskCpf, maskPhoneBr, unmaskCep, unmaskCpf, unmaskPhone } from "@/lib/inputMasks";
import { meToForm, profileSchema, type ProfileForm } from "@/lib/perfil/profileSchema";
import { mapMeToAuthUser, updateMeApi, type MeApiResponse } from "@/services/profileApi";
import { fetchViaCep } from "@/services/viaCep";
import { useAuthStore } from "@/stores/authStore";

export type PerfilFormContentProps = {
  serverMe: MeApiResponse;
  onCancel: () => void;
};

export function PerfilFormContent({ serverMe, onCancel }: PerfilFormContentProps) {
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
          <Input
            id="pf-name"
            className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={mutation.isPending}
            {...register("name")}
          />
          {formState.errors.name ? (
            <p className="mt-1 text-xs text-destructive">{formState.errors.name.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="pf-email">E-mail</Label>
          <Input
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
            <Input
              id="pf-cpf"
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              value={watch("cpf") ?? ""}
              onChange={(e) => setValue("cpf", maskCpf(e.target.value), { shouldValidate: true })}
            />
            {formState.errors.cpf ? (
              <p className="mt-1 text-xs text-destructive">{formState.errors.cpf.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="pf-phone">Telefone</Label>
            <Input
              id="pf-phone"
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              value={watch("phone") ?? ""}
              onChange={(e) => setValue("phone", maskPhoneBr(e.target.value), { shouldValidate: true })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="pf-birth">Data de nascimento</Label>
          <DatePicker
            id="pf-birth"
            className="mt-1.5"
            disabled={mutation.isPending}
            value={watch("birth_date") ?? ""}
            onValueChange={(value) => setValue("birth_date", value, { shouldDirty: true, shouldValidate: true })}
          />
          {formState.errors.birth_date ? (
            <p className="mt-1 text-xs text-destructive">{formState.errors.birth_date.message}</p>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Endereço" icon={<MapPin className="h-4 w-4" />}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Label htmlFor="pf-cep">CEP</Label>
            <Input
              id="pf-cep"
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <Input
            id="pf-street"
            className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={mutation.isPending}
            {...register("address_street")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pf-num">Número</Label>
            <Input
              id="pf-num"
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              {...register("address_number")}
            />
          </div>
          <div>
            <Label htmlFor="pf-comp">Complemento</Label>
            <Input
              id="pf-comp"
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              {...register("address_complement")}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="pf-bairro">Bairro</Label>
          <Input
            id="pf-bairro"
            className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={mutation.isPending}
            {...register("address_neighborhood")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pf-city">Cidade</Label>
            <Input
              id="pf-city"
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={mutation.isPending}
              {...register("address_city")}
            />
          </div>
          <div>
            <Label htmlFor="pf-uf">Estado (UF)</Label>
            <SelectField
              id="pf-uf"
              className="mt-1.5"
              disabled={mutation.isPending}
              value={watch("address_state") ?? ""}
              onValueChange={(value) => setValue("address_state", value, { shouldDirty: true, shouldValidate: true })}
              options={[{ value: "", label: "Selecione" }, ...BR_UFS.map((uf) => ({ value: uf, label: uf }))]}
            />
          </div>
        </div>
      </FormSection>

      <MinhaAssinatura />

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
