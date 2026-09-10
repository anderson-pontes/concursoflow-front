import puppeteer from "puppeteer";

const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000";
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const contestId = "30000000-0000-4000-8000-000000000001";
const secondContestId = "30000000-0000-4000-8000-000000000021";
const disciplineId = "30000000-0000-4000-8000-000000000002";
const topicId = "30000000-0000-4000-8000-000000000003";
const requests = [];
const contextRequests = [];

const items = {
  hoje: [
    review("30000000-0000-4000-8000-000000000011", "Revisão pelo Pomodoro", 0),
    review("30000000-0000-4000-8000-000000000012", "Conclusão manual", 0),
    review("30000000-0000-4000-8000-000000000013", "Reagendamento", 0),
  ],
  atrasadas: [review("30000000-0000-4000-8000-000000000014", "Revisão atrasada", 2)],
  proximas: [],
  concluidas: [review("30000000-0000-4000-8000-000000000015", "Revisão concluída", 0, "concluida")],
  ignoradas: [review("30000000-0000-4000-8000-000000000016", "Revisão ignorada", 0, "ignorada")],
};

function review(id, topicoNome, diasAtraso, status = "pendente") {
  return {
    id,
    versao: 1,
    concurso_id: contestId,
    disciplina_id: disciplineId,
    disciplina_nome: "Disciplina QA",
    topico_id: `${topicId.slice(0, -2)}${id.slice(-2)}`,
    topico_nome: topicoNome,
    origem_tipo: "ciclo_topico",
    origem_sessao_id: null,
    regra_versao: "topico-cycle-v1",
    ciclo_indice: 0,
    intervalo_dias: 1,
    data_prevista_original: today,
    data_prevista_atual: diasAtraso > 0 ? new Date(Date.now() - diasAtraso * 86400000).toISOString().slice(0, 10) : today,
    timezone: "America/Sao_Paulo",
    status,
    ultima_transicao_em: new Date().toISOString(),
  };
}

function json(body, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify(body) };
}

function removeItem(id) {
  for (const group of Object.values(items)) {
    const index = group.findIndex((item) => item.id === id);
    if (index >= 0) return group.splice(index, 1)[0];
  }
  return null;
}

async function clickText(page, text, selector = "button") {
  const clicked = await page.evaluate((label, target) => {
    const node = [...document.querySelectorAll(target)].find((element) => element.textContent?.trim().includes(label));
    if (!node) return false;
    node.click();
    return true;
  }, text, selector);
  if (!clicked) throw new Error(`Controle não encontrado: ${text}`);
}

