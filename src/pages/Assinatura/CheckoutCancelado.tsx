import { useNavigate } from "react-router-dom";

import { AuthPrimaryButton } from "@/components/auth/AuthFields";
import { AuthShell } from "@/components/auth/AuthShell";

export function CheckoutCancelado() {
  const navigate = useNavigate();
  return (
    <AuthShell>
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 text-4xl" aria-hidden>
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-foreground">Pagamento não concluído</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O pagamento foi cancelado ou não foi finalizado. Sua conta já está criada — você pode tentar novamente a
          qualquer momento pela tela de login.
        </p>
        <div className="mt-8">
          <AuthPrimaryButton type="button" onClick={() => navigate("/login")}>
            Voltar ao login
          </AuthPrimaryButton>
        </div>
      </div>
    </AuthShell>
  );
}
