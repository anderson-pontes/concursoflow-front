import {expect,it} from 'vitest';
import {activityMinutes,withActivityTopics} from './activityPresentation';
import type {Bloco} from './types';

const template={id:'b',topico_ids:['a','b'],topico_nomes:['Concordância','Regência']} as Bloco;
it('reutiliza nomes já carregados somente quando o bloco e os assuntos da ocorrência coincidem',()=>{
  const activity={id:'b',fonte:'bloco_semanal',topico_ids:['a','b'],topico_nome:'2 tópicos'} as Bloco;
  expect(withActivityTopics(activity,[template]).topico_nomes).toEqual(['Concordância','Regência']);
  const changed={...activity,topico_ids:['other']};
  expect(withActivityTopics(changed,[template])).toBe(changed);
  const legacy={...activity,fonte:'cronograma_item'} as Bloco;
  expect(withActivityTopics(legacy,[template])).toBe(legacy);
});
it('preserva nomes específicos recebidos da ocorrência e duração explícita sem horário',()=>{
  const activity={id:'b',fonte:'bloco_semanal',topico_ids:['a','b'],topico_nomes:['Assunto específico'],duracao_minutos:40,hora_inicio:'',hora_fim:''} as Bloco;
  expect(withActivityTopics(activity,[template])).toBe(activity);
  expect(activityMinutes(activity)).toBe(40);
  expect(activityMinutes({...activity,duracao_minutos:undefined,hora_inicio:'08:00',hora_fim:'08:40'})).toBe(40);
});
