export function reorderCatalogItems<T extends { ordem: number }>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, index) => ({ ...item, ordem: index + 1 }));
}

export function parseBulkTopics(value: string, existing: string[]) {
  const seen = new Set(existing.map((item) => item.trim().toLocaleLowerCase("pt-BR")));
  const result: string[] = [];
  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.replace(/^\s*(?:(?:\d+(?:\.\d+)*[.)-]?)|[-*•])\s*/, "").trim();
    const key = line.toLocaleLowerCase("pt-BR");
    if (!line || seen.has(key)) continue;
    seen.add(key);
    result.push(line);
  }
  return result;
}
