import {describe,expect,it} from 'vitest';
import {adminPageLinks,pageBreadcrumb,pageLinks} from './navigation';

describe('configuração central do breadcrumb',()=>{
  it.each([...pageLinks,...adminPageLinks])('identifica $to pelo grupo e nome configurados',page=>{
    const [path,query]=page.to.split('?');
    expect(pageBreadcrumb(path,query)).toEqual([{label:page.group},{label:'breadcrumbLabel' in page?page.breadcrumbLabel:page.label}]);
  });
  it.each([
    ['/disciplinas/123','Estudos','Disciplinas','/disciplinas','Detalhes da disciplina'],
    ['/planos/novo','Principal','Meus Concursos','/concursos','Criar plano de estudos'],
    ['/planos/123/replanejar','Principal','Meus Concursos','/concursos','Replanejar estudos'],
    ['/editais/ativar','Principal','Meus Concursos','/concursos','Ativar edital'],
    ['/admin/editais/novo','Administração','Catálogo de editais','/admin/editais','Novo edital'],
    ['/admin/editais/123/editar','Administração','Catálogo de editais','/admin/editais','Editar edital'],
    ['/admin/editais/123','Administração','Catálogo de editais','/admin/editais','Detalhes do edital'],
    ['/admin/usuarios/123','Administração','Gestão de usuários','/admin/usuarios','Detalhes do usuário'],
  ])('resolve a página interna %s com link válido ao pai',(path,group,parent,to,current)=>{
    expect(pageBreadcrumb(path)).toEqual([{label:group},{label:parent,to},{label:current}]);
  });
  it('distingue edital e disciplinas por query sem criar rotas de grupos inexistentes',()=>{
    expect(pageBreadcrumb('/disciplinas','?view=edital&filter=active').at(-1)?.label).toBe('Edital Verticalizado');
    expect(pageBreadcrumb('/disciplinas','?view=cards').at(-1)?.label).toBe('Disciplinas');
    expect(pageBreadcrumb('/cronograma')[0]).toEqual({label:'Estudos'});
    expect(pageBreadcrumb('/rota-inexistente')).toEqual([{label:'Clickedital'}]);
  });
});
