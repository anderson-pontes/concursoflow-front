import {BookOpen, MoreHorizontal, Plus, Settings} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import type {Planejamento} from '@/lib/cronograma/types';

type Props={plano?:Planejamento|null; contest?:{nome:string;orgao?:string|null;cargo?:string|null}; loading:boolean; onCreate:()=>void; onAdd:()=>void; onActivity:()=>void; onConfig:()=>void; onRegistro:()=>void};
export function CronogramaPageHeader({plano,contest,loading,onCreate,onAdd,onActivity,onConfig,onRegistro}:Props) {
  const name=contest?.orgao||contest?.nome||'Concurso ativo';
  const cargo=contest?.cargo||plano?.cargo;
  const label=[name,cargo&&!name.includes(cargo)?cargo:null].filter(Boolean).join(' · ');
  return <header className="flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between"><div className="min-w-0"><h1 className="text-2xl font-semibold tracking-tight">Meu Cronograma</h1><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Planeje seus estudos, acompanhe suas atividades e evolua com consistência.</p>{plano&&<div className="mt-3 flex min-w-0 flex-wrap items-center gap-2"><TooltipProvider><Tooltip><TooltipTrigger asChild><span tabIndex={0} className="block max-w-full truncate rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-md" title={contest?.nome}>{label}</span></TooltipTrigger><TooltipContent className="max-w-xs break-words">{contest?.nome||name}{cargo?` · ${cargo}`:''}</TooltipContent></Tooltip></TooltipProvider><div className="flex w-full flex-wrap items-center gap-2"><span className="break-words text-sm font-medium">{plano.nome}</span><Badge variant="outline">{plano.tipo==='manual'?'Manual':'Automático'}</Badge><Badge variant={plano.ativo?'success':'secondary'}>{plano.ativo?'Ativo':'Inativo'}</Badge></div></div>}</div>
    <div className="flex shrink-0 flex-wrap items-center gap-2">{plano?<>{plano.disciplinas.length>0&&<Button onClick={onActivity}><Plus aria-hidden/>Adicionar atividade</Button>}<Button variant={plano.disciplinas.length?'outline':'default'} onClick={onAdd}><Plus aria-hidden/>Adicionar disciplinas</Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" aria-label="Ações do cronograma"><MoreHorizontal aria-hidden/><span className="hidden sm:inline">Ações</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={onRegistro} className="min-h-11"><BookOpen aria-hidden/>Registrar estudo</DropdownMenuItem><DropdownMenuItem onSelect={onConfig} className="min-h-11"><Settings aria-hidden/>Configurar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></>:<Button disabled={loading} onClick={onCreate}><Plus aria-hidden/>Criar cronograma</Button>}</div>
  </header>;
}
