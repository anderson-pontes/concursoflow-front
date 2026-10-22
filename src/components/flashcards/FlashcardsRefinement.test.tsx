import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { Flashcards } from "@/pages/Flashcards";
import { DeckFormModal } from "@/components/flashcards/DeckFormModal";
import { api } from "@/services/api";
import { ANKI_DEFAULTS } from "@/lib/flashcards/constants";
import { DECK_COLOR_PALETTE } from "@/lib/palette/deck-colors";
import { ImportApkgModal } from "@/components/flashcards/ImportApkgModal";

vi.mock("@/services/api",()=>({api:{get:vi.fn(),post:vi.fn(),put:vi.fn(),delete:vi.fn()}}));
let config={...ANKI_DEFAULTS};
let decks=[{id:"d1",nome:"Português",descricao:"Gramática",cor_hex:DECK_COLOR_PALETTE[0],total_cards:3,parent_id:null}];
let total=3;
beforeEach(()=>{
 vi.clearAllMocks();config={...ANKI_DEFAULTS};total=3;decks=[{id:"d1",nome:"Português",descricao:"Gramática",cor_hex:DECK_COLOR_PALETTE[0],total_cards:3,parent_id:null}];
 vi.mocked(api.get).mockImplementation(async url=>({data:String(url).includes('/decks/')?decks:url==='/flashcards/metrics'?{total_cards:total,due_today_total:0,decks:[]}:url==='/flashcards/config'?config:[]}) as never);
 vi.mocked(api.post).mockResolvedValue({data:{id:"new-deck"}});
 vi.mocked(api.put).mockImplementation(async (_url,body)=>{config=body as typeof config;return {data:config} as never;});
});
function setup(component=<Flashcards/>){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});return render(<QueryClientProvider client={client}>{component}</QueryClientProvider>);}
it("preserva vírgula, ponto e precisão decimal no payload das seis configurações",async()=>{
 const user=userEvent.setup();setup();fireEvent.click(screen.getByRole('tab',{name:'Configurações'}));
 await screen.findByRole('spinbutton',{name:'Novos cartões por dia'});
 fireEvent.click(screen.getByRole('button',{name:'Algoritmo de intervalos'}));
 fireEvent.click(screen.getByRole('button',{name:'Penalidades e bônus'}));
 for(const [label,text] of [['Multiplicador Difícil','1,35'],['Bônus Fácil','1.456'],['Facilidade inicial (EF)','2,65'],['Facilidade mínima','1.33'],['Penalidade Difícil (EF)','0,17'],['Bônus Fácil (EF)','0.235']]){
  const field=screen.getByRole('textbox',{name:label});await user.clear(field);await user.type(field,text);fireEvent.blur(field);
 }
 expect(screen.getByRole('textbox',{name:'Bônus Fácil'})).toHaveValue('1,456');
 expect(screen.getByRole('textbox',{name:'Facilidade mínima'})).toHaveValue('1,33');
 fireEvent.click(screen.getByRole('button',{name:'Salvar configurações'}));
 await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/flashcards/config',expect.objectContaining({intervalo_dificil_mult:1.35,bonus_facil_mult:1.456,facilidade_inicial:2.65,facilidade_minima:1.33,penalidade_dificil:0.17,bonus_facilidade_facil:0.235})));
});
it("sinaliza campos vazios e valores fora do limite sem salvar",async()=>{
 setup();fireEvent.click(screen.getByRole('tab',{name:'Configurações'}));await screen.findByRole('spinbutton',{name:'Novos cartões por dia'});
 fireEvent.click(screen.getByRole('button',{name:'Algoritmo de intervalos'}));
 const field=screen.getByRole('textbox',{name:'Facilidade inicial (EF)'});
 for(const value of ['', 'abc', '1,2', '10']){
  fireEvent.change(field,{target:{value}});
  expect(field).toHaveAttribute('aria-invalid','true');
  expect(screen.getByRole('button',{name:'Salvar configurações'})).toBeDisabled();
 }
 expect(api.put).not.toHaveBeenCalled();
 fireEvent.change(field,{target:{value:'1,3'}});
 expect(field).toHaveAttribute('aria-invalid','false');
 expect(screen.getByRole('button',{name:'Salvar configurações'})).toBeEnabled();
});
it("aguarda a API, preserva edições no erro e permite nova tentativa",async()=>{
 let rejectRequest!:(error:Error)=>void;
 vi.mocked(api.put).mockImplementationOnce(()=>new Promise((_resolve,reject)=>{rejectRequest=reject;}));
 setup();fireEvent.click(screen.getByRole('tab',{name:'Configurações'}));
 const field=await screen.findByRole('spinbutton',{name:'Novos cartões por dia'});
 fireEvent.change(field,{target:{value:'35'}});
 expect(screen.getByText('Existem alterações não salvas.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Salvar configurações'}));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Salvando…'})).toBeDisabled());
 expect(screen.queryByText('Configurações salvas. Nenhuma alteração pendente.')).not.toBeInTheDocument();
 rejectRequest(new Error('Falha simulada'));
 expect(await screen.findByText(/Suas alterações foram mantidas/)).toBeInTheDocument();
 expect(field).toHaveValue(35);
 fireEvent.click(screen.getByRole('button',{name:'Salvar configurações'}));
 expect(await screen.findByText('Configurações salvas. Nenhuma alteração pendente.')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Salvar configurações'})).toBeDisabled();
});
it("abre a criação de cartão no baralho vazio selecionado sem mostrar progresso",async()=>{
 decks=[{...decks[0],total_cards:0}];total=0;setup();
 fireEvent.click(await screen.findByRole('button',{name:'Adicionar cartões'}));
 const dialog=await screen.findByRole('dialog');
 expect(within(dialog).getByText('Português')).toBeInTheDocument();
 expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Estudar este baralho'})).not.toBeInTheDocument();
});
it("sincroniza slider e número, preserva 9999 no campo e só salva alterações válidas",async()=>{
 setup();fireEvent.click(screen.getByRole('tab',{name:'Configurações'}));
 const number=await screen.findByRole('spinbutton',{name:'Novos cartões por dia'});
 expect(screen.getByRole('button',{name:'Salvar configurações'})).toBeDisabled();
 fireEvent.change(number,{target:{value:'40'}});
 expect(screen.getByRole('slider',{name:'Novos cartões por dia (controle deslizante)'})).toHaveValue('40');
 fireEvent.change(screen.getByRole('slider',{name:'Novos cartões por dia (controle deslizante)'}),{target:{value:'30'}});
 expect(number).toHaveValue(30);
 fireEvent.change(screen.getByRole('spinbutton',{name:'Máximo de revisões por dia'}),{target:{value:'9999'}});
 expect(screen.getByRole('slider',{name:'Máximo de revisões por dia (controle deslizante)'})).toHaveValue('300');
 expect(screen.getByRole('spinbutton',{name:'Máximo de revisões por dia'})).toHaveValue(9999);
 fireEvent.click(screen.getByRole('button',{name:'Salvar configurações'}));
 await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/flashcards/config',expect.objectContaining({novos_por_dia:30,max_revisoes_dia:9999})));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Salvar configurações'})).toBeDisabled());
});
it("restaura os padrões existentes sem mudar os valores do algoritmo",async()=>{
 config={...ANKI_DEFAULTS,novos_por_dia:40};setup();fireEvent.click(screen.getByRole('tab',{name:'Configurações'}));
 expect(await screen.findByRole('spinbutton',{name:'Novos cartões por dia'})).toHaveValue(40);
 fireEvent.click(screen.getByRole('button',{name:'Restaurar padrões'}));
 expect(screen.getByRole('spinbutton',{name:'Novos cartões por dia'})).toHaveValue(ANKI_DEFAULTS.novos_por_dia);
 fireEvent.click(screen.getByRole('button',{name:'Salvar configurações'}));
 await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/flashcards/config',ANKI_DEFAULTS));
});
it("cria baralho com a cor selecionada e preserva o contrato",async()=>{
 const close=vi.fn();setup(<DeckFormModal open onClose={close}/>);
 const dialog=screen.getByRole('dialog');expect(within(dialog).getByRole('button',{name:'Criar baralho'})).toBeDisabled();
 fireEvent.change(within(dialog).getByLabelText(/Nome do baralho/),{target:{value:'Direito Constitucional'}});
 fireEvent.change(within(dialog).getByLabelText('Descrição'),{target:{value:'Direitos fundamentais'}});
 fireEvent.click(within(dialog).getByRole('button',{name:`Selecionar cor ${DECK_COLOR_PALETTE[1]}`}));
 expect(within(dialog).getByRole('button',{name:`Selecionar cor ${DECK_COLOR_PALETTE[1]}`})).toHaveAttribute('aria-pressed','true');
 fireEvent.click(within(dialog).getByRole('button',{name:'Criar baralho'}));
 await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/flashcards/decks',{nome:'Direito Constitucional',descricao:'Direitos fundamentais',cor_hex:DECK_COLOR_PALETTE[1],disciplina_id:null,parent_id:null}));
 expect(close).toHaveBeenCalled();
});
it.each([[0,0,'Comece pelo seu primeiro baralho'],[1,0,'Seus baralhos ainda não têm cartões'],[1,3,'Tudo em dia!']])("diferencia revisão vazia com %s baralhos e %s cartões",async(count,cards,title)=>{
 if(!count)decks=[];total=cards;setup();fireEvent.click(screen.getByRole('tab',{name:'Revisar Hoje'}));
 expect(await screen.findByText(title)).toBeInTheDocument();
 if(!cards)expect(screen.queryByRole('button',{name:'Revisar no avançado'})).not.toBeInTheDocument();
});
it("não apresenta erro de catálogo como ausência de baralhos",async()=>{
 vi.mocked(api.get).mockRejectedValue(new Error('offline'));setup();
 expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar este conteúdo');
 expect(screen.queryByText('Comece criando seu primeiro baralho')).not.toBeInTheDocument();
});
it("edita um baralho existente mantendo os vínculos",async()=>{
 setup(<DeckFormModal open onClose={vi.fn()} deck={{...decks[0],disciplina_id:'disciplina-1',parent_id:'pai',created_at:'2026-10-01'}}/>);
 fireEvent.change(screen.getByLabelText(/Nome do baralho/),{target:{value:'Nome atualizado'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar alterações'}));
 await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/flashcards/decks/d1',expect.objectContaining({nome:'Nome atualizado',disciplina_id:'disciplina-1',parent_id:'pai'})));
});
it("mantém o envio APKG como FormData e o resultado da importação",async()=>{
 vi.mocked(api.post).mockResolvedValue({data:{decks_criados:1,decks_reaproveitados:0,cards_importados:2,cards_ignorados:0,midias_importadas:0,mensagens:[]}});
 const {container}=setup(<ImportApkgModal open onClose={vi.fn()}/>);
 const file=new File(['fixture'],'qa.apkg',{type:'application/octet-stream'});
 fireEvent.change(container.ownerDocument.querySelector('input[type=file]')!,{target:{files:[file]}});
 fireEvent.click(screen.getByRole('button',{name:'Importar'}));
 expect(await screen.findByText('Importação concluída')).toBeInTheDocument();
 expect(api.post).toHaveBeenCalledWith('/flashcards/import-apkg',expect.any(FormData));
 expect((vi.mocked(api.post).mock.calls[0][1] as FormData).get('file')).toEqual(file);
});
