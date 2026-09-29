import React from "react";

import { KIWIFY_CHECKOUT_URL } from "@/lib/commercial";

export function CheckoutRedirect() {
  React.useEffect(() => {
    window.location.replace(KIWIFY_CHECKOUT_URL);
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <p className="text-sm text-muted-foreground">Redirecionando para a compra segura...</p>
        <a className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline" href={KIWIFY_CHECKOUT_URL}>
          Ir para o checkout da Kiwify
        </a>
      </div>
    </main>
  );
}
