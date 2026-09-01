import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getTelemetryPreference, updateTelemetryPreference } from "@/services/telemetry";

const QUERY_KEY = ["telemetry-preference"] as const;

export function TelemetryPreferenceCard() {
  const queryClient = useQueryClient();
  const preference = useQuery({ queryKey: QUERY_KEY, queryFn: getTelemetryPreference, retry: 1, retryDelay: 250 });
  const mutation = useMutation({
    mutationFn: updateTelemetryPreference,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
      toast.success(data.opted_out ? "Compartilhamento de dados desativado." : "Compartilhamento de dados ativado.");
    },
    onError: () => toast.error("Não foi possível atualizar sua preferência. Tente novamente."),
  });

  const sharingEnabled = preference.data ? !preference.data.opted_out : false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div>
            <CardTitle>Privacidade e melhoria do produto</CardTitle>
            <CardDescription className="mt-1">
              Controle como dados pseudonimizados de uso ajudam a melhorar o ClickEdital.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {preference.isLoading ? (
          <div className="flex items-center justify-between gap-4" role="status" aria-label="Carregando preferência de privacidade">
            <div className="space-y-2"><Skeleton className="h-4 w-52" /><Skeleton className="h-3 w-full max-w-md" /></div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ) : null}

        {preference.isError ? (
          <Alert variant="destructive">
            <BarChart3 aria-hidden />
            <AlertTitle>Preferência indisponível</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>Por segurança, nenhum evento é enviado enquanto não conseguimos confirmar sua escolha.</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void preference.refetch()}>
                <RotateCcw aria-hidden /> Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {preference.data ? (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/25 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <Label htmlFor="telemetry-sharing" className="text-sm font-semibold">
                Compartilhar dados pseudonimizados de uso
              </Label>
              <p id="telemetry-sharing-description" className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Envia somente eventos técnicos previamente definidos, como etapas concluídas e falhas. Não enviamos nome,
                e-mail, termos pesquisados, conteúdo do edital, disciplinas, tópicos ou respostas.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Um código técnico derivado da sua conta relaciona os eventos durante a retenção, sem expor sua identidade.
                Os eventos brutos são mantidos por no máximo 90 dias. Ao desativar, novos eventos deixam de ser armazenados
                e os eventos pseudonimizados associados ao código são excluídos.
              </p>
            </div>
            <Switch
              id="telemetry-sharing"
              checked={sharingEnabled}
              disabled={mutation.isPending}
              aria-describedby="telemetry-sharing-description"
              aria-label="Compartilhar dados pseudonimizados de uso"
              onCheckedChange={(checked) => mutation.mutate(!checked)}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
