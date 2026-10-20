import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const longOnly=process.env.QA_LONG_ONLY==='1';
const base='http://127.0.0.1:4175',output=new URL('../docs/qa/concursos-refinement/',import.meta.url);await mkdir(output,{recursive:true});
const cid='00000000-0000-4000-8000-000000000001',user={id:cid,name:'Estudante QA',email:'qa@example.invalid',role:'user',status:'ativo'};
const rows=[{id:cid,user_id:cid,nome:'Receita Federal',orgao:'Receita Federal do Brasil',cargo:'Auditor-Fiscal da Receita Federal',banca:'FGV',status:'ativo',data_prova:'2027-01-17',logo_url:null,edital_url:'/uploads/edital.pdf',created_at:'2026-10-01T12:00:00'}, {id:'c2',nome:'TRT',orgao:'Tribunal Regional do Trabalho',cargo:'AnalistaDeTecnologiaDaInformacao'.repeat(9),banca:null,status:'realizado',edital_url:null,logo_url:null,data_prova:null,created_at:'2026-10-01T12:00:00'}];
const disciplines=[{id:'d1',nome:'Português e compreensão e interpretação de textos de gêneros variados',concurso_ids:[cid]},{id:'d2',nome:'DireitoConstitucional'.repeat(8),concurso_ids:[cid]}];
const json=(body,status=200)=>({status,contentType:'application/json',body:JSON.stringify(body)});
function pdf(){let text='%PDF-1.4\n';const offsets=[0];const stream='BT /F1 18 Tf 36 100 Td (Edital - QA local) Tj ET';const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 180] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];objects.forEach((o,i)=>{offsets.push(text.length);text+=`${i+1} 0 obj\n${o}\nendobj\n`;});const x=text.length;text+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;return text;}
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});const results=[];
async function shot(page,name){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await new Promise(r=>setTimeout(r,220));await page.screenshot({path:fileURLToPath(new URL(name,output))});}
async function check(page,modal=false){return page.evaluate(modal=>{
 const host=modal?document.querySelector('[role=dialog]'):document.querySelector('main'),r=host.getBoundingClientRect();
 const panel=host.querySelector('[role=tabpanel]');const buttons=modal?[...host.querySelectorAll('header button,footer button')]:[];
 return {overflow:host.scrollWidth>host.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,contained:r.left>=-1&&r.right<=innerWidth+1&&(!modal||r.top>=-1&&r.bottom<=innerHeight+1),panelOverflow:panel?panel.scrollWidth>panel.clientWidth+1:false,buttons:buttons.map(n=>{const b=n.getBoundingClientRect();return {width:b.width,height:b.height,contained:b.left>=r.left-1&&b.right<=r.right+1&&b.top>=r.top-1&&b.bottom<=r.bottom+1};})};
 },modal);}
