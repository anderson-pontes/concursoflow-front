import { useQuery } from "@tanstack/react-query";
import { obterConteudoCargo, obterResumoEditalPublicado } from "@/services/editaisCatalogo";

/** Separate cache identities keep selector summaries out of full-detail consumers. */
export function usePlanoCatalogo(editalId: string | null, cargoId: string | null) {
  const resumo = useQuery({
    queryKey: ["catalogo-edital", "public", editalId, "resumo"],
    queryFn: ({ signal }) => obterResumoEditalPublicado(editalId!, signal),
    enabled: Boolean(editalId), staleTime: 60_000, retry: 1,
  });
  const versao = resumo.data?.versao_atual;
  const cargo = versao?.cargos.find((item) => item.id === cargoId);
  const conteudo = useQuery({
    queryKey: ["catalogo-edital", "public", editalId, versao?.id, "cargo", cargoId],
    queryFn: ({ signal }) => obterConteudoCargo(editalId!, versao!.id, cargoId!, signal),
    enabled: Boolean(editalId && versao && cargo), staleTime: 60_000, retry: 1,
  });
  return { resumo, conteudo, cargo, versao };
}
