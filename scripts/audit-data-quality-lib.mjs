const placeholder = /^(?:teste?|test|asdf|fadf|ddd|xxx)(?:\b|[-_\d])/i;

function findingsFor(items) {
  return items.flatMap((item) =>
    [
      ["nome", item.nome],
      ["órgão", item.orgao],
      ["banca", item.banca],
    ]
      .filter(([, value]) => typeof value === "string" && placeholder.test(value.trim()))
      .map(([field, value]) => ({ id: item.id, field, value })),
  );
}

export async function auditCatalog({ fetchImpl = fetch, baseUrl, token, pageSize = 100, maxPages = 10_000 }) {
  const findings = [];
  let checked = 0;
  let page = 1;
  let expectedTotal = null;

  while (page <= maxPages) {
    const response = await fetchImpl(`${baseUrl}/admin/editais?page=${page}&page_size=${pageSize}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Catálogo respondeu HTTP ${response.status} na página ${page}`);

    const payload = await response.json();
    const paginated = !Array.isArray(payload);
    const items = Array.isArray(payload) ? payload : payload.items ?? [];
    const totalPages = paginated ? Number(payload.total_pages ?? 1) : 1;
    expectedTotal = paginated && Number.isFinite(Number(payload.total)) ? Number(payload.total) : expectedTotal;
    checked += items.length;
    findings.push(...findingsFor(items));

    if (!paginated || page >= totalPages) break;
    page += 1;
  }

  if (page > maxPages) throw new Error(`Auditoria interrompida após ${maxPages} páginas para evitar loop infinito`);
  if (expectedTotal !== null && checked !== expectedTotal) {
    throw new Error(`Auditoria incompleta: API informou ${expectedTotal} registros, mas ${checked} foram verificados`);
  }

  return { checked, pages: page, expectedTotal, findings };
}
