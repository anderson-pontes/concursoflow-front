import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { toast } from "sonner";
import { DisciplinaTopicEditor, duplicateTopicos } from "@/components/disciplinas/DisciplinaTopicEditor";
import { parseTopicosLinhas } from "@/components/disciplinas/TopicosModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { fmtPontos } from "@/lib/disciplinas/pontos";
import type { Disciplina } from "@/lib/disciplinas/types";
import { api } from "@/services/api";
import { useConcursoAtivoId, useConcursoContextError, useConcursoContextResolved } from "@/stores/concursoStore";

type Concurso = { id: string; nome: string; cargo: string | null; orgao: string };

export function DisciplinaEditor() {
  const { disciplinaId } = useParams();
  const concursoId = useConcursoAtivoId();
  const resolved = useConcursoContextResolved();
  const [contextReady, setContextReady] = useState(resolved);
  if (resolved && !contextReady) setContextReady(true);
  const contextError = useConcursoContextError();
  const { search, state: backState } = useLocation();
  const backTo = `/disciplinas${search}`;
  const query = useQuery({
    queryKey: ["disciplinas", "detail", disciplinaId],
    queryFn: async ({ signal }) => (await api.get<Disciplina>(`/disciplinas/${disciplinaId}`, { signal })).data,
    enabled: Boolean(disciplinaId),
  });

  if (!query.data && (query.isError || (!disciplinaId && !contextReady && contextError))) {
    return <div role="alert" className="space-y-3 rounded-xl border bg-card p-6">
      <p>Não foi possível carregar o cadastro.</p>
      <Button variant="outline" asChild><Link to={backTo} state={backState}>Voltar</Link></Button>
      {disciplinaId && <Button className="ml-2" onClick={() => void query.refetch()}>Tentar novamente</Button>}
    </div>;
  }
  if (disciplinaId ? !query.data : !contextReady) return <PageSkeleton cards={1} rows={3} />;

  return <DisciplinaForm key={disciplinaId ?? "nova"} disciplina={query.data} concursoId={concursoId} backTo={backTo} backState={backState} />;
}

