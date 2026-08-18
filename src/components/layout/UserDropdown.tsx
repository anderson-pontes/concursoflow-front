import { KeyRound, LogOut, Mail, User, Youtube } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { Avatar } from "@/components/layout/Avatar";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";

export function UserDropdown({ compact = false }: { compact?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [pwdOpen, setPwdOpen] = React.useState(false);

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full ring-2 ring-surface transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Menu do usuário"
          >
            <Avatar name={user.name} avatarUrl={user.avatar_url} size={compact ? "sm" : "md"} className="ring-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="p-3 font-normal">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} avatarUrl={user.avatar_url} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="min-h-11 gap-2 px-3" onSelect={() => navigate("/perfil")}>
              <User className="text-muted-foreground" aria-hidden />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 gap-2 px-3" onSelect={() => setPwdOpen(true)}>
              <KeyRound className="text-muted-foreground" aria-hidden />
              Alterar senha
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Suporte</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="min-h-11 gap-2 px-3">
              <a href="mailto:clickedital@gmail.com"><Mail className="text-muted-foreground" aria-hidden />Suporte por e-mail</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-11 gap-2 px-3">
              <a href="https://www.youtube.com/@clickedital" target="_blank" rel="noopener noreferrer" aria-label="Canal @clickedital no YouTube, abre em nova aba"><Youtube className="text-muted-foreground" aria-hidden />Canal @clickedital</a>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-11 gap-2 px-3"
            onSelect={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut aria-hidden />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordModal open={pwdOpen} onOpenChange={setPwdOpen} />
    </>
  );
}
