import { api } from "@/services/api";
import type { AuthUser } from "@/stores/authStore";

type MeResponse = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  daily_goal_hours: number;
  created_at: string;
};

export function mapMeResponseToAuthUser(data: MeResponse): AuthUser {
  return {
    id: String(data.id),
    name: data.name ?? "",
    email: data.email ?? "",
    avatar_url: data.avatar_url ?? null,
    daily_goal_hours: Number(data.daily_goal_hours ?? 0),
    created_at: typeof data.created_at === "string" ? data.created_at : String(data.created_at),
  };
}

/** Perfil do usuário autenticado (requer token já configurado no axios). */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await api.get<MeResponse>("/auth/me");
  return mapMeResponseToAuthUser(res.data);
}
