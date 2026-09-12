import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const concursoId = "40000000-0000-4000-8000-000000000001";
const disciplinaId = "40000000-0000-4000-8000-000000000002";
const fingerprint = "b".repeat(64);
const authSnapshot = JSON.stringify({
  state: {
    accessToken: "qa-local-token",
    refreshToken: "qa-local-refresh-token",
    user: {
      id: "40000000-0000-4000-8000-000000000099",
      name: "Pessoa QA",
      email: "qa-local@example.invalid",
      avatar_url: null,
      daily_goal_hours: 2,
      role: "user",
      status: "ativo",
      created_at: new Date().toISOString(),
      cpf: null,
      phone: null,
      birth_date: null,
      address_cep: null,
      address_street: null,
      address_number: null,
      address_complement: null,
      address_neighborhood: null,
      address_city: null,
      address_state: null,
    },
  },
  version: 4,
});

const planejamento = {
  concurso_id: concursoId,
  nome: "Concurso explicável QA",
  orgao: "Órgão QA",
  cargo: "Analista QA",
  banca: "Banca QA",
  data_prova: null,
  observacoes: null,
  tipo_plano: "personalizado",
  disciplinas: [{
    disciplina_id: disciplinaId,
    nome: "Português",
    sigla: "POR",
    topicos: [],
    ativa: true,
    peso: 5,
    conhecimento: "regular",
    ordem: 0,
  }],
  planejamento: {
    tipo: "ciclo",
    disponibilidade_minutos: { 0: 60 },
    sessao_min_minutos: 30,
    sessao_max_minutos: 60,
    data_inicio: "2026-09-14",
    data_fim: "2026-09-14",
  },
};

const preview = {
  sessoes: [{ disciplina_id: disciplinaId, disciplina_nome: "Português", data: "2026-09-14", dia_semana: 0, duracao_minutos: 60, ordem: 1 }],
  minutos_totais: 60,
  carga_semanal_minutos: 60,
  prioridades: { Português: 15 },
  preview_fingerprint: fingerprint,
  explicacao: {
    versao_contrato: 1,
    algoritmo_versao: "planejamento-v1",
    confirmavel: true,
    capacidade: {
      capacidade_informada_minutos: 60,
      capacidade_planejavel_minutos: 60,
      carga_alocada_minutos: 60,
      saldo_nao_planejavel_minutos: 0,
      dias_disponiveis: 1,
      dias_utilizados: 1,
      encaixe_calendario: "viavel",
      cobertura_edital: "indeterminada_sem_estimativa_esforco",
    },
    disciplinas: [{
      disciplina_id: disciplinaId,
      disciplina_nome: "Português",
      peso: 5,
      conhecimento: "regular",
      fator_conhecimento: 3,
      prioridade: 15,
      minutos_alocados: 60,
      sessoes: 1,
      dias_utilizados: 1,
      participacao_bps: 10000,
    }],
    alertas: ["COBERTURA_EDITAL_NAO_MENSURAVEL"],
  },
};

function json(body, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify(body) };
}

async function clickButton(page, label) {
  await page.waitForFunction(
    (text) => [...document.querySelectorAll("button")].some((node) => node.textContent?.includes(text) && !node.disabled),
    { timeout: 15000 },
    label,
  );
  await page.evaluate(
    (text) => [...document.querySelectorAll("button")].find((node) => node.textContent?.includes(text) && !node.disabled)?.click(),
    label,
  );
}

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const failures = [];

try {
  for (const profile of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 375, height: 812 },
  ]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const errors = [];
    const fingerprints = [];
    let recalculations = 0;
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error"
        && !message.text().includes("favicon.ico")
        && !message.text().includes("409 (Conflict)")
      ) errors.push(message.text());
    });
    await page.setViewport({ width: profile.width, height: profile.height });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.evaluate((auth) => localStorage.setItem("aprovingo-auth", auth), authSnapshot);
    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/api/v1/")) return request.continue();
      if (request.method() === "GET" && url.pathname.endsWith(`/concursos/${concursoId}/planejamento`)) return request.respond(json(planejamento));
      if (request.method() === "POST" && url.pathname.endsWith("/concursos/planejamento/preview")) return request.respond(json(preview));
      if (request.method() === "POST" && url.pathname.endsWith(`/concursos/${concursoId}/planejamento/recalcular`)) {
        recalculations += 1;
        fingerprints.push(JSON.parse(request.postData() || "{}").preview_fingerprint);
        if (recalculations === 1) return request.respond(json({ detail: { code: "PLANEJAMENTO_PREVIEW_DESATUALIZADO" } }, 409));
        return request.respond(json({ concurso_id: concursoId, criado: false, disciplinas_criadas: 0, topicos_criados: 0, sessoes_planejadas: 1, preview }));
      }
      if (request.method() === "GET" && url.pathname.endsWith("/concursos")) return request.respond(json([]));
      if (request.method() === "GET" && url.pathname.endsWith("/notifications/unread-count")) return request.respond(json({ count: 0 }));
      if (request.method() === "GET" && url.pathname.endsWith("/telemetry/preference")) return request.respond(json({ opted_out: true }));
      if (request.method() === "POST" && url.pathname.endsWith("/telemetry/events")) return request.respond(json({ accepted: 0 }, 202));
      return request.respond(json({}));
    });

    try {
      await page.goto(`${baseUrl}/planos/${concursoId}/replanejar`, { waitUntil: "networkidle2", timeout: 60000 });
      await clickButton(page, "Gerar nova prévia");
      await page.waitForFunction(() => document.body.innerText.includes("Como seu plano foi distribuído"));
      const review = await page.evaluate(() => ({
        text: document.querySelector("main")?.textContent ?? "",
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }));
      if (!review.text.includes("Ainda não estimamos se esse tempo cobre todo o edital") || review.overflow) failures.push({ profile: profile.name, stage: "preview", review });

      await clickButton(page, "Aplicar replanejamento");
      await clickButton(page, "Confirmar e substituir futuros");
      await page.waitForFunction(() => document.body.innerText.includes("Seu plano mudou desde a prévia"));
      await clickButton(page, "Gerar nova prévia");
      await page.waitForFunction(() => document.body.innerText.includes("Como seu plano foi distribuído"));
      await clickButton(page, "Aplicar replanejamento");
      await clickButton(page, "Confirmar e substituir futuros");
      await page.waitForFunction(() => location.pathname === "/cronograma", { timeout: 15000 });

      if (recalculations !== 2 || fingerprints.some((value) => value !== fingerprint)) {
        failures.push({ profile: profile.name, stage: "fingerprint", recalculations, fingerprints });
      }
    } catch (error) {
      failures.push({ profile: profile.name, stage: "exception", error: String(error) });
    } finally {
      if (errors.length) failures.push({ profile: profile.name, stage: "console", errors });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ passed: failures.length === 0, failures }, null, 2));
if (failures.length) process.exitCode = 1;