function DisciplinaForm({ disciplina, concursoId, backTo, backState }: {
  disciplina?: Disciplina;
  concursoId: string | null;
  backTo: string;
  backState: unknown;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [original] = useState(() => ({
    nome: disciplina?.nome ?? "",
    sigla: disciplina?.sigla ?? "",
    concursoIds: disciplina?.concurso_ids ?? (concursoId ? [concursoId] : []),
  }));
  const [values, setValues] = useState(original);
  const [text, setText] = useState("");
  const [editingTopic, setEditingTopic] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const newTopics = useMemo(() => parseTopicosLinhas(text), [text]);
  const hasDuplicates = useMemo(() => duplicateTopicos(newTopics).size > 0, [newTopics]);
  const { confirmDialog, markSaved } = useUnsavedChanges(values !== original || Boolean(text) || editingTopic || saving);
  const goBack = () => navigate(backTo, { replace: true, state: backState });
  const changeTopics = useCallback((value: string) => {
    setText(value);
    setError("");
  }, []);
  const concursos = useQuery({
    queryKey: ["concursos"],
    queryFn: async ({ signal }) => (await api.get<Concurso[]>("/concursos", { signal })).data,
  });
  const linked = concursos.data?.filter((item) => values.concursoIds.includes(item.id)) ?? [];
  const title = disciplina ? "Editar disciplina" : "Cadastrar disciplina";
  const total = (disciplina?.topicos_total ?? 0) + newTopics.length;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || editingTopic || hasDuplicates) return;
    const nome = values.nome.trim();
    if (!nome) {
      setError("Informe o nome da disciplina.");
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError("");
    const payload = {
      nome,
      sigla: disciplina ? values.sigla.trim() : values.sigla.trim() || null,
      ...(disciplina && values.concursoIds === original.concursoIds ? {} : { concurso_ids: values.concursoIds }),
      novos_topicos: newTopics,
    };
    try {
      if (disciplina) await api.put(`/disciplinas/${disciplina.id}`, payload);
      else await api.post("/disciplinas", payload);
      void Promise.all([
        qc.invalidateQueries({ queryKey: ["disciplinas"] }),
        qc.invalidateQueries({ queryKey: ["edital-verticalizado"] }),
        ...(disciplina ? [
          qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplina.id] }),
          qc.invalidateQueries({ queryKey: ["topicos", disciplina.id] }),
        ] : []),
      ]);
      toast.success(disciplina ? "Disciplina atualizada." : "Disciplina cadastrada.");
      markSaved();
      goBack();
    } catch (e) {
      setError(isAxiosError(e) && e.response?.status === 409
        ? "Há tópicos repetidos ou já cadastrados nesta disciplina. Revise os novos tópicos."
        : "Não foi possível salvar. Confira os dados e tente novamente.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return <div className="mx-auto w-full min-w-0 max-w-6xl space-y-5 pb-10">
    <header className="space-y-3">
      <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={goBack}><ArrowLeft />Voltar</Button>
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><BookOpen className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="break-words text-sm text-muted-foreground">
            {linked.map((item) => `${item.orgao} — ${item.cargo ?? item.nome}`).join(" · ") || (values.concursoIds.length ? "Concurso vinculado" : "Catálogo de disciplinas")} · {total} {total === 1 ? "tópico" : "tópicos"}
          </p>
        </div>
      </div>
    </header>
    <form className="space-y-4" onSubmit={save} aria-busy={saving}>
      <fieldset disabled={saving} className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="font-semibold">Informações da disciplina</h2>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
          <label className="space-y-1.5 text-sm font-medium"><span>Nome da disciplina</span><Input required maxLength={150} value={values.nome} placeholder="Ex.: Direito Tributário" onChange={(e) => setValues({ ...values, nome: e.target.value })} /></label>
          <label className="space-y-1.5 text-sm font-medium"><span>Sigla <span className="text-muted-foreground">(opcional)</span></span><Input maxLength={10} value={values.sigla} onChange={(e) => setValues({ ...values, sigla: e.target.value })} /></label>
        </div>
        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium">Concursos e cargos vinculados</legend>
          {concursos.isLoading && <p role="status" className="text-sm text-muted-foreground">Carregando concursos…</p>}
          {concursos.isError && <Button type="button" variant="outline" onClick={() => void concursos.refetch()}>Recarregar concursos</Button>}
          {concursos.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum concurso cadastrado. A disciplina ficará no catálogo.</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {concursos.data?.map((item) => <label key={item.id} className="flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2 text-sm">
              <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary" checked={values.concursoIds.includes(item.id)} onChange={(e) => {
                const ids = e.target.checked ? [...values.concursoIds, item.id] : values.concursoIds.filter((id) => id !== item.id);
                setValues({ ...values, concursoIds: ids });
              }} />
              <span className="min-w-0 break-words">{item.orgao} — {item.cargo ?? item.nome}</span>
            </label>)}
          </div>
        </fieldset>
        {disciplina && <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-sm text-muted-foreground">
            Peso no edital: {fmtPontos(disciplina.total_pontos ?? disciplina.peso ?? null)} · Prioridade calculada: {fmtPontos(disciplina.prioridade_calculada ?? null)}
          </p>
          <Link className="inline-flex text-sm font-medium text-primary underline underline-offset-4" to={`/disciplinas/${disciplina.id}`}>Gerenciar tópicos cadastrados</Link>
        </div>}
      </fieldset>

      <DisciplinaTopicEditor value={text} onChange={changeTopics} disabled={saving} onEditingChange={setEditingTopic} />

      <footer className="sticky bottom-0 z-10 space-y-2 rounded-xl border bg-card p-3 shadow-sm">
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={goBack}>Cancelar</Button>
          <Button type="submit" disabled={saving || hasDuplicates || editingTopic}><Save />{saving ? "Salvando…" : "Salvar disciplina"}</Button>
        </div>
      </footer>
    </form>
    {confirmDialog}
  </div>;
}
