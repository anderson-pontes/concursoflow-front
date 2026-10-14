import {describe, expect, it} from 'vitest';
import {formatStudyPercent, periodStudyProgress, studyProgress} from './studyProgress';

describe('cumprimento de estudos', () => {
  it.each([
    [120,90,75,75,30,0,'Meta parcialmente cumprida'],
    [120,120,100,100,0,0,'Meta atingida'],
    [120,150,125,100,0,30,'Meta superada'],
    [120,0,0,0,120,0,'Meta não iniciada'],
    [0,0,null,0,null,null,'Sem meta'],
    [0,30,null,0,null,null,'Sem meta'],
  ])('planejado %s / realizado %s', (planned, actual, percent, fill, remaining, excess, status) => {
    expect(studyProgress(planned,actual)).toEqual({percent,fill,remaining,excess,status});
  });
  it('pondera pelo tempo planejado e inclui estudo sem meta no total', () => {
    const days = [{minutos_planejados:60,minutos_estudados:60},{minutos_planejados:180,minutos_estudados:90}];
    expect(periodStudyProgress(days)).toBe(62.5);
    expect(periodStudyProgress([...days,{minutos_planejados:0,minutos_estudados:30}])).toBe(75);
    expect(periodStudyProgress([])).toBeNull();
    expect(periodStudyProgress([{minutos_planejados:0,minutos_estudados:30}])).toBeNull();
  });
  it('formata sem meta, zero e percentuais reais', () => {
    expect(formatStudyPercent(null)).toBe('Sem meta');
    expect(formatStudyPercent(0)).toBe('0%');
    expect(formatStudyPercent(125)).toBe('125%');
    expect(formatStudyPercent(62.5)).toBe('62,5%');
  });
});
