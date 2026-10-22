import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
const base='http://127.0.0.1:4175',output=new URL('../docs/qa/calendario-redesign/',import.meta.url);await mkdir(output,{recursive:true});
const cid='00000000-0000-4000-8000-000000000001',user={id:cid,name:'Estudante QA',email:'qa@example.invalid',role:'user',status:'ativo'};
const disciplines=[{id:'d1',nome:'Língua Portuguesa e interpretação de textos',concurso_ids:[cid]},{id:'d2',nome:'DireitoConstitucional'.repeat(9),concurso_ids:[cid]},{id:'d3',nome:'Tecnologia da Informação',concurso_ids:[cid]},{id:'d4',nome:'Direito Administrativo',concurso_ids:[cid]}];
const json=(body,status=200)=>({status,contentType:'application/json',body:JSON.stringify(body)});
function dataFor(ano,mes){return Array.from({length:new Date(ano,mes,0).getDate()},(_,i)=>{
 const day=i+1,data=`${ano}-${String(mes).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 const minutes={5:75,6:75,7:75,20:150,22:240,25:375}[day]||0,real={5:76,6:35,8:40,20:30}[day]||0;
 const future=data>'2026-10-20';const status=future?'futuro':day===5?'cumprido':[6,20].includes(day)?'parcial':day===7?'nao_cumprido':day===8?'estudou_sem_plano':'sem_planejamento';
 const planejado=minutes?(day===22?disciplines:[disciplines[0]]).map((d,index)=>({id:`b${index}`,bloco_cronograma_id:`b${index}`,fonte:'bloco_semanal',disciplina_id:d.id,disciplina_nome:d.nome,topico_id:`t${index}`,topico_nome:`Tópico ${index}: interpretação, aplicação e revisão dos conceitos`,duracao_minutos:day===22?60:minutes,modo:'aprendizado'})):[];
 return {data,status,minutos_planejados:minutes,minutos_realizados:future?0:real,minutos_extra:day===8?real:0,sessoes_realizadas:!future&&real?1:0,planejado};
});}
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});const results=[];
async function shot(page,name){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await new Promise(r=>setTimeout(r,250));await page.screenshot({path:fileURLToPath(new URL(name,output))});}
async function geometry(page){return page.evaluate(()=>{
 const main=document.querySelector('main'),dialog=document.querySelector('[role=dialog]');const r=dialog?.getBoundingClientRect();
 const view=document.querySelector('.calendar-study-month');const mode=view&&getComputedStyle(view).display!=='none'?'month':'agenda';
 const selected=document.querySelector(mode==='month'?'.calendar-study-month':'.calendar-study-agenda');
 return {mode,docOverflow:document.documentElement.scrollWidth>innerWidth+1,mainOverflow:main.scrollWidth>main.clientWidth+1,externalVertical:document.documentElement.scrollHeight>innerHeight+1,cells:selected?[...selected.querySelectorAll('[data-calendar-date]')].map(n=>({date:n.dataset.calendarDate,status:n.dataset.status,height:n.getBoundingClientRect().height,overflow:n.scrollWidth>n.clientWidth+1})):[],dialog:dialog?{contained:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,overflow:dialog.scrollWidth>dialog.clientWidth+1,scrolls:[...dialog.querySelectorAll('*')].filter(n=>n.scrollHeight>n.clientHeight+2&&['auto','scroll'].includes(getComputedStyle(n).overflowY)).length}:null};
 });}
async function valid(page){const g=await geometry(page);assert.equal(g.docOverflow||g.mainOverflow||g.externalVertical,false,'external overflow');assert.ok(g.cells.every(c=>!c.overflow),'cell overflow');if(g.dialog){assert.ok(g.dialog.contained&&!g.dialog.overflow);assert.ok(g.dialog.scrolls<=1,'one dialog scroll');}return g;}
async function activeSelector(page){return (await geometry(page)).mode==='month'?'.calendar-study-month':'.calendar-study-agenda';}
try{for(const width of (process.env.QA_WIDTHS ? process.env.QA_WIDTHS.split(',').map(Number) : [320,375,390,768,1024,1440,1920]))for(const theme of ['light','dark']){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],requests=[];let mode='normal',detailMode='normal';
 try{
 await page.setViewport({width,height:width<768?950:1100});await page.emulateTimezone('America/Sao_Paulo');page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(({user,cid,theme})=>{const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-10-20T15:00:00.000Z']));}static now(){return new NativeDate('2026-10-20T15:00:00.000Z').getTime();}};localStorage.setItem('theme',theme);localStorage.setItem('aprovingo-auth',JSON.stringify({state:{user,accessToken:'qa-local',refreshToken:'qa-local'},version:4}));localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:cid},version:0}));},{user,cid,theme});
 await page.setRequestInterception(true);page.on('request',async r=>{
  const u=new URL(r.url());if(!u.pathname.startsWith('/api/v1/'))return u.origin===base?r.continue():r.abort();const p=u.pathname.replace('/api/v1','');requests.push({p,method:r.method(),search:u.search});
  if(p==='/auth/me')return r.respond(json(user));if(p==='/concursos')return r.respond(json([{id:cid,nome:'RFB',orgao:'Receita Federal',cargo:'Auditor',status:'ativo'}]));
  if(p==='/disciplinas')return r.respond(json(disciplines));if(p==='/cronograma/blocos')return r.respond(json(disciplines.map((d,i)=>({id:`b${i}`,disciplina_id:d.id,dia_semana:'seg',hora_inicio:'08:00',hora_fim:'09:00',ativo:true,tipo:'teoria',modo_criacao:'avancado',topico_ids:[]}))));
  if(p==='/cronograma/calendario'){
   if(mode==='loading')await new Promise(r=>setTimeout(r,1600));if(mode==='error')return r.respond(json({detail:'Falha QA'},500));
   const ano=Number(u.searchParams.get('ano')),mes=Number(u.searchParams.get('mes')),dias=dataFor(ano,mes);
   return r.respond(json({ano,mes,timezone:'America/Sao_Paulo',dias:mode==='empty'?dias.map(d=>({...d,status:d.data>'2026-10-20'?'futuro':'sem_planejamento',minutos_planejados:0,minutos_realizados:0,planejado:[]})):dias,resumo_mes:mode==='empty'?{dias_com_planejamento:0,dias_cumpridos:0,dias_parciais:0,dias_nao_cumpridos:0,dias_estudou_sem_plano:0,minutos_planejados:0,minutos_realizados:0,taxa_cumprimento_pct:0}:{dias_com_planejamento:6,dias_cumpridos:1,dias_parciais:2,dias_nao_cumpridos:1,dias_estudou_sem_plano:1,minutos_planejados:990,minutos_realizados:181,taxa_cumprimento_pct:17}}));
  }
  if(p.startsWith('/sessoes-estudo/dia/')){if(detailMode==='error')return r.respond(json({detail:'Falha QA'},500));const data=p.split('/').pop(),[ano,mes]=data.split('-').map(Number),d=dataFor(ano,mes).find(d=>d.data===data);return r.respond(json({data,status:d.status,timezone:'America/Sao_Paulo',totais:{planejados:d.minutos_planejados,realizados:d.minutos_realizados,extra:d.minutos_extra},planejado:d.planejado,realizado:d.minutos_realizados?[{id:'s1',disciplina_id:'d1',topico_id:'t0',duracao_minutos:d.minutos_realizados,tipo:'teoria'}]:[]}));}
  if(p==='/notifications/unread-count')return r.respond(json({count:0}));if(p==='/telemetry/preference')return r.respond(json({opted_out:true}));return r.respond(json([]));
 });
 await page.goto(`${base}/estudos/calendario?ano=2026&mes=10`,{waitUntil:'networkidle2'});await page.waitForSelector('.calendar-study-view');
 assert.equal(await page.$$eval('[data-metric-tone]',ns=>ns.length),6);assert.ok(await page.$eval('[aria-label="Resumo do mês"]',n=>n.textContent.includes('3h 01min')&&n.textContent.includes('16h 30min')&&n.textContent.includes('17%')));
 const g=await valid(page);if(width<=1024)assert.equal(g.mode,'agenda');if(width>=1440)assert.equal(g.mode,'month');
 const prefix=await activeSelector(page);for(const [date,status] of [['05','cumprido'],['06','parcial'],['07','nao_cumprido'],['08','estudou_sem_plano'],['20','parcial'],['22','futuro']])assert.equal(await page.$eval(`${prefix} [data-calendar-date="2026-10-${date}"]`,n=>n.dataset.status),status);
 assert.ok(await page.$eval(`${prefix} [data-calendar-date="2026-10-22"]`,n=>n.textContent.includes('+2 disciplinas')));assert.equal(await page.$eval(`${prefix} [data-calendar-date="2026-10-20"]`,n=>n.getAttribute('aria-current')),'date');
 if(g.mode==='month'){assert.equal(g.cells.length,31);assert.ok(Math.max(...g.cells.map(c=>c.height))<320);assert.ok(Math.min(...g.cells.map(c=>c.height))<Math.max(...g.cells.map(c=>c.height)));}else{await page.locator('::-p-aria(Mostrar dias vazios)').click();assert.equal(await page.$$eval('.calendar-study-agenda [data-calendar-date]',ns=>ns.length),31);await page.locator('::-p-aria(Ocultar dias vazios)').click();}
 await shot(page,`${width}-${theme}-calendar.png`);
 await page.locator(`${prefix} [data-calendar-date="2026-10-22"]`).click();await page.waitForSelector('[role=dialog]');await page.waitForFunction(()=>document.querySelector('[role=dialog]')?.textContent.includes('Tópico 3'));
 await valid(page);assert.equal(await page.$$eval('[role=dialog] button',ns=>ns.some(n=>n.textContent.includes('Registrar estudo'))),false,'no future record');await shot(page,`${width}-${theme}-future-detail.png`);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
 await page.locator(`${prefix} [data-calendar-date="2026-10-05"]`).click();await page.waitForSelector('[role=dialog]');await page.waitForFunction(()=>document.querySelector('[role=dialog]')?.textContent.includes('Estudos realizados'));await valid(page);assert.ok(await page.$eval('[role=dialog]',n=>n.textContent.includes('Registrar estudo')));await shot(page,`${width}-${theme}-completed-detail.png`);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
 await page.locator('::-p-aria(Próximo mês)').click();await page.waitForFunction(()=>new URL(location).searchParams.get('mes')==='11');await page.waitForSelector('.calendar-study-view');await page.locator('::-p-aria(Mês anterior)').click();await page.waitForFunction(()=>new URL(location).searchParams.get('mes')==='10');await page.waitForSelector('.calendar-study-view');
 if([375,1440].includes(width)&&theme==='light'){
  for(const [ano,mes,total] of [[2026,12,31],[2027,1,31],[2024,2,29],[2025,2,28],[2026,4,30]]){await page.goto(`${base}/estudos/calendario?ano=${ano}&mes=${mes}`,{waitUntil:'networkidle2'});await page.waitForSelector('.calendar-study-view');assert.equal(await page.$$eval('.calendar-study-month [data-calendar-date]',ns=>ns.length),total);await valid(page);if(ano===2026&&mes===12){await page.locator('::-p-aria(Próximo mês)').click();await page.waitForFunction(()=>new URL(location).searchParams.get('ano')==='2027'&&new URL(location).searchParams.get('mes')==='1');await page.waitForSelector('.calendar-study-view');await page.locator('::-p-aria(Mês anterior)').click();await page.waitForFunction(()=>new URL(location).searchParams.get('ano')==='2026'&&new URL(location).searchParams.get('mes')==='12');}}
  const today=await page.evaluate(()=>({ano:new Date().getFullYear(),mes:new Date().getMonth()+1}));await page.locator('::-p-aria(Hoje)').click();await page.waitForFunction(({ano,mes})=>new URL(location).searchParams.get('ano')===String(ano)&&new URL(location).searchParams.get('mes')===String(mes),{},today);await page.waitForSelector('.calendar-study-view');
  mode='loading';await page.goto(`${base}/estudos/calendario?ano=2026&mes=10`,{waitUntil:'domcontentloaded'});await page.waitForSelector('[aria-busy=true]');assert.ok(await page.$('button[aria-label="Próximo mês"]'));await shot(page,`${width}-${theme}-loading.png`);await page.waitForSelector('.calendar-study-view');
  mode='empty';await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('.calendar-study-view');await valid(page);await shot(page,`${width}-${theme}-empty.png`);
  mode='error';await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('[role=alert]',{timeout:20000});assert.ok(await page.$('button[aria-label="Próximo mês"]'));await shot(page,`${width}-${theme}-error.png`);
  mode='normal';await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('.calendar-study-view');const current=await activeSelector(page);detailMode='error';await page.locator(`${current} [data-calendar-date="2026-10-05"]`).click();await page.waitForSelector('[role=dialog] [role=alert]',{timeout:20000});await valid(page);await shot(page,`${width}-${theme}-detail-error.png`);await page.keyboard.press('Escape');
 }
 assert.ok(requests.filter(r=>r.p==='/cronograma/calendario').every(r=>new URLSearchParams(r.search).get('concurso_id')===cid),'contest filter preserved');assert.deepEqual(errors,[]);results.push({width,theme,passed:true,geometry:g,requests:requests.length});
 }catch(error){results.push({width,theme,passed:false,error:String(error)});await shot(page,`${width}-${theme}-failure.png`);}
 finally{await context.close();}
 console.log(JSON.stringify(results.at(-1)));
}}finally{await browser.close();}
await writeFile(new URL(process.env.QA_RESULT_FILE || 'results.json',output),JSON.stringify(results,null,2));assert.ok(results.every(r=>r.passed));
