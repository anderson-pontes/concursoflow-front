import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DisciplinaDashboardTopicosTable, type DisciplinaDashboardTopicosTableProps } from "./DisciplinaDashboardTopicosTable";
import { getMockDisciplinaDashboard } from "@/mocks/disciplinaDashboardMock";
vi.mock("@/components/disciplinas/TopicosModal", () => ({TopicosModal: () => null}));
const longName = "Compreensão e interpretação de textos de gêneros variados, reconhecimento das características estruturais e linguísticas, identificação de informações explícitas e implícitas e relações de sentido. ".repeat(4);
function setup(overrides: Partial<DisciplinaDashboardTopicosTableProps> = {}) {
  const data = getMockDisciplinaDashboard("disciplina");
  data.topicos = data.topicos.slice(0, 3).map((row,i) => ({...row,descricao:i === 0 ? longName : i === 1 ? "Ortografia e acentuação" : "Sintaxe",peso:1,dominio:i+1,concluido_edital:i === 1,certas:i ? 10 : 0,erradas:0,em_branco:0}));
  const mutation = () => ({mutate:vi.fn(),mutateAsync:vi.fn(),isPending:false});
  const props = {disciplinaId:"disciplina",data,isLoading:false,isDemoMode:false,topicosModalOpen:false,onTopicosModalOpenChange:vi.fn(),toggleConcluido:mutation(),criarTopicos:mutation(),excluirTopico:mutation(),reordenarTopicos:mutation(),atualizarTopico:mutation(),onDemoToast:vi.fn(),onDetalhesTopico:vi.fn(),onRegistroTopico:vi.fn(),onEditTopico:vi.fn()} as unknown as DisciplinaDashboardTopicosTableProps;
  Object.assign(props, overrides);
  render(<DisciplinaDashboardTopicosTable {...props} />);
  return {user:userEvent.setup(),props,row:()=>document.querySelector(`[data-topico-id="${data.topicos[0].id}"]`) as HTMLElement};
}
beforeEach(() => {
  localStorage.clear();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
describe("Tópicos da disciplina", () => {
  it("apresenta carregamento sem tópicos fictícios", () => {
    setup({data:undefined,isLoading:true});
    expect(screen.getByText("Carregando tópicos...")).toHaveAttribute("role","status");
    expect(document.querySelectorAll('[data-topico-id]')).toHaveLength(0);
  });
  it("apresenta o estado vazio e mantém acesso à inclusão", () => {
    const data=getMockDisciplinaDashboard("disciplina");data.topicos=[];setup({data});
    expect(screen.getByText("Nenhum tópico cadastrado. Adicione o primeiro acima.")).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Adicionar tópicos"})).toBeEnabled();
  });
  it("preserva a proteção contra alterações no modo demonstração", () => {
    const {row}=setup({isDemoMode:true});
    expect(within(row()).getByRole("checkbox")).toBeDisabled();
    expect(within(row()).getByRole("spinbutton")).toBeDisabled();
    expect(within(row()).getByRole("button",{name:"Domínio 4: bom domínio"})).toBeDisabled();
  });
  it("mostra o texto integral e inicia no modo resumido", () => {
    setup(); expect(screen.getByText(longName.trim())).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Resumido"})).toHaveAttribute("aria-pressed","true");
    expect(screen.queryByRole("columnheader",{name:"Certas"})).not.toBeInTheDocument();
    expect(screen.getByText("Sem questões")).toBeInTheDocument();
  });
  it("busca sem acentos e combina situação e domínio", async () => {
    const {user}=setup(); await user.type(screen.getByRole("textbox",{name:"Buscar tópico"}),"acentuacao");
    expect(document.querySelectorAll('[data-topico-id]')).toHaveLength(1);
    await user.click(screen.getByRole("combobox",{name:"Situação"}));await user.click(screen.getByRole("option",{name:"Pendentes"}));
    expect(screen.getByText("Nenhum tópico corresponde a este filtro.")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox",{name:"Situação"}));await user.click(screen.getByRole("option",{name:/^Todos$/}));
    await user.click(screen.getByRole("combobox",{name:"Domínio"}));await user.click(screen.getByRole("option",{name:"Domínio total"}));
    expect(document.querySelectorAll('[data-topico-id]')).toHaveLength(0);
  });
  it("alterna e persiste a visualização completa", async () => {
    const {user}=setup();await user.click(screen.getByRole("button",{name:"Completo"}));
    expect(screen.getByRole("columnheader",{name:"Certas"})).toBeInTheDocument();expect(screen.getByRole("columnheader",{name:"Páginas"})).toBeInTheDocument();expect(localStorage.getItem("cf-disciplina-topics-view")).toBe("complete");
  });
  it("expande métricas adicionais e recolhe sem esconder o nome", async () => {
    const {user,row}=setup();await user.click(within(row()).getByRole("button",{name:"Ver detalhes"}));
    expect(document.querySelector('.topic-details')).toHaveTextContent("Próxima revisão");
    await user.click(within(row()).getByRole("button",{name:"Recolher detalhes"}));expect(document.querySelector('.topic-details')).toBeNull();expect(row()).toHaveTextContent(longName.trim());
  });
  it("preserva conclusão, peso e domínio sem chamar outras mutações", async () => {
    const {user,props,row}=setup();await user.click(within(row()).getByRole("checkbox"));
    expect(props.toggleConcluido.mutate).toHaveBeenCalledWith({topicoId:props.data!.topicos[0].id,concluido:true});
    const weight=within(row()).getByRole("spinbutton");await user.clear(weight);await user.type(weight,"3");await user.tab();
    expect(props.atualizarTopico.mutate).toHaveBeenCalledWith({topicoId:props.data!.topicos[0].id,patch:{peso:3}});
    await user.click(within(row()).getByRole("button",{name:"Domínio 4: bom domínio"}));
    expect(props.atualizarTopico.mutate).toHaveBeenCalledWith({topicoId:props.data!.topicos[0].id,patch:{dominio:4}});
    expect(props.reordenarTopicos.mutate).not.toHaveBeenCalled();
  });
  it("preserva peso não salvo ao buscar", async () => {
    const {user,row}=setup();const weight=within(row()).getByRole("spinbutton");await user.clear(weight);await user.type(weight,"7");
    await user.type(screen.getByRole("textbox",{name:"Buscar tópico"}),"interpretação");expect(within(row()).getByRole("spinbutton")).toHaveValue(7);
  });
  it("abre o menu acessível e mantém registros, edição e inclusão", async () => {
    const {user,props,row}=setup();await user.click(within(row()).getByRole("button",{name:/^Ações:/}));
    await user.click(screen.getByRole("menuitem",{name:"Ver registros de estudo"}));expect(props.onDetalhesTopico).toHaveBeenCalledWith({id:props.data!.topicos[0].id,descricao:longName});
    await user.click(within(row()).getByRole("button",{name:/^Ações:/}));await user.click(screen.getByRole("menuitem",{name:"Novo registro neste tópico"}));expect(props.onRegistroTopico).toHaveBeenCalled();
    await user.click(within(row()).getByRole("button",{name:/^Ações:/}));await user.click(screen.getByRole("menuitem",{name:"Renomear"}));expect(props.onEditTopico).toHaveBeenCalled();
    await user.click(screen.getByRole("button",{name:"Adicionar tópicos"}));expect(props.onTopicosModalOpenChange).toHaveBeenCalledWith(true);
  });
  it("separa a alça de ordenação dos demais controles", () => {
    const {props,row}=setup();
    expect(within(row()).getByRole("button",{name:/^Reordenar tópico:/})).toHaveAttribute("tabindex","0");
    expect(props.reordenarTopicos.mutate).not.toHaveBeenCalled();
  });
});
