import { useNavigate } from "react-router-dom";

import { AuthPrimaryButton } from "@/components/auth/AuthFields";
import { AuthShell } from "@/components/auth/AuthShell";

export function CheckoutSucesso() {
  const navigate = useNavigate();
  return (
    <AuthShell>
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 text-4xl" aria-hidden>
          🎉
        </div>
        <h1 className="text-2xl font-bold text-foreground">Pagamento recebido!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Estamos confirmando sua assinatura. Em instantes seu acesso será liberado e você receberá um e-mail de
          confirmação. Depois, entre com seu e-mail e senha.
        </p>
        <div className="mt-8">
          <AuthPrimaryButton type="button" onClick={() => navigate("/login")}>
            Ir para o login
          </AuthPrimaryButton>
        </div>
      </div>
    </AuthShell>
  );
}
