import {matchPath} from 'react-router-dom';

type NavigationPage = {label:string; to:string; group:string; breadcrumbLabel?:string};

/** Shared route metadata for the global search and contextual header. */
export const pageLinks = [
  {label:'Dashboard',to:'/dashboard',group:'Visão geral'},
  {label:'Meus Concursos',to:'/concursos',group:'Principal'},
  {label:'Meu Cronograma',to:'/cronograma',group:'Estudos',breadcrumbLabel:'Cronograma'},
  {label:'Disciplinas',to:'/disciplinas',group:'Estudos'},
  {label:'Edital Verticalizado',to:'/disciplinas?view=edital',group:'Estudos'},
  {label:'Pomodoro',to:'/pomodoro',group:'Estudos'},
  {label:'Calendário',to:'/estudos/calendario',group:'Estudos'},
  {label:'Histórico de Estudos',to:'/estudos/historico',group:'Análises'},
  {label:'Revisões',to:'/revisoes',group:'Estudos'},
  {label:'Flashcards',to:'/flashcards',group:'Estudos'},
  {label:'Mapas Mentais',to:'/mapas-mentais',group:'Estudos'},
  {label:'Avisos',to:'/avisos',group:'Outros'},
  {label:'Configurações de estudo',to:'/configuracoes/estudos',group:'Outros'},
  {label:'Meu perfil',to:'/perfil',group:'Conta'},
] as const satisfies readonly NavigationPage[];

export const adminPageLinks = [
  {label:'Gestão de usuários',to:'/admin/usuarios',group:'Administração'},
  {label:'Catálogo de editais',to:'/admin/editais',group:'Administração'},
] as const satisfies readonly NavigationPage[];

export type BreadcrumbItem = {label:string; to?:string};
const detailRoutes = [
  {path:'/disciplinas/:id',parent:'/disciplinas',label:'Detalhes da disciplina'},
  {path:'/planos/novo',parent:'/concursos',label:'Criar plano de estudos'},
  {path:'/planos/:concursoId/replanejar',parent:'/concursos',label:'Replanejar estudos'},
  {path:'/editais/ativar',parent:'/concursos',label:'Ativar edital'},
  {path:'/admin/editais/novo',parent:'/admin/editais',label:'Novo edital'},
  {path:'/admin/editais/:id/editar',parent:'/admin/editais',label:'Editar edital'},
  {path:'/admin/editais/:id',parent:'/admin/editais',label:'Detalhes do edital'},
  {path:'/admin/usuarios/:id',parent:'/admin/usuarios',label:'Detalhes do usuário'},
] as const;

export function pageBreadcrumb(path:string,search=''):BreadcrumbItem[] {
  const pages:readonly NavigationPage[]=[...pageLinks,...adminPageLinks];
  const detail=detailRoutes.find(route=>matchPath({path:route.path,end:true},path));
  if(detail) {
    const parent=pages.find(page=>page.to===detail.parent)!;
    return [{label:parent.group},{label:parent.breadcrumbLabel??parent.label,to:parent.to},{label:detail.label}];
  }
  const route=path==='/disciplinas'
    ? pages.find(page=>page.to===(new URLSearchParams(search).get('view')==='edital'?'/disciplinas?view=edital':'/disciplinas'))
    : pages.find(page=>page.to===path);
  return route?[{label:route.group},{label:route.breadcrumbLabel??route.label}]:[{label:'Clickedital'}];
}
