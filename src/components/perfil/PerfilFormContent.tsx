import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCircle } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/FormSection";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { maskCpf, maskPhoneBr, unmaskCpf, unmaskPhone } from "@/lib/inputMasks";
import { meToForm, profileSchema, type ProfileForm } from "@/lib/perfil/profileSchema";
import { mapMeToAuthUser, updateMeApi, type MeApiResponse } from "@/services/profileApi";
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
    reset,
    formState,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: meToForm(serverMe),
  });

  React.useEffect(() => {
    reset(meToForm(serverMe));
  }, [reset, serverMe]);

  const mutation = useMutation({
    mutationFn: async (values: ProfileForm) => {
      const cpfDigits = unmaskCpf(values.cpf ?? "");
      const body = {
        name: values.name.trim(),
        cpf: cpfDigits.length === 11 ? cpfDigits : null,
        phone: unmaskPhone(values.phone ?? "").length ? unmaskPhone(values.phone ?? "") : null,
      };
      return updateMeApi(body);
    },
    onSuccess: (res) => {
      setUser(mapMeToAuthUser(res));
      reset(meToForm(res));
      queryClient.setQueryData(["auth-me-profile"], res);
      void queryClient.invalidateQueries({ queryKey: ["auth-me-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-user", res.id] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (e) => {
      const msg = isAxiosError(e)
        ? (e.response?.data as { detail?: string | unknown })?.detail
        : null;
      toast.error(typeof msg === "string" ? msg : "Não foi possível salvar o perfil.");
    },
  });

  const onSubmit = handleSubmit((v) => mutation.mutate(v));

  const handleCancelClick = () => {
    onCancel();
  };

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <FormSection title="Informações pessoais" icon={<UserCircle className="h-4 w-4" />}>
        <div>
          <Label htmlFor="pf-name">Nome completo</Label>
          <Input
            id="pf-name"
            className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={mutation.isPending}
            aria-invalid={Boolean(formState.errors.name)}
            aria-describedby={formState.errors.name ? "pf-name-error" : undefined}
            {...register("name")}
          />
          {formState.errors.name ? (
            <p id="pf-name-error" role="alert" className="mt-1 text-xs text-destructive">
              {formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="pf-email">E-mail</Label>
          <Input
            id="pf-email"
            readOnly
            value={serverMe.email ?? ""}
            aria-readonly="true"
            aria-describedby="pf-email-help"
            className="mt-1.5 min-h-11 w-full cursor-not-allowed rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground"
          />
          <p id="pf-email-help" className="mt-1 text-xs text-muted-foreground">
            O e-mail não pode ser alterado aqui.
          </p>
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
      </FormSection>

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
