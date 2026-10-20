import React from "react";
import { Calendar, BarChart3, ExternalLink, FileText, Landmark, LucideIcon, NotebookTabs, Pencil, User, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { loadConcursoProgress, saveConcursoProgress, type ConcursoProgressPersist } from "@/lib/concursoProgressStorage";
import { cn } from "@/lib/utils";
import { isImageUrl, isPdfUrl, resolvePublicUrl } from "@/lib/publicUrl";
import { useTablistNavigation } from "@/hooks/useTablistNavigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConcursoStatus, ConcursoTitle } from "@/components/concursos/ConcursoPresentation";
import { ConcursoProgressoTab } from "@/components/concursos/ConcursoProgressoTab";

type ConcursoRow = { id:string; nome:string; orgao:string; cargo:string|null; banca:string|null; edital_url:string|null; logo_url:string|null; status:string; created_at:string; updated_at?:string|null };
type Props = { concurso:ConcursoRow|null; onClose:()=>void; onEdit?:()=>void };
type TabId = "dados"|"edital"|"progresso";
const tabs: {id:TabId;icon:LucideIcon;label:string;tone:string}[] = [
  {id:"dados",icon:NotebookTabs,label:"Dados",tone:"text-primary"},
  {id:"edital",icon:FileText,label:"Edital",tone:"text-violet-600 dark:text-violet-300"},
  {id:"progresso",icon:BarChart3,label:"Progresso",tone:"text-success-text"},
];
function InfoCard({icon:Icon,label,value,tone}:{icon:LucideIcon;label:string;value:string|null|undefined;tone:string}) {
  return <div className={`concurso-soft-card concurso-tone-${tone} flex min-w-0 items-start gap-3 rounded-xl border px-3 py-2.5 sm:px-4`}>
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[var(--concurso-ink)]"><Icon className="size-4" aria-hidden /></span>
    <div className="min-w-0"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-semibold leading-relaxed [overflow-wrap:anywhere]">{value?.trim()||<span className="font-normal text-muted-foreground">Não informado</span>}</dd></div>
  </div>;
}
function EditalPanel({src,onEdit}:{src:string|null;onEdit?:()=>void}) {
  if(!src) return <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
    <FileText className="mx-auto size-9 text-primary" aria-hidden /><h3 className="mt-3 font-semibold">Nenhum edital anexado</h3><p className="mt-2 text-sm text-muted-foreground">Adicione o documento para consultá-lo aqui.</p>
    {onEdit&&<Button variant="outline" className="mt-4" onClick={onEdit}><Pencil className="size-4" />Adicionar edital</Button>}
  </div>;
  let filename="Documento do edital";
  try { filename=decodeURIComponent(new URL(src,window.location.origin).pathname.split("/").pop()||filename); } catch { /* Keep descriptive fallback. */ }
  return <section className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3"><FileText className="size-5 shrink-0 text-primary" aria-hidden /><div className="min-w-0"><h3 className="text-sm font-semibold">Edital do concurso</h3><p className="mt-1 break-all text-xs text-muted-foreground">{filename}</p></div></div>
      <a href={src} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({variant:"outline"}),"w-full sm:w-auto")}><ExternalLink className="size-4" />Abrir em nova aba</a>
    </div>
    <div className="overflow-hidden rounded-xl border border-border bg-muted/20 p-1.5 sm:p-2">
      {isPdfUrl(src)?<iframe title="Pré-visualização do edital" src={src} className="h-[min(55dvh,520px)] min-h-64 w-full rounded-lg bg-card" />:isImageUrl(src)?<div className="flex min-h-64 items-center justify-center p-2"><img src={src} alt="Edital" className="max-h-[55dvh] max-w-full rounded-lg object-contain" /></div>:<div className="flex min-h-64 flex-col items-center justify-center gap-3 p-5 text-center"><FileText className="size-9 text-muted-foreground" aria-hidden /><p className="text-sm text-muted-foreground">Pré-visualização indisponível para este tipo de arquivo.</p><a href={src} target="_blank" rel="noopener noreferrer" className={buttonVariants({variant:"outline"})}>Baixar / abrir arquivo<ExternalLink className="size-4" /></a></div>}
    </div>
  </section>;
}
export function ConcursoDetalheModal({concurso,onClose,onEdit}:Props) {
  const onTablistKeyDown=useTablistNavigation(), id=React.useId();
  const [tab,setTab]=React.useState<TabId>("dados");
  const closeButtonRef=React.useRef<HTMLButtonElement>(null);
  const [persist,setPersist]=React.useState<ConcursoProgressPersist>(loadConcursoProgress);
  React.useEffect(()=>{saveConcursoProgress(persist);},[persist]);
  React.useEffect(()=>{if(concurso)setTab("dados");},[concurso]);
  React.useEffect(()=>{if(!concurso)return;const label=concurso.cargo?.trim()||concurso.nome;setPersist(p=>({...p,concursoMeta:{...p.concursoMeta,[concurso.id]:{label}}}));},[concurso]);
  if(!concurso)return <Dialog open={false} onOpenChange={open=>{if(!open)onClose();}} />;
  const logoSrc=resolvePublicUrl(concurso.logo_url),editalSrc=resolvePublicUrl(concurso.edital_url);
  let created="Não informado";
  try { created=format(parseISO(concurso.created_at),"dd/MM/yyyy 'às' HH:mm",{locale:ptBR}); } catch { /* No invalid date label. */ }
  const cargoTitle=concurso.cargo?.trim()||concurso.nome;
  let updated:string|null=null;
  if(concurso.updated_at) try { updated=format(parseISO(concurso.updated_at),"dd/MM/yyyy 'às' HH:mm",{locale:ptBR}); } catch { /* Invalid update dates are omitted. */ }
  return <Dialog open onOpenChange={open=>{if(!open)onClose();}}>
    <DialogContent hideClose aria-describedby={undefined} onOpenAutoFocus={event=>{event.preventDefault();closeButtonRef.current?.focus();}} className="flex max-h-[min(92dvh,900px)] w-[900px] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 sm:p-0 max-sm:inset-x-0 max-sm:top-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none">
      <header className="flex shrink-0 items-start gap-3 border-b border-border/80 bg-primary/5 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card text-primary">{logoSrc?<img src={logoSrc} alt="" className="size-full object-contain" />:<Landmark className="size-5" aria-hidden />}</div>
        <div className="min-w-0 max-w-2xl flex-1 pr-1 sm:pr-3"><DialogTitle className="text-base font-semibold leading-snug sm:text-lg"><ConcursoTitle lines={2}>{cargoTitle}</ConcursoTitle></DialogTitle><div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"><p className="min-w-0 text-xs text-muted-foreground [overflow-wrap:anywhere]">{concurso.orgao}</p><ConcursoStatus status={concurso.status} /></div></div>
        <Button ref={closeButtonRef} variant="ghost" size="icon-lg" className="ml-auto shrink-0" aria-label="Fechar detalhes do concurso" onClick={onClose}><X className="size-5" /></Button>
      </header>
      <div className="shrink-0 border-b border-border/80 px-3 py-1 sm:px-6">
        <nav role="tablist" aria-label="Seções do concurso" onKeyDown={onTablistKeyDown} className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
          {tabs.map(({id:tabId,icon:Icon,label,tone})=><button key={tabId} id={`${id}-${tabId}`} type="button" role="tab" aria-selected={tab===tabId} aria-controls={`${id}-${tabId}-panel`} tabIndex={tab===tabId?0:-1} onClick={()=>setTab(tabId)} className={cn("flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm",tab===tabId?"bg-card text-primary shadow-sm ring-1 ring-border":"text-muted-foreground hover:bg-card/60 hover:text-foreground")}><Icon className={cn("size-4 shrink-0",tone)} aria-hidden />{label}</button>)}
        </nav>
      </div>
      <div role="tabpanel" id={`${id}-${tab}-panel`} aria-labelledby={`${id}-${tab}`} tabIndex={0} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 sm:py-4">
        {tab==="dados"&&<dl className="grid items-stretch gap-3 sm:grid-cols-2"><InfoCard tone="indigo" icon={Landmark} label="Órgão" value={concurso.orgao} /><InfoCard tone="blue" icon={User} label="Cargo" value={concurso.cargo} /><InfoCard tone="purple" icon={FileText} label="Banca" value={concurso.banca} /><InfoCard tone="orange" icon={Calendar} label="Cadastrado em" value={created} /></dl>}
        {tab==="edital"&&<EditalPanel src={editalSrc} onEdit={onEdit} />}
        {tab==="progresso"&&<ConcursoProgressoTab concurso={concurso} />}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border/80 bg-muted/20 px-4 py-3 sm:px-6">
        {updated&&<p className="mr-auto w-full text-xs leading-relaxed text-muted-foreground sm:w-auto">Última atualização: {updated}</p>}
        <div className="flex w-full gap-2 sm:w-auto"><Button variant="outline" className="flex-1 sm:flex-none" onClick={onClose}>Fechar</Button>{onEdit&&<Button className="flex-1 sm:flex-none" onClick={onEdit}><Pencil className="size-4" />Editar concurso</Button>}</div>
      </footer>
    </DialogContent>
  </Dialog>;
}
