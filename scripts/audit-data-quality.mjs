const baseUrl = process.env.QA_API_URL || "http://localhost:8000/api/v1";
const token = process.env.QA_ACCESS_TOKEN;
const placeholder = /^(?:teste?|test|asdf|fadf|ddd|xxx)(?:\b|[-_\d])/i;

if (!token) {
  console.error("Defina QA_ACCESS_TOKEN para auditar o catálogo sem alterar dados.");
  process.exit(2);
}

const response = await fetch(`${baseUrl}/admin/editais?page=1&page_size=100`, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!response.ok) throw new Error(`Catálogo respondeu HTTP ${response.status}`);

const payload = await response.json();
const items = Array.isArray(payload) ? payload : payload.items ?? [];
const findings = items.flatMap((item) =>
  [
    ["nome", item.nome],
    ["órgão", item.orgao],
    ["banca", item.banca],
  ]
    .filter(([, value]) => typeof value === "string" && placeholder.test(value.trim()))
    .map(([field, value]) => ({ id: item.id, field, value })),
);

console.log(JSON.stringify({ checked: items.length, findings }, null, 2));
if (findings.length) process.exitCode = 1;
