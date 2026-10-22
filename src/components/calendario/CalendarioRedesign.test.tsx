import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { CalendarioMensalGrid } from "@/components/calendario/CalendarioMensalGrid";
import { CalendarioResumoMes } from "@/components/calendario/CalendarioResumoMes";
import { CalendarioDiaDetalheDialog } from "@/components/calendario/CalendarioDiaDetalheDialog";
import { fmtDuracaoCalendario } from "@/lib/calendario/format";
import type { CalendarioDia } from "@/lib/calendario/types";
import { api } from "@/services/api";
vi.mock("@/services/api",()=>({api:{get:vi.fn()}}));
const planned=Array.from({length:5},(_,i)=>({id:`b${i}`,bloco_cronograma_id:`b${i}`,fonte:'bloco_semanal' as const,disciplina_id:`d${i}`,disciplina_nome:`Disciplina ${i}`,topico_id:`t${i}`,topico_nome:`Tópico ${i}`,duracao_minutos:30}));
const dia:CalendarioDia={data:'2026-10-25',status:'futuro',minutos_planejados:150,minutos_realizados:0,minutos_extra:0,sessoes_realizadas:0,planejado:planned};
function renderGrid(ano=2026,mes=10){return render(<CalendarioMensalGrid detailed ano={ano} mes={mes} dias={[dia]} onDiaClick={vi.fn()}/>);}
describe('calendário detalhado',()=>{
 it.each([[0,'0 min'],[59,'59 min'],[60,'1h'],[181,'3h 01min'],[990,'16h 30min']])('formata %i minutos sem alterar o valor de origem', (value,label)=>expect(fmtDuracaoCalendario(value as number)).toBe(label));
 it('usa o percentual recebido da API e apresenta os seis KPIs',()=>{
  render(<CalendarioResumoMes resumo={{dias_com_planejamento:6,dias_cumpridos:1,dias_parciais:2,dias_nao_cumpridos:1,dias_estudou_sem_plano:1,minutos_realizados:181,minutos_planejados:990,taxa_cumprimento_pct:17}}/>);
  expect(screen.getByText('17%')).toBeVisible();expect(screen.getByText('3h 01min')).toBeVisible();expect(screen.getByText('16h 30min')).toBeVisible();expect(document.querySelectorAll('[data-metric-tone]')).toHaveLength(6);
 });
 it('limita a densidade, preserva nomes completos no rótulo e não marca o futuro como pendente',()=>{
  renderGrid();const month=document.querySelector('.calendar-study-month') as HTMLElement;
  const day=month.querySelector('[data-calendar-date="2026-10-25"]') as HTMLElement;
  expect(day.getAttribute('aria-label')).toContain('Planejado');expect(day.getAttribute('aria-label')).not.toContain('Pendente');
  expect(within(day).getByText('+3 disciplinas · Ver estudos')).toBeInTheDocument();expect(within(day).queryByText('Disciplina 4')).not.toBeInTheDocument();expect(day.getAttribute('aria-label')).toContain('Disciplina 4');
 });
 it.each([[2024,2,29],[2025,2,28],[2026,4,30],[2026,10,31]])('monta corretamente %i/%i com %i dias',(ano,mes,total)=>{
  renderGrid(ano,mes);expect(document.querySelectorAll('.calendar-study-month [data-calendar-date]')).toHaveLength(total);
 });
 it('permite consultar dias vazios na agenda com a mesma fonte de dados',async()=>{
  renderGrid();const agenda=screen.getByRole('region',{name:'Agenda de estudos do mês'});const before=within(agenda).getAllByRole('button').length;
  await userEvent.click(within(agenda).getByRole('button',{name:'Mostrar dias vazios'}));expect(within(agenda).getAllByRole('button').length).toBeGreaterThan(before);expect(within(agenda).getByRole('button',{name:'Ocultar dias vazios'})).toHaveAttribute('aria-pressed','true');
 });
 it('preserva tópicos/ações nos detalhes, não oferece registro futuro e fecha com Escape',async()=>{
  const futureDate='2099-10-25';
  vi.mocked(api.get).mockResolvedValue({data:{data:futureDate,status:dia.status,timezone:'America/Sao_Paulo',totais:{planejados:150,realizados:0,extra:0},planejado:planned,realizado:[]}});
  const onClose=vi.fn(),onEditar=vi.fn(),onRemover=vi.fn();
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><CalendarioDiaDetalheDialog enhanced data={futureDate} concursoId="c1" open onClose={onClose} onEditarBloco={onEditar} onRemoverBloco={onRemover} onRegistrar={vi.fn()}/></MemoryRouter></QueryClientProvider>);
  expect(await screen.findByText('Tópico 4')).toBeVisible();expect(screen.queryByRole('button',{name:'Registrar estudo'})).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'Editar Disciplina 0'}));expect(onEditar).toHaveBeenCalledWith('b0');
  await userEvent.click(screen.getByRole('button',{name:'Remover Disciplina 0'}));expect(onRemover).toHaveBeenCalledWith('b0');
  expect(screen.getByRole('link',{name:'Ver no cronograma'})).toHaveAttribute('href','/cronograma');await userEvent.keyboard('{Escape}');expect(onClose).toHaveBeenCalled();
 });
});
