import { api } from "@/services/api";
import { mapMeToAuthUser, type MeApiResponse } from "@/services/profileApi";
import type { AuthUser } from "@/stores/authStore";

/** @deprecated use MeApiResponse from profileApi */
type MeResponse = MeApiResponse;

export function mapMeResponseToAuthUser(data: MeResponse): AuthUser {
  return mapMeToAuthUser(data);
}

/** Perfil do usuário autenticado (requer token já configurado no axios). */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await api.get<MeResponse>("/auth/me");
  return mapMeResponseToAuthUser(res.data);
}
