import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { PerfilFormContent } from "@/components/perfil/PerfilFormContent";
import { getMeApi, type MeApiResponse } from "@/services/profileApi";

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
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted"
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
