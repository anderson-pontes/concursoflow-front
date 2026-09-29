import { z } from "zod";

import { isValidCpf } from "@/lib/cpfValidate";
import { maskCpf, maskPhoneBr, unmaskCpf } from "@/lib/inputMasks";
import type { MeApiResponse } from "@/services/profileApi";

export const profileSchema = z
  .object({
    name: z
      .string({ required_error: "Informe seu nome" })
      .trim()
      .min(3, "Informe um nome com pelo menos 3 caracteres")
      .max(100, "Informe um nome com no máximo 100 caracteres"),
    cpf: z.string().optional(),
    phone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const cpfDigits = unmaskCpf(data.cpf ?? "");
    if (cpfDigits.length > 0 && (cpfDigits.length !== 11 || !isValidCpf(cpfDigits))) {
      ctx.addIssue({ code: "custom", message: "CPF inválido", path: ["cpf"] });
    }
  });

export type ProfileForm = z.infer<typeof profileSchema>;

export function meToForm(m: MeApiResponse): ProfileForm {
  return {
    name: m.name ?? "",
    cpf: m.cpf ? maskCpf(m.cpf) : "",
    phone: m.phone ? maskPhoneBr(m.phone) : "",
  };
}