async function valid(page,modal=false){const g=await check(page,modal);assert.equal(g.overflow||g.panelOverflow,false,'no horizontal overflow');assert.equal(g.contained,true,'dialog fits viewport');assert.ok(g.buttons.every(b=>b.contained&&b.height>=43),'footer/header touch targets visible');return g;}
const tab=name=>`[role=tab]::-p-text(${name})`;
try{for(const width of (longOnly?[320,375,768,1440]:[320,375,390,768,1024,1440,1920]))for(const theme of ['light','dark']){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],calls=[];let contests=structuredClone(rows),mode='normal',attachment='pdf';
 try{
 await page.setViewport({width,height:width<768?900:1000});page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(({user,cid,theme})=>{localStorage.setItem('theme',theme);localStorage.setItem('aprovingo-auth',JSON.stringify({state:{user,accessToken:'qa-local',refreshToken:'qa-local'},version:4}));localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:cid},version:0}));},{user,cid,theme});
 await page.setRequestInterception(true);page.on('request',async r=>{
 const u=new URL(r.url());if(u.pathname==='/uploads/edital.pdf')return r.respond({status:200,contentType:'application/pdf',body:pdf()});
 if(u.pathname==='/uploads/edital.png')return r.respond({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="300" height="180" fill="white"/><text x="20" y="90">Edital QA</text></svg>'});
 if(!u.pathname.startsWith('/api/v1/'))return u.origin===base?r.continue():r.abort();const p=u.pathname.replace('/api/v1','');calls.push(p);
 if(p==='/auth/me')return r.respond(json(user));
 if(p==='/concursos')return r.respond(json(contests.map(c=>({...c,edital_url:attachment==='none'?null:attachment==='pdf'?'/uploads/edital.pdf':attachment==='image'?'/uploads/edital.png':'/uploads/edital.docx'}))));
 if(p==='/disciplinas')return r.respond(json(disciplines));
 if(p===`/concursos/${cid}/disciplinas`){if(mode==='list-error')return r.respond(json({detail:'QA error'},500));if(mode==='loading')await new Promise(r=>setTimeout(r,1200));return r.respond(json(mode==='empty'?[]:disciplines));}
 if(p.endsWith('/dashboard')){if(mode==='partial-error'&&p.includes('d2'))return r.respond(json({detail:'QA error'},500));const count=mode==='no-questions'||p.includes('d2')?0:10;return r.respond(json({kpis:{questoes_resolvidas_total:count,questoes_certas_total:count?7:0,desempenho_geral_pct:count?70:0},topicos:[]}));}
 if(p==='/notifications/unread-count')return r.respond(json({count:0}));if(p==='/telemetry/preference')return r.respond(json({opted_out:true}));return r.respond(json([]));
 });
 await page.goto(`${base}/concursos`,{waitUntil:'networkidle2'});await page.waitForSelector('[data-concurso-card]');await valid(page);
 const titleGeometry=await page.$eval('[data-concurso-card]:last-child h2',n=>{const s=n.querySelector('.line-clamp-3');return {clamp:getComputedStyle(s).webkitLineClamp,height:s.clientHeight,lineHeight:parseFloat(getComputedStyle(s).lineHeight)};});assert.equal(titleGeometry.clamp,'3');assert.ok(titleGeometry.height<=titleGeometry.lineHeight*3+2);
 await page.$eval('[data-concurso-card]:last-child h2 [tabindex]',n=>n.scrollIntoView({block:'center'}));await new Promise(r=>setTimeout(r,220));await page.focus('[data-concurso-card]:last-child h2 [tabindex]');await page.waitForSelector('[role=tooltip]');assert.ok(await page.$eval('[role=tooltip]',n=>n.textContent.includes('AnalistaDeTecnologia')));await valid(page);await page.keyboard.press('Escape');
 if(longOnly){
  await page.locator('[data-concurso-card]:last-child > div:last-child button').click();await page.waitForSelector('[role=dialog]');
  const geometry=await valid(page,true);assert.ok(await page.$eval('[role=tabpanel]',(n,title)=>n.textContent.includes(title),rows[1].cargo));
  await shot(page,`${width}-${theme}-long-title.png`);results.push({width,theme,passed:true,geometry});continue;
 }
 await page.locator('::-p-aria(Ver detalhes)').click();await page.waitForSelector('[role=dialog]');const dataGeometry=await valid(page,true);
 assert.equal(await page.$eval('[role=dialog]',n=>n.textContent.includes('Cadastrado em')&&!n.textContent.includes('Última atualização')),true);
 assert.equal(calls.some(p=>p.includes('/dashboard')),false,'no eager dashboard requests');
 await shot(page,`${width}-${theme}-dados.png`);
 await page.focus(tab('Dados'));await page.keyboard.press('ArrowRight');await page.waitForSelector('iframe[title="Pré-visualização do edital"]');assert.ok(await page.$eval('iframe',n=>n.src.endsWith('/uploads/edital.pdf')));await valid(page,true);await shot(page,`${width}-${theme}-edital.png`);
 await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>{const text=document.querySelector('[role=tabpanel]')?.textContent||'';return text.includes('70%')&&text.includes('Nenhuma quest\u00e3o resolvida ainda');});await valid(page,true);
 assert.ok(await page.$eval('[role=tabpanel]',n=>n.textContent.includes('Nenhuma questão resolvida ainda')&&!/(^|\s)0% de acerto/.test(n.textContent)));
 assert.equal(await page.$eval('[role=tabpanel] a',n=>new URL(n.href).pathname),'/disciplinas');await shot(page,`${width}-${theme}-progresso.png`);
 await page.locator('::-p-aria(Fechar detalhes do concurso)').click();await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
 contests=rows.slice(0,1);await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('[data-concurso-card]');const single=await page.$eval('[data-concurso-card]',n=>n.getBoundingClientRect().width);if(width>=1024)assert.ok(single>=600&&single<=673,'single card comfortable');await valid(page);await shot(page,`${width}-${theme}-page.png`);
 if([375,1440].includes(width)&&theme==='light'){
  for(const state of ['empty','no-questions','partial-error','list-error','loading']){
   mode=state;await page.reload({waitUntil:'networkidle2'});await page.locator('::-p-aria(Ver detalhes)').click();await page.waitForSelector('[role=dialog]');await page.locator(tab('Progresso')).click();
   if(state==='empty')await page.waitForFunction(()=>document.querySelector('[role=tabpanel]')?.textContent.includes('Nenhuma disciplina vinculada'));
   if(state==='no-questions')await page.waitForFunction(()=>document.querySelector('[role=tabpanel]')?.textContent.includes('O progresso aparecerá'));
   if(state.endsWith('error'))await page.waitForSelector('[role=dialog] [role=alert]',{timeout:20000});
   if(state==='loading')await page.waitForSelector('[role=dialog] [role=status]');
   await valid(page,true);await shot(page,`${width}-${theme}-${state}.png`);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
  }
  mode='normal';for(const value of ['none','image','unsupported']){attachment=value;await page.reload({waitUntil:'networkidle2'});await page.locator('::-p-aria(Ver detalhes)').click();await page.waitForSelector('[role=dialog]');await page.locator(tab('Edital')).click();await valid(page,true);await shot(page,`${width}-${theme}-edital-${value}.png`);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));}
 }
 assert.deepEqual(errors,[]);results.push({width,theme,passed:true,dataGeometry,single,requests:calls.filter(p=>p.includes('/dashboard')).length});
 }catch(error){results.push({width,theme,passed:false,error:String(error)});await shot(page,`${width}-${theme}-failure.png`);}
 finally{await context.close();}
 console.log(JSON.stringify(results.at(-1)));
}}finally{await browser.close();}
await writeFile(new URL(longOnly?'long-results.json':'results.json',output),JSON.stringify(results,null,2));assert.ok(results.every(r=>r.passed));
