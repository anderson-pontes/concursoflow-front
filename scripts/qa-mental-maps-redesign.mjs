import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';

const base='http://127.0.0.1:4175',output=new URL('../docs/qa/mental-maps-desktop-refinement/',import.meta.url);
await mkdir(output,{recursive:true});
const cid='00000000-0000-4000-8000-000000000001';
const user={id:cid,name:'Estudante QA',email:'qa@example.invalid',role:'user',status:'ativo'};
const categories=['Dados e Inteligência','Gestão e Metodologias','Segurança da Informação','Outros conteúdos'];
const titles=['Fluência em Dados','Gestão de processos e metodologias ágeis','Segurança da Informação e proteção de dados','Arquitetura e organização dos conteúdos','TítuloMuitoExtensoSemEspaços'.repeat(5),'Inteligência analítica','Revisão integrada'];
const items=titles.map((title,i)=>({slug:`mapa-${i}`,title,description:i===4?'DescriçãoExtensaSemEspaços'.repeat(10):'Conceitos fundamentais para conectar ideias e revisar o conteúdo com clareza.',category:categories[i%4],topics:i===2?[]:['Dados','Informação','Análise de dados','Estatística','AssuntoMuitoExtensoSemEspaços'.repeat(4)],page_count:i===2?null:7,updated_at:i===2?null:'2026-08-01',available:i!==2,featured:i===0}));
const json=(data,status=200)=>({status,contentType:'application/json',body:JSON.stringify(data)});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const results=[];
async function shot(page,name){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:fileURLToPath(new URL(name,output))});}
async function valid(page){return page.evaluate(()=>{
 const main=document.querySelector('main'),grid=document.querySelector('.mental-maps-grid');
 const library=document.querySelector('.mental-maps-library'), mainStyle=getComputedStyle(main),usableWidth=main.clientWidth-parseFloat(mainStyle.paddingLeft)-parseFloat(mainStyle.paddingRight);const cards=[...document.querySelectorAll('article')];
 const rows=new Map();for(const card of cards){const r=card.getBoundingClientRect(),footer=card.querySelector('[data-slot="card-footer"]')?.getBoundingClientRect();const key=Math.round(r.top);rows.set(key,[...(rows.get(key)||[]),footer?.bottom]);}
 return {usableWidth,libraryWidth:library.getBoundingClientRect().width,patterns:[...new Set(cards.map(c=>c.querySelector('[data-cover-pattern]').dataset.coverPattern))],overflow:document.documentElement.scrollWidth>innerWidth+1||main.scrollWidth>main.clientWidth+1,cards:cards.length,columns:grid?getComputedStyle(grid).gridTemplateColumns.split(' ').length:0,aligned:[...rows.values()].every(row=>Math.max(...row)-Math.min(...row)<2),mobileFilter:getComputedStyle(document.querySelector('.mental-maps-mobile-filter')).display!=='none',cardOverflow:cards.some(c=>c.scrollWidth>c.clientWidth+1)};
 });}
