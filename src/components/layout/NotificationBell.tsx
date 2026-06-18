import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { isAdminUser } from "@/lib/authRoles";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import { useAuthStore } from "@/stores/authStore";

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const isAdmin = isAdminUser(user);

  const { data: count = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: fetchUnreadCount,
    enabled: isAdmin,
    refetchInterval: 60_000,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: isAdmin && open,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  if (!isAdmin) return null;

  const iconBtn =
    "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-200 dark:hover:bg-neutral-900";

  return (
    <div className="relative">
      <button type="button" className={iconBtn} title="Notificações" aria-label="Notificações" onClick={() => setOpen((v) => !v)}>
        <Bell className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,360px)] rounded-xl border border-border/40 bg-background shadow-lg">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <span className="text-sm font-semibold">Notificações</span>
              <button
                type="button"
                className="text-xs text-primary-600 hover:underline"
                onClick={() => markAllMutation.mutate()}
              >
                Marcar todas como lidas
              </button>
            </div>
            <div className="max-h-80 overflow-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação.</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={cn(
                      "w-full border-b border-border/20 px-4 py-3 text-left text-sm hover:bg-muted/50",
                      !n.read_at && "bg-primary-50/40 dark:bg-primary-950/20",
                    )}
                    onClick={() => {
                      if (!n.read_at) markReadMutation.mutate(n.id);
                      if (n.related_user_id) {
                        setOpen(false);
                        navigate(`/admin/usuarios/${n.related_user_id}`);
                      }
                    }}
                  >
                    <div className="font-medium">{n.title}</div>
                    {n.body ? <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div> : null}
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("pt-BR")}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
