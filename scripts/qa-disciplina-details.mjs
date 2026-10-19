import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4175';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const output=new URL('../docs/qa/disciplina-details-v2/',import.meta.url);await mkdir(output,{recursive:true});
const id='00000000-0000-4000-8000-000000000001';
const user={id,name:'Estudante QA',email:'qa@example.invalid',role:'user',status:'ativo',daily_goal_hours:2};
const long='Compreensão e interpretação de textos de gêneros variados, reconhecimento das características estruturais e linguísticas, identificação de informações explícitas e implícitas e relações de sentido. ';
const fixture=()=>({disciplina_id:id,nome:'Língua Portuguesa — análise e interpretação de textos',kpis:{tempo_estudo_horas:2.5,desempenho_geral_pct:72,questoes_certas_total:36,questoes_erradas_total:14,questoes_branco_total:0,questoes_resolvidas_total:50,progresso_edital_pct:20,topicos_concluidos:1,topicos_pendentes:4,topicos_total:5,paginas_lidas_total:58},topicos:[long,'Ortografia e acentuação.',long.repeat(3),long.repeat(6),'PalavraExtensa'+ 'abcdefghijklmnopqrstuv'.repeat(25)].map((descricao,index)=>({id:`topic-${index}`,descricao,numero_ordem:index+1,concluido_edital:index===1,certas:index?9:0,erradas:index?3:0,em_branco:0,aproveitamento_pct:index?75:0,tempo_estudo_minutos:index*20,paginas_lidas:index*6,peso:1,dominio:index===1?5:1,prioridade:index===1?1:5,ultima_revisao_em:null,intervalo_idx:0,sessoes_count:index,ultimo_estudo_em:null,proxima_revisao_em:null}))});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});const results=[];
const json=data=>({status:200,contentType:'application/json',body:JSON.stringify(data)});
async function audit(page){return page.evaluate(()=>{
 const main=document.querySelector('main'),rows=[...document.querySelectorAll('[data-topico-id]')];
 const scrolling=[main,...main.querySelectorAll('*')].filter(n=>n.clientHeight>0 && n.scrollHeight>n.clientHeight+2 && ['auto','scroll'].includes(getComputedStyle(n).overflowY)).map(n=>n.tagName+':'+n.className);
 const outside=[...main.querySelectorAll('*')].filter(n=>n.getBoundingClientRect().right>main.getBoundingClientRect().right+1 && !n.closest('.topic-table-scroll')).map(n=>({tag:n.tagName,classes:n.className,width:n.getBoundingClientRect().width}));
 const container=document.querySelector(".topic-table-scroll"); return {mainWidth:main.clientWidth,mainScroll:main.scrollWidth,container:{width:container.clientWidth,scroll:container.scrollWidth,x:getComputedStyle(container).overflowX,contain:getComputedStyle(container).contain,position:getComputedStyle(container).position},outside,docX:document.documentElement.scrollWidth>innerWidth+1,mainX:main.scrollWidth>main.clientWidth+1,docY:document.documentElement.scrollHeight>innerHeight+1,scrolling,rowDisplay:rows[0]&&getComputedStyle(rows[0]).display,names:rows.map(r=>{const n=r.querySelector('.topic-name p');return {text:n.textContent,client:n.clientHeight,scroll:n.scrollHeight,clamp:getComputedStyle(n).webkitLineClamp};}),tableScroll:document.querySelector('.topic-table-scroll').scrollWidth>document.querySelector('.topic-table-scroll').clientWidth+1};
});}
try{for(const width of [1920,1440,1366,1024,768,375].filter(w=>!process.env.QA_WIDTH||w===Number(process.env.QA_WIDTH)))for(const theme of ['light','dark']){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],requests=[];let data=fixture();
 try{
 await page.setViewport({width,height:width<768?812:1000});page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(({user,theme})=>{localStorage.clear();localStorage.setItem('theme',theme);localStorage.setItem('aprovingo-auth',JSON.stringify({state:{accessToken:'qa-local',refreshToken:'qa-local',user},version:4}));localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:null},version:0}));},{user,theme});
 await page.setRequestInterception(true);page.on('request',async r=>{
  const url=new URL(r.url());if(!url.pathname.startsWith('/api/v1/'))return url.origin===new URL(base).origin?r.continue():r.abort();
  const path=url.pathname.replace('/api/v1','');
  if(path===`/disciplinas/${id}/dashboard`)return r.respond(json(data));
  if(path===`/disciplinas/${id}/topicos/reordenar`){const order=JSON.parse(r.postData()).ordem;requests.push({path,order});data.topicos=order.map(topic=>data.topicos.find(t=>t.id===topic));return r.respond(json({}));}
  if(r.method()!=='GET'){requests.push({path,method:r.method(),body:r.postData()});return r.respond(json({}));}
  if(path==='/auth/me')return r.respond(json(user));
  if(['/concursos','/disciplinas','/notifications','/notifications/'].includes(path))return r.respond(json([]));
  if(path==='/notifications/unread-count')return r.respond(json({count:0}));
  if(path==='/telemetry/preference')return r.respond(json({opted_out:true}));
  return r.respond(json([]));
 });
 await page.goto(`${base}/disciplinas/${id}`,{waitUntil:'networkidle2'});await page.waitForSelector('[data-topico-id]');
 let geometry=await audit(page);assert.equal(geometry.docX||geometry.mainX||geometry.docY,false,'sem overflow/dupla rolagem');assert.equal(geometry.scrolling.length,1,'apenas main com rolagem vertical');assert.equal(geometry.rowDisplay,width>=1280?'table-row':'grid');assert.ok(geometry.names.every(n=>n.scroll<=n.client+1 && n.clamp==='none'),'nomes sem cortes');assert.equal(geometry.tableScroll,false,'resumo sem rolagem horizontal');

 const kpiAudit=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('[data-discipline-kpi]')];
  const rects=cards.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
  function rgb(color){ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);}
  function lum(color){return rgb(color).map(c=>{const n=c/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);}
  const contrast=cards.flatMap(card=>[...card.querySelectorAll('p,strong')].map(n=>{const a=lum(getComputedStyle(n).color),b=lum(getComputedStyle(card).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}));
  return {rects,colors:cards.map(n=>getComputedStyle(n).backgroundColor),contrast,height:document.querySelector('[data-discipline-kpis]').getBoundingClientRect().height};
 });
 assert.equal(new Set(kpiAudit.colors).size,5,'cinco superfícies distintas');
 assert.ok(kpiAudit.contrast.every(c=>c>=4.5),'contraste AA nos textos dos KPIs');
 if(width<1280){assert.equal(kpiAudit.rects[1].y,kpiAudit.rects[2].y);assert.equal(kpiAudit.rects[3].y,kpiAudit.rects[4].y);}
 if(width===375)assert.ok(kpiAudit.height<450,'indicadores compactos no mobile');
 await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-overview.png`,output))});
 await page.$eval('.topic-table-scroll',n=>n.scrollIntoView({block:'start'}));await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-topics.png`,output))});
 await page.click('[aria-controls="topic-details-topic-0"]');await page.waitForSelector('#topic-details-topic-0');assert.ok(await page.$eval('#topic-details-topic-0',n=>n.textContent.includes('Próxima revisão')));await page.click('[aria-controls="topic-details-topic-0"]');
 await page.type('input[placeholder="Buscar tópico..."]','acentuacao');assert.equal(await page.$$eval('[data-topico-id]',n=>n.length),1);await page.$eval('input[placeholder="Buscar tópico..."]',n=>n.focus());await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.press('Backspace');
 await page.click('[role=group][aria-label="Visualização dos tópicos"] button:last-child');assert.ok(await page.$eval('.topic-table thead',n=>n.textContent.includes('Páginas')));
 geometry=await audit(page);assert.equal(geometry.docX||geometry.mainX||geometry.docY,false);assert.equal(geometry.tableScroll,width>=1280&&width<1800,'scroll apenas quando a tabela completa precisa');
 await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-complete.png`,output))});
 await page.click('[role=group][aria-label="Visualização dos tópicos"] button:first-child');
 if(width===1440&&theme==='light'){
  await page.focus('[data-topico-id="topic-0"] button[aria-label^="Reordenar"]');await page.keyboard.press('Space');await new Promise(r=>setTimeout(r,100));await page.keyboard.press('ArrowDown');await new Promise(r=>setTimeout(r,100));await page.keyboard.press('Space');await page.waitForFunction(()=>document.querySelector('[data-topico-id]')?.getAttribute('data-topico-id')==='topic-1');assert.ok(requests.some(r=>r.order?.[0]==='topic-1'),'ordem persistida por teclado');
  // Pointer drag uses only the explicit handle.
  const handle=await page.$('[data-topico-id="topic-0"] button[aria-label^="Reordenar"]');const target=await page.$('[data-topico-id="topic-1"]');await handle.evaluate(n=>n.scrollIntoView({block:'center'}));const from=await handle.boundingBox(),to=await target.boundingBox();await page.mouse.move(from.x+10,from.y+15);await page.mouse.down();await page.mouse.move(from.x+10,to.y+to.height/2,{steps:20});await page.mouse.up();await page.waitForFunction(()=>document.querySelector('[data-topico-id]')?.getAttribute('data-topico-id')==='topic-0');
  assert.ok(requests.some(r=>r.order?.[0]==='topic-0'),'ordem persistida por arraste');
 }

 data.nome='PORTUGUES'+'fad'.repeat(60);await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('[data-topico-id]');
 const titleGeometry=await audit(page);assert.equal(titleGeometry.docX||titleGeometry.mainX,false,'nome extenso sem overflow');
 await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-long-title.png`,output))});
 data.topicos.forEach(row=>row.concluido_edital=false);data.kpis.progresso_edital_pct=0;data.kpis.topicos_concluidos=0;
 await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('[data-topico-id]');
 assert.equal(await page.$eval('.discipline-progress [data-slot="progress"]',n=>n.getAttribute('aria-valuenow')),'0','progresso zero sem preenchimento artificial');
 assert.ok(await page.$eval('.discipline-progress [data-slot="progress-indicator"]',n=>n.style.transform.includes('-100%')));
 assert.deepEqual(errors,[]);results.push({width,theme,passed:true,geometry,kpiAudit,titleOverflow:false,zeroProgress:true,mutations:requests});

 }catch(error){await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-failure.png`,output))});results.push({width,theme,passed:false,error:error.message,errors,geometry:await audit(page)});console.log(JSON.stringify(results.at(-1)));}finally{await context.close();}
}}finally{await browser.close();await writeFile(new URL('results.json',output),JSON.stringify({mocked:true,productionWrites:false,results},null,2));}
console.log(JSON.stringify({total:results.length,passed:results.filter(r=>r.passed).length,failures:results.filter(r=>!r.passed)},null,2));if(results.some(r=>!r.passed))process.exitCode=1;
