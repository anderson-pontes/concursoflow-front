import { Eye, Link2, Link2Off, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
export type DisciplineActionsProps={id:string;name:string;canToggleConcurso:boolean;inConcurso:boolean;onToggleConcurso:()=>void;onEdit:()=>void;onConfirmDelete:()=>void|Promise<void>};
export function DisciplineActions({id,name,canToggleConcurso,inConcurso,onToggleConcurso,onEdit,onConfirmDelete}:DisciplineActionsProps){
 const {requestConfirmation,confirmDialog}=useConfirmDialog();
 return <><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-lg" aria-label={`Ações da disciplina ${name}`}><MoreHorizontal className="size-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
  <DropdownMenuItem asChild><Link to={`/disciplinas/${id}`}><Eye/>Ver detalhes</Link></DropdownMenuItem>
  <DropdownMenuItem onSelect={onEdit}><Pencil/>Editar disciplina</DropdownMenuItem>
  {canToggleConcurso&&<DropdownMenuItem onSelect={onToggleConcurso}>{inConcurso?<Link2Off/>:<Link2/>}{inConcurso?"Remover do concurso":"Incluir no concurso"}</DropdownMenuItem>}
  <DropdownMenuItem variant="destructive" onSelect={()=>{void requestConfirmation({title:"Excluir disciplina?",description:`A disciplina “${name}” será excluída. Esta ação não pode ser desfeita.`,confirmLabel:"Excluir disciplina",variant:"destructive"}).then(ok=>{if(ok)void onConfirmDelete();});}}><Trash2/>Excluir disciplina</DropdownMenuItem>
 </DropdownMenuContent></DropdownMenu>{confirmDialog}</>;
}
