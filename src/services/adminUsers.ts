import { api } from "@/services/api";
import type {
  AdminUserDetail,
  PaginatedUsers,
  UserAuditLog,
  UsersDashboard,
} from "@/types/userManagement";

export type ListUsersParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  subscription_status?: string;
  study_goal?: string;
  created_from?: string;
  created_to?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
};

export async function fetchUsersDashboard(): Promise<UsersDashboard> {
  const res = await api.get<UsersDashboard>("/admin/users/dashboard");
  return res.data;
}

export async function fetchUsers(params: ListUsersParams = {}): Promise<PaginatedUsers> {
  const res = await api.get<PaginatedUsers>("/admin/users", { params });
  return res.data;
}

export async function fetchUserDetail(id: string): Promise<AdminUserDetail> {
  const res = await api.get<AdminUserDetail>(`/admin/users/${id}`);
  return res.data;
}

export async function approveUser(id: string): Promise<void> {
  await api.post(`/admin/users/${id}/aprovar`);
}

export async function rejectUser(id: string, reason?: string): Promise<void> {
  await api.post(`/admin/users/${id}/reprovar`, { reason: reason ?? null });
}

export async function blockUser(id: string, reason?: string): Promise<void> {
  await api.post(`/admin/users/${id}/bloquear`, { reason: reason ?? null });
}

export async function unblockUser(id: string): Promise<void> {
  await api.post(`/admin/users/${id}/desbloquear`);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/admin/users/${id}`);
}

export async function resetUserPassword(id: string, new_password: string): Promise<void> {
  await api.post(`/admin/users/${id}/reset-senha`, { new_password });
}

export async function resendUserEmail(id: string): Promise<void> {
  await api.post(`/admin/users/${id}/reenviar-email`);
}

export async function fetchUserAudit(id: string): Promise<UserAuditLog[]> {
  const res = await api.get<UserAuditLog[]>(`/admin/users/${id}/auditoria`);
  return res.data;
}

export async function updateUserAdmin(id: string, body: Record<string, unknown>): Promise<void> {
  await api.put(`/admin/users/${id}`, body);
}

export async function createUserAdmin(body: Record<string, unknown>): Promise<void> {
  await api.post("/admin/users", body);
}
