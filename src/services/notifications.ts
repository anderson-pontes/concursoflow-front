import { api } from "@/services/api";
import type { AppNotification } from "@/types/userManagement";

export async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await api.get<AppNotification[]>("/notifications");
  return res.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await api.get<{ count: number }>("/notifications/unread-count");
  return res.data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/ler`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/ler-todas");
}
