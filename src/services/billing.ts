import { api } from "@/services/api";

export type SubscriptionInfo = {
  status: string;
  has_access: boolean;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  amount: number | null;
  currency: string | null;
  interval: string | null;
};

/**
 * Inicia o checkout de assinatura para um usuário ainda não autenticado
 * (primeiro pagamento após o cadastro ou renovação de assinatura vencida).
 * Valida e-mail + senha no backend e retorna a URL do Stripe Checkout.
 */
export async function startCheckout(email: string, password: string): Promise<string> {
  const res = await api.post("/billing/checkout", { email, password });
  return (res.data as { checkout_url: string }).checkout_url;
}

/** Assinatura do usuário autenticado (área "Minha assinatura"). */
export async function getMySubscription(): Promise<SubscriptionInfo> {
  const res = await api.get("/billing/me");
  return res.data as SubscriptionInfo;
}

/** Abre o Stripe Billing Portal (trocar cartão / cancelar). */
export async function openBillingPortal(): Promise<string> {
  const res = await api.post("/billing/portal");
  return (res.data as { portal_url: string }).portal_url;
}
