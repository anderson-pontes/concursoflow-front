import { useNavigate } from "react-router-dom";

import { AuthShell } from "@/components/auth/AuthShell";

export function CheckoutSucesso() {
  const navigate = useNavigate();
  return (
    <AuthShell>
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 text-4xl" aria-hidden>
          🎉
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Pagamento recebido!</h1>
        <p className="mt-3 text-sm text-[#6B7280]">
          Estamos confirmando sua assinatura. Em instantes seu acesso será liberado e você
          receberá um e-mail de confirmação. Depois, entre com seu e-mail e senha.
        </p>
        <button
          type="button"
          className="mt-8 flex h-[50px] w-full items-center justify-center rounded-xl bg-[#6C3FC5] text-[15px] font-semibold text-white transition-colors hover:bg-[#5B32A8]"
          onClick={() => navigate("/login")}
        >
          Ir para o login
        </button>
      </div>
    </AuthShell>
  );
}
