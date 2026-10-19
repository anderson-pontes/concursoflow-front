import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
const base='http://127.0.0.1:4175',output=new URL('../docs/qa/disciplinas-density/',import.meta.url);await mkdir(output,{recursive:true});
const cid='00000000-0000-4000-8000-000000000001',user={id:cid,name:'Estudante QA',email:'qa@example.invalid',role:'user',status:'ativo'};
const disciplines=Array.from({length:12},(_,i)=>({id:`00000000-0000-4000-8000-${String(i+20).padStart(12,'0')}`,nome:i===0?'Língua Portuguesa — Compreensão e interpretação de textos de gêneros variados':i===1?'DIREITO'+ 'Administrativo'.repeat(12):i===2?'Informática':`Disciplina ${i}`,sigla:'TRT 8ª Região',peso:22,total_pontos:22,prioridade_calculada:110-i,ordem:i,concurso_ids:i%3===2?[]:[cid],topicos_total:22,topicos_estudados:i%3===0?0:i%3===1?5:22,topicos_iniciados:i%3===0?0:i%3===1?8:22}));
const json=data=>({status:200,contentType:'application/json',body:JSON.stringify(data)});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});const results=[];
try{for(const width of [1920,1440,1366,1024,768,375])for(const theme of ['light','dark']){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],mutations=[];let queries=0;
 try{
 await page.setViewport({width,height:width<768?900:1000});page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(({cid,user,theme})=>{localStorage.clear();localStorage.setItem('theme',theme);localStorage.setItem('aprovingo-auth',JSON.stringify({state:{user,accessToken:'qa-local',refreshToken:'qa-local'},version:4}));localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:cid},version:0}));},{cid,user,theme});
 await page.setRequestInterception(true);page.on('request',async r=>{
 const u=new URL(r.url());if(!u.pathname.startsWith('/api/v1/'))return u.origin===base?r.continue():r.abort();
 const p=u.pathname.replace('/api/v1','');if(r.method()!=='GET'){mutations.push({path:p,method:r.method(),body:r.postData()});return r.respond(json({}));}
 if(p==='/auth/me')return r.respond(json(user));
 if(p==='/concursos')return r.respond(json([{id:cid,nome:'TRT 8ª Região',orgao:'TRT 8ª Região',cargo:'Analista Judiciário'}]));
 if(p==='/disciplinas/paginadas'){
 queries++;const term=(u.searchParams.get('search')||'').toLowerCase(),filter=u.searchParams.get('vinculo')||'todas';
 const rows=disciplines.filter(d=>d.nome.toLowerCase().includes(term)&&(filter==='todas'||(filter==='concurso')===d.concurso_ids.includes(cid)));const pageNum=Number(u.searchParams.get('page')||1);
 return r.respond(json({items:rows.slice((pageNum-1)*9,pageNum*9),total:rows.length,page:pageNum,page_size:9,total_pages:Math.ceil(rows.length/9),summary:{total:rows.length,em_progresso:rows.filter(d=>d.topicos_iniciados>0&&d.topicos_estudados<d.topicos_total).length,no_concurso:rows.filter(d=>d.concurso_ids.includes(cid)).length,fora_concurso:rows.filter(d=>!d.concurso_ids.includes(cid)).length,progresso_medio:rows.length?Math.round(rows.reduce((s,d)=>s+Math.round(d.topicos_estudados/d.topicos_total*100),0)/rows.length):0,topicos_total:rows.reduce((s,d)=>s+d.topicos_total,0),topicos_concluidos:rows.reduce((s,d)=>s+d.topicos_estudados,0)}}));
 }
 if(p==='/notifications/unread-count')return r.respond(json({count:0}));if(p==='/telemetry/preference')return r.respond(json({opted_out:true}));return r.respond(json([]));
 });
 await page.goto(`${base}/disciplinas?view=cards`,{waitUntil:'networkidle2'});await page.waitForSelector('[data-discipline-card]');
 const geometry=async()=>page.evaluate(()=>{const main=document.querySelector('main');return {docX:document.documentElement.scrollWidth>innerWidth+1,mainX:main.scrollWidth>main.clientWidth+1,docY:document.documentElement.scrollHeight>innerHeight+1,scrolls:[main,...main.querySelectorAll('*')].filter(n=>n.clientHeight&&n.scrollHeight>n.clientHeight+2&&['auto','scroll'].includes(getComputedStyle(n).overflowY)).length};});
 const assertGeometry=async()=>{const g=await geometry();assert.equal(g.docX||g.mainX||g.docY,false,'sem overflow externo');assert.ok(g.scrolls<=1,'sem dupla rolagem vertical');return g;};
 await assertGeometry();assert.equal(await page.$$eval('[data-discipline-card]',n=>n.length),9);
 await new Promise(resolve=>setTimeout(resolve,220));await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-grade.png`,output))});
 const count=queries;await page.locator('[aria-label="Vista em lista"]').click();await page.waitForSelector('.discipline-list-item');
 const density=await page.evaluate(()=>{
  const rows=[...document.querySelectorAll('.discipline-list-item')];
  const common=rows.filter(n=>n.textContent.includes('Disciplina 3')||n.textContent.includes('Informática'));
  return {commonHeights:common.map(n=>n.getBoundingClientRect().height),rowCount:rows.length,cardBorder:getComputedStyle(rows[0]).borderTopWidth,names:rows.map(n=>{const link=n.querySelector('.discipline-list-identity a');return {scroll:link.scrollHeight,client:link.clientHeight};})};
 });
 assert.ok(density.names.every(n=>n.scroll<=n.client+1),'nomes completos na lista');
 assert.equal(density.cardBorder,'1px','lista sem borda superior destacada');
 if(width>=1366)assert.ok(density.commonHeights.every(h=>h>=72&&h<=100),'linhas comuns compactas');assert.equal(queries,count,'alternar modo usa cache');await assertGeometry();await new Promise(resolve=>setTimeout(resolve,220));await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-lista.png`,output))});
 await page.locator('[aria-label="Vista em tabela"]').click();await page.waitForFunction(()=>new URL(location).searchParams.get('view')==='table');await assertGeometry();assert.equal(queries,count,'tabela usa mesmos dados');assert.equal(await page.$$eval('input[type=search]',ns=>ns.filter(n=>n.getBoundingClientRect().width>0).length),1,'busca única');await new Promise(resolve=>setTimeout(resolve,220));await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-tabela.png`,output))});
 await page.locator('[aria-label="Vista em cards"]').click();await page.type('input[placeholder="Buscar disciplina..."]','Informática');await page.waitForFunction(()=>document.querySelectorAll('[data-discipline-card]').length===1);await page.locator('[aria-label="Vista em lista"]').click();assert.equal(await page.$eval('input[type=search]',n=>n.value),'Informática');await page.locator('[aria-label="Vista em tabela"]').click();assert.equal(await page.$eval('input[type=search]',n=>n.value),'Informática');
 await page.focus('input[type=search]');await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.press('Backspace');await page.locator('[aria-label="Vista em cards"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-discipline-card]').length===9);
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Fora').click());await page.waitForFunction(()=>document.querySelectorAll('[data-discipline-card]').length===4);await page.locator('[aria-label="Vista em lista"]').click();assert.ok(await page.$eval('[aria-label="Filtrar por vínculo ao concurso"]',n=>n.querySelector('[aria-pressed=true]').textContent==='Fora'));await assertGeometry();
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Todas').click());await page.locator('[aria-label="Vista em cards"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-discipline-card]').length===9);
 await page.locator('[aria-label^="Ações da disciplina"]').click();await page.waitForSelector('[role=menu]');assert.ok(await page.$eval('[role=menu]',n=>n.textContent.includes('Editar disciplina')&&n.textContent.includes('Excluir disciplina')));await page.keyboard.press('Escape');
 if(width===1440&&theme==='light'){
  await page.evaluate(()=>[...document.querySelectorAll('nav[aria-label="Paginação de disciplinas"] button')].find(n=>n.textContent.includes('Próxima')).click());
  await page.waitForFunction(()=>document.querySelectorAll('[data-discipline-card]').length===3);
  const beforeSwitch=queries;await page.locator('[aria-label="Vista em lista"]').click();assert.equal(await page.$$eval('[data-discipline-card]',ns=>ns.length),3);assert.equal(queries,beforeSwitch,'mantém página e cache ao trocar modo');
  assert.ok(await page.$eval('[aria-label="Resumo das disciplinas"]',n=>n.textContent.includes('108/264')),'agregado não limitado à página');
  await page.evaluate(()=>[...document.querySelectorAll('nav[aria-label="Paginação de disciplinas"] button')].find(n=>n.textContent.includes('Anterior')).click());await page.locator('[aria-label="Vista em cards"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-discipline-card]').length===9);
 }
 assert.deepEqual(errors,[]);results.push({width,theme,passed:true,geometry:await geometry(),density,queries,mutations});
 }catch(e){await new Promise(resolve=>setTimeout(resolve,220));await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-failure.png`,output))});results.push({width,theme,passed:false,error:e.message,errors});console.log(JSON.stringify(results.at(-1)));}finally{await context.close();}
}}finally{await browser.close();await writeFile(new URL('results.json',output),JSON.stringify({mocked:true,productionWrites:false,results},null,2));}
console.log(JSON.stringify({total:results.length,passed:results.filter(r=>r.passed).length,failures:results.filter(r=>!r.passed)},null,2));if(results.some(r=>!r.passed))process.exitCode=1;
