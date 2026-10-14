import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {DashboardStudyProgress} from './DashboardStudyProgress';
import type {AnalysisDay} from '@/lib/dashboard/analysis';

const day = (data: string, planned: number, actual: number): AnalysisDay => ({data,minutos_planejados:planned,minutos_estudados:actual,questoes_total:0,acertos:0,acertos_pct:null});
beforeAll(() => vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
}));
afterAll(() => vi.unstubAllGlobals());
describe('barras de cumprimento diário', () => {
  it('mostra percentuais reais e consolidado ponderado e atualiza ao receber novos dados', () => {
    const days = [day('2026-10-12',60,60),day('2026-10-13',180,90),day('2026-10-14',120,0)];
    const {rerender} = render(<DashboardStudyProgress days={days}/>);
    expect(screen.getByText('Cumprimento do período: 41,7%')).toBeInTheDocument();
    expect(screen.getByRole('button',{name:/14\/10\/2026.*Meta não iniciada/})).toHaveTextContent('0%');
    rerender(<DashboardStudyProgress days={[day('2026-10-12',120,150),day('2026-10-13',0,30)]}/>);
    expect(screen.getByText('Cumprimento do período: 150%')).toBeInTheDocument();
    const exceeded = screen.getByRole('button',{name:/12\/10\/2026.*Meta superada/});
    expect(exceeded).toHaveTextContent('125%');
    expect(exceeded.querySelector('.study-progress-track')).toHaveStyle('--study-fill: 100%');
    expect(screen.getByRole('button',{name:/13\/10\/2026.*Estudo realizado sem planejamento/})).toHaveTextContent('Sem meta');
  });
  it('abre tooltip por teclado com data, tempos, restante e situação e fecha com Escape', async () => {
    const user = userEvent.setup();
    render(<DashboardStudyProgress days={[day('2026-10-13',120,90)]}/>);
    await user.tab(); // scroll region
    await user.tab(); // daily bar
    const tooltip = await screen.findByRole('tooltip');
    for (const text of ['Data: 13/10/2026','Tempo planejado: 2h','Tempo realizado: 1h 30min','Tempo restante: 30 min','Cumprimento: 75%','Situação: Meta parcialmente cumprida']) {
      expect(within(tooltip).getByText(text)).toBeInTheDocument();
    }
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });
  it('abre por hover e informa excedente sem restante negativo', async () => {
    const user = userEvent.setup();
    render(<DashboardStudyProgress days={[day('2026-10-13',120,150)]}/>);
    await user.hover(screen.getByRole('button'));
    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('Tempo excedente: 30 min')).toBeInTheDocument();
    expect(within(tooltip).queryByText(/Tempo restante/)).not.toBeInTheDocument();
  });
  it('distingue estudo sem meta e mantém o estado vazio e acesso ao cronograma', () => {
    const {rerender} = render(<MemoryRouter><DashboardStudyProgress days={[day('2026-10-13',0,30),day('2026-10-14',0,0)]}/></MemoryRouter>);
    expect(screen.getByText('Cumprimento do período: Sem meta')).toBeInTheDocument();
    expect(screen.getAllByText('Sem meta')).toHaveLength(2);
    rerender(<MemoryRouter><DashboardStudyProgress days={[]}/></MemoryRouter>);
    expect(screen.getByText('Nenhum planejamento ou estudo neste período.')).toBeInTheDocument();
    expect(screen.getByRole('link',{name:'Planejar estudos'})).toHaveAttribute('href','/cronograma');
  });
});
