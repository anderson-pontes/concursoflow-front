import { describe, expect, it } from "vitest";

import { KIWIFY_CHECKOUT_URL } from "@/lib/commercial";

describe("checkout comercial", () => {
  it("mantém o checkout oficial como destino único", () => {
    expect(KIWIFY_CHECKOUT_URL).toBe("https://pay.kiwify.com.br/sEvntb7");
  });
});
