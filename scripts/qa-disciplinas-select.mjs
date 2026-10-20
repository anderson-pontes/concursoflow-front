import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';

const base='http://127.0.0.1:4175';
const output=new URL('../docs/qa/disciplinas-select/',import.meta.url);
await mkdir(output,{recursive:true});
const cid='00000000-0000-4000-8000-000000000001',second='00000000-0000-4000-8000-000000000002';
const user={id:cid,name:'QA',email:'qa@example.invalid',role:'user',status:'ativo'};
const cargo='AUDITOR '+ 'nomeSemEspacos'.repeat(24);
const contests=[{id:cid,orgao:'RFB',cargo,nome:'Receita Federal'},{id:second,orgao:'TRT',cargo:'Analista',nome:'Tribunal'}];
const json=body=>({status:200,contentType:'application/json',body:JSON.stringify(body)});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const results=[];
try {
 for(const width of [320,375,768,1024,1440,1920]) for(const theme of ['light','dark']) {
  const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
  try {
   await page.setViewport({width,height:1000});page.on('pageerror',e=>errors.push(e.message));
   await page.evaluateOnNewDocument(({user,cid,theme})=>{
    localStorage.setItem('theme',theme);
    localStorage.setItem('aprovingo-auth',JSON.stringify({state:{user,accessToken:'qa-local',refreshToken:'qa-local'},version:4}));
    localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:cid},version:0}));
   },{user,cid,theme});
   await page.setRequestInterception(true);page.on('request',r=>{
    const u=new URL(r.url());if(!u.pathname.startsWith('/api/v1/'))return u.origin===base?r.continue():r.abort();
    const path=u.pathname.replace('/api/v1','');
    if(path==='/concursos')return r.respond(json(contests));
    if(path==='/auth/me')return r.respond(json(user));
    if(path==='/disciplinas/paginadas')return r.respond(json({items:[],total:0,page:1,page_size:9,total_pages:0,summary:{total:0,em_progresso:0,no_concurso:0,fora_concurso:0,progresso_medio:0,topicos_total:0,topicos_concluidos:0}}));
    if(path==='/notifications/unread-count')return r.respond(json({count:0}));
    if(path==='/telemetry/preference')return r.respond(json({opted_out:true}));
    return r.respond(json([]));
   });
   await page.goto(`${base}/disciplinas`,{waitUntil:'networkidle2'});
   const selector='[role=combobox][aria-label="Concurso ativo"]';
   await page.waitForSelector(selector);
   const geometry=await page.$eval(selector,n=>{
    const r=n.getBoundingClientRect(),svg=n.querySelector('svg').getBoundingClientRect(),text=n.firstElementChild;
    const create=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Nova disciplina')).getBoundingClientRect();
    const main=document.querySelector('main');
    return {height:r.height,iconWidth:svg.width,iconContained:svg.right<=r.right,ellipsis:getComputedStyle(text).textOverflow,title:text.title,
     overlap:r.left<create.right&&r.right>create.left&&r.top<create.bottom&&r.bottom>create.top,
     overflow:document.documentElement.scrollWidth>innerWidth+1||main.scrollWidth>main.clientWidth+1};
   });
   assert.ok(geometry.height<=46,'single line trigger');assert.equal(geometry.iconWidth,16);assert.equal(geometry.iconContained,true);
   assert.equal(geometry.ellipsis,'ellipsis');assert.equal(geometry.title,`RFB \u2014 ${cargo}`);assert.equal(geometry.overlap,false);assert.equal(geometry.overflow,false);
   await page.locator(selector).click();await page.waitForSelector('[role=listbox]');
   const popup=await page.$eval('[role=listbox]',n=>{
    const r=n.getBoundingClientRect();return {contained:r.left>=0&&r.right<=innerWidth,overflow:n.scrollWidth>n.clientWidth+1,
     options:[...n.querySelectorAll('[role=option]')].map(o=>({overflow:o.scrollWidth>o.clientWidth+1,text:o.textContent}))};
   });
   assert.equal(popup.contained,true);assert.equal(popup.overflow,false);assert.ok(popup.options.every(o=>!o.overflow));assert.ok(popup.options.some(o=>o.text.includes(cargo)));
   await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-open.png`,output))});
   await page.keyboard.press('End');
   await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='option'&&document.activeElement.textContent.includes('Analista'));
   await page.keyboard.press('Enter');
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cf-concurso-ativo')).state.concursoAtivoId==='00000000-0000-4000-8000-000000000002');
   await page.waitForFunction(()=>document.querySelector('[role=combobox][aria-label="Concurso ativo"]').textContent.includes('Analista'));
   assert.deepEqual(errors,[]);results.push({width,theme,passed:true,geometry,popup});
  } catch(error) {results.push({width,theme,passed:false,error:String(error)});}
  finally {await context.close();}
 }
} finally {await browser.close();}
await writeFile(new URL('results.json',output),JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({width,theme,passed,error})=>({width,theme,passed,error})),null,2));
assert.ok(results.every(r=>r.passed),'select regression');
