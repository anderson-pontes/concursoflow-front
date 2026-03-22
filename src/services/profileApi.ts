import { api } from "@/services/api";
import type { AuthUser } from "@/stores/authStore";

/** Resposta de GET /auth/me (snake_case da API). */
export type MeApiResponse = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  daily_goal_hours: number;
  created_at: string;
  cpf: string | null;
  phone: string | null;
  birth_date: string | null;
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
};

export type UserProfileUpdatePayload = {
  name?: string;
  avatar_url?: string | null;
  daily_goal_hours?: number;
  cpf?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  address_cep?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
};

export async function getMeApi(): Promise<MeApiResponse> {
  const res = await api.get<MeApiResponse>("/auth/me");
  return res.data;
}

export async function updateMeApi(body: UserProfileUpdatePayload): Promise<MeApiResponse> {
  const res = await api.put<MeApiResponse>("/auth/me", body);
  return res.data;
}

export async function changePasswordApi(current_password: string, new_password: string): Promise<void> {
  await api.patch("/auth/me/password", { current_password, new_password });
}

export function mapMeToAuthUser(data: MeApiResponse): AuthUser {
  return {
    id: String(data.id),
    name: data.name ?? "",
    email: data.email ?? "",
    avatar_url: data.avatar_url ?? null,
    daily_goal_hours: Number(data.daily_goal_hours ?? 0),
    created_at: typeof data.created_at === "string" ? data.created_at : String(data.created_at),
    cpf: data.cpf ?? null,
    phone: data.phone ?? null,
    birth_date: data.birth_date ?? null,
    address_cep: data.address_cep ?? null,
    address_street: data.address_street ?? null,
    address_number: data.address_number ?? null,
    address_complement: data.address_complement ?? null,
    address_neighborhood: data.address_neighborhood ?? null,
    address_city: data.address_city ?? null,
    address_state: data.address_state ?? null,
  };
}
