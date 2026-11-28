import {render,screen,fireEvent,within,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {describe,it,expect,vi} from 'vitest';
import {DashboardPeriodKpis,DashboardDisciplineCharts,DashboardDailyCharts} from './DashboardAnalytics';
import {DashboardTodayPlan} from './DashboardTodayPlan';
import type {AnalysisDiscipline,DashboardAnalysis,TodaySession} from '@/lib/dashboard/analysis';
const sample:DashboardAnalysis={inicio:'2026-10-12',fim:'2026-10-18',timezone:'America/Sao_Paulo',totais:{minutos_planejados:100,minutos_estudados:150,meta_periodo_minutos:840,sessoes:2,questoes_total:10,acertos:1,erros:9,acertos_pct:10,topicos_total:10,topicos_concluidos:3,progresso_edital_pct:30},dias:[],disciplinas:[],plano_hoje:[]};
describe('indicadores e planejamento do dashboard',()=>{
 it('integra progresso e tabela aos dias recebidos e preserva estado sem questões',()=>{
  const days=[{data:'2026-10-13',minutos_planejados:120,minutos_estudados:90,questoes_total:0,acertos:0,acertos_pct:null}];
  const {rerender}=render(<MemoryRouter><DashboardDailyCharts data={{...sample,dias:days}}/></MemoryRouter>);
  expect(screen.getByRole('button',{name:/13\/10\/2026.*Cumprimento: 75%/})).toBeInTheDocument();
  expect(screen.getByText('Evolução dos acertos')).toBeInTheDocument();
  expect(screen.getByText(/Sem questões respondidas neste período/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Ver dados dos gráficos'));
  expect(screen.getByRole('cell',{name:'13/10/2026',hidden:true})).toBeInTheDocument();
  rerender(<MemoryRouter><DashboardDailyCharts data={{...sample,dias:[]}}/></MemoryRouter>);
  expect(screen.queryByRole('button',{name:/13\/10\/2026/})).not.toBeInTheDocument();
  expect(screen.getByText('Nenhum planejamento ou estudo neste período.')).toBeInTheDocument();
 });
 it('mostra duração legível, acertos e erros do período e progresso acumulado',()=>{
  render(<DashboardPeriodKpis data={sample}/>);
  expect(screen.getByText('2h 30min')).toBeInTheDocument();
  expect(screen.getByText('10,0%')).toBeInTheDocument();
  expect(screen.getByText('1 acerto em 10 questões')).toBeInTheDocument();
  expect(screen.getByText('9 erros')).toBeInTheDocument();
  expect(screen.getByText('3 de 10 tópicos concluídos')).toBeInTheDocument();
  expect(screen.getByRole('progressbar',{name:'Conclusão acumulada do edital'})).toHaveAttribute('aria-valuenow','30');
 });
 it('mostra meta ultrapassada com valor real e limita o preenchimento da barra',()=>{
  render(<DashboardPeriodKpis data={{...sample,totais:{...sample.totais,minutos_estudados:90,meta_periodo_minutos:60}}}/>);
  expect(screen.getByText('150,0% da meta')).toBeInTheDocument();
  const bar=screen.getByRole('progressbar',{name:'Meta do período atingida'});
  expect(bar).toHaveAttribute('aria-valuenow','100');
  expect(bar).toHaveAttribute('aria-valuetext','150,0%');
 });
 it('oculta as barras de metas, acertos e edital quando faltam dados',()=>{
  render(<DashboardPeriodKpis data={{...sample,totais:{...sample.totais,meta_periodo_minutos:null,questoes_total:0,acertos:0,erros:0,acertos_pct:null,topicos_total:0,topicos_concluidos:0,progresso_edital_pct:null}}}/>);
  expect(screen.getByText('Meta não definida para o período')).toBeInTheDocument();
  expect(screen.getByText('Sem tópicos')).toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
 });
 it('distingue sem questões de zero acertos real e zero minutos',()=>{const t={...sample.totais,minutos_estudados:0,acertos:0,questoes_total:0,acertos_pct:0};const {rerender}=render(<DashboardPeriodKpis data={{...sample,totais:t}}/>);expect(screen.getByText('0 min')).toBeInTheDocument();expect(screen.getByText('Sem dados')).toBeInTheDocument();rerender(<DashboardPeriodKpis data={{...sample,totais:{...t,questoes_total:10,acertos_pct:0}}}/>);expect(screen.getByText('0,0%')).toBeInTheDocument();expect(screen.queryByText('Sem dados')).not.toBeInTheDocument();});
 it('ordena disciplinas por menor progresso e destaca a cobertura quando só uma tem estudo',()=>{
  const rows=[
   {id:'a',nome:'Mais avançada',topicos_total:10,topicos_concluidos:8,progresso_pct:80,minutos_estudados:30,participacao_tempo_pct:100},
   {id:'b',nome:'Precisa atenção',topicos_total:10,topicos_concluidos:1,progresso_pct:10,minutos_estudados:0,participacao_tempo_pct:0},
  ];
  render(<MemoryRouter><DashboardDisciplineCharts data={{...sample,disciplinas:rows}}/></MemoryRouter>);
  expect(screen.getAllByRole('link')[0]).toHaveAttribute('href','/disciplinas/b');
  expect(screen.getAllByRole('link',{name:'Precisa atenção'})).toHaveLength(1);
  const legend=within(screen.getByRole('list',{name:'Tempo por disciplina'}));
  expect(legend.getByText('30 min')).toBeInTheDocument();
  expect(legend.getByText('100% do tempo estudado')).toBeInTheDocument();
  expect(screen.getByRole('meter',{name:'Cobertura das disciplinas no período'})).toHaveAttribute('aria-valuetext','1 de 2 disciplinas estudadas');
  expect(screen.getByText('1 sem registros')).toBeInTheDocument();
  const unrecorded = within(screen.getByRole('list', {name:'Disciplinas sem registros'}));
  expect(unrecorded.getByText('Precisa atenção')).toBeInTheDocument();
  expect(unrecorded.getByText('0 min')).toBeInTheDocument();
  expect(screen.getByText('50%')).toBeInTheDocument();
 });
 it('resume até três disciplinas sem registros e reavalia a cobertura e o planejamento ao trocar os dados',()=>{
  const subjects:AnalysisDiscipline[]=Array.from({length:25},(_,index)=>({
   id:String(index),nome:`Disciplina ${String(index+1).padStart(2,'0')}`,
   topicos_total:10,topicos_concluidos:2,progresso_pct:20,minutos_estudados:index===0?60:0,participacao_tempo_pct:index===0?100:0,
  }));
  const totals={...sample.totais,minutos_planejados:90,minutos_estudados:60};
  const {rerender}=render(<MemoryRouter><DashboardDisciplineCharts data={{...sample,totais:totals,disciplinas:subjects}}/></MemoryRouter>);
  expect(within(screen.getByRole('list',{name:'Disciplinas sem registros'})).getAllByRole('listitem')).toHaveLength(3);
  expect(screen.getByText('24 sem registros')).toBeInTheDocument();
  expect(screen.getByText('4%')).toBeInTheDocument();
  const comparison=within(screen.getByRole('region',{name:'Planejado × Realizado'}));
  expect(comparison.getByText('1h 30min')).toBeInTheDocument();
  expect(comparison.getByText('66,7% de cumprimento')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Ver todas as disciplinas sem registros'}));
  const drawer=within(screen.getByRole('dialog',{name:'Disciplinas sem registros no período'}));
  expect(drawer.getAllByRole('listitem')).toHaveLength(24);
  expect(drawer.getByText('Disciplina 25')).toBeInTheDocument();
  expect(drawer.queryByText('Disciplina 01')).not.toBeInTheDocument();
  fireEvent.click(drawer.getByRole('button',{name:'Fechar'}));
  const allStudied=subjects.map(row=>({...row,minutos_estudados:1}));
  rerender(<MemoryRouter><DashboardDisciplineCharts data={{...sample,totais:{...totals,minutos_planejados:0},disciplinas:allStudied}}/></MemoryRouter>);
  expect(screen.getByText('Todas as disciplinas têm registros neste período.')).toBeInTheDocument();
  expect(screen.queryByRole('list',{name:'Disciplinas sem registros'})).not.toBeInTheDocument();
  expect(screen.getByText('Sem tempo planejado no período.')).toBeInTheDocument();
  expect(comparison.queryByRole('progressbar')).not.toBeInTheDocument();
  rerender(<MemoryRouter><DashboardDisciplineCharts data={{...sample,disciplinas:[]}}/></MemoryRouter>);
  expect(screen.queryByRole('meter',{name:'Cobertura das disciplinas no período'})).not.toBeInTheDocument();
  expect(screen.getByText('Nenhuma disciplina cadastrada no concurso ativo.')).toBeInTheDocument();
 });
 it.each([
  {studied:0,caption:'0% de cumprimento',difference:'Tempo restante',duration:'6h 40min',fill:0,value:'0%'},
  {studied:325,caption:'81,3% de cumprimento',difference:'Tempo restante',duration:'1h 15min',fill:81.25,value:'81,3%'},
  {studied:400,caption:'Meta atingida · 100%',difference:'Tempo restante',duration:'0 min',fill:100,value:'100%'},
  {studied:500,caption:'Meta superada · 125%',difference:'Tempo excedente',duration:'1h 40min',fill:100,value:'125%'},
 ])('compara o total do período com $studied minutos estudados',({studied,caption,difference,duration,fill,value})=>{
  const data={...sample,totais:{...sample.totais,minutos_planejados:400,minutos_estudados:studied}};
  render(<MemoryRouter><DashboardDisciplineCharts data={data}/></MemoryRouter>);
  const comparison=within(screen.getByRole('region',{name:'Planejado × Realizado'}));
  expect(comparison.getByText(caption)).toBeInTheDocument();
  expect(comparison.getByText(difference).nextElementSibling).toHaveTextContent(duration);
  const bar=comparison.getByRole('progressbar',{name:'Cumprimento do tempo planejado'});
  expect(bar).toHaveAttribute('aria-valuenow',String(fill));
  expect(bar).toHaveAttribute('aria-valuetext',`${value} do tempo planejado`);
 });
 it('pondera a cobertura pelo total de tópicos, inclusive de disciplinas fora do resumo',()=>{
  const subjects:AnalysisDiscipline[]=Array.from({length:7},(_,i)=>({
   id:String(i),nome:`Disciplina ${i}`,topicos_total:i===6?40:10,topicos_concluidos:i===6?40:0,
   progresso_pct:i===6?100:0,minutos_estudados:0,participacao_tempo_pct:0,
  }));
  const {rerender}=render(<MemoryRouter><DashboardDisciplineCharts data={{...sample,disciplinas:subjects}}/></MemoryRouter>);
  const coverage=within(screen.getByRole('region',{name:'Cobertura geral do edital'}));
  expect(coverage.getByRole('progressbar')).toHaveAttribute('aria-valuenow','40');
  expect(screen.queryByRole('link',{name:'Disciplina 6'})).not.toBeInTheDocument();
  for (const percent of [0,100]) {
   const rows=subjects.map(row=>({...row,topicos_concluidos:row.topicos_total*percent/100,progresso_pct:percent}));
   rerender(<MemoryRouter><DashboardDisciplineCharts data={{...sample,disciplinas:rows}}/></MemoryRouter>);
   expect(coverage.getByRole('progressbar')).toHaveAttribute('aria-valuenow',String(percent));
  }
  const withoutTopics=subjects.map(row=>({...row,topicos_total:0,topicos_concluidos:0,progresso_pct:null}));
  rerender(<MemoryRouter><DashboardDisciplineCharts data={{...sample,disciplinas:withoutTopics}}/></MemoryRouter>);
  expect(coverage.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(coverage.getByText('7 disciplinas sem tópicos cadastrados')).toBeInTheDocument();
 });
 it('diferencia disciplina sem tópicos de 0%, progresso parcial e conclusão',()=>{
  const rows:AnalysisDiscipline[]=[
   {id:'a',nome:'A sem tópicos',topicos_total:0,topicos_concluidos:0,progresso_pct:0,minutos_estudados:0,participacao_tempo_pct:0},
   {id:'b',nome:'B com zero',topicos_total:4,topicos_concluidos:0,progresso_pct:0,minutos_estudados:0,participacao_tempo_pct:0},
   {id:'c',nome:'C parcial',topicos_total:4,topicos_concluidos:1,progresso_pct:25,minutos_estudados:0,participacao_tempo_pct:0},
   {id:'d',nome:'D concluída',topicos_total:4,topicos_concluidos:4,progresso_pct:100,minutos_estudados:0,participacao_tempo_pct:0},
  ];
  render(<MemoryRouter><DashboardDisciplineCharts data={{...sample,disciplinas:rows}}/></MemoryRouter>);
  const preview=within(screen.getByRole('list',{name:'Resumo de progresso por disciplina'}));
  const items=preview.getAllByRole('listitem');
  expect(items.at(-1)).toHaveTextContent('A sem tópicos');
  expect(within(items[3]!).getByText('Sem tópicos cadastrados')).toBeInTheDocument();
  expect(within(items[3]!).getByText('Não disponível')).toBeInTheDocument();
  expect(items[3]!.querySelector('.dashboard-subject-track')).toBeNull();
  const [zero,partial,done]=preview.getAllByRole('meter');
  expect(zero).toHaveAttribute('aria-valuenow','0');
  expect(zero).toBeEmptyDOMElement();
  expect(partial?.firstElementChild).toHaveStyle({width:'25%'});
  expect(done?.firstElementChild).toHaveStyle({width:'100%'});
  expect(within(items[2]!).getByRole('img',{name:'Concluída'})).toBeInTheDocument();
 });
 it('limita o resumo mesmo com 30 disciplinas e filtra o edital no painel lateral',()=>{
  const rows:AnalysisDiscipline[]=Array.from({length:30},(_,index)=>({
   id:String(index),nome:index===0?'Língua Portuguesa':`Disciplina ${index}`,
   topicos_total:10,topicos_iniciados:index===0?2:index===1?0:10,topicos_concluidos:index<2?0:10,
   progresso_pct:index<2?0:100,minutos_estudados:0,participacao_tempo_pct:0,
  }));
  render(<MemoryRouter><DashboardDisciplineCharts data={{...sample,disciplinas:rows}}/></MemoryRouter>);
  const preview=screen.getByRole('list',{name:'Resumo de progresso por disciplina'});
  expect(within(preview).getAllByRole('listitem')).toHaveLength(5);
  expect(screen.getByText('280')).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('combobox',{name:'Ordenar disciplinas'}),{key:'Enter'});
  fireEvent.click(screen.getByRole('option',{name:'Maior progresso primeiro'}));
  expect(within(preview).queryByRole('link',{name:'Língua Portuguesa'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Ver todas as disciplinas'}));
  const drawer=within(screen.getByRole('dialog',{name:'Todas as disciplinas'}));
  expect(drawer.getAllByRole('listitem')).toHaveLength(30);
  fireEvent.keyDown(drawer.getByRole('combobox',{name:'Filtrar por status'}),{key:'Enter'});
  fireEvent.click(screen.getByRole('option',{name:'Em andamento'}));
  expect(drawer.getAllByRole('listitem')).toHaveLength(1);
  expect(drawer.getByRole('link',{name:'Língua Portuguesa'})).toBeInTheDocument();
  fireEvent.change(drawer.getByRole('searchbox'),{target:{value:'LINGUA'}});
  expect(drawer.getByRole('link',{name:'Língua Portuguesa'})).toBeInTheDocument();
  fireEvent.change(drawer.getByRole('searchbox'),{target:{value:'Direito'}});
  expect(drawer.getByText('Nenhuma disciplina encontrada com esses filtros.')).toBeInTheDocument();
 });
 it('agrupa as menores fatias sem perder minutos e atualiza o tempo sem zerar o edital',()=>{
  const rows:AnalysisDiscipline[]=Array.from({length:7},(_,index)=>({
   id:String(index),nome:`Disciplina ${index+1}`,topicos_total:2,topicos_concluidos:1,progresso_pct:50,
   minutos_estudados:(7-index)*10,participacao_tempo_pct:0,
  }));
  const {rerender}=render(<MemoryRouter><DashboardDisciplineCharts data={{...sample,disciplinas:rows}}/></MemoryRouter>);
  const legend=within(screen.getByRole('list',{name:'Tempo por disciplina'}));
  expect(legend.getAllByRole('listitem')).toHaveLength(6);
  const grouped=legend.getByText('Outras disciplinas').closest('li')!;
  expect(within(grouped).getByText('30 min')).toBeInTheDocument();
  expect(within(grouped).getByText('10,7% do tempo')).toBeInTheDocument();
  expect(screen.getByText('4h 40min')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Ver distribuição completa'}));
  const drawer=within(screen.getByRole('dialog',{name:'Distribuição completa do tempo'}));
  const others=within(drawer.getByRole('region',{name:'Outras disciplinas'}));
  expect(others.getAllByRole('listitem')).toHaveLength(2);
  expect(others.getByText('Disciplina 7')).toBeInTheDocument();
  fireEvent.click(drawer.getByRole('button',{name:'Fechar'}));
  rerender(<MemoryRouter><DashboardDisciplineCharts data={{...sample,disciplinas:rows.map(row=>({...row,minutos_estudados:0}))}}/></MemoryRouter>);
  expect(screen.getByText('Nenhum estudo registrado neste período')).toBeInTheDocument();
  expect(screen.getByRole('meter',{name:'Progresso de Disciplina 1'})).toHaveAttribute('aria-valuenow','50');
  expect(screen.queryByText('Tempo total')).not.toBeInTheDocument();
 });
 it('prioriza duas sessões, calcula o progresso sobre todas e registra pelo painel cronológico',async()=>{
  const register=vi.fn();
  const statuses=['planejada','em_andamento','concluida','atrasada'] as const;
  const items:TodaySession[]=statuses.map((status,i)=>({
   id:`id${i}`,fonte:'cronograma_item',disciplina_id:'disc',disciplina_nome:'Português',
   topico_id:`topico-${i}`,topico_nome:`Tópico ${i}`,data:'2026-10-12',
   hora_inicio:`${10+i}:00`,hora_fim:null,duracao_minutos:60,status,
  }));
  render(<MemoryRouter><DashboardTodayPlan items={items} studiedMinutes={35} onRegister={register}/></MemoryRouter>);
  expect(screen.getByRole('progressbar',{name:'1 de 4 sessões concluídas'})).toHaveAttribute('aria-valuenow','25');
  expect(screen.getByText('35 min estudados de 4h planejados')).toBeInTheDocument();
  const preview=screen.getByRole('list',{name:'Sessões prioritárias'});
  expect(within(preview).getAllByRole('listitem')).toHaveLength(2);
  expect(within(preview).getByText('Em andamento')).toBeInTheDocument();
  expect(within(preview).getByText('Atrasada')).toBeInTheDocument();
  expect(within(preview).queryByText('Planejada')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Ver todas as sessões'}));
  const drawer=screen.getByRole('dialog',{name:'Sessões de hoje'});
  const rows=within(drawer).getAllByRole('listitem');
  expect(rows.map((row)=>within(row).getByText(/^Tópico /).textContent)).toEqual(['Tópico 0','Tópico 1','Tópico 2','Tópico 3']);
  fireEvent.click(within(rows[0]).getByRole('button',{name:'Registrar estudo'}));
  await waitFor(()=>expect(register).toHaveBeenCalledWith(items[0]));
  expect(screen.queryByRole('dialog',{name:'Sessões de hoje'})).not.toBeInTheDocument();
 });

 it('permite ler o tópico completo mesmo com uma sessão e indica o plano concluído',()=>{
  const item:TodaySession={
   id:'id',fonte:'cronograma_item',disciplina_id:'disc',disciplina_nome:'Português',
   topico_id:'topico',topico_nome:'Gramática '.repeat(20).trim(),data:'2026-10-12',
   hora_inicio:'08:00',hora_fim:'09:00',duracao_minutos:60,status:'concluida',
  };
  render(<MemoryRouter><DashboardTodayPlan items={[item]} onRegister={vi.fn()}/></MemoryRouter>);
  expect(screen.getByText(/Plano do dia concluído/)).toBeInTheDocument();
  expect(screen.getByText(item.topico_nome!)).toHaveClass('line-clamp-2');
  fireEvent.click(screen.getByRole('button',{name:'Ver todas as sessões'}));
  const drawer=screen.getByRole('dialog',{name:'Sessões de hoje'});
  expect(within(drawer).getByText(item.topico_nome!)).not.toHaveClass('line-clamp-2');
 });
});
