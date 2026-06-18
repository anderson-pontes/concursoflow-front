import type { AuthUser } from "@/stores/authStore";

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  return user?.role === "admin";
}
