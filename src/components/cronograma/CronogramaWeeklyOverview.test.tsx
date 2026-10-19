import type {ReactNode} from 'react';
import {MemoryRouter} from 'react-router-dom';
import {render as testingRender,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,it,vi} from 'vitest';
import {CronogramaWeeklyOverview} from './CronogramaWeeklyOverview';
import type {Bloco,Planejamento} from '@/lib/cronograma/types';

const render=(ui:ReactNode)=>testingRender(<MemoryRouter>{ui}</MemoryRouter>);
const plan={disciplinas:[{disciplina_id:'d',nome:'Português',ordem:0}]} as Planejamento;
const activities=Array.from({length:16},(_,i)=>({id:`b-${i}`,disciplina_id:'d',dia_semana:'seg',hora_inicio:'',hora_fim:'',duracao_minutos:i<14?40:20,ativo:true,tipo:'estudo'} as Bloco));
it('confere 16 ocorrências totalizando 10 horas e distribui carga sem repetir os cards',async()=>{
  const onViewAll=vi.fn();
  render(<CronogramaWeeklyOverview plano={plan} activities={activities} onViewAll={onViewAll}/>);
  expect(screen.getByText('16 atividades · 10h planejadas')).toBeInTheDocument();
  expect(screen.getByRole('meter',{name:'Carga de Seg'})).toHaveAttribute('aria-valuenow','600');
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Registrar estudo'})).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'Ver lista completa'}));
  expect(onViewAll).toHaveBeenCalledOnce();
});
it('expõe falha de carregamento sem apresentar uma lista vazia como sucesso',()=>{
  const retry=vi.fn();
  render(<CronogramaWeeklyOverview plano={plan} activities={[]} error onViewAll={vi.fn()} onRetry={retry}/>);
  expect(screen.getByText('Atividades indisponíveis')).toBeInTheDocument();
  expect(screen.queryByText('Nenhuma atividade nesta semana.')).not.toBeInTheDocument();
  screen.getByRole('button',{name:'Tentar novamente'}).click();
  expect(retry).toHaveBeenCalledOnce();
});
