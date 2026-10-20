import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ConcursoDetalheModal } from "@/components/concursos/ConcursoDetalheModal";
import { api } from "@/services/api";
vi.mock("@/services/api",()=>({api:{get:vi.fn()}}));
vi.stubGlobal("ResizeObserver",class {observe(){} unobserve(){} disconnect(){}});
afterAll(()=>vi.unstubAllGlobals());
const title="Auditor-Fiscal de Tecnologia da Informação e Governança de Sistemas com atribuições de controle e fiscalização";
const concurso={id:"c1",nome:"Receita",orgao:"Receita Federal",cargo:title,banca:null,status:"ativo",edital_url:"/uploads/edital.pdf",logo_url:null,created_at:"2026-10-01T12:00:00"};
const disciplinas=[{id:"d1",nome:"Português e interpretação de textos"},{id:"d2",nome:"Direito Tributário"}];
function Location(){return <output data-testid="route">{useLocation().pathname}</output>;}
function setup(overrides:Partial<typeof concurso> & {updated_at?:string|null}={}){
 const onClose=vi.fn(),onEdit=vi.fn();
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><ConcursoDetalheModal concurso={{...concurso,...overrides}} onClose={onClose} onEdit={onEdit}/><Location/></MemoryRouter></QueryClientProvider>);
 return {onClose,onEdit};
}
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(api.get).mockImplementation(async path=>({data:String(path).endsWith('/disciplinas')?disciplinas:{kpis:{questoes_resolvidas_total:String(path).includes('d1')?10:0,questoes_certas_total:String(path).includes('d1')?7:0,desempenho_geral_pct:String(path).includes('d1')?70:0}}}));
});
describe("detalhes do concurso",()=>{
 it("abre em Dados sem buscar KPIs e preserva título integral, edição e fechamento",async()=>{
  const {onClose,onEdit}=setup();
  expect(screen.getByRole('dialog')).toHaveAccessibleName(title);
  expect(screen.getByRole('button',{name:'Fechar detalhes do concurso'})).toHaveFocus();
  expect(screen.getByRole('tab',{name:'Dados'})).toHaveAttribute('aria-selected','true');
  expect(api.get).not.toHaveBeenCalled();
  expect(within(screen.getByRole('tabpanel')).getByText(title)).toBeVisible();
  expect(screen.queryByText(/Última atualização/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'Editar concurso'}));expect(onEdit).toHaveBeenCalledOnce();
  await userEvent.click(screen.getByRole('button',{name:'Fechar'}));expect(onClose).toHaveBeenCalledOnce();
 });
 it("oferece título completo por tooltip ao navegar com teclado",async()=>{
  setup();const heading=screen.getByRole('heading',{name:title});
  const text=heading.querySelector('.line-clamp-2') as HTMLElement;
  act(()=>{Object.defineProperty(text,'scrollHeight',{value:100});Object.defineProperty(text,'clientHeight',{value:60});window.dispatchEvent(new Event('resize'));});
  const label=heading.querySelector('[tabindex]') as HTMLElement;
  act(()=>label.focus());expect(await screen.findByRole('tooltip')).toHaveTextContent(title);
 });
 it("omite a data duplicada e só informa última atualização fornecida",()=>{
  setup({updated_at:'2026-10-20T12:00:00'});
  expect(screen.getAllByText('Cadastrado em')).toHaveLength(1);
  expect(screen.getByText(/Última atualização: 20\/10\/2026/)).toBeVisible();
 });
 it("preserva navegação das abas pelo teclado e o PDF",async()=>{
  setup();screen.getByRole('tab',{name:'Dados'}).focus();await userEvent.keyboard('{ArrowRight}');
  expect(screen.getByRole('tab',{name:'Edital'})).toHaveAttribute('aria-selected','true');
  expect(screen.getByTitle('Pré-visualização do edital')).toHaveAttribute('src',expect.stringContaining('/uploads/edital.pdf'));
  expect(screen.getByRole('link',{name:'Abrir em nova aba'})).toHaveAttribute('target','_blank');
  await userEvent.keyboard('{Home}');expect(screen.getByRole('tab',{name:'Dados'})).toHaveFocus();
 });
 it("mantém agregação real e distingue disciplinas sem questões",async()=>{
  setup();await userEvent.click(screen.getByRole('tab',{name:'Progresso'}));
  expect(await screen.findByText('70%')).toBeVisible();
  expect(screen.getByText('Nenhuma questão resolvida ainda')).toBeVisible();
  expect(screen.queryByText('0% de acerto')).not.toBeInTheDocument();
  expect(screen.getAllByRole('progressbar')).toHaveLength(1);
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','70');
  expect(screen.getByRole('link',{name:'Editar vínculos'})).toHaveAttribute('href','/disciplinas');
  await userEvent.click(screen.getByRole('button',{name:/Português e interpretação/}));
  expect(screen.getByTestId('route')).toHaveTextContent('/disciplinas/d1');
 });
 it("apresenta falha de consulta sem convertê-la em ausência de disciplinas",async()=>{
  vi.mocked(api.get).mockRejectedValue(new Error('falha local'));setup();await userEvent.click(screen.getByRole('tab',{name:'Progresso'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as disciplinas');
  expect(screen.queryByText('Nenhuma disciplina vinculada')).not.toBeInTheDocument();
 });
 it("não apresenta totais parciais como se fossem completos",async()=>{
  vi.mocked(api.get).mockImplementation(async path=>{if(String(path).includes('d2'))throw new Error('falha local');return {data:String(path).endsWith('/disciplinas')?disciplinas:{kpis:{questoes_resolvidas_total:10,questoes_certas_total:7,desempenho_geral_pct:70}}};});
  setup();await userEvent.click(screen.getByRole('tab',{name:'Progresso'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar todos os indicadores');
  await waitFor(()=>expect(screen.getAllByText('Indisponível')).toHaveLength(2));
  expect(screen.queryByText('70%')).not.toBeInTheDocument();
 });
 it("explica ausência de edital e preserva ação para anexar",async()=>{
  const {onEdit}=setup({edital_url:null as unknown as string});await userEvent.click(screen.getByRole('tab',{name:'Edital'}));
  expect(screen.getByText('Nenhum edital anexado')).toBeVisible();await userEvent.click(screen.getByRole('button',{name:'Adicionar edital'}));expect(onEdit).toHaveBeenCalledOnce();
 });
});
