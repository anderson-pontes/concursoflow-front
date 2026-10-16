import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import puppeteer from 'puppeteer';

// Real local HTTP/SQL, isolated QA server, outer transaction rolled back at shutdown.
const base=process.env.QA_BASE_URL || 'http://127.0.0.1:13013';
const api='http://127.0.0.1:18013';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const session=await (await fetch(`${api}/__qa/session`)).json();
const output=new URL('../docs/qa/plano-progressivo-29-13/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const results=[];
try {
 const page=await browser.newPage();
 await page.setViewport({width:1440,height:1000});
 await page.evaluateOnNewDocument(user=>{
  if(!localStorage.getItem('aprovingo-auth'))localStorage.setItem('aprovingo-auth',JSON.stringify({state:{accessToken:'isolated-local-qa',refreshToken:'isolated-local-qa',user},version:4}));
 },session.user);
 let failId=null;
 const requests=[];
 await page.setRequestInterception(true);
 page.on('request',async req=>{
  const url=new URL(req.url());
  if(!url.pathname.startsWith('/api/'))return req.continue();
  const start=performance.now();
  try {
   if(failId && url.pathname===`/api/v1/catalogo/editais/${failId}`)return req.abort('connectionfailed');
   const response=await fetch(`${api}${url.pathname}${url.search}`,{method:req.method(),headers:{'content-type':'application/json'},body:['GET','HEAD'].includes(req.method())?undefined:req.postData()});
   const body=await response.text();
   requests.push({path:url.pathname,search:url.search,method:req.method(),status:response.status,bytes:Buffer.byteLength(body),ms:Math.round(performance.now()-start)});
   await req.respond({status:response.status,contentType:'application/json',body});
  }catch{if(!req.isInterceptResolutionHandled())await req.abort().catch(()=>{});}
 });
 const click=async text=>{
  await page.waitForFunction(t=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()===t && !b.disabled),{},text);
  await page.evaluate(t=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t && !b.disabled).click(),text);
 };
 const select=async name=>{
  await page.waitForFunction(n=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Selecionar edital' && b.closest('[data-slot="card"]')?.textContent.includes(n)),{},name);
  await page.evaluate(n=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Selecionar edital' && b.closest('[data-slot="card"]')?.textContent.includes(n)).click(),name);
 };
 const text=async value=>page.waitForFunction(t=>document.body.textContent.includes(t),{},value);
 const openStarted=performance.now();
 await page.goto(`${base}/planos/novo?origem=catalogo&search=QA%20Plano`,{waitUntil:'networkidle0'});
 await text('QA Plano grande');
 const renderTimes={openToResultsMs:Math.round(performance.now()-openStarted)};
 assert.equal(requests.filter(r=>/\/catalogo\/editais$/.test(r.path)).length,1);
 assert.ok(requests.find(r=>/\/catalogo\/editais$/.test(r.path)).search.includes('resumo=true'));
 assert.equal(requests.filter(r=>r.path.includes('/cargos/')).length,0);
 let selectionStarted=performance.now();
 await select('QA Plano pequeno');
 await page.waitForFunction(()=>document.querySelectorAll('[role="radio"]').length===2);
 renderTimes.smallSelectionToRadiosMs=Math.round(performance.now()-selectionStarted);
 selectionStarted=performance.now();
 await select('QA Plano grande');
 await page.waitForFunction(()=>document.querySelectorAll('[role="radio"]').length===12);
 renderTimes.largeSelectionToRadiosMs=Math.round(performance.now()-selectionStarted);
 await page.evaluate(()=>[...document.querySelectorAll('h3')].find(el=>el.textContent==='Cargo ou especialidade').scrollIntoView({block:'center'}));
 await page.screenshot({path:new URL('desktop-cargos.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
 await page.click('[role="radio"]');
 await text('960 tópicos');
 await click('Continuar');
 await text('Escolha disciplinas e tópicos');
 assert.equal(await page.$$eval('main [role="checkbox"]',els=>els.length),8);
 const count=requests.filter(r=>r.path.includes('/cargos/')).length;
 await page.click('main [role="checkbox"]');
 await click('Voltar');
 await click('Continuar');
 assert.equal(await page.$eval('main [role="checkbox"]',el=>el.getAttribute('data-state')),'unchecked');
 assert.equal(requests.filter(r=>r.path.includes('/cargos/')).length,count);
 await page.waitForFunction(()=>Object.entries(localStorage).some(([key,value])=>key.startsWith('clickedital:onboarding-draft')&&JSON.parse(value).step===3&&JSON.parse(value).disciplinas.some(d=>!d.ativa)));
 failId=session.editais[1].id;
 await page.reload({waitUntil:'networkidle0'});
 await click('Retomar rascunho');
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Continuar'&&b.disabled));
 await text('Não foi possível validar o catálogo. Suas escolhas foram mantidas.');
 assert.equal(await page.$eval('main [role="checkbox"]',el=>el.getAttribute('data-state')),'unchecked');
 failId=null;
 await click('Tentar novamente');
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Continuar'&&!b.disabled));
 assert.equal(await page.$eval('main [role="checkbox"]',el=>el.getAttribute('data-state')),'unchecked');
 results.push({scenario:'restore-advanced-draft-network-failure-retry-preserves-choices',passed:true});
 await click('Continuar');
 await text('Como organizar seus estudos?');
 await click('Continuar');
 await text('Seu plano está pronto para confirmar');
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Confirmar e ativar')&&!b.disabled));
 await click('Confirmar e ativar');
 await text('Plano criado');
 assert.equal(requests.filter(r=>r.path.endsWith('/planejamento/confirmar')&&r.status===201).length,1);
 await page.screenshot({path:new URL('desktop-plano-salvo.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
 results.push({scenario:'real-catalog-create-back-cache-save',passed:true,renderTimes,requests});

 // New independent browser context: recoverable failure does not reuse a previous cargo.
 const context=await browser.createBrowserContext();
 const mobile=await context.newPage();
 await mobile.setViewport({width:375,height:850});
 await mobile.evaluateOnNewDocument(user=>localStorage.setItem('aprovingo-auth',JSON.stringify({state:{accessToken:'isolated-local-qa',user},version:4})),session.user);
 await mobile.setRequestInterception(true);
 let fail=true;
 mobile.on('request',async req=>{
  const u=new URL(req.url());
  if(!u.pathname.startsWith('/api/'))return req.continue();
  try {
   if(fail&&u.pathname===`/api/v1/catalogo/editais/${session.editais[0].id}`)return req.abort('connectionfailed');
   const res=await fetch(`${api}${u.pathname}${u.search}`,{method:req.method(),headers:{'content-type':'application/json'},body:req.method()==='GET'?undefined:req.postData()});
   await req.respond({status:res.status,contentType:'application/json',body:await res.text()});
  }catch{if(!req.isInterceptResolutionHandled())await req.abort().catch(()=>{});}
 });
 await mobile.goto(`${base}/planos/novo?origem=catalogo&search=QA%20Plano`,{waitUntil:'networkidle0'});
 await mobile.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Selecionar edital'&&b.closest('[data-slot="card"]')?.textContent.includes('QA Plano pequeno')).click());
 await mobile.waitForFunction(()=>document.body.textContent.includes('Não foi possível carregar os cargos.'));
 assert.equal(await mobile.$$eval('[role="radio"]',els=>els.length),0);
 fail=false;
 await mobile.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Tentar novamente').click());
 await mobile.waitForFunction(()=>document.querySelectorAll('[role="radio"]').length===2);
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await mobile.screenshot({path:new URL('mobile-retry-cargos.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
 results.push({scenario:'mobile-real-http-failure-retry',passed:true});
 const disciplinas=await (await fetch(`${api}/api/v1/disciplinas`)).json();
 assert.ok(disciplinas[0]?.id);
 await mobile.goto(`${process.env.QA_PRODUCTION_URL || base}/pomodoro?from=dashboard&disciplina_id=${disciplinas[0].id}&minutos=25`,{waitUntil:'networkidle0'});
 await mobile.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Iniciar sessão'));
 assert.ok(await mobile.evaluate(()=>!/(sessÃ|CronÃ|espaÃ)/.test(document.body.textContent)));
 await mobile.screenshot({path:new URL('mobile-timer-utf8.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
 results.push({scenario:process.env.QA_PRODUCTION_URL?'production-build-timer-utf8':'timer-utf8',passed:true});
} finally {
 await writeFile(new URL('results.json',output),JSON.stringify(results,null,2));
 await browser.close();
}
console.log(JSON.stringify(results.map(({scenario,passed})=>({scenario,passed}))));
