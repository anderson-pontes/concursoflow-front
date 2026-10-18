import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {describe,it,expect,vi} from 'vitest';
import {DashboardPeriodKpis,DashboardDisciplineCharts,DashboardDailyCharts} from './DashboardAnalytics';
import {DashboardTodayPlan} from './DashboardTodayPlan';
import type {DashboardAnalysis,TodaySession} from '@/lib/dashboard/analysis';
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
 it('mostra duração legível, denominador ponderado e progresso acumulado',()=>{render(<DashboardPeriodKpis data={sample}/>);expect(screen.getByText('2h 30min')).toBeInTheDocument();expect(screen.getByText('10,0%')).toBeInTheDocument();expect(screen.getByText('1 acertos em 10 questões')).toBeInTheDocument();expect(screen.getByText(/3 de 10 tópicos · acumulado atual/)).toBeInTheDocument();});
 it('distingue sem questões de zero acertos real e zero minutos',()=>{const t={...sample.totais,minutos_estudados:0,acertos:0,questoes_total:0,acertos_pct:0};const {rerender}=render(<DashboardPeriodKpis data={{...sample,totais:t}}/>);expect(screen.getByText('0 min')).toBeInTheDocument();expect(screen.getByText('Sem dados')).toBeInTheDocument();rerender(<DashboardPeriodKpis data={{...sample,totais:{...t,questoes_total:10,acertos_pct:0}}}/>);expect(screen.getByText('0,0%')).toBeInTheDocument();expect(screen.queryByText('Sem dados')).not.toBeInTheDocument();});
 it('ordena disciplinas por menor progresso e mantém acesso aos acompanhamentos',()=>{const rows=[{id:'a',nome:'Mais avançada',topicos_total:10,topicos_concluidos:8,progresso_pct:80,minutos_estudados:30,participacao_tempo_pct:100},{id:'b',nome:'Precisa atenção',topicos_total:10,topicos_concluidos:1,progresso_pct:10,minutos_estudados:0,participacao_tempo_pct:0}];render(<MemoryRouter><DashboardDisciplineCharts data={{...sample,disciplinas:rows}}/></MemoryRouter>);const links=screen.getAllByRole('link');expect(links[0]).toHaveAttribute('href','/disciplinas/b');expect(screen.getAllByRole('link',{name:'Precisa atenção'})).toHaveLength(1);expect(screen.getByText('30 min')).toBeInTheDocument();});
 it('mostra todos os status e repassa o vínculo real para registrar',()=>{const register=vi.fn();const statuses=['planejada','em_andamento','concluida','atrasada'] as const;const items:TodaySession[]=statuses.map((status,i)=>({id:`id${i}`,fonte:'cronograma_item',disciplina_id:'disc',disciplina_nome:'Português',topico_id:null,topico_nome:null,data:'2026-10-12',hora_inicio:'08:00',hora_fim:'09:00',duracao_minutos:60,status}));render(<MemoryRouter><DashboardTodayPlan items={items} onRegister={register}/></MemoryRouter>);expect(screen.getByText('1 de 4 sessões concluídas')).toBeInTheDocument();for(const label of ['Planejada','Em andamento','Concluída','Atrasada'])expect(screen.getByText(label)).toBeInTheDocument();fireEvent.click(screen.getAllByRole('button',{name:'Registrar estudo'})[0]);expect(register).toHaveBeenCalledWith(items[0]);});
});
