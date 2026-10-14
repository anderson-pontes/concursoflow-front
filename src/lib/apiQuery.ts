import { isAxiosError } from "axios";

// A missing resource will not recover through automatic retries. Keep manual
// refetch, focus/reconnect updates and retries for transient failures available.
export function retryApiQuery(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error) && error.response?.status === 404) return false;
  return failureCount < 3;
}

export function apiUnavailableMessage(error: unknown): string | undefined {
  if (isAxiosError(error) && error.response?.status === 404) {
    return "Recurso indisponível na API. Tente novamente mais tarde ou contate o suporte.";
  }
  if (isAxiosError(error) && !error.response) {
    return "Não foi possível conectar à API. Verifique sua conexão e tente novamente.";
  }
  return undefined;
}
