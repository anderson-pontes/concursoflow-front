import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { MentalMaps } from "@/pages/MentalMaps";
import { mentalMapCategory } from "@/components/mentalMaps/MentalMapCard";
import { listMentalMaps, requestMentalMapAccess, type MentalMap } from "@/services/mentalMaps";
import { toast } from "sonner";

vi.mock("@/services/mentalMaps", () => ({ listMentalMaps: vi.fn(), requestMentalMapAccess: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
const map = (slug: string, category = "Dados e Inteligência", extras: Partial<MentalMap> = {}): MentalMap => ({slug, title: `Mapa ${slug}`, category, description: "Material de revisão", topics: ["Dados", "Análise", "Leitura", "Estatística", "Aplicação"], page_count: 7, updated_at: "2026-08-01", available: true, featured: false, ...extras});
const items = [map("dados"), map("gestao", "Gestão e Metodologias"), map("seguranca", "Segurança da Informação", { available: false })];
function setup() { const client = new QueryClient({defaultOptions:{queries:{retry:false}}}); return render(<QueryClientProvider client={client}><MentalMaps /></QueryClientProvider>); }
beforeEach(() => { vi.restoreAllMocks(); vi.mocked(listMentalMaps).mockReset().mockResolvedValue({items,total:items.length}); vi.mocked(requestMentalMapAccess).mockReset().mockResolvedValue({url:"https://example.invalid/mapa.pdf",expires_in:60}); });

it("combina busca e categoria e limpa ambos sem nova requisição", async () => {
  setup(); await screen.findByRole("article", {name:"Mapa dados"});
  const group = document.querySelector('.mental-maps-desktop-filters')!;
  fireEvent.click(within(group as HTMLElement).getByRole("button", {name:"Gestão e Metodologias",hidden:true}));
  expect(screen.getByText("mapa encontrado")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), {target:{value:"Estatística"}});
  expect(screen.getByRole("article", {name:"Mapa gestao"})).toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), {target:{value:"inexistente"}});
  expect(screen.getByText("Nenhum mapa encontrado")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", {name:"Limpar filtros"})[0]);
  expect(screen.getAllByRole("article")).toHaveLength(3); expect(listMentalMaps).toHaveBeenCalledTimes(1);
});
it("mantém todos os assuntos acessíveis e recolhe os extras", async () => {
  setup(); const card = await screen.findByRole("article", {name:"Mapa dados"});
  expect(within(card).queryByText("Estatística")).not.toBeInTheDocument();
  fireEvent.click(within(card).getByRole("button", {name:"+2 assuntos"}));
  expect(within(card).getByText("Estatística")).toBeInTheDocument();
  fireEvent.click(within(card).getByRole("button", {name:"Recolher assuntos"}));
  expect(within(card).queryByText("Estatística")).not.toBeInTheDocument();
});
it("abre o documento na aba preparada e solicita download pelo contrato existente", async () => {
  const popup = {document:{title:"",body:{textContent:""}},opener:{},location:{replace:vi.fn()},close:vi.fn()};
  vi.spyOn(window,"open").mockReturnValue(popup as unknown as Window);
  const click = vi.spyOn(HTMLAnchorElement.prototype,"click").mockImplementation(()=>{});
  setup(); const card = await screen.findByRole("article",{name:"Mapa dados"});
  fireEvent.click(within(card).getByRole("button",{name:"Visualizar"}));
  await waitFor(()=>expect(popup.location.replace).toHaveBeenCalledWith("https://example.invalid/mapa.pdf"));
  expect(requestMentalMapAccess).toHaveBeenCalledWith("dados",false); expect(popup.opener).toBeNull();
  await waitFor(()=>expect(within(card).getByRole("button",{name:"Baixar PDF"})).toBeEnabled());
  fireEvent.click(within(card).getByRole("button",{name:"Baixar PDF"}));
  await waitFor(()=>expect(requestMentalMapAccess).toHaveBeenCalledWith("dados",true));
  expect(click).toHaveBeenCalledTimes(1);
});
it("fecha a aba de espera e mostra a falha de acesso", async () => {
  const popup = {document:{title:"",body:{textContent:""}},opener:null,close:vi.fn()};
  vi.spyOn(window,"open").mockReturnValue(popup as unknown as Window);
  vi.mocked(requestMentalMapAccess).mockRejectedValue({response:{data:{detail:"Arquivo indisponível"}}});
  setup(); const card = await screen.findByRole("article",{name:"Mapa dados"});
  fireEvent.click(within(card).getByRole("button",{name:"Visualizar"}));
  await waitFor(()=>expect(toast.error).toHaveBeenCalledWith("Arquivo indisponível")); expect(popup.close).toHaveBeenCalled();
  await waitFor(()=>expect(within(card).getByRole("button",{name:"Visualizar"})).toBeEnabled());
});
it("desabilita documentos indisponíveis e não inventa data/páginas ausentes", async () => {
  vi.mocked(listMentalMaps).mockResolvedValue({items:[map("sem-arquivo","Outra categoria",{available:false,page_count:null,updated_at:null})],total:1});
  setup(); const card = await screen.findByRole("article",{name:"Mapa sem-arquivo"});
  expect(within(card).getByRole("button",{name:"Visualizar"})).toBeDisabled();
  expect(within(card).getByRole("button",{name:"Baixar PDF"})).toBeDisabled(); expect(card.querySelector("time")).toBeNull();
  expect(requestMentalMapAccess).not.toHaveBeenCalled(); expect(mentalMapCategory("Outra categoria").tone).toBe("mental-map-neutral");
  expect(mentalMapCategory("Segurança da Informação").tone).toBe("study-tone-amber");
});
it("permite repetir carregamento com erro e mostra catálogo vazio", async () => {
  vi.mocked(listMentalMaps).mockRejectedValueOnce(new Error("offline")).mockResolvedValue({items:[],total:0});
  setup(); fireEvent.click(await screen.findByRole("button",{name:"Tentar novamente"}));
  expect(await screen.findByText("A biblioteca está sendo preparada")).toBeInTheDocument();
});
it("mostra loading e pagina resultados sem perder itens", async () => {
  let resolve!: (value:{items:MentalMap[];total:number})=>void;
  vi.mocked(listMentalMaps).mockReturnValue(new Promise(r=>{resolve=r;}));
  setup(); expect(screen.queryAllByRole("article")).toHaveLength(0);
  await act(async()=>resolve({items:Array.from({length:8},(_,i)=>map(String(i))),total:8}));
  expect(await screen.findAllByRole("article")).toHaveLength(6);
  fireEvent.click(screen.getByRole("button",{name:"Mostrar mais mapas (2)"}));
  expect(screen.getAllByRole("article")).toHaveLength(8);
});
