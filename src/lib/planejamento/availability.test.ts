import {describe,it,expect} from "vitest";
import {dailySlots,parseDuration,planningValidation} from "@/lib/planejamento/availability";
import type {ConfigPlanejamento,DisciplinaPlanoInput} from "@/types/planejamento";
const config:ConfigPlanejamento={tipo:'ciclo',disponibilidade_minutos:{0:90},sessao_min_minutos:25,sessao_max_minutos:50,data_inicio:'2026-10-19',data_fim:'2026-10-25'};
const disciplines:DisciplinaPlanoInput[]=[{nome:'Português',ativa:true,topicos:[],peso:5,conhecimento:'regular',ordem:0}];
describe('disponibilidade semanal e compatibilidade de capacidade',()=>{
 it.each([['01:30',90],['02:00',120],['00:00',0],['00:45',45],['24:00',1440],['24:01',null],['02:60',null],['-1:30',null],['2.5',null],['',null]])('converte %s para minutos', (text,expected)=>expect(parseDuration(text)).toBe(expected));
 it.each([[20,25,50,0],[30,25,50,1],[130,25,50,3],[60,50,50,null],[100,50,50,2],[1440,25,50,29]])('divide %i conforme limites %i–%i',(n,min,max,expected)=>expect(dailySlots(n,min,max)).toBe(expected));
 it('valida dias inteiros de segunda a domingo na convenção Python',()=>{
  expect(planningValidation({...config,data_fim:'2026-10-19'},disciplines).slots).toBe(2);
  expect(planningValidation({...config,disponibilidade_minutos:{6:60},data_inicio:'2026-10-25',data_fim:'2026-10-25'},disciplines).slots).toBe(2);
  expect(planningValidation({...config,disponibilidade_minutos:{6:60},data_fim:'2026-10-19'},disciplines).errors.length).toBeGreaterThan(0);
 });
 it('avisa quando um dia será ignorado e bloqueia apenas quando não há capacidade',()=>{
  const ignored=planningValidation({...config,disponibilidade_minutos:{0:30,1:100},sessao_min_minutos:50,sessao_max_minutos:50},disciplines);
  expect(ignored.warnings).toHaveLength(1);expect(ignored.errors).toHaveLength(0);
  expect(planningValidation({...config,disponibilidade_minutos:{0:30},sessao_min_minutos:50},disciplines).errors.length).toBeGreaterThan(0);
 });
 it('bloqueia partição impossível mesmo quando o total diário supera a sessão mínima',()=>{
  expect(planningValidation({...config,disponibilidade_minutos:{0:60},sessao_min_minutos:50,sessao_max_minutos:50},disciplines).errors.join(' ')).toContain('não é possível dividir');
 });
 it.each([{disponibilidade_minutos:{}},{data_inicio:'2026-11-01'},{sessao_min_minutos:60},{sessao_max_minutos:241},{disponibilidade_minutos:{0:NaN}},{disponibilidade_minutos:{0:1441}}] as Partial<ConfigPlanejamento>[])('rejeita configuração inválida %j',patch=>expect(planningValidation({...config,...patch},disciplines).errors.length).toBeGreaterThan(0));
 it('exige ao menos um slot para cada disciplina ativa',()=>{
  expect(planningValidation({...config,disponibilidade_minutos:{0:30}},[...disciplines,{...disciplines[0],nome:'TI'}]).errors.join(' ')).toContain('cada disciplina');
 });
});
