import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
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

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

function normalizePersistedUser(u: AuthUser | null): AuthUser | null {
  if (!u) return null;
  return {
    ...u,
    cpf: u.cpf ?? null,
    phone: u.phone ?? null,
    birth_date: u.birth_date ?? null,
    address_cep: u.address_cep ?? null,
    address_street: u.address_street ?? null,
    address_number: u.address_number ?? null,
    address_complement: u.address_complement ?? null,
    address_neighborhood: u.address_neighborhood ?? null,
    address_city: u.address_city ?? null,
    address_state: u.address_state ?? null,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        }),
    }),
    {
      name: "aprovingo-auth",
      version: 2,
      migrate: (persisted) => {
        const p = persisted as { state?: { user?: AuthUser | null } };
        if (p?.state && p.state.user) {
          p.state.user = normalizePersistedUser(p.state.user);
        }
        return persisted as never;
      },
    },
  ),
);

