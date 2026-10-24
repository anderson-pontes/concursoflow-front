import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
const base='http://127.0.0.1:4175', output=new URL('../docs/qa/study-plan-integrated-days/',import.meta.url);
await mkdir(output,{recursive:true});
const apiDir=fileURLToPath(new URL('../../../api/concursoflow/',import.meta.url));
function generate(input){
 const result=spawnSync(`${apiDir}/.venv/Scripts/python.exe`,['-c',`import sys,json,dataclasses
from datetime import date
from app.services.planejamento import DisciplinaPlanejamento,gerar_planejamento_explicado
x=json.load(sys.stdin);c=x['planejamento'];ds=[DisciplinaPlanejamento(None,d['nome'],d['peso'],d['conhecimento'],d['ordem']) for d in x['disciplinas']]
r=gerar_planejamento_explicado(ds,{int(k):v for k,v in c['disponibilidade_minutos'].items()},c['sessao_min_minutos'],c['sessao_max_minutos'],date.fromisoformat(c['data_inicio']),date.fromisoformat(c['data_fim']))
print(json.dumps(dict(sessoes=[dataclasses.asdict(s) for s in r.sessoes],minutos_totais=r.capacidade.carga_alocada_minutos,carga_semanal_minutos=sum(c['disponibilidade_minutos'].values()),prioridades={d.nome:d.prioridade for d in ds},preview_fingerprint=r.preview_fingerprint,explicacao=dict(versao_contrato=1,algoritmo_versao='planejamento-v1',confirmavel=True,capacidade=dataclasses.asdict(r.capacidade),disciplinas=[dataclasses.asdict(d) for d in r.disciplinas],alertas=r.alertas)),default=str))`],{cwd:apiDir,input:JSON.stringify(input),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
}
const user={id:'qa-study-plan',name:'Estudante QA',email:'qa@example.invalid',role:'user',status:'ativo'};
const discipline={nome:'DisciplinaComNomeMuitoExtensoSemEspaços'.repeat(3),topicos:['Leitura e interpretação','Questões práticas'],ativa:true,peso:5,conhecimento:'regular',ordem:0};
const config={tipo:'ciclo',disponibilidade_minutos:{0:60,1:60,2:60,3:60,4:60},sessao_min_minutos:25,sessao_max_minutos:50,data_inicio:'2026-11-02',data_fim:'2026-11-15'};
const draft={schemaVersion:1,userScope:user.id,updatedAt:new Date().toISOString(),idempotencyKey:'qa-availability-plan',step:4,tipo:'personalizado',busca:'',editalId:null,versionId:null,cargoId:null,nome:'Concurso de validação',orgao:'Órgão QA',cargoNome:'Analista',banca:'',dataProva:'',observacoes:'',disciplinas:[discipline],config};
const json=data=>({status:200,contentType:'application/json',body:JSON.stringify(data)});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']}),results=[];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function click(page,label){await page.locator(`::-p-aria(${label})`).click();}
async function check(page){const result=await page.evaluate(()=>{const root=document.querySelector('.study-plan-page'),main=document.querySelector('main'),style=getComputedStyle(main);return {overflow:document.documentElement.scrollWidth>innerWidth+1||main.scrollWidth>main.clientWidth+1,outerScroll:document.documentElement.scrollHeight>innerHeight+1,fullWidth:Math.abs(root.getBoundingClientRect().width-(main.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)))<2};});assert.equal(result.overflow,false);assert.equal(result.outerScroll,false);assert.ok(result.fullWidth);return result;}
async function shot(page,name,selector){await page.waitForFunction(()=>!document.querySelector('[data-sonner-toast]'),{timeout:10000});if(selector)await page.$eval(selector,n=>n.scrollIntoView({block:'start'}));await page.evaluate(()=>document.fonts.ready);await wait(180);await page.screenshot({path:fileURLToPath(new URL(name,output))});}
try{for(const width of (process.env.QA_WIDTHS?process.env.QA_WIDTHS.split(',').map(Number):[375,390,768,1366,1440,1920]))for(const theme of ['light','dark']){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];let preview,previewInput,confirmation;
 try{
 await page.setViewport({width,height:1000});page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(({user,draft,theme})=>{localStorage.setItem('theme',theme);localStorage.setItem('aprovingo-auth',JSON.stringify({state:{user,accessToken:'qa-local',refreshToken:'qa-local'},version:4}));localStorage.setItem(`clickedital:onboarding-draft:v1:${user.id}`,JSON.stringify(draft));},{user,draft,theme});
 await page.setRequestInterception(true);page.on('request',async req=>{const url=new URL(req.url());if(!url.pathname.startsWith('/api/v1/'))return url.origin===base?req.continue():req.abort();const path=url.pathname.replace('/api/v1','');
 if(path==='/auth/me')return req.respond(json(user));
 if(path==='/concursos/planejamento/preview'){previewInput=JSON.parse(req.postData());preview=generate(previewInput);return req.respond(json(preview));}
 if(path==='/concursos/planejamento/confirmar'){confirmation=JSON.parse(req.postData());assert.deepEqual(confirmation.planejamento,previewInput.planejamento);assert.equal(confirmation.preview_fingerprint,preview.preview_fingerprint);return req.respond(json({concurso_id:'qa-contest',disciplinas_criadas:1,topicos_criados:2,sessoes_planejadas:preview.sessoes.length,preview}));}
 if(path==='/notifications/unread-count')return req.respond(json({count:0}));if(path==='/telemetry/preference')return req.respond(json({opted_out:true}));return req.respond(json([]));});
 await page.goto(`${base}/planos/novo`,{waitUntil:'networkidle2'});await click(page,'Retomar rascunho');await page.waitForSelector('.weekly-availability');await check(page);await shot(page,`${width}-${theme}-planning.png`);
 await click(page,'Limpar semana');assert.equal(await page.$eval('button',()=>[...document.querySelectorAll('button')].find(n=>n.textContent.includes('Continuar')).disabled),true);
 await click(page,'Aplicar todos os dias');await click(page,'Aplicar de seg. a sex.');
 await click(page,'Limpar semana');await click(page,'Estudar na Segunda');
 await click(page,'Duração de Segunda');await click(page,'Personalizar duração');await page.locator('::-p-aria(Duração personalizada de Segunda)').fill('00:30');
 await page.locator('::-p-aria(Sessão mínima (min))').fill('50');await page.locator('::-p-aria(Sessão máxima (min))').fill('50');
 await page.waitForFunction(()=>document.body.textContent.includes('não comportam uma sessão mínima'));assert.equal(await page.$eval('button',()=>[...document.querySelectorAll('button')].find(n=>n.textContent.includes('Continuar')).disabled),true);await check(page);await shot(page,`${width}-${theme}-capacity-error.png`,'.weekly-availability');
 await page.locator('::-p-aria(Sessão mínima (min))').fill('25');await page.locator('::-p-aria(Duração personalizada de Segunda)').fill('01:30');
 await click(page,'Copiar para dias selecionados');await click(page,'Copiar para Domingo');await check(page);await shot(page,`${width}-${theme}-copy-targets.png`,'[aria-label="Dias de destino da cópia"]');await click(page,'Aplicar aos dias selecionados');
 await click(page,'Voltar');await page.waitForFunction(()=>document.body.textContent.includes('Escolha disciplinas e tópicos'));await check(page);await shot(page,`${width}-${theme}-content.png`);
 await click(page,'Continuar');await page.waitForSelector('.weekly-availability');assert.ok((await page.$eval('[aria-label="Duração de Segunda"]',n=>n.textContent)).includes('1h 30min'));await check(page);await shot(page,`${width}-${theme}-availability.png`,'.weekly-availability');
 await click(page,'Continuar');await page.waitForFunction(()=>document.body.textContent.includes('Seu plano está pronto para confirmar'));await check(page);assert.equal(previewInput.planejamento.disponibilidade_minutos[0],90);assert.equal(previewInput.planejamento.disponibilidade_minutos[6],120);assert.equal(preview.minutos_totais,420);assert.ok(preview.sessoes.every(s=>s.duracao_minutos>=25&&s.duracao_minutos<=50));await shot(page,`${width}-${theme}-review.png`);
 await click(page,'Confirmar e ativar');await page.waitForFunction(()=>document.body.textContent.includes('Seu plano está pronto'));assert.ok(confirmation);assert.deepEqual(errors,[]);results.push({width,theme,passed:true,minutes:preview.minutos_totais,sessions:preview.sessoes.length,contract:confirmation.planejamento});
 }catch(error){results.push({width,theme,passed:false,error:String(error),errors});await shot(page,`${width}-${theme}-failure.png`);}finally{await context.close();}console.log(JSON.stringify(results.at(-1)));
}}finally{await browser.close();}
await writeFile(new URL(process.env.QA_RESULT_FILE??'results.json',output),JSON.stringify(results,null,2));assert.ok(results.every(r=>r.passed));
