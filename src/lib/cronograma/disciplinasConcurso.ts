type DisciplinaComConcursos = {
  concurso_ids?: string[];
};

export function filtrarDisciplinasDoConcursoAtivo<T extends DisciplinaComConcursos>(
  disciplinas: T[],
  concursoAtivoId: string | null,
): T[] {
  if (!concursoAtivoId) return [];
  return disciplinas.filter((disciplina) => disciplina.concurso_ids?.includes(concursoAtivoId));
}
