import {describe,it,expect} from 'vitest';
import {dashboardRange,percentBR,dashboardDayISO,formatDashboardDuration,resolveNextStudyStatus,todaySessionWithTimer,type TodaySession} from './analysis';
describe('períodos do dashboard',()=>{
 it('mantém semana de segunda a domingo entre anos',()=>expect(dashboardRange('week',new Date(2026,0,1))).toEqual({inicio:'2025-12-29',fim:'2026-01-04'}));
 it('mantém mês civil e janela inclusiva de 30 dias',()=>{expect(dashboardRange('month',new Date(2024,1,12))).toEqual({inicio:'2024-02-01',fim:'2024-02-29'});expect(dashboardRange('30days',new Date(2026,0,2))).toEqual({inicio:'2025-12-04',fim:'2026-01-02'});});
 it('distingue zero real de ausência e formata em pt-BR',()=>{expect(percentBR(0)).toBe('0,0%');expect(percentBR(null)).toBe('Sem dados');expect(percentBR(12.5)).toBe('12,5%');});
 it('resolve o dia do usuário independente do fuso do navegador',()=>{const instant=new Date('2027-01-01T01:00:00Z');expect(dashboardDayISO('America/Sao_Paulo',instant)).toBe('2026-12-31');expect(dashboardDayISO('UTC',instant)).toBe('2027-01-01');});
 it('mantém zero real e horas legíveis',()=>{expect(formatDashboardDuration(0)).toBe('0 min');expect(formatDashboardDuration(150)).toBe('2h 30min');});
 it('reconhece timer por vínculo e data, incluindo template, sem afetar conclusão ou outro concurso',()=>{
  const item:TodaySession={id:'dated-item',bloco_cronograma_id:'template',fonte:'cronograma_item',disciplina_id:'disc',disciplina_nome:'Português',topico_id:null,topico_nome:null,data:'2026-10-12',hora_inicio:null,hora_fim:null,duracao_minutos:60,status:'planejada'};
  const context={blocoId:'template',dataReferencia:item.data,concursoId:'contest'};
  expect(todaySessionWithTimer(item,context,'contest',true).status).toBe('em_andamento');
  expect(todaySessionWithTimer(item,{...context,concursoId:'other'},'contest',true).status).toBe('planejada');
  expect(todaySessionWithTimer(item,{...context,dataReferencia:'2026-10-13'},'contest',true).status).toBe('planejada');
  expect(todaySessionWithTimer({...item,status:'concluida'},context,'contest',true).status).toBe('concluida');
 });
 it('reaproveita o status da ocorrência exata e distingue uma repetição futura',()=>{
  const day='2026-11-24';
  const item:TodaySession={id:'template',fonte:'bloco_semanal',disciplina_id:'disc',disciplina_nome:'Português',topico_id:'topic',topico_nome:'Sintaxe',data:day,hora_inicio:'08:00',hora_fim:'09:00',duracao_minutos:60,status:'atrasada'};
  const next={item_id:item.id,fonte:item.fonte,data:day};
  expect(resolveNextStudyStatus(next,day,[item])).toBe('atrasada');
  const active=todaySessionWithTimer(item,{blocoId:item.id,concursoId:'contest',dataReferencia:day},'contest',true);
  expect(resolveNextStudyStatus(next,day,[active])).toBe('em_andamento');
  expect(resolveNextStudyStatus({...next,fonte:'cronograma_item'},day,[item])).toBeUndefined();
  expect(resolveNextStudyStatus({...next,item_id:'outro'},day,[item])).toBeUndefined();
  expect(resolveNextStudyStatus(next,day,[])).toBeUndefined();
  expect(resolveNextStudyStatus({...next,data:'2026-12-01'},day,[item])).toBe('planejada');
 });
});
