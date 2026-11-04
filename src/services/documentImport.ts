import { api } from "@/services/api";

export type ImportIssue = { section: string; line: number; field: string; value: string | null; message: string; expected: string };
export type ImportRow = { id: string; section: string; line: number; data: Record<string, string>; issues: ImportIssue[] };
export type ImportSummary = { cargos: number; disciplinas: number; relacoes: number; topicos: number; anexos: number; eventos: number; erros: number };
export type ImportSession = {
  id: string; document_key: string; status: string; revision: number;
  metadata_json: Record<string, unknown>; summary: ImportSummary;
  report: Record<string, unknown> | null; edital_id: string | null; version_id: string | null; created_at: string;
};
export type ImportContract = { version: string; sections: Record<string, { title: string; headers: string[] }> };
export type ImportPage<T> = { items: T[]; total: number; page: number; page_size: number };
const ROOT = "/admin/importacoes-documentos";

export async function getImportContract() { return (await api.get<ImportContract>(`${ROOT}/contrato`)).data; }
export async function getImportHistory(page = 1) { return (await api.get<ImportPage<ImportSession>>(ROOT, { params: { page, page_size: 10 } })).data; }
export async function getImportSession(id: string) { return (await api.get<ImportSession>(`${ROOT}/${id}`)).data; }
export async function getImportRows(id: string, section: string, page = 1) {
  return (await api.get<ImportPage<ImportRow>>(`${ROOT}/${id}/linhas`, { params: { section, page, page_size: 50 } })).data;
}
export async function uploadImport(file: File, officialFile: File | null) {
  const form = new FormData(); form.append("file", file);
  if (officialFile) form.append("official_file", officialFile);
  return (await api.post<ImportSession>(ROOT, form)).data;
}
export async function correctImportField(id: string, rowId: string, revision: number, field: string, value: string) {
  return (await api.patch<ImportSession>(`${ROOT}/${id}/linhas/${rowId}`, { revision, field, value })).data;
}
export async function confirmImport(id: string, revision: number) {
  return (await api.post<ImportSession>(`${ROOT}/${id}/confirmar`, { revision, confirm: true })).data;
}
export async function validateImport(id: string, revision: number) {
  return (await api.post<ImportSession>(`${ROOT}/${id}/validar`, { revision })).data;
}
export async function downloadImportTemplate(format: "docx" | "pdf", example = false) {
  const response = await api.get<Blob>(`${ROOT}/modelo`, { params: { formato: format, exemplo: example }, responseType: "blob" });
  saveBlob(response.data, `ClickEdital-Import-V1${example ? "-exemplo" : ""}.${format}`);
}
export async function downloadImportReport(id: string) {
  const response = await api.get<Blob>(`${ROOT}/${id}/relatorio`, { responseType: "blob" });
  saveBlob(response.data, `ClickEdital-importacao-${id}.json`);
}
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
