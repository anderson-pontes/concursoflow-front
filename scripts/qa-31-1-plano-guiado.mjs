import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3012";
const output = new URL("../../../docs/qa/31.1-plano-guiado/", import.meta.url);
await mkdir(output, { recursive: true });
const uid = "50000000-0000-4000-8000-000000000099";
const cid = "50000000-0000-4000-8000-000000000001";
const pid = "50000000-0000-4000-8000-000000000002";
const user = { id: uid, name: "Pessoa QA", email: "qa@example.invalid", role: "user", status: "ativo", daily_goal_hours: 2 };
const config = { tipo: "semanal", disponibilidade_minutos: { 0: 180, 2: 120 }, sessao_min_minutos: 30, sessao_max_minutos: 90, data_inicio: "2026-11-09", data_fim: "2026-11-15" };
const subjects = [{ nome: "Português", topicos: ["Interpretação de textos"], ativa: true, peso: 5, conhecimento: "regular", ordem: 0 }];
const draft = { schemaVersion: 1, userScope: uid, updatedAt: new Date().toISOString(), idempotencyKey: "qa-guided-31-1", step: 4, tipo: "personalizado", busca: "", editalId: null, versionId: null, cargoId: null, nome: "Concurso de auditor", orgao: "Órgão QA", cargoNome: "Analista", banca: "", dataProva: "2026-12-01", observacoes: "", disciplinas: subjects, config };
const preview = { sessoes: [0, 1, 2, 3, 4].map(i => ({ disciplina_id: null, disciplina_nome: "Português", data: i < 3 ? "2026-11-09" : "2026-11-11", dia_semana: i < 3 ? 0 : 2, duracao_minutos: 60, ordem: i + 1 })), minutos_totais: 300, carga_semanal_minutos: 300, prioridades: { Português: 15 }, preview_fingerprint: "a".repeat(64), explicacao: { versao_contrato: 1, algoritmo_versao: "planejamento-v1", confirmavel: true, capacidade: { capacidade_informada_minutos: 300, capacidade_planejavel_minutos: 300, carga_alocada_minutos: 300, saldo_nao_planejavel_minutos: 0, dias_disponiveis: 2, dias_utilizados: 2, encaixe_calendario: "viavel", cobertura_edital: "indeterminada_sem_estimativa_esforco" }, disciplinas: [{ disciplina_id: null, disciplina_nome: "Português", peso: 5, conhecimento: "regular", fator_conhecimento: 3, prioridade: 15, minutos_alocados: 300, sessoes: 5, dias_utilizados: 2, participacao_bps: 10000 }], alertas: ["COBERTURA_EDITAL_NAO_MENSURAVEL"] } };
const browser = await puppeteer.launch({ headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 1000 });
    await page.evaluateOnNewDocument(({ user, draft, uid }) => {
      localStorage.setItem("aprovingo-auth", JSON.stringify({ state: { accessToken: "qa-local", refreshToken: "qa-local", user }, version: 4 }));
      localStorage.setItem(`clickedital:onboarding-draft:v1:${uid}`, JSON.stringify(draft));
    }, { user, draft, uid });
    let confirmed = false, submissions = 0;
    const errors = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.setRequestInterception(true);
    page.on("request", request => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/api/v1/")) return void request.continue();
      let data = [];
      if (url.pathname.endsWith("/auth/me")) data = user;
      else if (url.pathname.endsWith("/planejamento/preview")) data = preview;
      else if (url.pathname.endsWith("/planejamento/confirmar")) {
        submissions += 1;
        confirmed = true;
        data = { concurso_id: cid, cronograma_id: pid, criado: true, disciplinas_criadas: 1, topicos_criados: 1, sessoes_planejadas: 5, preview };
      } else if (url.pathname.endsWith("/concursos")) data = confirmed ? [{ id: cid, nome: draft.nome, orgao: draft.orgao, cargo: draft.cargoNome, status: "ativo", tipo_plano: "personalizado" }] : [];
      else if (url.pathname.endsWith("/telemetry/preference")) data = { opted_out: true };
      else if (url.pathname.endsWith("/notifications/unread-count")) data = { count: 0 };
      else if (url.pathname.endsWith("/cronograma/planejamento")) data = { id: pid, user_id: uid, concurso_id: cid, nome: draft.nome, cargo: draft.cargoNome, tipo: "automatico", ativo: true, data_inicio: config.data_inicio, data_fim: config.data_fim, dias_disponiveis: ["seg", "qua"], disciplinas: [] };
      void request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
    });
    async function click(text) {
      await page.waitForFunction(value => [...document.querySelectorAll("button")].some(el => el.textContent.trim() === value), {}, text);
      await page.evaluate(value => [...document.querySelectorAll("button")].find(el => el.textContent.trim() === value).click(), text);
    }
    await page.goto(`${base}/planos/novo`, { waitUntil: "networkidle0" });
    await click("Retomar rascunho");
    await click("Continuar");
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some(el => el.textContent.trim() === "Criar plano e gerar cronograma" && !el.disabled));
    await click("Criar plano e gerar cronograma");
    await page.waitForFunction(() => document.body.innerText.includes("Plano de estudos criado com sucesso!"));
    assert.equal(submissions, 1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, `Overflow at ${width}`);
    await page.screenshot({ path: new URL(`success-${width}.png`, output).pathname.replace(/^\/([A-Z]:)/, "$1"), fullPage: true });
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), "BUTTON");
    await click("Visualizar meu cronograma");
    await page.waitForFunction(() => location.pathname === "/cronograma");
    assert.equal(await page.evaluate(() => new URLSearchParams(location.search).get("inicio")), config.data_inicio);
    const selected = await page.evaluate(() => JSON.parse(localStorage.getItem("cf-concurso-ativo")).state.concursoAtivoId);
    assert.equal(selected, cid);
    assert.deepEqual(errors, []);
    console.log(`${width}px: success summary, no overflow, keyboard and correct contest navigation passed`);
    await page.close();
  }
} finally {
  await browser.close();
}
