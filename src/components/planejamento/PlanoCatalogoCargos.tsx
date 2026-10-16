import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { usePlanoCatalogo } from "@/hooks/usePlanoCatalogo";

type Props = {
  editalId: string | null;
  cargoId: string | null;
  catalogo: ReturnType<typeof usePlanoCatalogo>;
  onSelect: (id: string) => void;
};

export function PlanoCatalogoCargos({ editalId, cargoId, catalogo, onSelect }: Props) {
  const { resumo, versao, conteudo } = catalogo;
  return <div className="mt-6">
    <h3 className="font-semibold">Cargo ou especialidade</h3>
    {!editalId ? <p className="mt-2 text-sm text-muted-foreground">Selecione um edital para consultar os cargos.</p>
      : resumo.isPending ? <p role="status" className="mt-2 text-sm text-muted-foreground">Carregando cargos...</p>
      : resumo.isError ? <div role="alert" className="mt-2 text-sm"><p>Não foi possível carregar os cargos.</p><Button variant="outline" onClick={() => void resumo.refetch()}>Tentar novamente</Button></div>
      : !versao?.cargos.length ? <p className="mt-2 text-sm text-muted-foreground">Nenhum cargo encontrado para este edital</p>
      : <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Cargo do edital">
        {versao.cargos.map((item) => <button type="button" role="radio" aria-checked={cargoId === item.id} key={item.id} onClick={() => onSelect(item.id)} className={cn("min-h-20 rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", cargoId === item.id ? "border-primary bg-primary-muted ring-1 ring-primary" : "border-border hover:border-primary/50")}>
          <strong>{item.nome}</strong><span className="mt-1 block text-xs text-muted-foreground">{item.disciplinas_total ?? item.disciplinas.length} disciplinas · {item.topicos_total ?? item.disciplinas.reduce((sum, disc) => sum + (disc.topicos_total ?? disc.topicos.length), 0)} tópicos</span>
        </button>)}
      </div>}
    {cargoId && conteudo.isPending && <p role="status" className="mt-3 text-sm text-muted-foreground">Carregando conteúdo do cargo...</p>}
    {cargoId && conteudo.isError && <div role="alert" className="mt-3 text-sm"><p>Não foi possível carregar o conteúdo deste cargo. Sua seleção foi mantida.</p><Button variant="outline" onClick={() => void conteudo.refetch()}>Tentar novamente</Button></div>}
  </div>;
}
