import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

// Only local Vite and mocked APIs: this is visual evidence, not real API authentication.
const base = process.env.QA_VISUAL_URL ?? "http://127.0.0.1:13010";
assert.equal(new URL(base).hostname, "127.0.0.1");
const output = new URL("../docs/qa/indigo-focus/", import.meta.url);
await mkdir(output, { recursive: true });
const user = { id: "qa-user", name: "Anderson QA com nome completo", email: "qa@example.invalid", role: "admin", status: "ativo", daily_goal_hours: 2, created_at: "2026-10-11" };
const names = ["Direito Administrativo e Constitucional: organização do Estado e direitos fundamentais", "Banco de Dados", "Raciocínio Lógico"];
const disciplines = names.map((nome, i) => ({ id: `d${i}`, nome, sigla: null, ordem: i, peso: 2, concurso_ids: ["contest"], topicos_total: 8, topicos_estudados: i + 2, dominio_medio_pct: 35, total_pontos: 16, prioridade_calculada: 2 }));
const plan = { id: "plan", user_id: user.id, concurso_id: "contest", ativo: true, tipo: "manual", nome: "Meu cronograma", cargo: "Analista", data_inicio: "2026-01-01", data_fim: null, dias_disponiveis: ["seg", "ter", "qua", "qui", "sex"], disciplinas: disciplines.map((d, ordem) => ({ disciplina_id: d.id, nome: d.nome, ordem })) };
const days = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const blocks = Array.from({length: 10}, (_,i) => ({ id: `b${i}`, user_id: user.id, disciplina_id: `d${i%3}`, cronograma_id: "plan", concurso_id: "contest", dia_semana: days[i%7], hora_inicio: i === 7 ? "08:30" : i === 8 ? "10:00" : "08:00", hora_fim: i === 8 ? "10:05" : "09:30", tipo: ["estudo","questoes","revisao","simulado"][i%4], ativo: true, modo_criacao: "manual", vigencia_inicio: "2026-01-01", vigencia_fim: null, vigencia_indeterminada: true }));
blocks.push({...blocks[0], id:"legacy", dia_semana:"qua", hora_inicio:"",hora_fim:"", duracao_minutos:45, fonte:"cronograma_item",cronograma_item_id:"legacy"});
const resumo = { minutos_planejados_semana: 900, minutos_estudados_semana: 360, disciplinas_count: 3, atividades_planejadas: 11, atividades_concluidas: 4, progresso_pct: 36.4, questoes_total: 80, acertos: 64, erros:16, rendimento_pct:80, disciplinas: disciplines.map(d => ({ disciplina_id:d.id,minutos_planejados:300,minutos_estudados:120,sessoes_semana:3,progresso_pct:40 })) };
const dashboard = {horas_hoje:1.5,meta_horas:2,horas_semana:6,sessoes_semana:4,questoes_semana:80,rendimento_medio:80,avisos_proximos:0,flashcards_para_revisar:0,streak_dias:3};
const catalog = {id:"edital",nome:"Concurso nacional para Analista com título extenso e conteúdo programático",orgao:"Órgão federal",status:"publicado",cargos_total:2,disciplinas_total:3,logo_url:null,versao_atual:null};
const progresso = {dominados:2,total:8,percentual:25,texto:"2 de 8 tópicos"};
const json = body => ({status:200,contentType:"application/json",body:JSON.stringify(body)});
const results = [];
const browser = await puppeteer.launch({headless:true,args:["--no-sandbox"]});
async function intercept(page) {
  await page.setRequestInterception(true);
  page.on("request", async request => {
    const url = new URL(request.url());
    if (!url.pathname.startsWith("/api/v1/")) return url.origin===base ? request.continue() : request.abort();
    const path = url.pathname.replace("/api/v1", "");
    let data;
    if (path === "/concursos") data=[{id:"contest",nome:"Concurso QA – Analista",orgao:"Órgão federal",cargo:"Analista",status:"ativo",data_prova:"2026-12-12"}];
    else if(path==="/auth/me") data=user;
    else if(path==="/disciplinas") data=disciplines;
    else if(path==="/disciplinas/paginadas") data={items:disciplines,total:3,page:1,page_size:9,total_pages:1,summary:{total:3,em_progresso:3,no_concurso:3,fora_concurso:0,progresso_medio:35}};
    else if(path==="/cronograma/planejamento") data=plan;
    else if(path==="/cronograma/blocos") data=blocks;
    else if(path.endsWith("/atividades")) { const start=new Date(`${url.searchParams.get("inicio")}T12:00:00`); data=blocks.map(b=>{const d=new Date(start);d.setDate(d.getDate()+days.indexOf(b.dia_semana));return {...b,data:d.toISOString().slice(0,10),fonte:b.fonte??"bloco_semanal",bloco_cronograma_id:b.cronograma_item_id?null:b.id};}); }
    else if(path.includes("cronograma")&&path.endsWith("/resumo")) data=resumo;
    else if(path==="/dashboard/resumo") data=dashboard;
    else if(path==="/dashboard/proximo-estudo") data={fonte:"bloco_semanal",item_id:"b0",concurso_id:"contest",disciplina_id:"d0",disciplina_nome:names[0],topico_id:null,topico_nome:null,data:"2026-10-12",duracao_minutos:90,sessoes_recentes:4};
    else if(path==="/dashboard/revisoes-pendentes") data={total:0,items:[]};
    else if(path==="/dashboard/heatmap") data=[];
    else if(path.includes("calendario")) data={dias:[],resumo_mes:{minutos_planejados:900,minutos_realizados:360,total_sessoes:4,taxa_cumprimento_pct:40}};
    else if(path.endsWith("/edital-verticalizado/consulta")) data={contract_version:"1",concurso:{id:"contest",status:"ativo"},as_of:{local_date:"2026-10-11",timezone:"America/Sao_Paulo"},progresso_global:progresso,disciplinas:disciplines.map(d=>({...d,progresso,resultados:1})),items:disciplines.map((d,i)=>({id:`topic${i}`,disciplina_id:d.id,disciplina_nome:d.nome,descricao:"Princípios constitucionais, controle e competências administrativas",status:"em_andamento",numero_ordem:i,peso:2,dominio:1,prioridade:4,ultima_atividade_em:"2026-10-10T10:00:00",proxima_revisao_id:null,proxima_revisao_versao:null,proxima_revisao_em:null,revisao_atrasada:false,dias_atraso:0,nunca_estudado:false,razoes_atencao:[]})),page:{next_cursor:null,has_more:false,limit:30,result_count:3}};
    else if(path==="/admin/users/dashboard") data={total:1,ativos:1,pendentes:0,bloqueados:0};
    else if(path==="/admin/users") data={items:[user],total:1,page:1,page_size:15};
    else if(path==="/admin/editais") data={items:[catalog],total:1,page:1,page_size:15,total_pages:1};
    else if(path==="/notifications/unread-count") data={count:0};
    else if(path==="/telemetry/preference") data={opted_out:true};
    else if(path.includes("pomodoro")&&path.endsWith("config")) data={focus_hours:0,focus_minutes:25,short_break_minutes:5,long_break_minutes:15,cycles_before_long_break:4};
    else data=[];
    return request.respond(json(data));
  });
}
async function shot(page,name) { await page.screenshot({path:fileURLToPath(new URL(`${name}.png`,output)),fullPage:true}); }
async function geometry(page) {
  return page.evaluate(()=>{const main=document.querySelector("main");const mainRight=main?.getBoundingClientRect().right??innerWidth;return {actualTheme:document.documentElement.classList.contains("dark")?"dark":"light",pageWidth:document.documentElement.scrollWidth,mainWidth:main?.clientWidth,mainScrollWidth:main?.scrollWidth,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,mainOverflow:main?.scrollWidth>main?.clientWidth+1,heading:document.querySelector("main h1")?.textContent??document.querySelector("h1")?.textContent,missingNames:[...document.querySelectorAll("button")].filter(e=>e.getBoundingClientRect().width>0&& !e.textContent.trim() && !e.getAttribute("aria-label")&&!e.getAttribute("title")).map(e=>e.outerHTML.slice(0,180)),activeNav:[...document.querySelectorAll('#app-sidebar [aria-current="page"]')].map(e=>e.textContent.trim()),offenders:[...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().right>mainRight+1&&!e.closest("#app-sidebar")).slice(0,35).map(e=>({tag:e.tagName,classes:e.className,left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width),overflow:getComputedStyle(e).overflowX,text:e.textContent?.trim().slice(0,90)}))};});
}
try {
 if(!process.env.QA_PUBLIC_ONLY)for(const width of (process.env.QA_WIDTHS?.split(",").map(Number)??[1440,1280,768,375])) for(const theme of (process.env.QA_THEMES?.split(",")??["light","dark"])) {
  const context=await browser.createBrowserContext(); const page=await context.newPage(); const errors=[];
  page.on("pageerror",e=>errors.push(e.message)); await page.setViewport({width,height:900});
  await page.evaluateOnNewDocument((user,theme)=>{localStorage.setItem("theme",theme);localStorage.setItem("aprovingo-auth",JSON.stringify({state:{accessToken:"qa-visual-mocked",refreshToken:"qa-visual-mocked",user},version:4}));localStorage.setItem("cf-concurso-ativo",JSON.stringify({state:{concursoAtivoId:"contest"},version:0}));},user,theme);
  await intercept(page);
  for(const [name,path] of [["dashboard","/dashboard"],["cronograma","/cronograma"],["edital","/disciplinas?view=edital"],["disciplinas","/disciplinas?view=cards"],["usuarios","/admin/usuarios"],["catalogo","/admin/editais"]]) {
    if(process.env.QA_PAGES&&!process.env.QA_PAGES.split(",").includes(name))continue;
    try {await page.goto(base+path,{waitUntil:"networkidle2"});await page.waitForSelector("main h1");await shot(page,`${width}-${theme}-${name}`);if(name==="cronograma") {await page.evaluate(()=>{const main=document.querySelector("main");main.scrollTop=600;});await shot(page,`${width}-${theme}-${name}-below`);}const g=await geometry(page);results.push({width,theme,name,...g,errors:[...errors],passed:!g.pageOverflow&&!g.mainOverflow&&!errors.length});}
    catch(error){results.push({width,theme,name,passed:false,error:String(error),errors:[...errors]});}
  }
  if(process.env.QA_PAGES){await context.close();continue;}
  await page.goto(base+"/dashboard",{waitUntil:"networkidle2"});
  await page.keyboard.down("Control");await page.keyboard.press("k");await page.keyboard.up("Control");await page.waitForSelector('[role="dialog"]');
  const searchFocused=await page.evaluate(()=>document.activeElement?.getAttribute("aria-label")==="Nome da página");await page.keyboard.press("Escape");await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'));const searchRestore=await page.waitForFunction(()=>document.activeElement?.getAttribute("aria-label")?.startsWith("Buscar páginas"),{timeout:3000}).then(()=>true,()=>false);
  if(width<768) {await page.click('[aria-label="Abrir menu"]');await page.waitForSelector('#app-sidebar[role="dialog"]');await shot(page,`${width}-${theme}-drawer`);await page.keyboard.press("Escape");await page.waitForFunction(()=>document.querySelector('#app-sidebar')?.getAttribute("aria-hidden")==="true");const restored=await page.evaluate(()=>document.activeElement?.getAttribute("aria-label")==="Abrir menu");results.push({width,theme,name:"keyboard",searchFocused,searchRestore,drawerRestore:restored,passed:searchFocused&&searchRestore&&restored});}
  else {await page.click('[aria-label="Recolher menu"]');await page.waitForSelector('[aria-label="Expandir menu"]');await shot(page,`${width}-${theme}-compact`);await page.reload({waitUntil:"networkidle2"});const persisted=!!await page.$('[aria-label="Expandir menu"]');results.push({width,theme,name:"keyboard",searchFocused,searchRestore,compactPersisted:persisted,passed:searchFocused&&searchRestore&&persisted});}
  await context.close();
 }
 // Public login is separate: no simulated authentication.
 if(!process.env.QA_PAGES)for(const width of [1440,1280,768,375]) for(const theme of ["light","dark"]) {const context=await browser.createBrowserContext();const page=await context.newPage();await page.setViewport({width,height:900});await page.evaluateOnNewDocument(theme=>localStorage.setItem("theme",theme),theme);await intercept(page);await page.goto(base+"/login",{waitUntil:"networkidle2"});await shot(page,`${width}-${theme}-login`);const g=await geometry(page);results.push({width,theme,name:"login",...g,passed:!g.pageOverflow&&g.actualTheme===theme});await context.close();}
} finally {await browser.close();}
await writeFile(new URL(process.env.QA_PUBLIC_ONLY?"public-results.json":process.env.QA_PAGES?"targeted-results.json":"smoke-results.json",output),JSON.stringify({mocked:true,base,results},null,2));
console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
