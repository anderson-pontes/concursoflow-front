import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { getMySubscription, openBillingPortal, type SubscriptionInfo } from "@/services/billing";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: "Ativa", className: "bg-emerald-100 text-emerald-700" },
  trialing: { label: "Período de teste", className: "bg-emerald-100 text-emerald-700" },
  past_due: { label: "Pagamento pendente", className: "bg-amber-100 text-amber-700" },
  canceled: { label: "Cancelada", className: "bg-rose-100 text-rose-700" },
  unpaid: { label: "Não paga", className: "bg-rose-100 text-rose-700" },
  incomplete: { label: "Incompleta", className: "bg-neutral-200 text-neutral-700" },
  none: { label: "Sem assinatura", className: "bg-neutral-200 text-neutral-700" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtAmount(sub: SubscriptionInfo): string | null {
  if (sub.amount == null) return null;
  const value = sub.amount / 100;
  const currency = (sub.currency ?? "brl").toUpperCase();
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function MinhaAssinatura() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: getMySubscription,
  });

  const portalMutation = useMutation({
    mutationFn: openBillingPortal,
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? ((err.response?.data as { detail?: string } | undefined)?.detail ?? "Não foi possível abrir o portal de pagamento.")
        : "Não foi possível abrir o portal de pagamento.";
      toast.error(String(msg));
    },
  });

  const status = data?.status ?? "none";
  const badge = STATUS_LABEL[status] ?? STATUS_LABEL.none;
  const amount = data ? fmtAmount(data) : null;

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Minha assinatura</h2>
        {!isLoading && !isError ? (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badge.className}`}>
            {badge.label}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando informações da assinatura…</p>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Não foi possível carregar sua assinatura.</p>
      ) : (
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap justify-between gap-2">
            <span>Plano</span>
            <span className="font-medium text-foreground">
              Anual{amount ? ` · ${amount}` : ""}
            </span>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <span>{data?.cancel_at_period_end ? "Acesso até" : "Próxima renovação"}</span>
            <span className="font-medium text-foreground">{fmtDate(data?.current_period_end ?? null)}</span>
          </div>
          {data?.cancel_at_period_end ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Sua assinatura está marcada para cancelamento e não será renovada automaticamente.
            </p>
          ) : null}
        </div>
      )}

      <Button
        type="button"
        className="mt-4"
        onClick={() => portalMutation.mutate()}
        disabled={portalMutation.isPending}
      >
        {portalMutation.isPending ? "Abrindo…" : "Gerenciar pagamento"}
      </Button>
    </section>
  );
}
