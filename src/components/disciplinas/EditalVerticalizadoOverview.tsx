import React from "react";
import { ChevronDown, ChevronRight, CircleAlert, Clock3, FileText, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import type { Disciplina } from "@/lib/disciplinas/types";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import type { DisciplinaDashboardResponse, DisciplinaDashboardTopicoRow } from "@/types/disciplinaDashboard";
import { SelectField } from "@/components/ui/select-field";

type Filter = "todos" | "pendentes" | "concluidos" | "nunca" | "baixo" | "revisao";

export function EditalVerticalizadoOverview({ disciplinas }: { disciplinas: Disciplina[] }) {
  const [openId, setOpenId] = React.useState<string | null>(disciplinas[0]?.id ?? null);
  const [filter, setFilter] = React.useState<Filter>("todos");

  if (disciplinas.length === 0) {
    return <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center"><FileText className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">Nenhuma disciplina neste concurso</h2><p className="mt-1 text-sm text-muted-foreground">Vincule disciplinas ao concurso ativo para visualizar o edital verticalizado.</p></div>;
  }

  return (
    <section aria-labelledby="edital-verticalizado-title" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 id="edital-verticalizado-title" className="font-semibold">Edital verticalizado</h2><p className="text-sm text-muted-foreground">Expanda uma disciplina para conferir progresso, desempenho e revisões dos tópicos.</p></div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filtrar tópicos<SelectField value={filter} onValueChange={(value) => setFilter(value as Filter)} className="mt-1 min-w-48 font-medium normal-case" options={[{ value: "todos", label: "Todos" }, { value: "pendentes", label: "Pendentes" }, { value: "concluidos", label: "Concluídos" }, { value: "nunca", label: "Nunca estudados" }, { value: "baixo", label: "Baixo desempenho" }, { value: "revisao", label: "Revisão atrasada" }]} /></label>
      </div>
      <div className="space-y-3">
        {disciplinas.map((disciplina) => <DisciplinaAccordion key={disciplina.id} disciplina={disciplina} open={openId === disciplina.id} onToggle={() => setOpenId((current) => current === disciplina.id ? null : disciplina.id)} filter={filter} />)}
      </div>
    </section>
  );
}

function DisciplinaAccordion({ disciplina, open, onToggle, filter }: { disciplina: Disciplina; open: boolean; onToggle: () => void; filter: Filter }) {
  const detail = useQuery({
    queryKey: ["disciplina-dashboard", disciplina.id],
    queryFn: async () => (await api.get<DisciplinaDashboardResponse>(`/disciplinas/${disciplina.id}/dashboard`)).data,
    enabled: open,
  });
  const rows = React.useMemo(() => filterRows(detail.data?.topicos ?? [], filter), [detail.data?.topicos, filter]);
  const total = disciplina.topicos_total ?? 0;
  const studied = disciplina.topicos_estudados ?? 0;
  const progress = total ? Math.round((studied / total) * 100) : 0;

  return <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"><button type="button" aria-expanded={open} onClick={onToggle} className="flex min-h-16 w-full items-center gap-3 p-4 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">{open ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}<div className="min-w-0 flex-1"><strong className="block truncate">{disciplina.nome}</strong><span className="text-xs text-muted-foreground">{studied} de {total} tópicos estudados</span></div><div className="hidden w-36 sm:block"><div className="mb-1 flex justify-between text-xs"><span>Progresso</span><strong>{progress}%</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></div></button>{open ? <div className="border-t border-border">{detail.isLoading ? <p role="status" className="p-6 text-center text-sm text-muted-foreground">Carregando tópicos…</p> : detail.isError ? <p role="alert" className="p-6 text-center text-sm text-destructive">Não foi possível carregar esta disciplina.</p> : <><Metrics data={detail.data} /><div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="border-y border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Tópico</th><th className="px-3 py-3">Situação</th><th className="px-3 py-3">Último estudo</th><th className="px-3 py-3 text-center">Sessões</th><th className="px-3 py-3 text-center">Questões</th><th className="px-3 py-3 text-center">Desempenho</th><th className="px-3 py-3">Próxima revisão</th><th className="px-3 py-3"><span className="sr-only">Ação</span></th></tr></thead><tbody className="divide-y divide-border">{rows.map((row) => <TopicRow key={row.id} disciplinaId={disciplina.id} row={row} />)}</tbody></table>{rows.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhum tópico corresponde ao filtro selecionado.</p> : null}</div></>}</div> : null}</article>;
}

function Metrics({ data }: { data?: DisciplinaDashboardResponse }) {
  if (!data) return null;
  const metrics = [{ label: "Tempo", value: `${data.kpis.tempo_estudo_horas} h`, icon: Clock3 }, { label: "Questões", value: String(data.kpis.questoes_resolvidas_total), icon: FileText }, { label: "Desempenho", value: `${data.kpis.desempenho_geral_pct}%`, icon: Target }];
  return <div className="grid gap-2 p-4 sm:grid-cols-3">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-3 rounded-lg bg-muted/40 p-3"><Icon className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">{label}<strong className="block text-sm text-foreground">{value}</strong></span></div>)}</div>;
}

function TopicRow({ disciplinaId, row }: { disciplinaId: string; row: DisciplinaDashboardTopicoRow }) {
  const questions = row.certas + row.erradas + row.em_branco;
  return <tr><td className="max-w-sm px-4 py-3 font-medium">{row.descricao}</td><td className="px-3 py-3"><span className={cn("rounded-full px-2 py-1 text-xs font-semibold", row.concluido_edital ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>{row.concluido_edital ? "Concluído" : row.sessoes_count ? "Em andamento" : "Não iniciado"}</span></td><td className="px-3 py-3 text-muted-foreground">{formatDate(row.ultimo_estudo_em)}</td><td className="px-3 py-3 text-center">{row.sessoes_count}</td><td className="px-3 py-3 text-center">{questions}</td><td className="px-3 py-3 text-center font-semibold">{questions ? `${row.aproveitamento_pct}%` : "—"}</td><td className="px-3 py-3"><span className={cn("inline-flex items-center gap-1", isOverdue(row.proxima_revisao_em) && "font-semibold text-destructive")}>{isOverdue(row.proxima_revisao_em) ? <CircleAlert className="h-4 w-4" /> : null}{formatDate(row.proxima_revisao_em)}</span></td><td className="px-3 py-3"><Link to={`/disciplinas/${disciplinaId}?topico=${row.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted">Abrir e registrar</Link></td></tr>;
}

function filterRows(rows: DisciplinaDashboardTopicoRow[], filter: Filter) {
  const today = todayKey();
  return rows.filter((row) => {
    if (filter === "pendentes") return !row.concluido_edital;
    if (filter === "concluidos") return row.concluido_edital;
    if (filter === "nunca") return row.sessoes_count === 0;
    if (filter === "baixo") return row.certas + row.erradas + row.em_branco > 0 && row.aproveitamento_pct < 60;
    if (filter === "revisao") return Boolean(row.proxima_revisao_em && row.proxima_revisao_em.slice(0, 10) <= today);
    return true;
  });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
  return new Date(normalized).toLocaleDateString("pt-BR");
}

function isOverdue(value: string | null) {
  return Boolean(value && value.slice(0, 10) <= todayKey());
}

function todayKey() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}
