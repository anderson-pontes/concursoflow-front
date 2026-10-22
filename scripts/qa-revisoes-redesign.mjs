import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
const base='http://127.0.0.1:4175',output=new URL('../docs/qa/revisoes-final/',import.meta.url);await mkdir(output,{recursive:true});
const cid='00000000-0000-4000-8000-000000000001',did='00000000-0000-4000-8000-000000000002';
const user={id:cid,name:'Estudante QA',email:'qa@example.invalid',role:'user',status:'ativo'};
const groups=['hoje','atrasadas','proximas','concluidas','ignoradas'];const labels=['Hoje','Atrasadas','Próximas','Concluídas','Ignoradas'];
const topic='Compreensão e interpretação de textos, relações de sentido e identificação das informações explícitas e implícitas.';
function fixture(){return Object.fromEntries(groups.map((grupo,i)=>[grupo,Array.from({length:grupo==='hoje'?2:1},(_,n)=>({id:`${grupo}-${n}`,versao:1,concurso_id:cid,disciplina_id:n?'d2':did,disciplina_nome:n?'DisciplinaSemEspaços'.repeat(7):'Língua Portuguesa e interpretação de textos',topico_id:`t${i}-${n}`,topico_nome:n?'TópicoSemEspaços'.repeat(20):topic,origem_tipo:'ciclo_topico',origem_sessao_id:null,regra_versao:'topico-cycle-v1',ciclo_indice:0,intervalo_dias:7,data_prevista_original:'2026-10-21',data_prevista_atual:i===1?'2026-10-18':i===2?'2026-10-25':'2026-10-21',timezone:'America/Sao_Paulo',status:i===3?'concluida':i===4?'ignorada':'pendente',ultima_transicao_em:'2026-10-20T10:00:00-03:00'}))]));}
const json=(data,status=200)=>({status,contentType:'application/json',body:JSON.stringify(data)});
async function shot(page,name){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:fileURLToPath(new URL(name,output))});}
async function valid(page){const g=await page.evaluate(()=>{const main=document.querySelector('main'),lib=document.querySelector('.reviews-page'),s=getComputedStyle(main),cards=[...document.querySelectorAll('.review-card')];return{overflow:document.documentElement.scrollWidth>innerWidth+1||main.scrollWidth>main.clientWidth+1,externalScroll:document.documentElement.scrollHeight>innerHeight+1,fullWidth:Math.abs(lib.getBoundingClientRect().width-(main.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)))<2,cardOverflow:cards.some(n=>n.scrollWidth>n.clientWidth+1),kpiColumns:getComputedStyle(document.querySelector('.reviews-summary-grid')).gridTemplateColumns.split(' ').length};});assert.equal(g.overflow||g.externalScroll||g.cardOverflow,false);assert.ok(g.fullWidth);return g;}
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']}),results=[];
try{for(const width of (process.env.QA_WIDTHS?process.env.QA_WIDTHS.split(',').map(Number):[375,390,768,1366,1920]))for(const theme of ['light','dark']){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],requests=[];let mode='normal',items=fixture();
 try{
 await page.setViewport({width,height:1100});page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(({user,cid,theme})=>{localStorage.setItem('theme',theme);localStorage.setItem('aprovingo-auth',JSON.stringify({state:{user,accessToken:'qa-local',refreshToken:'qa-local'},version:4}));localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:cid},version:0}));},{user,cid,theme});
 await page.setRequestInterception(true);page.on('request',async r=>{
 const u=new URL(r.url());if(!u.pathname.startsWith('/api/v1/'))return u.origin===base?r.continue():r.abort();const p=u.pathname.replace('/api/v1','');requests.push({p,method:r.method(),params:Object.fromEntries(u.searchParams)});
 if(p==='/auth/me')return r.respond(json(user));if(p==='/concursos')return r.respond(json([{id:cid,nome:'Receita Federal — Auditor Fiscal '.repeat(10),orgao:'Receita Federal',cargo:'Auditor',status:'ativo'}]));
 if(p==='/disciplinas')return r.respond(json([{id:did,nome:'Língua Portuguesa e interpretação de textos'},{id:'d2',nome:'DisciplinaSemEspaços'.repeat(7)}]));
 if(p==='/pomodoro-config')return r.respond(json({mode:'pomodoro',focus_hours:0,focus_minutes:25,short_break_minutes:5,long_break_minutes:15,cycles_target:4,last_disciplina_id:null,last_topico_id:null}));
 if(p==='/revisoes'){
  if(mode==='loading')await new Promise(resolve=>setTimeout(resolve,1800));if(mode==='error')return r.respond(json({detail:'Falha QA'},500));
  const current=u.searchParams.get('grupo'),disc=u.searchParams.get('disciplina_id'),start=u.searchParams.get('data_inicio'),end=u.searchParams.get('data_fim');
  const scoped=Object.fromEntries(groups.map(group=>[group,(mode==='empty'||mode==='no-today'&&group==='hoje'||mode==='no-future'&&['hoje','proximas'].includes(group))?[]:items[group].filter(item=>(!disc||item.disciplina_id===disc)&&(!start||item.data_prevista_atual>=start)&&(!end||item.data_prevista_atual<=end))]));
  return r.respond(json({grupo:current,items:scoped[current],has_more:false,next_cursor:null,limit:20,...(u.searchParams.get('incluir_resumo')==='true'?{resumo:Object.fromEntries(groups.map(group=>[group,scoped[group].length]))}:{})}));
 }
 if(p.endsWith('/ignorar')&&r.method()==='POST'){const item=items.hoje.shift();items.ignoradas.push({...item,status:'ignorada'});return r.respond(json({id:item.id,concurso_id:cid,status:'ignorada',versao:2}));}
 if(p==='/notifications/unread-count')return r.respond(json({count:0}));if(p==='/telemetry/preference')return r.respond(json({opted_out:true}));return r.respond(json([]));
 });
 await page.goto(`${base}/revisoes`,{waitUntil:'networkidle2'});await page.waitForSelector('.review-card');
 const g=await valid(page);assert.equal(g.kpiColumns,width>=1366?4:2);assert.equal(await page.$eval('[aria-label="Resumo das revisões"] [data-review-group=hoje] > p',n=>n.textContent),'2');
 await shot(page,`${width}-${theme}-with-reviews.png`);
 for(let i=1;i<groups.length;i++){await page.locator(`::-p-aria([name="${labels[i]}"][role="tab"])`).click();await page.waitForFunction(group=>new URL(location).searchParams.get('grupo')===group,{},groups[i]);await page.waitForSelector('.review-card');await valid(page);}
 await page.locator('::-p-aria([name="Hoje"][role="tab"])').click();await page.waitForSelector('.review-card');
 if(await page.$eval('.reviews-mobile-filters',n=>getComputedStyle(n).display!=='none')){await page.locator('::-p-aria(Filtros)').click();await page.waitForSelector('[role=dialog]');await shot(page,`${width}-${theme}-filters.png`);await page.locator('[role=dialog] [role=combobox]').click();await page.waitForSelector('[role=option]');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option');await page.keyboard.press('End');await page.waitForFunction(()=>document.activeElement?.textContent.includes('DisciplinaSemEspa'));await page.keyboard.press('Enter');await page.locator('::-p-aria(Aplicar filtros)').click();}
 else {await page.locator('::-p-aria(Filtrar revisões por disciplina)').click();await page.waitForSelector('[role=option]');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option');await page.keyboard.press('End');await page.waitForFunction(()=>document.activeElement?.textContent.includes('DisciplinaSemEspa'));await page.keyboard.press('Enter');}
 await page.waitForFunction(()=>new URL(location).searchParams.get('disciplina')==='d2');await page.waitForFunction(()=>document.querySelectorAll('.review-card').length===1);await valid(page);
 await page.goto(`${base}/revisoes?grupo=hoje&disciplina=${did}&inicio=2026-10-25&fim=2026-10-26`,{waitUntil:'networkidle2'});await page.waitForFunction(()=>document.body.textContent.includes('Nenhuma revisão encontrada para os filtros selecionados.'));await valid(page);await shot(page,`${width}-${theme}-filtered-empty.png`);
 mode='empty';await page.goto(`${base}/revisoes`,{waitUntil:'networkidle2'});await page.waitForFunction(()=>document.body.textContent.includes('Nenhuma revisão disponível neste concurso.'));await shot(page,`${width}-${theme}-empty.png`);
 for(let i=1;i<groups.length;i++){await page.locator(`::-p-aria([name="${labels[i]}"][role="tab"])`).click();await page.waitForFunction(()=>!document.querySelector('.review-card'));await valid(page);}
 if(width===1366&&theme==='light'){
  mode='no-today';await page.goto(`${base}/revisoes`,{waitUntil:'networkidle2'});await page.locator('::-p-aria(Ver próximas revisões)').click();await page.waitForSelector('.review-card');assert.equal(new URL(page.url()).searchParams.get('grupo'),'proximas');mode='no-future';await page.goto(`${base}/revisoes`,{waitUntil:'networkidle2'});await page.waitForFunction(()=>document.body.textContent.includes('Você não tem revisões programadas para hoje.'));assert.equal(await page.$('button::-p-aria(Ver próximas revisões)'),null);mode='normal';await page.goto(`${base}/revisoes`,{waitUntil:'networkidle2'});await page.waitForSelector('.review-card');await page.locator(`::-p-aria(Mais ações para ${topic})`).click();await page.locator('::-p-aria([name="Ignorar revisão"][role="menuitem"])').click();await page.waitForSelector('[role=alertdialog]');await page.locator('[role=alertdialog] ::-p-aria(Ignorar revisão)').click();await page.waitForFunction(()=>document.querySelector('[aria-label="Resumo das revisões"] [data-review-group=hoje] > p')?.textContent==='1');assert.equal(requests.filter(r=>r.method==='POST'&&r.p.endsWith('/ignorar')).length,1);
  mode='loading';await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('[aria-label="Resumo das revisões"][aria-busy=true]');await shot(page,'loading.png');await page.waitForSelector('.review-card');
  mode='error';await page.reload({waitUntil:'networkidle2'});await page.waitForFunction(()=>document.body.textContent.includes('Não foi possível carregar as revisões'),{timeout:20000});await shot(page,'error.png');mode='normal';await page.locator('::-p-aria(Tentar novamente)').click();await page.waitForSelector('.review-card');
  const count=requests.filter(r=>r.p==='/revisoes').length;await page.goto(`${base}/revisoes?inicio=2026-10-30&fim=2026-10-01`,{waitUntil:'networkidle2'});await page.waitForFunction(()=>document.body.textContent.includes('Período inválido'));assert.equal(requests.filter(r=>r.p==='/revisoes').length,count);
 }
 assert.ok(requests.filter(r=>r.p==='/revisoes').every(r=>r.params.concurso_id===cid));assert.deepEqual(errors,[]);results.push({width,theme,passed:true,...g});
 }catch(error){results.push({width,theme,passed:false,error:String(error)});await shot(page,`${width}-${theme}-failure.png`);}
 finally{await context.close();}console.log(JSON.stringify(results.at(-1)));
}}finally{await browser.close();}
await writeFile(new URL('results.json',output),JSON.stringify(results,null,2));assert.ok(results.every(r=>r.passed));
