export const CONCURSO_CARD_SHADOW = "0 2px 12px rgba(0,0,0,0.07)";

export function isEncerradoStatus(status: string) {
  return status === "realizado" || status === "eliminado";
}
