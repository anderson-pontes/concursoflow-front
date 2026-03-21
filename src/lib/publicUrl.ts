/**
 * URLs públicas de uploads vindas da API (ex.: `/uploads/concursos/...`).
 * Com proxy `/uploads` no Vite, o mesmo origin funciona no dev.
 */
export function resolvePublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return path;
}

export function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url) || url.toLowerCase().includes("application/pdf");
}

export function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}
