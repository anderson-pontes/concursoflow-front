import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';

// Somente localhost, APIs interceptadas e dados vazios/erros controlados.
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const output=new URL('../docs/qa/global-header/',import.meta.url);
await mkdir(output,{recursive:true});
const id='00000000-0000-4000-8000-000000000001';
const routes=[
  ['/dashboard','Visão geral','Dashboard'],['/cronograma','Estudos','Cronograma'],
  ['/disciplinas?view=edital','Estudos','Edital Verticalizado'],['/disciplinas?view=cards','Estudos','Disciplinas'],
  ['/pomodoro','Estudos','Pomodoro'],['/estudos/calendario','Estudos','Calendário'],
  ['/revisoes','Estudos','Revisões'],['/flashcards','Estudos','Flashcards'],
  ['/mapas-mentais','Estudos','Mapas Mentais'],['/estudos/historico','Análises','Histórico de Estudos'],
  ['/concursos','Principal','Meus Concursos'],['/avisos','Outros','Avisos'],
  ['/configuracoes/estudos','Outros','Configurações de estudo'],['/perfil','Conta','Meu perfil'],
  ['/planos/novo','Principal','Criar plano de estudos'],['/editais/ativar','Principal','Ativar edital'],
  [`/planos/${id}/replanejar`,'Principal','Replanejar estudos'],[`/disciplinas/${id}`,'Estudos','Detalhes da disciplina'],
  ['/admin/usuarios','Administração','Gestão de usuários'],['/admin/editais','Administração','Catálogo de editais'],
  ['/admin/editais/novo','Administração','Novo edital'],[`/admin/editais/${id}/editar`,'Administração','Editar edital'],
  [`/admin/editais/${id}`,'Administração','Detalhes do edital'],[`/admin/usuarios/${id}`,'Administração','Detalhes do usuário'],
];
const profiles=[...[1440,1920,1366,1024,768,375,320].flatMap(width=>['light','dark'].map(theme=>({width,theme,name:`${width}-${theme}`})))];
const user={id,name:'Anderson Pinheiro com identificação extensa para validar truncamento',email:'qa@example.invalid',role:'admin',status:'ativo',daily_goal_hours:2,created_at:'2026-10-01'};
const json=(data,status=200)=>({status,contentType:'application/json',body:JSON.stringify(data)});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const results=[];
async function audit(page,expected,group) {
  const geometry=await page.evaluate(()=>{
    const headers=[...document.querySelectorAll('[data-app-header]')],header=headers[0],main=document.querySelector('main');
    const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height};};
    return {count:headers.length,header:rect(header),main:rect(main),current:header.querySelector('[aria-current=page]')?.textContent,breadcrumb:header.querySelector('nav').textContent,docX:document.documentElement.scrollWidth>innerWidth+1,mainX:main.scrollWidth>main.clientWidth+1,docY:document.documentElement.scrollHeight>document.documentElement.clientHeight+1,controls:[...header.querySelectorAll('button')].filter(n=>n.getBoundingClientRect().height>0).map(n=>({name:n.getAttribute('aria-label'),...rect(n)}))};
  });
  assert.equal(geometry.count,1,'um único header compartilhado');
  assert.equal(geometry.current,expected,'página atual');assert.ok(geometry.breadcrumb.includes(group),'grupo contextual');
  assert.equal(geometry.header.height,65,'altura preservada do Cronograma');
  assert.equal(geometry.header.top,0,'header fixo');
  assert.ok(Math.abs(geometry.header.left-geometry.main.left)<=1,'alinhamento com main e sidebar');
  assert.equal(geometry.docX||geometry.mainX||geometry.docY,false,'sem overflow ou dupla rolagem');
  assert.ok(geometry.controls.every(c=>c.height>=44),`áreas de toque: ${JSON.stringify(geometry.controls)}`);
  return geometry;
}
async function exerciseControls(page,width) {
  let stage='busca';
  try {
  const search='[aria-label="Buscar páginas (Ctrl+K)"]';
  await page.focus(search);await page.keyboard.down('Control');await page.keyboard.press('k');await page.keyboard.up('Control');
  await page.waitForSelector('[role=dialog]');
  await page.type('[aria-label="Nome da página"]','cronograma');
  assert.ok(await page.$eval('[role=dialog]',n=>n.textContent.includes('Meu Cronograma')));
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
  await page.waitForFunction(selector=>document.activeElement===document.querySelector(selector),{timeout:3000},search);
  assert.equal(await page.$eval(search,n=>document.activeElement===n),true,'foco restaurado à busca');
  stage='notificações';
  await page.click('[aria-label="Notificações"]');await page.waitForSelector('[role=menu][aria-label="Notificações"]');
  await page.waitForFunction(()=>document.querySelector('[role=menu]')?.contains(document.activeElement));
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=menu]'));
  stage='perfil';
  await page.click('[aria-label="Menu do usuário"]');await page.waitForSelector('[role=menu]');
  await page.waitForFunction(()=>document.querySelector('[role=menu]')?.contains(document.activeElement));
  assert.ok(await page.$eval('[role=menu]',n=>n.textContent.includes('qa@example.invalid')));
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=menu]'));
  if(width>=640) {
    stage='tema';
    const before=await page.evaluate(()=>document.documentElement.classList.contains('dark'));
    await page.click('[data-app-header] button[aria-label^="Ativar modo"]');
    assert.notEqual(await page.evaluate(()=>document.documentElement.classList.contains('dark')),before);
    await page.click('[data-app-header] button[aria-label^="Ativar modo"]');
  }
  if(width>=768) {
    stage='sidebar desktop';
    await page.click('[aria-label="Recolher menu"]');
    await page.waitForFunction(()=>Math.abs(document.querySelector('[data-app-header]').getBoundingClientRect().left-72)<=1);
    await page.click('[aria-label="Expandir menu"]');
    await page.waitForFunction(()=>Math.abs(document.querySelector('[data-app-header]').getBoundingClientRect().left-260)<=1);
  }else{
    stage='sidebar mobile';
    await page.click('[aria-label="Abrir menu"]');await page.waitForFunction(()=>document.querySelector('[aria-label="Abrir menu"]').getAttribute('aria-expanded')==='true');
    await page.waitForFunction(()=>Math.abs(document.querySelector('#app-sidebar').getBoundingClientRect().left)<=1);
    const before=await page.evaluate(()=>document.documentElement.classList.contains('dark'));
    await page.click('#app-sidebar [role="switch"]');
    assert.notEqual(await page.evaluate(()=>document.documentElement.classList.contains('dark')),before);
    await page.click('#app-sidebar [role="switch"]');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('[aria-label="Abrir menu"]').getAttribute('aria-expanded')==='false');
  }
  }catch(error){throw new Error(`${stage}: ${error.message}`);}
}
try {
  for(const profile of profiles.filter(p=>!process.env.QA_PROFILE||p.name===process.env.QA_PROFILE)) {
    const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
    await page.setViewport({width:profile.width,height:profile.width<768?812:900});
    page.on('pageerror',e=>errors.push(e.message));
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.evaluateOnNewDocument(({user,theme})=>{
      localStorage.clear();sessionStorage.clear();localStorage.setItem('theme',theme);
      localStorage.setItem('aprovingo-auth',JSON.stringify({state:{accessToken:'qa-local',refreshToken:'qa-local',user},version:4}));
      localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:null},version:0}));
    },{user,theme:profile.theme});
    await page.setRequestInterception(true);
    page.on('request',async request=>{
      const url=new URL(request.url());
      if(!url.pathname.startsWith('/api/v1/'))return url.origin===new URL(base).origin?request.continue():request.abort();
      const path=url.pathname.replace('/api/v1','');
      if(path==='/auth/me')return request.respond(json(user));
      if(['/concursos','/disciplinas','/notifications','/notifications/'].includes(path))return request.respond(json([]));
      if(path==='/notifications/unread-count')return request.respond(json({count:0}));
      if(path==='/telemetry/preference')return request.respond(json({opted_out:true}));
      return request.respond(json({detail:'Estado indisponível controlado no teste local'},404));
    });
    const selected=profile.name==='1440-light'?routes:[...routes.slice(0,4),routes.at(-3)];
    for(const [route,group,label] of selected) {
      try {
        errors.length=0;
        await page.goto(`${base}${route}`,{waitUntil:'networkidle2'});
        await page.waitForSelector('[data-app-header]',{timeout:5000});
        const geometry=await audit(page,label,group);
        assert.deepEqual(errors,[],'sem erros de renderização');
        await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-${label.replaceAll(' ','-')}.png`,output))});
        results.push({profile:profile.name,route,passed:true,geometry});
      }catch(error){console.log(JSON.stringify({profile:profile.name,route,error:error.message,errors}));results.push({profile:profile.name,route,passed:false,error:error.message,errors:[...errors]});}
    }
    try {await exerciseControls(page,profile.width);results.push({profile:profile.name,controls:true,passed:true});}
    catch(error){await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-controls-failure.png`,output))});results.push({profile:profile.name,controls:true,passed:false,error:error.message});}
    await context.close();
  }
}finally{await browser.close();await writeFile(new URL(process.env.QA_PROFILE?`results-${process.env.QA_PROFILE}.json`:'results.json',output),JSON.stringify({mocked:true,productionWrites:false,results},null,2));}
console.log(JSON.stringify({total:results.length,passed:results.filter(r=>r.passed).length,failures:results.filter(r=>!r.passed)},null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
