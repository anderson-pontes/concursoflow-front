import { Navigate } from "react-router-dom";

import { isAdminUser } from "@/lib/authRoles";
import { useAuthStore } from "@/stores/authStore";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdminUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
