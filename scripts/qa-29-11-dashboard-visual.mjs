import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

// Somente localhost e respostas interceptadas: não faz login nem escreve em banco real.
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname));
const v2 = process.env.QA_VARIANT === "v2";
const output = new URL(v2 ? "../docs/qa/dashboard-v2/" : "../docs/qa/dashboard-29-11/", import.meta.url);
await mkdir(output, { recursive: true });
const id = index => `29110000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const contest = { id: id(1), nome: "Concurso QA Dashboard", orgao: "Órgão QA", cargo: "Analista", data_prova: null };
const secondContest = {...contest,id:id(20),nome:'Concurso QA sem registros',orgao:'Outro órgão QA'};
const names = ["Direito Constitucional e Administrativo com identificação longa", "Língua Portuguesa", "Banco de Dados"];
const disciplines = names.map((nome, index) => ({ id: id(index + 2), nome, concurso_ids: [contest.id], topicos_total: 10, topicos_estudados: index * 3 }));
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const json = (data, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(data) });
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const results = [];
const profiles = [
  { name: "desktop-light", width: 1440, height: 900, theme: "light", scenario: "data" },
  { name: "desktop-dark", width: 1440, height: 900, theme: "dark", scenario: "data" },
  { name: "tablet-light", width: 768, height: 1024, theme: "light", scenario: "data" },
  { name: "mobile-light", width: 375, height: 812, theme: "light", scenario: "data" },
  { name: "mobile-dark", width: 375, height: 812, theme: "dark", scenario: "data" },
  { name: "desktop-empty", width: 1440, height: 900, theme: "light", scenario: "empty" },
  { name: "desktop-zero-rate", width: 1440, height: 900, theme: "light", scenario: "zero" },
  { name: "desktop-error", width: 1440, height: 900, theme: "light", scenario: "error" },
];
if (v2) {
  profiles.push(...[320,390,430,1024,1920].flatMap(width=>['light','dark'].map(theme=>({name:`v2-${width}-${theme}`,width,height:1000,theme,scenario:'data'}))));
  profiles.push({name:'v2-mobile-empty',width:320,height:1000,theme:'light',scenario:'empty'});
}

function analysis(url, scenario) {
  const inicio = url.searchParams.get("inicio");
  const fim = url.searchParams.get("fim");
  const active = scenario !== "empty";
  const minutes = active ? 150 : 0;
  const count = active ? 10 : 0;
  const correct = scenario === "data" ? 1 : 0;
  const rate = count ? correct / count * 100 : null;
  const rows = disciplines.map((d, index) => ({ id: d.id, nome: d.nome, topicos_total: 10, topicos_concluidos: index * 3, progresso_pct: index * 30, minutos_estudados: active ? [30, 60, 60][index] : 0, participacao_tempo_pct: active ? [20, 40, 40][index] : 0 }));
  return { inicio, fim, timezone: "America/Sao_Paulo", totais: { minutos_planejados: active ? 180 : 0, minutos_estudados: minutes, meta_periodo_minutos: 840, sessoes: active ? 2 : 0, questoes_total: count, acertos: correct, erros: count - correct, acertos_pct: rate, topicos_total: 30, topicos_concluidos: 9, progresso_edital_pct: 30 },
    dias: [{ data: inicio, minutos_planejados: active ? 120 : 0, minutos_estudados: active ? 30 : 0, questoes_total: active ? 1 : 0, acertos: correct, acertos_pct: active ? correct * 100 : null }, ...(v2?[{data:inicio.slice(0,8)+String(Number(inicio.slice(8))+1).padStart(2,'0'),minutos_planejados:0,minutos_estudados:0,questoes_total:0,acertos:0,acertos_pct:0}]:[]), { data: fim, minutos_planejados: active ? 60 : 0, minutos_estudados: active ? 120 : 0, questoes_total: active ? 9 : 0, acertos: 0, acertos_pct: active ? 0 : null }],
    disciplinas: rows, plano_hoje: active ? [{ id: id(8), fonte: "bloco_semanal", bloco_cronograma_id: id(8), disciplina_id: disciplines[0].id, disciplina_nome: disciplines[0].nome, topico_id: null, topico_nome: "Direitos fundamentais", data: today, hora_inicio: "08:00", hora_fim: "09:00", duracao_minutos: 60, status: "concluida" }, { id: id(9), fonte: "cronograma_item", bloco_cronograma_id: id(10), disciplina_id: disciplines[1].id, disciplina_nome: disciplines[1].nome, topico_id: null, topico_nome: null, data: today, hora_inicio: "22:00", hora_fim: "23:00", duracao_minutos: 60, status: "planejada" }] : [] };
}

try {
  for (const profile of profiles) {
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
      if (path === "/cronograma/calendario") return request.respond(json({ ano: Number(url.searchParams.get("ano")), mes: Number(url.searchParams.get("mes")), timezone: "America/Sao_Paulo", resumo_mes: { dias_com_planejamento: 1, dias_cumpridos: 0, dias_parciais: 1, dias_nao_cumpridos: 0, dias_estudou_sem_plano: 0, minutos_planejados: 180, minutos_realizados: 150, taxa_cumprimento_pct: 83.3 }, dias: v2&&profile.scenario!=='empty'?[{data:`${url.searchParams.get('ano')}-${String(url.searchParams.get('mes')).padStart(2,'0')}-15`,status:'parcial',minutos_planejados:60,minutos_realizados:30,minutos_extra:0,sessoes_realizadas:1,planejado:[{id:id(50),fonte:'cronograma_item',disciplina_id:disciplines[0].id,disciplina_nome:disciplines[0].nome,topico_id:null,topico_nome:'Direitos fundamentais',duracao_minutos:60,modo:'revisao'}]}]:[] }));
      if (path.includes("/calendario/dia") || path.includes('/sessoes-estudo/dia/')) return request.respond(json({ data: today, status: "parcial", totais: { planejados: 180, realizados: 150 }, planejado: [], realizado: [] }));
      if (path === "/notifications/unread-count") return request.respond(json({ count: 0 }));
      if (path === "/telemetry/preference") return request.respond(json({ opted_out: true }));
      return request.respond(json([]));
    });
    try {
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle2" });
      await page.waitForFunction(name => document.querySelector("main")?.textContent?.includes(name), {}, contest.nome);
      await page.waitForFunction(() => document.body.innerText.includes("Tempo estudado") || document.body.innerText.includes("Tentar novamente"));
      const audit = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1 || document.querySelector('main').scrollWidth > document.querySelector('main').clientWidth+1, text: document.querySelector("main")?.innerText ?? "", dark: document.documentElement.classList.contains("dark"), charts: document.querySelectorAll(".recharts-wrapper").length, kpis: document.querySelector('[aria-label="Indicadores de desempenho"]') ? getComputedStyle(document.querySelector('[aria-label="Indicadores de desempenho"]')).gridTemplateColumns.split(' ').length : null }));
      assert.equal(audit.overflow, false, "overflow horizontal");
      assert.equal(audit.dark, profile.theme === "dark");
      assert.equal(errors.length, 0, errors.join("; "));
      if (profile.scenario === "data") { assert.ok(audit.text.includes("2h 30min"), "KPI duração real"); assert.ok(/10[,\.]0%/.test(audit.text), "taxa ponderada"); }
      if (profile.scenario === "empty") assert.ok(audit.text.includes("Sem dados"), "taxa sem denominador");
      if (profile.scenario === "zero") assert.ok(/0[,\.]0%/.test(audit.text), "zero acertos real");
      if (profile.scenario === "error") assert.ok(audit.text.includes("Tentar novamente"), "retry após erro");
      if(v2&&profile.scenario!=='error') assert.equal(audit.kpis,profile.width>=1024?4:2);
      if(v2&&profile.width>=1024&&profile.scenario!=='error') {
        const rows=await page.evaluate(()=>['actions','daily','disciplines','complementary','tracking'].map(name=>{
          const cards=[...document.querySelector(`[data-dashboard-row="${name}"]`)?.children??[]].filter(node=>node.matches('[data-slot="card"]')).slice(0,name==='complementary'?3:2);
          return {name,rects:cards.map(node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom};})};
        }));
        for(const row of rows) for(const rect of row.rects.slice(1)) {
          assert.ok(Math.abs(rect.top-row.rects[0].top)<=1,`${row.name}: topo dos cards`);
          assert.ok(Math.abs(rect.bottom-row.rects[0].bottom)<=1,`${row.name}: base dos cards`);
        }
      }
      assert.ok(requests.filter(r => r.path === "/dashboard/analise").every(r => r.query.concurso_id === contest.id));
      assert.ok(requests.filter(r => r.path === "/dashboard/heatmap").every(r => r.query.concurso_id === contest.id));
      await page.screenshot({ path: fileURLToPath(new URL(`${profile.name}.png`, output)) });
      if(v2) {
        await page.evaluate(()=>document.querySelector('[data-dashboard-row="actions"]')?.scrollIntoView({block:'start'}));
        await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-actions.png`,output))});
      }
      if(v2&&profile.scenario==='data') {
        const bars=await page.$$eval('.study-progress-track',nodes=>nodes.map(node=>({fill:parseFloat(node.style.getPropertyValue('--study-fill'))})));
        assert.equal(bars[0].fill,25);
        assert.equal(bars.at(-1).fill,100);
        assert.ok(audit.text.includes('200%'),'cumprimento superior a 100% preservado');
      }
      if(profile.name==='desktop-light') {
        const href=await page.evaluate(()=>[...document.querySelectorAll('a')].find(e=>e.textContent.includes('Iniciar estudo'))?.getAttribute('href'));
        assert.ok(href?.includes(`item_id=${id(9)}`)&&href.includes(`data_referencia=${today}`),'vínculo da próxima sessão');
        await page.click('[aria-label="Período do dashboard"]');
        await page.evaluate(()=>[...document.querySelectorAll('[role="option"]')].find(e=>e.textContent==='Este mês')?.click());
        await page.waitForNetworkIdle({idleTime:200,timeout:10000});
        const monthly=requests.filter(r=>r.path==='/dashboard/analise').at(-1);
        assert.equal(monthly.query.inicio,today.slice(0,7)+'-01','início do mês civil');
        const beforeCalendar=requests.filter(r=>r.path==='/dashboard/analise').length;
        const heatmapRequests=requests.filter(r=>r.path==='/dashboard/heatmap').length;
        await page.click('[aria-label="Próximo mês"]');
        await page.waitForNetworkIdle({idleTime:200,timeout:10000});
        assert.equal(requests.filter(r=>r.path==='/dashboard/analise').length,beforeCalendar,'calendário independente dos gráficos');
        assert.equal(requests.filter(r=>r.path==='/dashboard/heatmap').length,heatmapRequests,'histórico de 16 semanas independente do calendário');
        await page.evaluate(()=>[...document.querySelectorAll('button')].find(e=>e.textContent==='Registrar manualmente')?.click());
        await page.waitForSelector('[role="dialog"]');
        await page.keyboard.press('Escape');
        await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'));
        await page.click('#app-sidebar button[aria-haspopup="listbox"]');
        await page.waitForSelector('[role="listbox"]');
        await page.evaluate(()=>[...document.querySelectorAll('[role="option"]')].find(e=>e.textContent.includes('Outro órgão QA'))?.click());
        await page.waitForFunction(()=>document.querySelector('main h1')?.textContent.includes('Concurso QA sem registros'));
        await page.waitForNetworkIdle({idleTime:200,timeout:10000});
        assert.equal(requests.filter(r=>r.path==='/dashboard/analise').at(-1).query.concurso_id,secondContest.id);
        assert.ok(await page.evaluate(()=>document.querySelector('main')?.textContent.includes('0 min')&&document.querySelector('main')?.textContent.includes('Sem dados')),'novo concurso não conserva valores anteriores');
      }
      await page.evaluate(()=>document.querySelector('[data-dashboard-row="daily"]')?.scrollIntoView({block:'start'}));
      await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-charts.png`,output))});
      if(v2) {
        await page.evaluate(()=>document.querySelector('[data-dashboard-row="disciplines"]')?.scrollIntoView({block:'start'}));
        await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-disciplines.png`,output))});
      }
      await page.evaluate(()=>document.querySelector('[data-dashboard-row="tracking"]')?.scrollIntoView({block:'start'}));
      await page.screenshot({path:fileURLToPath(new URL(`${profile.name}-calendar.png`,output))});
      results.push({ profile: profile.name, passed: true, overflow: audit.overflow, charts: audit.charts, errors, requests });
    } catch (error) {
      await page.screenshot({ path: fileURLToPath(new URL(`${profile.name}-failure.png`, output)), fullPage: true });
      results.push({ profile: profile.name, passed: false, error: error.message, errors, requests });
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await writeFile(new URL("smoke-results.json", output), JSON.stringify({ mocked: true, productionWrites: false, results }, null, 2));
}
console.log(JSON.stringify({ mocked: true, profiles: results.map(({ profile, passed, error }) => ({ profile, passed, error })) }, null, 2));
if (results.some(r => !r.passed)) process.exitCode = 1;
