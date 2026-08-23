import assert from "node:assert/strict";
import test from "node:test";
import { auditCatalog } from "./audit-data-quality-lib.mjs";

function response(payload, ok = true, status = 200) {
  return { ok, status, json: async () => payload };
}

test("audita todas as páginas do catálogo e consolida findings", async () => {
  const pages = [
    { items: [{ id: "1", nome: "Concurso real", orgao: "Órgão", banca: "Banca" }], page: 1, total: 2, total_pages: 2 },
    { items: [{ id: "2", nome: "teste-2", orgao: "Outro", banca: "Banca" }], page: 2, total: 2, total_pages: 2 },
  ];
  const urls = [];
  const result = await auditCatalog({
    baseUrl: "http://api.test",
    token: "token",
    fetchImpl: async (url) => {
      urls.push(url);
      return response(pages[urls.length - 1]);
    },
  });

  assert.equal(result.checked, 2);
  assert.equal(result.pages, 2);
  assert.equal(result.findings.length, 1);
  assert.match(urls[1], /page=2/);
});

test("falha quando a API informa mais registros do que foram auditados", async () => {
  await assert.rejects(
    auditCatalog({
      baseUrl: "http://api.test",
      token: "token",
      fetchImpl: async () => response({ items: [], total: 1, total_pages: 1 }),
    }),
    /Auditoria incompleta/,
  );
});
