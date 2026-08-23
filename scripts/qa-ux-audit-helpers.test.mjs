import assert from "node:assert/strict";
import test from "node:test";
import { auditPassed, isAdminRoute, validateRouteAudit } from "./qa-ux-audit-helpers.mjs";

const validAudit = {
  route: "/admin/usuarios",
  pathname: "/admin/usuarios",
  h1Count: 1,
  horizontalOverflow: false,
  unnamedControls: 0,
  errorBoundary: false,
  pageErrors: [],
  consoleErrors: [],
};

test("reconhece rotas administrativas sem classificar rotas comuns", () => {
  assert.equal(isAdminRoute("/admin/usuarios"), true);
  assert.equal(isAdminRoute("/dashboard"), false);
});

test("reprova redirect inesperado mesmo quando a página de destino parece válida", () => {
  const failures = validateRouteAudit({ ...validAudit, pathname: "/dashboard" });
  assert.deepEqual(failures, ["Rota final inesperada: /dashboard"]);
});

test("reprova ErrorBoundary e erros de execução", () => {
  const failures = validateRouteAudit({
    ...validAudit,
    errorBoundary: true,
    pageErrors: ["render failed"],
    consoleErrors: ["request failed"],
  });
  assert.equal(failures.length, 3);
});

test("o relatório exige configuração completa e resultados sem falhas", () => {
  assert.equal(auditPassed([{ failures: [] }]), true);
  assert.equal(auditPassed([{ failures: ["redirect"] }]), false);
  assert.equal(auditPassed([{ failures: [] }], ["credencial admin ausente"]), false);
});
