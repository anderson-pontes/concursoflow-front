import { useNavigate } from "react-router-dom";

import { AuthShell } from "@/components/auth/AuthShell";

export function CheckoutCancelado() {
  const navigate = useNavigate();
  return (
    <AuthShell>
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 text-4xl" aria-hidden>
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Pagamento não concluído</h1>
        <p className="mt-3 text-sm text-[#6B7280]">
          O pagamento foi cancelado ou não foi finalizado. Sua conta já está criada — você pode
          tentar novamente a qualquer momento pela tela de login.
        </p>
        <button
          type="button"
          className="mt-8 flex h-[50px] w-full items-center justify-center rounded-xl bg-[#6C3FC5] text-[15px] font-semibold text-white transition-colors hover:bg-[#5B32A8]"
          onClick={() => navigate("/login")}
        >
          Voltar ao login
        </button>
      </div>
    </AuthShell>
  );
}
