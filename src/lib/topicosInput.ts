/** Separa descrições de tópicos por `;`, remove vazios e duplicatas no mesmo envio. */
export function parseTopicosDelimitados(texto: string): string[] {
  return Array.from(new Set(texto.split(";").map((x) => x.trim()).filter(Boolean)));
}
