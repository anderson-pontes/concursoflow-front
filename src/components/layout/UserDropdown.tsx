import { KeyRound, LogOut, User } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { Avatar } from "@/components/layout/Avatar";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";
import { useAuthStore } from "@/stores/authStore";

export function UserDropdown() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [pwdOpen, setPwdOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setMenuOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  if (!user) return null;

  return (
    <>
      <div className="relative z-[120]">
        <button
          ref={btnRef}
          type="button"
          className="shrink-0 rounded-full ring-2 ring-white transition hover:opacity-90 dark:ring-neutral-800"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title="Menu do usuário"
        >
          <Avatar name={user.name} avatarUrl={user.avatar_url} size="md" className="ring-0" />
        </button>

        {menuOpen ? (
          <div
            className="absolute right-0 z-[120] mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-neutral-600 dark:bg-neutral-900 dark:shadow-xl"
            role="menu"
            aria-label="Menu do usuário"
          >
            <div className="border-b border-border px-3 pb-3 pt-1">
              <div className="flex items-center gap-3">
                <Avatar name={user.name} avatarUrl={user.avatar_url} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/perfil");
                }}
              >
                <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                Meu perfil
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted"
                onClick={() => {
                  setMenuOpen(false);
                  setPwdOpen(true);
                }}
              >
                <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                Alterar senha
              </button>
            </div>

            <div className="border-t border-border py-1">
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                  navigate("/login");
                }}
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                Sair
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Fechar menu do usuário"
          className="fixed inset-0 z-[110] cursor-default bg-transparent"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <ChangePasswordModal open={pwdOpen} onOpenChange={setPwdOpen} />
    </>
  );
}