try{for(const width of (process.env.QA_WIDTHS?process.env.QA_WIDTHS.split(',').map(Number):[375,390,768,1024,1366,1440,1920,2560]))for(const theme of ['light','dark']){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],accesses=[];let mode='normal';
 try{
 await page.setViewport({width,height:1000});page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(({user,cid,theme})=>{localStorage.setItem('theme',theme);localStorage.setItem('aprovingo-auth',JSON.stringify({state:{user,accessToken:'qa-local',refreshToken:'qa-local'},version:4}));localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:cid},version:0}));},{user,cid,theme});
 await page.setRequestInterception(true);page.on('request',async r=>{
  const u=new URL(r.url());if(!u.pathname.startsWith('/api/v1/'))return u.origin===base?r.continue():r.abort();
  const p=u.pathname.replace('/api/v1','');
  if(p==='/auth/me')return r.respond(json(user));
  if(p==='/concursos')return r.respond(json([{id:cid,nome:'RFB',orgao:'Receita Federal',cargo:'Auditor',status:'ativo'}]));
  if(p==='/mapas-mentais'){if(mode==='loading')await new Promise(resolve=>setTimeout(resolve,1800));if(mode==='error')return r.respond(json({detail:'Falha QA'},500));return r.respond(json({items:mode==='empty'?[]:items,total:mode==='empty'?0:items.length}));}
  if(p.includes('/mapas-mentais/')&&p.endsWith('/access')){accesses.push({method:r.method(),download:u.searchParams.get('download')});return r.respond(json({detail:'Documento indisponível para teste'},404));}
  if(p==='/notifications/unread-count')return r.respond(json({count:0}));if(p==='/telemetry/preference')return r.respond(json({opted_out:true}));return r.respond(json([]));
 });
 await page.goto(`${base}/mapas-mentais`,{waitUntil:'networkidle2'});await page.waitForSelector('article');
 const initial=await valid(page);assert.equal(initial.overflow||initial.cardOverflow,false);assert.ok(initial.aligned);assert.equal(initial.cards,6);assert.ok(Math.abs(initial.libraryWidth-initial.usableWidth)<2);assert.equal(initial.columns,initial.usableWidth>=1560?4:initial.usableWidth>=1000?3:initial.usableWidth>=640?2:1);assert.equal(initial.patterns.length,3);
 await shot(page,`${width}-${theme}-library.png`);
 await page.$eval('article',n=>n.scrollIntoView({block:'start'}));await shot(page,`${width}-${theme}-cards.png`);
 if(initial.mobileFilter){await page.locator('[role=combobox]').click();await page.waitForSelector('[role=option]');await shot(page,`${width}-${theme}-categories.png`);await page.keyboard.press('Home');await page.waitForFunction(()=>document.activeElement?.getAttribute('data-state')==='checked');await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.activeElement?.textContent==='Dados e Intelig'+String.fromCharCode(234)+'ncia');await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.activeElement?.textContent==='Gest'+String.fromCharCode(227)+'o e Metodologias');await page.keyboard.press('Enter');}
 else await page.locator('.mental-maps-desktop-filters ::-p-aria(Gestão e Metodologias)').click();
 await page.waitForFunction(()=>document.querySelectorAll('article').length===2);assert.ok(await page.$$eval('article',ns=>ns.every(n=>n.textContent.includes('Gestão e Metodologias'))));
 await page.locator('input[type=search]').fill('inexistente');await page.waitForFunction(()=>document.body.textContent.includes('Nenhum mapa encontrado'));
 const clear=await page.$$('button');for(const b of clear){if(await b.evaluate(n=>n.textContent==='Limpar filtros')){await b.click();break;}}
 await page.waitForFunction(()=>document.querySelectorAll('article').length===6);
 await page.locator('article:first-child ::-p-aria(+2 assuntos)').click();assert.equal(await page.$eval('article:first-child button[aria-expanded]',n=>n.getAttribute('aria-expanded')),'true');assert.equal((await valid(page)).overflow,false);await shot(page,`${width}-${theme}-expanded.png`);await page.locator('article:first-child ::-p-aria(Recolher assuntos)').click();
 await page.locator('::-p-aria(Mostrar mais mapas (1))').click();await page.waitForFunction(()=>document.querySelectorAll('article').length===7);assert.equal((await valid(page)).cardOverflow,false);
 const unavailable=await page.$('article:nth-child(3)');assert.ok(await unavailable.$$eval('button',ns=>ns.filter(n=>n.textContent==='Visualizar'||n.textContent==='Baixar PDF').every(n=>n.disabled)));
 if(width===1440&&theme==='light'){
  await page.locator('article:first-child ::-p-aria(Visualizar)').click();await page.waitForFunction(()=>document.body.textContent.includes('Documento indisponível para teste'));await page.waitForFunction(()=>!document.querySelector('article:first-child button[aria-busy=true]'));await page.locator('article:first-child ::-p-aria(Baixar PDF)').click();await page.waitForFunction(()=>!document.querySelector('article:first-child button[aria-busy=true]'));assert.deepEqual(accesses,[{method:'POST',download:'false'},{method:'POST',download:'true'}]);
  mode='loading';await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('[role=status][aria-label="Carregando biblioteca"]');await shot(page,'loading.png');await page.waitForSelector('article');
  mode='empty';await page.reload({waitUntil:'networkidle2'});await page.waitForFunction(()=>document.body.textContent.includes('A biblioteca está sendo preparada'));await shot(page,'empty.png');
  mode='error';await page.reload({waitUntil:'networkidle2'});await page.waitForFunction(()=>document.body.textContent.includes('Não foi possível carregar a biblioteca'),{timeout:20000});await shot(page,'error.png');mode='normal';await page.locator('::-p-aria(Tentar novamente)').click();await page.waitForSelector('article');
 }
 assert.deepEqual(errors,[]);results.push({width,theme,passed:true,...initial});
 }catch(error){results.push({width,theme,passed:false,error:String(error)});await shot(page,`${width}-${theme}-failure.png`);}
 finally{await context.close();}
 console.log(JSON.stringify(results.at(-1)));
}}finally{await browser.close();}
await writeFile(new URL('results.json',output),JSON.stringify(results,null,2));assert.ok(results.every(r=>r.passed));
