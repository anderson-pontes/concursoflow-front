export const pageLinks = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Meus Concursos", to: "/concursos" },
  { label: "Meu Cronograma", to: "/cronograma" },
  { label: "Disciplinas", to: "/disciplinas" },
  { label: "Edital verticalizado", to: "/disciplinas?view=edital" },
  { label: "Pomodoro", to: "/pomodoro" },
  { label: "Calendário", to: "/estudos/calendario" },
  { label: "Histórico de estudos", to: "/estudos/historico" },
  { label: "Revisões", to: "/revisoes" },
  { label: "Flashcards", to: "/flashcards" },
  { label: "Mapas mentais", to: "/mapas-mentais" },
  { label: "Avisos", to: "/avisos" },
  { label: "Configurações de estudo", to: "/configuracoes/estudos" },
  { label: "Meu perfil", to: "/perfil" },
] as const;

export function pageBreadcrumb(path: string): { label: string; parent?: { label: string; to: string } } {
  if (path.startsWith("/admin/editais")) return { label: path === "/admin/editais" ? "Catálogo de editais" : "Editar edital", parent: { label: "Administração", to: "/admin/editais" } };
  if (path.startsWith("/admin/usuarios")) return { label: path === "/admin/usuarios" ? "Gestão de usuários" : "Detalhes do usuário", parent: { label: "Administração", to: "/admin/usuarios" } };
  if (path.startsWith("/disciplinas/")) return { label: "Detalhes da disciplina", parent: { label: "Disciplinas", to: "/disciplinas" } };
  if (path.startsWith("/planos/")) return { label: path.endsWith("/replanejar") ? "Replanejar estudos" : "Meu plano de estudos", parent: { label: "Meus Concursos", to: "/concursos" } };
  if (path.startsWith("/editais/")) return { label: "Ativar edital", parent: { label: "Meus Concursos", to: "/concursos" } };
  return { label: pageLinks.find(page => page.to === path)?.label ?? "Clickedital" };
}
