import { differenceInYears, parseISO } from "date-fns";
import { z } from "zod";

import { isValidCpf } from "@/lib/cpfValidate";
import { maskCep, maskCpf, maskPhoneBr, unmaskCep, unmaskCpf } from "@/lib/inputMasks";
import type { MeApiResponse } from "@/services/profileApi";

export function formatDateForInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = parseISO(iso.includes("T") ? iso : `${iso}T12:00:00`);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export const profileSchema = z
  .object({
    name: z.string().min(3, "Mínimo 3 caracteres").max(100),
    cpf: z.string().optional(),
    phone: z.string().optional(),
    birth_date: z.string().optional(),
    address_cep: z.string().optional(),
    address_street: z.string().optional(),
    address_number: z.string().optional(),
    address_complement: z.string().optional(),
    address_neighborhood: z.string().optional(),
    address_city: z.string().optional(),
    address_state: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const cpfDigits = unmaskCpf(data.cpf ?? "");
    if (cpfDigits.length > 0 && (cpfDigits.length !== 11 || !isValidCpf(cpfDigits))) {
      ctx.addIssue({ code: "custom", message: "CPF inválido", path: ["cpf"] });
    }
    if (data.birth_date) {
      try {
        const d = parseISO(data.birth_date);
        if (Number.isNaN(d.getTime())) {
          ctx.addIssue({ code: "custom", message: "Data inválida", path: ["birth_date"] });
        } else if (differenceInYears(new Date(), d) < 18) {
          ctx.addIssue({ code: "custom", message: "É necessário ter pelo menos 18 anos", path: ["birth_date"] });
        }
      } catch {
        ctx.addIssue({ code: "custom", message: "Data inválida", path: ["birth_date"] });
      }
    }
  });

export type ProfileForm = z.infer<typeof profileSchema>;

export function meToForm(m: MeApiResponse): ProfileForm {
  return {
    name: m.name ?? "",
    cpf: m.cpf ? maskCpf(m.cpf) : "",
    phone: m.phone ? maskPhoneBr(m.phone) : "",
    birth_date: formatDateForInput(m.birth_date),
    address_cep: m.address_cep ? maskCep(m.address_cep.replace(/\D/g, "")) : "",
    address_street: m.address_street ?? "",
    address_number: m.address_number ?? "",
    address_complement: m.address_complement ?? "",
    address_neighborhood: m.address_neighborhood ?? "",
    address_city: m.address_city ?? "",
    address_state: m.address_state ?? "",
  };
}
