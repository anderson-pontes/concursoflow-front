import {blocoDurationMinutes} from '@/lib/cronograma/constants';
import type {Bloco} from '@/lib/cronograma/types';

export function activityMinutes(bloco: Bloco): number {
  return Math.max(0, bloco.duracao_minutos ?? blocoDurationMinutes(bloco.hora_inicio, bloco.hora_fim));
}

/** Reuse names already loaded with templates, only for the same declared topics. */
export function withActivityTopics(activity: Bloco, templates: Bloco[]): Bloco {
  if (activity.topico_nomes?.length || activity.fonte !== 'bloco_semanal') return activity;
  const template = templates.find(b => b.id === (activity.bloco_cronograma_id ?? activity.id));
  if (!template?.topico_nomes?.length) return activity;
  const ids = activity.topico_ids?.length ? activity.topico_ids : activity.topico_id ? [activity.topico_id] : [];
  const sourceIds = template.topico_ids?.length ? template.topico_ids : template.topico_id ? [template.topico_id] : [];
  if (!ids.length || ids.length !== sourceIds.length || !ids.every(id => sourceIds.includes(id))) return activity;
  return {...activity, topico_nomes: template.topico_nomes};
}
