import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
const base='http://127.0.0.1:4175',output=new URL('../docs/qa/metric-cards/',import.meta.url);await mkdir(output,{recursive:true});
const cid='00000000-0000-4000-8000-000000000001',did='00000000-0000-4000-8000-000000000010';
const user={id:cid,name:'Estudante QA',email:'qa@example.invalid',role:'user',status:'ativo'};
const disc={id:did,nome:'Língua Portuguesa e interpretação de textos',sigla:'TRT',peso:6,total_pontos:6,prioridade_calculada:30,ordem:1,concurso_ids:[cid],topicos_total:6,topicos_estudados:1,topicos_iniciados:2};
const plan={id:'plan',user_id:cid,concurso_id:cid,nome:'Meu cronograma',cargo:'Analista',tipo:'manual',ativo:true,data_inicio:'2026-10-01',data_fim:null,dias_disponiveis:['seg','ter','qua','qui','sex'],disciplinas:[{disciplina_id:did,nome:disc.nome,ordem:0}]};
const progress={dominados:1,total:6,percentual:17,texto:'1 de 6 tópicos dominados'};
const topic={id:'topic',disciplina_id:did,disciplina_nome:disc.nome,descricao:'Interpretação e organização textual',status:'em_andamento',numero_ordem:1,peso:2,dominio:2,prioridade:8,ultima_atividade_em:null,proxima_revisao_id:null,proxima_revisao_em:null,revisao_atrasada:false,dias_atraso:0,nunca_estudado:false,razoes_atencao:[]};
const detail={disciplina_id:did,nome:disc.nome,kpis:{tempo_estudo_horas:2.5,desempenho_geral_pct:80,questoes_certas_total:8,questoes_erradas_total:2,questoes_branco_total:0,questoes_resolvidas_total:10,progresso_edital_pct:17,topicos_concluidos:1,topicos_pendentes:5,topicos_total:6,paginas_lidas_total:30},topicos:[]};
const json=body=>({status:200,contentType:'application/json',body:JSON.stringify(body)});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});const results=[];
async function geometry(page){return page.evaluate(()=>{const main=document.querySelector('main');return {docX:document.documentElement.scrollWidth>innerWidth+1,docY:document.documentElement.scrollHeight>innerHeight+1,mainX:main.scrollWidth>main.clientWidth+1};});}
async function metrics(page,selector){return page.$$eval(selector,ns=>{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
 const rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
 const luminance=color=>rgb(color).map(c=>{const n=c/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
 return ns.map(n=>{const s=getComputedStyle(n),icon=n.querySelector('.metric-card-icon,.discipline-kpi-icon'),i=getComputedStyle(icon),b=luminance(s.backgroundColor);return {tone:n.dataset.metricTone||({emerald:'green',violet:'purple',amber:'orange'}[n.dataset.disciplineKpi]||n.dataset.disciplineKpi),colors:[s.backgroundColor,s.borderColor,i.backgroundColor,i.color].map(c=>rgb(c).join(',')),border:s.borderTopWidth,radius:s.borderRadius,cursor:s.cursor,contrast:[...n.querySelectorAll('p,h2,.metric-card-description,strong')].map(t=>{const a=luminance(getComputedStyle(t).color);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}),text:n.textContent};});
 });}
try{for(const width of [375,768,1440].filter(w=>!process.env.QA_WIDTH||w===Number(process.env.QA_WIDTH)))for(const theme of ['light','dark']){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];let writes=0;
 await page.setViewport({width,height:width<640?950:1000});page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(({user,cid,theme})=>{localStorage.clear();localStorage.setItem('theme',theme);localStorage.setItem('aprovingo-auth',JSON.stringify({state:{user,accessToken:'qa-local',refreshToken:'qa-local'},version:4}));localStorage.setItem('cf-concurso-ativo',JSON.stringify({state:{concursoAtivoId:cid},version:0}));},{user,cid,theme});
 await page.setRequestInterception(true);page.on('request',async r=>{
  const u=new URL(r.url());if(!u.pathname.startsWith('/api/v1/'))return u.origin===base?r.continue():r.abort();const p=u.pathname.replace('/api/v1','');
  if(r.method()!=='GET'&&!p.endsWith('/consulta')){writes++;return r.respond(json({}));}
  if(p==='/auth/me')return r.respond(json(user));
  if(p==='/concursos')return r.respond(json([{id:cid,nome:'TRT 8ª Região',orgao:'TRT 8ª Região',cargo:'Analista',data_prova:null}]));
  if(p===`/disciplinas/${did}/dashboard`)return r.respond(json(detail));
  if(p==='/disciplinas')return r.respond(json([disc]));
  if(p==='/disciplinas/paginadas')return r.respond(json({items:[disc],total:1,page:1,page_size:9,total_pages:1,summary:{total:1,em_progresso:1,no_concurso:1,fora_concurso:0,progresso_medio:17,topicos_total:6,topicos_concluidos:1}}));
  if(p.endsWith('/edital-verticalizado/consulta'))return r.respond(json({contract_version:'1',concurso:{id:cid,status:'ativo'},as_of:{local_date:'2026-10-19',timezone:'America/Sao_Paulo'},progresso_global:progress,indicadores:{estudados:2,revisoes_pendentes:0,topicos_prioritarios:1},disciplinas:[{id:did,nome:disc.nome,ordem:0,progresso:progress,resultados:1}],items:[topic],page:{next_cursor:null,has_more:false,limit:30,result_count:1}}));
  if(p==='/cronograma/planejamento')return r.respond(json(plan));
  if(p==='/cronograma/planejamento/plan/resumo')return r.respond(json({minutos_planejados_semana:600,minutos_estudados_semana:145,disciplinas_count:1,atividades_planejadas:4,atividades_concluidas:1,progresso_pct:25,questoes_total:10,acertos:8,erros:2,rendimento_pct:80,disciplinas:[{disciplina_id:did,minutos_planejados:600,minutos_estudados:145,sessoes_semana:4,progresso_pct:25}]}));
  if(p==='/dashboard/analise')return r.respond(json({inicio:'2026-10-19',fim:'2026-10-25',timezone:'America/Sao_Paulo',totais:{minutos_planejados:600,minutos_estudados:145,meta_periodo_minutos:600,sessoes:4,questoes_total:10,acertos:8,erros:2,acertos_pct:80,topicos_total:6,topicos_concluidos:1,progresso_edital_pct:17},dias:[],disciplinas:[{id:did,nome:disc.nome,topicos_total:6,topicos_concluidos:1,progresso_pct:17,minutos_estudados:145,participacao_tempo_pct:100}],plano_hoje:[{id:'session',fonte:'cronograma_item',disciplina_id:did,disciplina_nome:disc.nome,topico_id:null,topico_nome:null,data:'2026-10-19',hora_inicio:null,hora_fim:null,duracao_minutos:30,status:'planejada'}]}));
  if(p==='/dashboard/resumo')return r.respond(json({horas_hoje:1,meta_horas:2,horas_semana:145/60,questoes_semana:10,flashcards_para_revisar:0,streak_dias:2,taxa_cumprimento_mes:25,minutos_planejados_mes:600,minutos_realizados_mes:145}));
  if(p==='/dashboard/proximo-estudo')return r.respond(json(null));if(p==='/dashboard/revisoes-pendentes')return r.respond(json({total:0,items:[]}));
  if(p==='/pomodoro/config')return r.respond(json({mode:'pomodoro',focus_hours:0,focus_minutes:25,short_break_minutes:5,long_break_minutes:15,cycles_target:4}));
  if(p==='/notifications/unread-count')return r.respond(json({count:0}));if(p==='/telemetry/preference')return r.respond(json({opted_out:true}));return r.respond(json([]));
 });
 const routes=[['reference',`/disciplinas/${did}`,5],['dashboard','/dashboard',4],['cronograma','/cronograma',6],['edital','/disciplinas?view=edital',4],['disciplinas','/disciplinas?view=cards',4]];let reference;
 for(const [name,route,count]of routes){try{
  errors.length=0;await page.goto(base+route,{waitUntil:'networkidle2'});await page.waitForSelector(name==='reference'?'[data-discipline-kpi]':'[data-metric-tone]');await new Promise(r=>setTimeout(r,250));
  const rows=await metrics(page,name==='reference'?'[data-discipline-kpi]':'[data-metric-tone]');assert.equal(rows.length,count);
  if(name==='reference')reference=Object.fromEntries(rows.map(r=>[r.tone,r]));else for(const row of rows){assert.deepEqual(row.colors,reference[row.tone].colors,'cores iguais à referência');assert.equal(row.border,'1px');assert.ok(row.contrast.every(c=>c>=4.5),'contraste dos textos AA');assert.notEqual(row.cursor,'pointer','KPI informativo sem cursor de ação');}
  const g=await geometry(page);assert.equal(g.docX||g.docY||g.mainX,false,'sem overflow externo');
  const neutral=await page.$$eval('[data-slot="card"],.discipline-summary,.discipline-catalog-card',ns=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
   const rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color.trim();ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).join(',');};
   return ns.map(n=>({text:n.textContent.slice(0,55),bg:rgb(getComputedStyle(n).backgroundColor),expected:rgb(getComputedStyle(n).getPropertyValue('--card'))}));
  });assert.deepEqual(neutral.filter(row=>row.bg!==row.expected),[],'neutral content surfaces');
  assert.deepEqual(errors,[]);await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-${name}.png`,output))});results.push({width,theme,page:name,passed:true,geometry:g,metrics:rows});
 }catch(e){await page.screenshot({path:fileURLToPath(new URL(`${width}-${theme}-${name}-failure.png`,output))});results.push({width,theme,page:name,passed:false,error:e.message,errors:[...errors]});console.log(JSON.stringify(results.at(-1)));}}
 await context.close();
}}finally{await browser.close();await writeFile(new URL('results.json',output),JSON.stringify({mocked:true,productionWrites:false,results},null,2));}
console.log(JSON.stringify({total:results.length,passed:results.filter(r=>r.passed).length,failures:results.filter(r=>!r.passed)},null,2));if(results.some(r=>!r.passed))process.exitCode=1;
