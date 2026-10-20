import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
const captureOnly=process.env.QA_CAPTURE_ONLY==='1';
const base='http://127.0.0.1:4175', output=new URL('../docs/qa/concursos-redesign/',import.meta.url);await mkdir(output,{recursive:true});
const cid='00000000-0000-4000-8000-000000000001',user={id:cid,name:'Estudante QA',email:'qa@example.invalid',role:'user',status:'ativo'};
const rows=Array.from({length:7},(_,i)=>({id:i===0?cid:`concurso-${i}`,user_id:cid,nome:`Concurso ${i}`,orgao:i===0?'Receita Federal':i===1?'Tribunal Regional do Trabalho':'Instituto Federal',cargo:i===0?'Auditor-Fiscal da Receita Federal':i===1?'Analista Judiciário - Tecnologia da Informação e Governança de Sistemas':i===2?'CargoExtensoSemEspacos'.repeat(6):`Técnico Administrativo ${i}`,banca:i%2?'Cebraspe':null,status:i===2?'realizado':i===3?'eliminado':i===4?'suspenso':'ativo',data_prova:i===0?'2027-01-17':i===1?'2027-02-20':i===2?'2026-01-01':i===3?'2026-12-20':i===4?'invalida':null,logo_url:null,edital_url:i===0?'/uploads/edital.pdf':null,created_at:'2026-10-01T12:00:00'}));
const disciplines=[{id:'disc',nome:'Português',concurso_ids:[cid],peso:1,ordem:1}];
const json=(body,status=200)=>({status,contentType:'application/json',body:JSON.stringify(body)});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});const results=[];
async function capture(page, options) { await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});await new Promise(resolve=>setTimeout(resolve,220));return page.screenshot(options); }
async function geometry(page){return page.evaluate(()=>{const main=document.querySelector('main');const cards=[...document.querySelectorAll('[data-concurso-card]')];return {docOverflow:document.documentElement.scrollWidth>innerWidth+1,mainOverflow:main.scrollWidth>main.clientWidth+1,cards:cards.map(n=>{const r=n.getBoundingClientRect(),h=n.querySelector('h2');return {width:r.width,x:r.x,y:r.y,height:r.height,overflow:n.scrollWidth>n.clientWidth+1,titleClipped:h.scrollHeight>h.clientHeight+1};}),kpiHeights:[...document.querySelectorAll('[data-metric-tone]')].map(n=>n.getBoundingClientRect().height)};});}
async function validate(page){const g=await geometry(page);assert.equal(g.docOverflow||g.mainOverflow,false,'horizontal overflow');assert.ok(g.cards.every(n=>!n.overflow&&!n.titleClipped&&n.width>=280),'cards legiveis');assert.ok(Math.max(...g.kpiHeights)-Math.min(...g.kpiHeights)<=1,'KPI aligned');return g;}
try{for(const width of (captureOnly?[375,1440]:[320,375,390,768,1024,1440,1920]))for(const theme of ['light','dark']){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],mutations=[];let contests=structuredClone(captureOnly?rows.slice(0,1):rows),mode='normal';
 try{
 await page.setViewport({width,height:width<768?1000:1100});page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(({user,cid,theme})=>{localStorage.setItem('theme',theme);localStorage.setItem('aprovingo-auth',JSON.stringify({state:{user,accessToken:'qa-local',refreshToken:'qa-local'},version:4}));localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:cid},version:0}));},{user,cid,theme});
 await page.setRequestInterception(true);page.on('request',async r=>{
 const u=new URL(r.url());if(!u.pathname.startsWith('/api/v1/'))return u.origin===base?r.continue():r.abort();const p=u.pathname.replace('/api/v1','');
 if(r.method()==='DELETE'){mutations.push(p);contests=contests.filter(c=>p!==`/concursos/${c.id}`);return r.respond(json({}));}
 if(r.method()!=='GET')return r.respond(json({}));
 if(p==='/auth/me')return r.respond(json(user));
 if(p==='/concursos'){if(mode==='loading')await new Promise(resolve=>setTimeout(resolve,1500));return r.respond(mode==='error'?json({detail:'Falha de teste'},500):json(contests));}
 if(p==='/disciplinas')return r.respond(json(disciplines));
 if(p==='/notifications/unread-count')return r.respond(json({count:0}));if(p==='/telemetry/preference')return r.respond(json({opted_out:true}));return r.respond(json([]));
 });
 await page.goto(`${base}/concursos`,{waitUntil:'networkidle2'});await page.waitForSelector('[data-concurso-card]');
 const g=await validate(page);
 if(captureOnly){
  await capture(page,{path:fileURLToPath(new URL(`${width}-${theme}-1.png`,output))});
  const card=await page.$('[data-concurso-card]');await card.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-card.png`,output))});
  results.push({width,theme,passed:true,geometry:g});continue;
 }
 assert.equal(g.cards.length,7);assert.equal(await page.$$eval('[data-metric-tone]',ns=>ns.length),3);
 assert.equal(await page.$eval('[data-metric-tone=orange]',n=>n.textContent.includes('17 jan 2027')),true);
 await capture(page,{path:fileURLToPath(new URL(`${width}-${theme}-many.png`,output)),fullPage:false});
 const search='input[aria-label="Buscar concurso"]';await page.locator(search).fill('Governança');await page.waitForFunction(()=>document.querySelectorAll('[data-concurso-card]').length===1);await validate(page);
 await page.locator(search).fill('inexistente');await page.waitForFunction(()=>document.querySelectorAll('[data-concurso-card]').length===0);assert.ok(await page.evaluate(()=>document.body.textContent.includes('Nenhum concurso encontrado')));
 await page.focus(search);await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.press('Backspace');
 await page.locator('::-p-aria(Encerrados)').click();
 await page.waitForFunction(()=>document.querySelectorAll('[data-concurso-card]').length===2);
 await page.locator('::-p-aria(Ativos)').click();await page.waitForFunction(()=>document.querySelectorAll('[data-concurso-card]').length===5);
 await page.locator('::-p-aria(Todos)').click();await page.waitForFunction(()=>document.querySelectorAll('[data-concurso-card]').length===7);
 if(width===1440&&theme==='light'){
  await page.locator('::-p-aria(Ver detalhes)').click();await page.waitForSelector('[role=dialog]');assert.ok(await page.$eval('[role=dialog]',n=>n.textContent.includes('Auditor-Fiscal')));await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
  await page.locator('[data-concurso-card] button[aria-label^="Ações"]').click();await page.locator('::-p-aria(Editar concurso)').click();await page.waitForSelector('[role=dialog]');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
  await page.locator('[data-concurso-card] button[aria-label^="Ações"]').click();await page.locator('::-p-aria(Excluir concurso)').click();await page.waitForSelector('[role=alertdialog]');assert.equal(mutations.length,0);
  await page.locator('::-p-aria(Cancelar)').click();assert.equal(mutations.length,0);
  await page.locator('[data-concurso-card] button[aria-label^="Ações"]').click();await page.locator('::-p-aria(Excluir concurso)').click();await page.waitForSelector('[role=alertdialog]');await page.locator('::-p-aria(Excluir concurso)').click();await page.waitForFunction(()=>document.querySelectorAll('[data-concurso-card]').length===6);assert.deepEqual(mutations,[`/concursos/${cid}`]);
 }
 if([375,1440].includes(width)){
  for(const count of [1,2,3,0]){
   contests=structuredClone(rows.slice(0,count));await page.reload({waitUntil:'networkidle2'});if(count)await page.waitForSelector('[data-concurso-card]');
   await validate(page);assert.equal(await page.$$eval('[data-concurso-card]',ns=>ns.length),count);if(!count)assert.ok(await page.evaluate(()=>document.body.textContent.includes('Nenhum concurso cadastrado')));
   await capture(page,{path:fileURLToPath(new URL(`${width}-${theme}-${count}.png`,output))});
   if(count===1){const card=await page.$('[data-concurso-card]');await card.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-card.png`,output))});}
  }
  contests=rows;mode='loading';await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('[aria-label="Carregando concursos"]');await capture(page,{path:fileURLToPath(new URL(`${width}-${theme}-loading.png`,output))});await page.waitForSelector('[data-concurso-card]');
  mode='error';await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('[role=alert]',{timeout:20000});assert.equal(await page.$$eval('[data-concurso-card]',ns=>ns.length),0);await validate(page);await capture(page,{path:fileURLToPath(new URL(`${width}-${theme}-error.png`,output))});
 }
 assert.deepEqual(errors,[]);results.push({width,theme,passed:true,geometry:g,mutations});
 }catch(error){results.push({width,theme,passed:false,error:String(error)});await capture(page,{path:fileURLToPath(new URL(`${width}-${theme}-failure.png`,output))});}
 finally{await context.close();}
 console.log(JSON.stringify(results.at(-1)));
}}finally{await browser.close();}
await writeFile(new URL(captureOnly?'capture-results.json':'results.json',output),JSON.stringify(results,null,2));assert.ok(results.every(r=>r.passed));
