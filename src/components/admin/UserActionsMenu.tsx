import React from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { KeyRound, MoreHorizontal, Pencil, Trash2, UserRoundSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { UserFormDialog } from "@/components/admin/UserFormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteUser, resetUserPassword } from "@/services/adminUsers";
import type { AdminUserListItem } from "@/types/userManagement";

type Props = { user: AdminUserListItem; onChanged: () => void };
const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function detail(error: unknown) {
  return isAxiosError(error) ? ((error.response?.data as { detail?: string } | undefined)?.detail ?? "Operação não concluída.") : "Operação não concluída.";
}

export function UserActionsMenu({ user, onChanged }: Props) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");

  const resetMutation = useMutation({
    mutationFn: () => resetUserPassword(user.id, password),
    onSuccess: () => { toast.success("Senha redefinida"); setPassword(""); setResetOpen(false); },
    onError: (error) => toast.error(detail(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(user.id),
    onSuccess: () => { toast.success("Usuário excluído"); setDeleteOpen(false); onChanged(); },
    onError: (error) => toast.error(detail(error)),
  });

  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Ações de ${user.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => navigate(`/admin/usuarios/${user.id}`)}><UserRoundSearch />Ver detalhes</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setEditOpen(true)}><Pencil />Editar</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setResetOpen(true)}><KeyRound />Redefinir senha</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}><Trash2 />Excluir definitivamente</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <UserFormDialog open={editOpen} onOpenChange={setEditOpen} user={user} onSaved={onChanged} />
    <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Redefinir senha de {user.name}?</AlertDialogTitle><AlertDialogDescription>A senha atual deixará de funcionar imediatamente.</AlertDialogDescription></AlertDialogHeader><div className="space-y-2"><Label htmlFor={`reset-${user.id}`}>Nova senha</Label><Input id={`reset-${user.id}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></div><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={!strongPassword.test(password) || resetMutation.isPending} onClick={(e) => { e.preventDefault(); resetMutation.mutate(); }}>Confirmar nova senha</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir {user.name} definitivamente?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. A conta <strong>{user.email}</strong> será removida se não possuir dados vinculados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending} onClick={(e) => { e.preventDefault(); deleteMutation.mutate(); }}>Excluir definitivamente</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </>;
}