async function openCardMenu(page, topicName) {
  const button = await page.$(`button[aria-label="Mais ações para ${topicName}"]`);
  if (!button) throw new Error(`Menu não encontrado para ${topicName}`);
  await button.click();
  await page.waitForSelector('[role="menu"]');
}

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const failures = [];
const authSnapshot = JSON.stringify({
  state: {
    accessToken: "qa-local-token",
    refreshToken: "qa-local-refresh-token",
    user: {
      id: "30000000-0000-4000-8000-000000000099",
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
let stage = "bootstrap";
let activePage = null;

try {
  const page = await browser.newPage();
  activePage = page;
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate((auth, concursoId) => {
    localStorage.setItem("aprovingo-auth", auth);
    localStorage.setItem("aprovingo-concurso", JSON.stringify({ state: { concursoAtivoId: concursoId }, version: 0 }));
  }, authSnapshot, contestId);
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    const url = new URL(request.url());
    if (!url.pathname.startsWith("/api/v1/")) return request.continue();
    const path = url.pathname.replace(/^\/api\/v1/, "");
    if (request.method() === "GET" && path === "/concursos") return request.respond(json([
      { id: contestId, nome: "Concurso QA", orgao: "Órgão QA", cargo: "Cargo QA", data_prova: null },
      { id: secondContestId, nome: "Concurso B", orgao: "Órgão B", cargo: "Cargo B", data_prova: null },
    ]));
    if (request.method() === "GET" && path === "/disciplinas") return request.respond(json([{ id: disciplineId, nome: "Disciplina QA", concurso_ids: [contestId] }]));
    if (request.method() === "GET" && path.startsWith(`/disciplinas/${disciplineId}/topicos`)) return request.respond(json(Object.values(items).flat().map((item) => ({ id: item.topico_id, descricao: item.topico_nome }))));
    if (request.method() === "GET" && path === "/revisoes") {
      const group = url.searchParams.get("grupo") || "hoje";
      const requestedContestId = url.searchParams.get("concurso_id");
      contextRequests.push(requestedContestId);
      if (requestedContestId === secondContestId) {
        const contextItem = {
          ...review("30000000-0000-4000-8000-000000000022", "Contexto do concurso B", 0),
          concurso_id: secondContestId,
          disciplina_nome: "Disciplina B",
        };
        return request.respond(json({
          grupo: group,
          items: group === "hoje" ? [contextItem] : [],
          next_cursor: null,
          has_more: false,
          limit: 20,
        }));
      }
      const rows = items[group] || [];
      return request.respond(json({ grupo: group, items: rows, next_cursor: null, has_more: false, limit: 20 }));
    }
    if (request.method() === "POST" && /^\/revisoes\/.+\/(concluir|reagendar|ignorar)$/.test(path)) {
      const [, id, action] = path.match(/^\/revisoes\/(.+)\/(concluir|reagendar|ignorar)$/);
      const source = removeItem(id);
      requests.push({ action, idempotency: request.headers()["idempotency-key"], body: JSON.parse(request.postData() || "{}") });
      if (source) {
        source.versao += 1;
        source.status = action === "concluir" ? "concluida" : action === "ignorar" ? "ignorada" : "pendente";
        if (action === "reagendar") source.data_prevista_atual = tomorrow;
        items[action === "concluir" ? "concluidas" : action === "ignorar" ? "ignoradas" : "proximas"].push(source);
      }
      return request.respond(json({ id, concurso_id: contestId, status: source?.status || "pendente", versao: 2, data_prevista_original: today, data_prevista_atual: source?.data_prevista_atual || today, conclusao_sessao_id: action === "concluir" ? "session-qa" : null, transicao: { tipo: action === "concluir" ? "concluida" : action === "ignorar" ? "ignorada" : "reagendada", ocorrido_em: new Date().toISOString() }, idempotency_replayed: false }));
    }
    if (path.includes("pomodoro-config")) return request.respond(json({}));
    if (path === "/telemetry/preference") return request.respond(json({ opted_out: true }));
    if (path === "/notifications/unread-count") return request.respond(json({ unread_count: 0 }));
    return request.respond(json({}));
  });

  stage = "central-inicial";
  await page.goto(`${baseUrl}/revisoes?grupo=hoje`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector("main h1");
  const initial = await page.evaluate(() => ({
    title: document.querySelector("main h1")?.textContent,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  if (!initial.title?.includes("Central de revisões") || initial.overflow) failures.push({ step: "initial", initial });

  stage = "reagendar";
  await openCardMenu(page, "Reagendamento");
  const openTopicHref = await page.$eval('[role="menu"] a', (node) => node.getAttribute("href"));
  if (!openTopicHref?.startsWith(`/disciplinas/${disciplineId}?topico=`)) failures.push({ step: "open-topic", openTopicHref });
  await clickText(page, "Reagendar", '[role="menuitem"]');
  await page.click('[aria-label="Nova data da revisão"]');
  await page.waitForSelector(`[data-day="${tomorrow}"]`);
  await page.click(`[data-day="${tomorrow}"]`);
  await clickText(page, "Confirmar reagendamento");
  await page.waitForFunction(() => !document.body.innerText.includes("Reagendamento"));

  stage = "concluir-manual";
  await openCardMenu(page, "Conclusão manual");
  await clickText(page, "Registrar conclusão", '[role="menuitem"]');
  await clickText(page, "Registrar conclusão");
  await page.waitForFunction(() => !document.body.innerText.includes("Conclusão manual"));

  stage = "ignorar";
  await page.goto(`${baseUrl}/revisoes?grupo=atrasadas`, { waitUntil: "networkidle2" });
  await openCardMenu(page, "Revisão atrasada");
  await clickText(page, "Ignorar revisão", '[role="menuitem"]');
  await clickText(page, "Ignorar revisão");
  await page.waitForFunction(() => !document.body.innerText.includes("Revisão atrasada"));

  stage = "pomodoro-launch";
  await page.goto(`${baseUrl}/revisoes?grupo=hoje`, { waitUntil: "networkidle2" });
  await clickText(page, "Iniciar revisão");
  await page.waitForFunction(() => location.pathname === "/pomodoro", { timeout: 30000 });
  stage = "pomodoro-bootstrap";
  await page.waitForFunction(() => document.body.innerText.includes("Iniciar sessão"), { timeout: 30000 });
  await clickText(page, "Iniciar sessão");
  stage = "pomodoro-concluir";
  await clickText(page, "Concluir revisão");
  await page.waitForFunction(() => location.pathname === "/revisoes", { timeout: 30000 });

  stage = "troca-concurso";
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${baseUrl}/revisoes?grupo=hoje`, { waitUntil: "networkidle2" });
  await page.click('button[aria-haspopup="listbox"]');
  await page.waitForSelector('[role="listbox"]');
  const switched = await page.evaluate(() => {
    const option = [...document.querySelectorAll('[role="option"]')]
      .find((element) => element.textContent?.includes("Concurso B"));
    if (!option) return false;
    option.click();
    return true;
  });
  if (!switched) throw new Error("Opção do segundo concurso não encontrada.");
  await page.waitForFunction(() => document.body.innerText.includes("Contexto do concurso B"));
  const lastContextRequest = contextRequests.at(-1);
  if (lastContextRequest !== secondContestId) {
    failures.push({ step: "troca-concurso", lastContextRequest });
  }

  const actions = requests.map((entry) => entry.action).sort();
  if (JSON.stringify(actions) !== JSON.stringify(["concluir", "concluir", "ignorar", "reagendar"])) failures.push({ step: "actions", actions });
  if (requests.some((entry) => !entry.idempotency || !entry.body.versao_esperada)) failures.push({ step: "idempotency", requests });
  await page.close();
} catch (error) {
  failures.push({
    step: "runtime",
    stage,
    error: String(error),
    url: activePage && !activePage.isClosed() ? activePage.url() : null,
    text: activePage && !activePage.isClosed()
      ? (await activePage.evaluate(() => document.body.innerText.slice(0, 500)).catch(() => ""))
      : "",
  });
} finally {
  await browser.close();
}

console.log(JSON.stringify({ passed: failures.length === 0, actions: requests.map((entry) => entry.action), failures }, null, 2));
if (failures.length) process.exitCode = 1;
