import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

// Somente localhost e respostas interceptadas: não faz login nem escreve em banco real.
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:13012";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname));
const output = new URL("../docs/qa/dashboard-29-12/", import.meta.url);
await mkdir(output, { recursive: true });
const id = index => `29110000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const contest = { id: id(1), nome: "Concurso QA Dashboard", orgao: "Tribunal Regional de uma Região com nome bastante extenso", cargo: "Analista Judiciário de Tecnologia da Informação", data_prova: null };
const secondContest = {...contest,id:id(20),nome:'Concurso QA sem registros',orgao:'Outro órgão QA'};
const names = ["Direito Constitucional e Administrativo com identificação longa", "Língua Portuguesa", "Banco de Dados"];
const disciplines = names.map((nome, index) => ({ id: id(index + 2), nome, concurso_ids: [contest.id], topicos_total: 10, topicos_estudados: index * 3 }));
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const json = (data, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(data) });
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const results = [];
const profiles = [1440,1280,768,375].flatMap(width => ['light','dark'].flatMap(theme => ['data','empty'].map(scenario => ({name:`${width}-${theme}-${scenario}`,width,height:900,theme,scenario}))));
profiles.push({name:'1440-light-zero',width:1440,height:900,theme:'light',scenario:'zero'},{name:'1440-light-error',width:1440,height:900,theme:'light',scenario:'error'});
profiles.push({name:'1440-light-no-questions',width:1440,height:900,theme:'light',scenario:'no-questions'});
const selectedProfiles=process.env.QA_LAYOUT_PROFILES?profiles.filter(p=>process.env.QA_LAYOUT_PROFILES.split(',').includes(p.name)):profiles;

function analysis(url, scenario) {
  const inicio = url.searchParams.get("inicio");
  const fim = url.searchParams.get("fim");
  const active = scenario !== "empty";
  const minutes = active ? 150 : 0;
  const hasQuestions=active&&scenario!=='no-questions';
  const count = hasQuestions ? 10 : 0;
  const correct = scenario === "data" ? 1 : 0;
  const rate = count ? correct / count * 100 : null;
  const rows = disciplines.map((d, index) => ({ id: d.id, nome: d.nome, topicos_total: 10, topicos_concluidos: index * 3, progresso_pct: index * 30, minutos_estudados: active ? [30, 60, 60][index] : 0, participacao_tempo_pct: active ? [20, 40, 40][index] : 0 }));
  return { inicio, fim, timezone: "America/Sao_Paulo", totais: { minutos_planejados: active ? 180 : 0, minutos_estudados: minutes, meta_periodo_minutos: 840, sessoes: active ? 2 : 0, questoes_total: count, acertos: correct, erros: count - correct, acertos_pct: rate, topicos_total: 30, topicos_concluidos: 9, progresso_edital_pct: 30 },
    dias: [{ data: inicio, minutos_planejados: active ? 120 : 0, minutos_estudados: active ? 30 : 0, questoes_total: hasQuestions ? 1 : 0, acertos: correct, acertos_pct: hasQuestions ? correct * 100 : null }, { data: fim, minutos_planejados: active ? 60 : 0, minutos_estudados: active ? 120 : 0, questoes_total: hasQuestions ? 9 : 0, acertos: 0, acertos_pct: hasQuestions ? 0 : null }],
    disciplinas: rows, plano_hoje: active ? [{ id: id(8), fonte: "bloco_semanal", bloco_cronograma_id: id(8), disciplina_id: disciplines[0].id, disciplina_nome: disciplines[0].nome, topico_id: null, topico_nome: "Direitos fundamentais", data: today, hora_inicio: "08:00", hora_fim: "09:00", duracao_minutos: 60, status: "concluida" }, { id: id(9), fonte: "cronograma_item", bloco_cronograma_id: id(10), disciplina_id: disciplines[1].id, disciplina_nome: disciplines[1].nome, topico_id: null, topico_nome: null, data: today, hora_inicio: "22:00", hora_fim: "23:00", duracao_minutos: 60, status: "planejada" }] : [] };
}

try {
  for (const profile of selectedProfiles) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const errors = [];
    const requests = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewport({ width: profile.width, height: profile.height });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.evaluateOnNewDocument(({ contestId, theme }) => {
      localStorage.setItem("aprovingo-auth", JSON.stringify({ state: { accessToken: "qa-mock", refreshToken: "qa-mock", user: { id: "qa-user", name: "QA", email: "qa@example.invalid", daily_goal_hours: 2, role: "user", status: "ativo" } }, version: 4 }));
      localStorage.setItem("cf-concurso-ativo", JSON.stringify({ state: { concursoAtivoId: contestId }, version: 0 }));
      localStorage.setItem("theme", theme);
    }, { contestId: contest.id, theme: profile.theme });
    await page.setRequestInterception(true);
    page.on("request", async request => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/api/v1/")) return url.origin === new URL(baseUrl).origin ? request.continue() : request.abort();
      const path = url.pathname.replace("/api/v1", "");
      requests.push({ method: request.method(), path, query: Object.fromEntries(url.searchParams) });
      if (path === "/concursos") return request.respond(json([contest,secondContest]));
      if (path === "/disciplinas") return request.respond(json(disciplines));
      if (path === "/dashboard/analise") return request.respond(profile.scenario === "error" ? json({ detail: "Falha QA simulada" }, 503) : json(analysis(url, url.searchParams.get('concurso_id')===secondContest.id?'empty':profile.scenario)));
      if (path === "/dashboard/resumo") return request.respond(json({ horas_hoje: 2.5, meta_horas: 2, horas_semana: 2.5, sessoes_semana: 2, questoes_semana: 10, rendimento_medio: 10, avisos_proximos: 0, flashcards_para_revisar: 3, streak_dias: 2, taxa_cumprimento_mes: 50, minutos_planejados_mes: 300, minutos_realizados_mes: 150 }));
      if (path === "/dashboard/proximo-estudo") return request.respond(json(profile.scenario === "empty" ? null : { item_id: id(9), fonte: "cronograma_item", concurso_id: contest.id, disciplina_id: disciplines[1].id, disciplina_nome: disciplines[1].nome, topico_id: null, topico_nome: null, data: today, duracao_minutos: 60, sessoes_recentes: 0 }));
      if (path === "/dashboard/revisoes-pendentes") return request.respond(json({ total: 0, items: [] }));
      if (path === "/dashboard/heatmap") return request.respond(json(profile.scenario === "empty" ? [] : [{ date: today, count: 2, minutes: 150 }]));
      if (path === "/cronograma/calendario") return request.respond(json({ ano: Number(url.searchParams.get("ano")), mes: Number(url.searchParams.get("mes")), timezone: "America/Sao_Paulo", resumo_mes: { dias_com_planejamento: 1, dias_cumpridos: 0, dias_parciais: 1, dias_nao_cumpridos: 0, dias_estudou_sem_plano: 0, minutos_planejados: 180, minutos_realizados: 150, taxa_cumprimento_pct: 83.3 }, dias: [] }));
      if (path.includes("/calendario/dia")) return request.respond(json({ data: today, status: "parcial", totais: { planejados: 180, realizados: 150 }, planejado: [], realizado: [] }));
      if (path === "/notifications/unread-count") return request.respond(json({ count: 0 }));
      if (path === "/telemetry/preference") return request.respond(json({ opted_out: true }));
      return request.respond(json([]));
    });
    try {
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle2" });
      await page.waitForFunction(name => document.querySelector("main")?.textContent?.includes(name), {}, contest.nome);
      await page.waitForFunction(() => document.body.innerText.includes("Tempo estudado") || document.body.innerText.includes("Tentar novamente"));
      const audit = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, text: document.querySelector("main")?.innerText ?? "", dark: document.documentElement.classList.contains("dark"), charts: document.querySelectorAll(".recharts-wrapper").length }));
      assert.equal(audit.overflow, false, "overflow horizontal");
      assert.equal(audit.dark, profile.theme === "dark");
      assert.equal(errors.length, 0, errors.join("; "));
      if (profile.scenario === "data") { assert.ok(audit.text.includes("2h 30min"), "KPI duração real"); assert.ok(/10[,\.]0%/.test(audit.text), "taxa ponderada"); }
      if (profile.scenario === "empty") assert.ok(audit.text.includes("Sem dados"), "taxa sem denominador");
      if (profile.scenario === "zero") assert.ok(/0[,\.]0%/.test(audit.text), "zero acertos real");
      if (profile.scenario === "error") assert.ok(audit.text.includes("Tentar novamente"), "retry após erro");
      assert.ok(requests.filter(r => r.path === "/dashboard/analise").every(r => r.query.concurso_id === contest.id));
      assert.ok(requests.filter(r => r.path === "/dashboard/heatmap").every(r => r.query.concurso_id === contest.id));
      const alignment=await page.evaluate(()=>['actions','daily','disciplines','tracking','complementary'].map(name=>{
        const row=document.querySelector(`[data-dashboard-row="${name}"]`);
        const cards=row?[...row.children].filter(e=>e.matches('[data-slot="card"],section[aria-labelledby]')):[];
        return {name,boxes:cards.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};})};
      }));
      for(const group of alignment){
        if(profile.scenario==='error'&&['daily','disciplines'].includes(group.name))continue;
        assert.equal(group.boxes.length,group.name==='complementary'?3:2,`cards found ${group.name}`);
        if(profile.width>=1280){
          assert.ok(Math.max(...group.boxes.map(b=>b.top))-Math.min(...group.boxes.map(b=>b.top))<=2,`top ${group.name}`);
          assert.ok(Math.max(...group.boxes.map(b=>b.bottom))-Math.min(...group.boxes.map(b=>b.bottom))<=2,`bottom ${group.name}`);
        }
      }
      await page.evaluate(()=>document.querySelector('main').scrollTop=0);
      await page.screenshot({ path: fileURLToPath(new URL(`${profile.name}-top.png`, output)), fullPage: true });
      await page.evaluate(()=>{document.querySelector('[data-dashboard-row="daily"]')?.scrollIntoView({block:'start'});});
      await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-charts.png`,output))});
      await page.evaluate(()=>{document.querySelector('[data-dashboard-row="disciplines"]')?.scrollIntoView({block:'start'});});
      await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-disciplines.png`,output))});
      await page.evaluate(()=>{document.querySelector('[data-dashboard-row="tracking"]')?.scrollIntoView({block:'start'});});
      await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-calendar.png`,output))});
      await page.evaluate(()=>{document.querySelector('main').scrollTop=100000;});
      await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-bottom.png`,output))});
      let menu=null;
      if(profile.width<768){await page.click('[aria-label="Abrir menu"]');await page.waitForFunction(()=>document.querySelector('#app-sidebar')?.getBoundingClientRect().left>=0);}
      const trigger=await page.$('#app-sidebar button[aria-haspopup="listbox"]');
      if(trigger){
        await trigger.click();await page.waitForSelector('[role="listbox"]');
        menu=await page.evaluate(()=>{const e=document.querySelector('[role="listbox"]');const s=getComputedStyle(e.closest('[data-slot="popover-content"]'));return {bg:s.backgroundColor,color:s.color,selected:e.querySelector('[aria-selected="true"]')?.textContent,bounds:{left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}};});
        assert.ok(menu.bounds.left>=0&&menu.bounds.right<=profile.width+1,'menu outside viewport');
        await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-menu-open.png`,output))});
        const option=await page.$('[role="option"]:last-child');if(option)await option.hover();
        await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-menu-hover.png`,output))});
        await trigger.focus();await page.keyboard.press('ArrowDown');
        await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-menu-keyboard.png`,output))});
        await page.keyboard.press('Escape');
        await page.waitForFunction(()=>!document.querySelector('[role="listbox"]'));
        if(profile.width<768)assert.equal(await page.$eval('#app-sidebar',e=>e.getAttribute('aria-hidden')),'false','Escape closes menu while preserving drawer');
        if(profile.scenario==='data') {
          if(profile.width>=768){
            await page.click('[aria-label="Recolher menu"]');
            await page.waitForFunction(()=>document.querySelector('#app-sidebar').getBoundingClientRect().width<=73);
          }
          await page.click('#app-sidebar button[aria-haspopup="listbox"]');
          await page.waitForSelector('[role="listbox"]');
          const bounds=await page.$eval('[data-slot="popover-content"]',e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}));
          assert.ok(bounds.left>=0&&bounds.right<=profile.width,'collapsed/drawer portal fits viewport');
          await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-menu-compact.png`,output))});
          await page.focus('#app-sidebar button[aria-haspopup="listbox"]');
          await page.keyboard.press('Tab');
          assert.ok(await page.evaluate(()=>document.activeElement?.textContent.includes('Gerenciar concursos')),'Tab reaches portal management action');
          await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');
          await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
          await page.waitForFunction(()=>document.querySelector('main h1')?.textContent.includes('Concurso QA sem registros'));
          assert.equal(await page.$('[role="listbox"]'),null,'selection closes the menu');
        }
      }
      results.push({ profile: profile.name, passed: true, overflow: audit.overflow, charts: audit.charts, errors, requests, alignment, menu });
    } catch (error) {
      await page.screenshot({ path: fileURLToPath(new URL(`${profile.name}-failure.png`, output)), fullPage: true });
      results.push({ profile: profile.name, passed: false, error: error.message, errors, requests });
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await writeFile(new URL(process.env.QA_LAYOUT_PROFILES?"targeted-results.json":"smoke-results.json", output), JSON.stringify({ mocked: true, productionWrites: false, results }, null, 2));
}
console.log(JSON.stringify({ mocked: true, profiles: results.map(({ profile, passed, error }) => ({ profile, passed, error })) }, null, 2));
if (results.some(r => !r.passed)) process.exitCode = 1;
