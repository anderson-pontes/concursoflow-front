export type ViaCepSuccess = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export type ViaCepLookupResult =
  | { ok: true; data: ViaCepSuccess }
  | { ok: false; reason: "invalid" | "not_found" | "network" | "aborted" };

/** Compat perfil — null = não encontrado / erro. */
export async function fetchViaCep(cepDigits: string): Promise<ViaCepSuccess | null> {
  const result = await lookupCep(cepDigits);
  return result.ok ? result.data : null;
}

export async function lookupCep(
  cepDigits: string,
  signal?: AbortSignal,
): Promise<ViaCepLookupResult> {
  const clean = cepDigits.replace(/\D/g, "");
  if (clean.length !== 8) return { ok: false, reason: "invalid" };

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, { signal });
    if (!res.ok) return { ok: false, reason: "network" };
    const data = (await res.json()) as ViaCepSuccess & { erro?: boolean };
    if (data.erro) return { ok: false, reason: "not_found" };
    return { ok: true, data };
  } catch (err) {
    if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
      return { ok: false, reason: "aborted" };
    }
    return { ok: false, reason: "network" };
  }
}
