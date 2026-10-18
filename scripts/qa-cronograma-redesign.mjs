import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';

// Fixtures locais interceptadas; nenhuma chamada ou escrita em produção.
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const scrollMatrix=process.env.QA_SCROLL_MATRIX==='1';
const scrollAudit=process.env.QA_SCROLL_AUDIT==='1'||scrollMatrix;
const output=new URL(scrollAudit?'../docs/qa/cronograma-scroll/':'../docs/qa/cronograma-refinement-v2/',import.meta.url);
await mkdir(output,{recursive:true});
const profiles=scrollMatrix?[[1920,1080],[1440,900],[1366,768],[768,1024],[375,812],[320,700]].flatMap(([width,height])=>['light','dark'].flatMap(theme=>[3,80].map(count=>({name:`${width}-${theme}-${count}`,width,height,theme,count,empty:false})))):[...[320,375,768,1024,1440,1920].flatMap(width=>['light','dark'].map(theme=>({name:`${width}-${theme}`,width,theme,empty:false}))),{name:'empty-light',width:1440,theme:'light',empty:true},{name:'empty-mobile-dark',width:320,theme:'dark',empty:true}];
const days=['seg','ter','qua','qui','sex','sab','dom'];
const names=['Língua Portuguesa','Tecnologia da Informação e Segurança de Redes com identificação extensa','Direito Constitucional','Direito Administrativo'];
const disciplines=names.map((nome,index)=>({id:`disc-${index}`,nome,concurso_ids:['contest']}));
const plan={id:'plan',user_id:'user',concurso_id:'contest',nome:'Preparação contínua',cargo:'Analista Judiciário — TI',tipo:'manual',ativo:true,data_inicio:'2026-10-01',data_fim:null,dias_disponiveis:days,disciplinas:disciplines.map((d,ordem)=>({disciplina_id:d.id,nome:d.nome,ordem}))};
const blocks=Array.from({length:16},(_,index)=>({id:`b-${index}`,user_id:'user',disciplina_id:disciplines[index%4].id,cronograma_id:'plan',concurso_id:'contest',dia_semana:days[Math.floor(index/3)],hora_inicio:index%2?'':'08:00',hora_fim:index%2?'':index<14?'08:40':'08:20',duracao_minutos:index<14?40:20,tipo:index%3?'estudo':'revisao',ativo:true,modo_criacao:'analitica',vigencia_inicio:'2026-10-01',vigencia_fim:null,vigencia_indeterminada:true,topico_ids:[`topic-${index}`],topico_nomes:[`Assunto ${index+1}: concordância e interpretação de texto`]}));
const json=data=>({status:200,contentType:'application/json',body:JSON.stringify(data)});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const results=[];
async function click(page,text) {
  const element=await page.evaluateHandle(label=>[...document.querySelectorAll('button,[role=tab]')].find(el=>el.textContent?.trim()===label&&el.getBoundingClientRect().height>0),text);
  assert.ok(element.asElement(),`Controle: ${text}`);
  await element.asElement().click();await element.dispose();
}
async function capture(page,name) {
  await page.screenshot({path:fileURLToPath(new URL(`${name}.png`,output))});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||document.querySelector('main').scrollWidth>document.querySelector('main').clientWidth+1),false,`${name}: overflow`);
  if(scrollMatrix)await checkScroll(page,name);
}
async function checkScroll(page,name) {
  const audit=await page.evaluate(()=>({documentOverflow:document.documentElement.scrollHeight>document.documentElement.clientHeight+1,documentTop:document.scrollingElement.scrollTop,headerTop:document.querySelector('#main-content').parentElement.querySelector('header').getBoundingClientRect().top,nested:[...document.querySelectorAll('main *')].filter(n=>n.clientHeight>0&&n.scrollHeight>n.clientHeight+2&&['auto','scroll'].includes(getComputedStyle(n).overflowY)).map(n=>({tag:n.tagName,class:n.className}))}));
  assert.equal(audit.documentOverflow,false,`${name}: rolagem externa`);
  assert.equal(audit.documentTop,0,`${name}: documento se moveu`);
  assert.equal(audit.headerTop,0,`${name}: header se moveu`);
  assert.deepEqual(audit.nested,[],`${name}: rolagem vertical aninhada`);
}
async function exerciseScroll(page,profile) {
  const scrollable=await page.$eval('main',n=>n.scrollHeight>n.clientHeight+1);
  if(scrollable) {
    await page.evaluate(()=>{const main=document.querySelector('main');main.scrollTop=0;main.querySelector('button')?.focus({preventScroll:true});});
    await page.keyboard.press('PageDown');
    await page.waitForFunction(()=>document.querySelector('main').scrollTop>0);
    await checkScroll(page,'PageDown');
    await page.$eval('main',n=>n.scrollTop=0);
    await page.mouse.move(profile.width-40,profile.height/2);
    await page.mouse.wheel({deltaY:500});
    await page.waitForFunction(()=>document.querySelector('main').scrollTop>0);
    await checkScroll(page,'mouse');
  }
  await page.$eval('main',n=>n.scrollTop=n.scrollHeight);
  const tail=await page.evaluate(()=>{
    const main=document.querySelector('main'),end=main.querySelector('[data-cronograma-section="weekly-overview"]');
    const expected=parseFloat(getComputedStyle(main).paddingBottom)+parseFloat(getComputedStyle(main.firstElementChild).paddingBottom);
    return {scrollable:main.scrollHeight>main.clientHeight+1,gap:main.scrollHeight-(end.getBoundingClientRect().bottom-main.getBoundingClientRect().top+main.scrollTop),expected};
  });
  if(tail.scrollable)assert.ok(Math.abs(tail.gap-tail.expected)<=2,`espaço ao final: ${JSON.stringify(tail)}`);
  await capture(page,`${profile.name}-bottom`);
  await click(page,'Próxima semana');await page.waitForNetworkIdle({idleTime:100});await checkScroll(page,'semana seguinte');
  await click(page,'Semana anterior');await page.waitForNetworkIdle({idleTime:100});
  await click(page,'Adicionar atividade');await page.waitForSelector('[role=dialog]');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
  await page.click('[aria-label^="Mais ações de"]');await page.waitForSelector('[role=menu]');await page.keyboard.press('Escape');
  if(profile.width>=768) {
    await page.click('[aria-label="Recolher menu"]');await page.waitForFunction(()=>document.querySelector('[aria-label="Expandir menu"]'));
    await page.click('[aria-label="Expandir menu"]');
  }else{
    await page.click('[aria-label="Abrir menu"]');await page.waitForFunction(()=>document.querySelector('[aria-label="Abrir menu"]').getAttribute('aria-expanded')==='true');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('[aria-label="Abrir menu"]').getAttribute('aria-expanded')==='false');
  }
  await click(page,'Mensal');await page.waitForSelector('[aria-label="Calendário mensal de estudos"]');await capture(page,`${profile.name}-month`);
  await click(page,'Lista');await capture(page,`${profile.name}-list`);
  await click(page,'Calendário');await click(page,'Semanal');
  const topics=await page.$$eval('[role=article]',nodes=>nodes.slice(0,3).map(n=>n.textContent.match(/Assunto distinto \d+/)?.[0]));
  assert.equal(new Set(topics).size,3,'assuntos distintos nos cards de Português');
  assert.ok(topics.every(Boolean),'assuntos associados visíveis');
  await checkScroll(page,'retorno semanal');
}
try {
  for(const profile of profiles.filter(p=>!process.env.QA_PROFILE||p.name===process.env.QA_PROFILE)) {
    const few=profile.width===320||profile.width===1440;
    const currentPlan={...plan,disciplinas:few?plan.disciplinas.slice(0,1):plan.disciplinas};
    const currentBlocks=scrollMatrix?Array.from({length:profile.count},(_,i)=>({...blocks[i%blocks.length],id:`scroll-${i}`,dia_semana:profile.count===3?'seg':days[i%7],disciplina_id:disciplines[0].id,topico_ids:[`scrolltopic-${i}`],topico_nomes:[`Assunto distinto ${i+1}: concordância e interpretação`]})):blocks.map(b=>({...b,disciplina_id:few?disciplines[0].id:b.disciplina_id}));
    const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.setViewport({width:profile.width,height:profile.height??1000});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.evaluateOnNewDocument(theme=>{
      localStorage.setItem('theme',theme);
      localStorage.setItem('aprovingo-auth',JSON.stringify({state:{accessToken:'qa-local',refreshToken:'qa-local',user:{id:'user',name:'QA',email:'qa@example.invalid',role:'user',status:'ativo',daily_goal_hours:2}},version:4}));
      localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:'contest'},version:0}));
      localStorage.setItem('cf-pomodoro',JSON.stringify({state:{mode:'pomodoro',focusHours:0,focusMinutes:25,shortBreakMinutes:5,longBreakMinutes:15,cyclesTarget:4,disciplinaId:null,topicoId:null,activityContext:null},version:0}));
    },profile.theme);
    await page.setRequestInterception(true);
    page.on('request',async request=>{
      const url=new URL(request.url());
      if(!url.pathname.startsWith('/api/v1/'))return url.origin===new URL(base).origin?request.continue():request.abort();
      const path=url.pathname.replace('/api/v1','');requests.push({path,method:request.method(),query:Object.fromEntries(url.searchParams)});
      if(path==='/concursos')return request.respond(json([{id:'contest',nome:'Tribunal Regional do Trabalho da Oitava Região — Concurso Público com identificação completa',orgao:'TRT 8ª Região',cargo:plan.cargo}]));
      if(path==='/disciplinas')return request.respond(json(disciplines));
      if(path==='/cronograma/planejamento')return request.respond(json(currentPlan));
      if(path==='/cronograma/blocos')return request.respond(json(profile.empty?[]:currentBlocks));
      if(path.endsWith('/atividades')) {
        const start=new Date(`${url.searchParams.get('inicio')}T12:00:00`);
        return request.respond(json(profile.empty?[]:currentBlocks.map(b=>{const d=new Date(start);d.setDate(d.getDate()+days.indexOf(b.dia_semana));return {...b,data:d.toISOString().slice(0,10),fonte:'bloco_semanal',bloco_cronograma_id:b.id,topico_nome:b.topico_nomes[0],topico_nomes:[],vigencia_inicio:d.toISOString().slice(0,10),vigencia_fim:d.toISOString().slice(0,10),vigencia_indeterminada:false};})));
      }
      if(path==='/cronograma/planejamento/plan/resumo')return request.respond(json({minutos_planejados_semana:profile.empty?0:scrollMatrix?currentBlocks.reduce((sum,b)=>sum+b.duracao_minutos,0):600,minutos_estudados_semana:profile.empty?0:145,disciplinas_count:currentPlan.disciplinas.length,atividades_planejadas:profile.empty?0:currentBlocks.length,atividades_concluidas:0,progresso_pct:0,questoes_total:0,acertos:0,erros:0,rendimento_pct:0,disciplinas:currentPlan.disciplinas.map((d,i)=>({disciplina_id:d.disciplina_id,minutos_planejados:profile.empty?0:currentBlocks.filter(b=>b.disciplina_id===d.disciplina_id).reduce((sum,b)=>sum+b.duracao_minutos,0),minutos_estudados:profile.empty?0:few?145:[90,35,20,0][i],sessoes_semana:profile.empty?0:currentBlocks.filter(b=>b.disciplina_id===d.disciplina_id).length,progresso_pct:0}))}));
      if(path==='/dashboard/resumo')return request.respond(json({meta_horas:2,horas_semana:profile.empty?0:145/60,questoes_semana:0}));
      if(path==='/calendario/mes')return request.respond(json({ano:Number(url.searchParams.get('ano')),mes:Number(url.searchParams.get('mes')),dias:[],resumo_mes:{}}));
      if(path==='/notifications/unread-count')return request.respond(json({count:0}));
      if(path==='/auth/me')return request.respond(json({id:'user',name:'QA',email:'qa@example.invalid',role:'user',status:'ativo',daily_goal_hours:2}));
      if(path==='/telemetry/preference')return request.respond(json({opted_out:true}));
      return request.respond(json([]));
    });
    try {
      await page.goto(`${base}/cronograma`,{waitUntil:'networkidle2'});
      await page.waitForSelector('[data-cronograma-section="weekly-overview"]');
      assert.equal(await page.$$eval('h1',nodes=>nodes.length),1);
      assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dark')),profile.theme==='dark');
      const placement=await page.evaluate(()=>{
        const layout=document.querySelector('[data-cronograma-section="agenda-layout"]').getBoundingClientRect(),lower=document.querySelector('[data-cronograma-section="weekly-overview"]').getBoundingClientRect();
        return {layout:{left:layout.left,right:layout.right,bottom:layout.bottom},lower:{left:lower.left,right:lower.right,top:lower.top},sidebar:document.querySelector('aside[aria-label="Acompanhamento do cronograma"]').textContent};
      });
      assert.ok(Math.abs(placement.lower.left-placement.layout.left)<1&&Math.abs(placement.lower.right-placement.layout.right)<1,'resumos ocupam largura total');
      assert.ok(placement.lower.top>=placement.layout.bottom,'resumos abaixo da agenda e consulta rápida');
      assert.ok(!placement.sidebar.includes('Disciplinas da semana')&&!placement.sidebar.includes('Atividades da semana'),'lateral compacta');
      if(scrollAudit) {
        const geometry=await page.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},document:{height:document.documentElement.scrollHeight,client:document.documentElement.clientHeight},nodes:[...document.querySelectorAll('html,body,#root,#root>div,#root>section,main,main>div,[data-slot=tabs],[data-slot=tabs-content],[data-cronograma-section]')].map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {tag:n.tagName,id:n.id,slot:n.getAttribute('data-slot'),section:n.getAttribute('data-cronograma-section'),class:n.className,top:r.top,bottom:r.bottom,height:r.height,client:n.clientHeight,scroll:n.scrollHeight,overflow:s.overflowY,minHeight:s.minHeight,display:s.display,hidden:n.hidden};}),scrollables:[...document.querySelectorAll('*')].filter(n=>n.clientHeight>0&&n.scrollHeight>n.clientHeight+1&&['auto','scroll','hidden'].includes(getComputedStyle(n).overflowY)).map(n=>({tag:n.tagName,id:n.id,class:n.className,client:n.clientHeight,scroll:n.scrollHeight,overflow:getComputedStyle(n).overflowY}))}));
        await writeFile(new URL(`${profile.name}-geometry.json`,output),JSON.stringify(geometry,null,2));
        if(!scrollMatrix)console.log(JSON.stringify(geometry,null,2));
      }
      await capture(page,profile.name);
      if(scrollMatrix) {
        await exerciseScroll(page,profile);assert.deepEqual(errors,[]);
        results.push({profile:profile.name,passed:true,documentScroll:false,nestedScroll:false});
        await context.close();continue;
      }
      await page.evaluate(()=>document.querySelector('[data-cronograma-section="agenda-layout"]').scrollIntoView({block:'start'}));
      await capture(page,`${profile.name}-agenda`);
      if(!profile.empty) {
        assert.equal(await page.$$eval('[role=article]',nodes=>nodes.length),16);
        await page.click('[aria-label^="Terça, 3 atividades"]');
        assert.equal(await page.$$eval('[role=article]',nodes=>nodes.length),3);
        assert.ok(await page.evaluate(()=>document.querySelector('[aria-label="Agenda semanal"]').textContent.includes('Sem horário')));
        await click(page,'Mostrar todos os dias');
        assert.equal(await page.$$eval('[role=article]',nodes=>nodes.length),16);
      }
      await page.evaluate(()=>document.querySelector('[data-cronograma-section="weekly-overview"]').scrollIntoView({block:'start'}));
      await capture(page,`${profile.name}-resumos`);
      if(!profile.empty) {
        assert.ok(await page.evaluate(()=>document.querySelector('[data-cronograma-section="weekly-overview"]').textContent.includes('16 atividades · 10h planejadas')),'carga confere com 16 ocorrências');
        assert.ok(placement.sidebar.includes('Execução da carga horária: 24%')&&placement.sidebar.includes('Atividades concluídas: 0 de 16 (0%)'),'horas e conclusão separadas');
        if(profile.width>=1440) {
          const sizes=await page.$$eval('[role=article]',nodes=>nodes.filter(n=>n.textContent.includes('Língua Portuguesa')).map(n=>n.getBoundingClientRect().height));
          assert.ok(sizes.every(height=>height<=160),'cards simples até 160 px');
        }
      }
      await page.evaluate(()=>document.querySelector('main').scrollTo(0,0));
      await click(page,'Mensal');
      await page.waitForSelector('[aria-label="Calendário mensal de estudos"]');
      await capture(page,`${profile.name}-mensal`);
      await click(page,'Lista');
      await capture(page,`${profile.name}-lista`);
      assert.ok(requests.filter(r=>r.path==='/cronograma/planejamento'||r.path==='/cronograma/blocos').every(r=>r.query.concurso_id==='contest'));
      assert.deepEqual(errors,[]);
      results.push({profile:profile.name,passed:true,overflow:false});
    }catch(error){await capture(page,`${profile.name}-failure`).catch(()=>{});results.push({profile:profile.name,passed:false,error:error.message,errors});}
    await context.close();
  }
} finally {await browser.close();await writeFile(new URL('results.json',output),JSON.stringify({mocked:true,productionWrites:false,results},null,2));}
console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
