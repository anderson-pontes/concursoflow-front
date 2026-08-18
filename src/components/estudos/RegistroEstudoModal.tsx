import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invalidateEstudosQueries } from "@/lib/estudos/invalidateQueries";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { createCategoria, listCategorias } from "@/services/categorias";
import { getRevisoesConfig } from "@/services/revisoesConfig";
import { useConcursoAtivoId } from "@/stores/concursoStore";
import { RegistroTopicosSection } from "@/components/estudos/RegistroTopicosSection";
import { RegistroDetalhesSection, RegistroOptionsSection } from "@/components/estudos/RegistroDetalhesSections";
import { NovaCategoriaDialog, RegistroDateSelector, RegistroModalFooter, RegistroModalHeader } from "@/components/estudos/RegistroModalChrome";
import { dedupeTopicosPorId, fmtDateValue, fmtHms, hmsToSeconds, NONE_DISCIPLINA, NOVA_CATEGORIA_VALUE, TimeSegment, type DisciplinaOpt, type RegistroEstudoModalProps, type SessaoEstudoApi, type TopicoOpt } from "@/components/estudos/registroEstudoSupport";

export type { RegistroDefaultTopico } from "@/components/estudos/registroEstudoSupport";

export function RegistroEstudoModal({
  open,
  onClose,
  defaultDisciplinaId,
  defaultConcursoId,
  defaultTopicos,
  defaultDuracaoSegundos,
  defaultAcertos,
  defaultErros,
  defaultBranco,
  sessaoId,
  defaultDataReferencia,
  onSaved,
}: RegistroEstudoModalProps) {
  const qc = useQueryClient();
  const concursoAtivoId = useConcursoAtivoId();

  const [dateKind, setDateKind] = React.useState<"hoje" | "ontem" | "outro">("hoje");
  const [dateCustom, setDateCustom] = React.useState(new Date().toISOString().slice(0, 10));

  const [categoriaId, setCategoriaId] = React.useState("");
  const [novaCategoriaOpen, setNovaCategoriaOpen] = React.useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = React.useState("");
  const [modalidade, setModalidade] = React.useState<"teoria" | "questoes" | "revisao">("teoria");
  const [disciplinaId, setDisciplinaId] = React.useState(defaultDisciplinaId ?? "");

  const [hours, setHours] = React.useState(0);
  const [minutes, setMinutes] = React.useState(25);
  const [seconds, setSeconds] = React.useState(0);

  const [selectedTopicos, setSelectedTopicos] = React.useState<TopicoOpt[]>([]);
  const [topicoBusca, setTopicoBusca] = React.useState("");
  const [novoTopicoNome, setNovoTopicoNome] = React.useState("");

  const [material, setMaterial] = React.useState("");
  const [comentarios, setComentarios] = React.useState("");
  const [teoriaFinalizada, setTeoriaFinalizada] = React.useState(false);
  const [contabilizar, setContabilizar] = React.useState(true);
  const [programarRevisoes, setProgramarRevisoes] = React.useState(false);
  const [saveAndNew, setSaveAndNew] = React.useState(false);

  const [revisoesDias, setRevisoesDias] = React.useState<number[]>([1, 7, 30, 60, 120]);
  const [novoDiaRevisao, setNovoDiaRevisao] = React.useState("");

  const [acertos, setAcertos] = React.useState(0);
  const [erros, setErros] = React.useState(0);
  const [branco, setBranco] = React.useState(0);
  const [paginas, setPaginas] = React.useState([{ inicio: "", fim: "" }]);

  const tempoDisplay = React.useMemo(() => fmtHms(hours, minutes, seconds), [hours, minutes, seconds]);

  const defaultTopicosSignature = (defaultTopicos ?? [])
    .map((t) => `${t.id}:${t.nome}`)
    .sort()
    .join(";");

  React.useEffect(() => {
    if (!open) return;
    if (sessaoId) return;
    const totalSeg = defaultDuracaoSegundos ?? 0;
    setHours(Math.floor(totalSeg / 3600));
    setMinutes(totalSeg > 0 ? Math.floor((totalSeg % 3600) / 60) : 25);
    setSeconds(totalSeg > 0 ? totalSeg % 60 : 0);
    setSelectedTopicos(dedupeTopicosPorId(defaultTopicos ?? []));
    setTopicoBusca("");
    setMaterial("");
    setComentarios("");
    setTeoriaFinalizada(false);
    setModalidade("teoria");
    setContabilizar(true);
    setProgramarRevisoes(false);
    setAcertos(defaultAcertos ?? 0);
    setErros(defaultErros ?? 0);
    setBranco(defaultBranco ?? 0);
    setPaginas([{ inicio: "", fim: "" }]);
    setSaveAndNew(false);
    setDisciplinaId(defaultDisciplinaId ?? "");
    if (defaultDataReferencia) {
      setDateKind("outro");
      setDateCustom(defaultDataReferencia);
    } else {
      setDateKind("hoje");
      setDateCustom(new Date().toISOString().slice(0, 10));
    }
  }, [
    open,
    sessaoId,
    defaultDisciplinaId,
    defaultTopicos,
    defaultTopicosSignature,
    defaultDuracaoSegundos,
    defaultAcertos,
    defaultErros,
    defaultBranco,
    defaultDataReferencia,
  ]);

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
    enabled: open,
  });

  const { data: revisoesCfg } = useQuery({
    queryKey: ["revisoes-config"],
    queryFn: getRevisoesConfig,
    enabled: open,
  });

  const { data: disciplinas } = useQuery({
    queryKey: ["registro-disciplinas", concursoAtivoId],
    enabled: open && Boolean(concursoAtivoId),
    queryFn: async () => {
      const rows = (await api.get("/disciplinas", { params: { concurso_id: concursoAtivoId } })).data as Array<{
        id: string;
        nome: string;
      }>;
      return rows.map((r) => ({ id: r.id, nome: r.nome })) as DisciplinaOpt[];
    },
  });

  const { data: topicos } = useQuery({
    queryKey: ["disciplina-topicos-registro", disciplinaId],
    enabled: open && Boolean(disciplinaId),
    queryFn: async () => {
      const res = await api.get(`/disciplinas/${disciplinaId}/topicos`);
      const rows = res.data as { id: string; descricao: string; status: string }[];
      return rows.map((t) => ({
        id: String(t.id),
        nome: t.descricao,
        status: t.status,
      })) as TopicoOpt[];
    },
  });

  const { data: sessaoData, isLoading: loadingSessao } = useQuery({
    queryKey: ["sessao-estudo", sessaoId],
    queryFn: async () => (await api.get(`/sessoes-estudo/${sessaoId}`)).data as SessaoEstudoApi,
    enabled: open && Boolean(sessaoId),
  });

  const hydratedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!open || !sessaoId) {
      hydratedRef.current = null;
      return;
    }
    if (!sessaoData) return;
    if (hydratedRef.current === sessaoData.id) return;
    hydratedRef.current = sessaoData.id;
    setDisciplinaId(sessaoData.disciplina_id);
    if (sessaoData.categoria_id) setCategoriaId(sessaoData.categoria_id);
    const refDate =
      sessaoData.data_referencia?.slice(0, 10) ?? new Date(sessaoData.inicio).toISOString().slice(0, 10);
    setDateKind("outro");
    setDateCustom(refDate);
    const seg = sessaoData.tempo_estudo_segundos ?? 0;
    setHours(Math.floor(seg / 3600));
    setMinutes(Math.floor((seg % 3600) / 60));
    setSeconds(seg % 60);
    setMaterial(sessaoData.material ?? "");
    setComentarios(sessaoData.comentarios ?? "");
    setTeoriaFinalizada(sessaoData.teoria_finalizada);
    setModalidade(sessaoData.modalidade ?? (sessaoData.questoes_acertos + sessaoData.questoes_erros + sessaoData.questoes_em_branco > 0 ? "questoes" : "teoria"));
    setContabilizar(sessaoData.contabilizar_no_planejamento);
    setProgramarRevisoes(sessaoData.programar_revisoes);
    setRevisoesDias(
      sessaoData.revisoes_dias?.length ? [...sessaoData.revisoes_dias] : [1, 7, 30, 60, 120],
    );
    setAcertos(sessaoData.questoes_acertos);
    setErros(sessaoData.questoes_erros);
    setBranco(sessaoData.questoes_em_branco);
    const pags = (sessaoData.paginas_blocos ?? []).map((b) => ({
      inicio: String(b.inicio),
      fim: String(b.fim),
    }));
    setPaginas(pags.length ? pags : [{ inicio: "", fim: "" }]);
    const ids =
      sessaoData.topico_ids?.length > 0
        ? sessaoData.topico_ids
        : sessaoData.topico_id
          ? [sessaoData.topico_id]
          : [];
    setSelectedTopicos(
      ids.map((id) => ({
        id,
        nome: (topicos ?? []).find((t) => t.id === id)?.nome ?? "Tópico",
        status: (topicos ?? []).find((t) => t.id === id)?.status,
      })),
    );
  }, [open, sessaoId, sessaoData, topicos]);

  React.useEffect(() => {
    if (!sessaoData || !topicos?.length) return;
    setSelectedTopicos((prev) =>
      prev.map((p) => ({
        ...p,
        nome: topicos.find((t) => t.id === p.id)?.nome ?? p.nome,
        status: topicos.find((t) => t.id === p.id)?.status ?? p.status,
      })),
    );
  }, [topicos, sessaoData]);

  React.useEffect(() => {
    if (!categoriaId && categorias?.length) setCategoriaId(categorias[0].id);
  }, [categorias, categoriaId]);

  React.useEffect(() => {
    if (revisoesCfg?.dias?.length) setRevisoesDias(revisoesCfg.dias);
  }, [revisoesCfg]);

  React.useEffect(() => {
    setSelectedTopicos([]);
    setTopicoBusca("");
  }, [disciplinaId]);

  const listaTopicosCheckbox = React.useMemo(() => {
    const list = topicos ?? [];
    const nomeCategoria = categorias?.find((c) => c.id === categoriaId)?.nome?.trim().toLowerCase();
    const isCategoriaTeoria = nomeCategoria === "teoria";
    if (!isCategoriaTeoria) return list;
    return list.filter((t) => t.status !== "dominado");
  }, [topicos, categorias, categoriaId]);

  const filteredTopicos = React.useMemo(() => {
    const term = topicoBusca.trim().toLowerCase();
    if (!term) return listaTopicosCheckbox;
    return listaTopicosCheckbox.filter((t) => t.nome.toLowerCase().includes(term));
  }, [listaTopicosCheckbox, topicoBusca]);

  const toggleTopico = (topico: TopicoOpt) => {
    setSelectedTopicos((prev) =>
      prev.some((t) => t.id === topico.id) ? prev.filter((t) => t.id !== topico.id) : [...prev, topico],
    );
  };

  const createCategoriaMutation = useMutation({
    mutationFn: (nome: string) => createCategoria(nome),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["categorias"] });
      setCategoriaId(c.id);
      setNovaCategoriaOpen(false);
      setNovaCategoriaNome("");
      toast.success("Categoria criada.");
    },
    onError: () => toast.error("Não foi possível criar a categoria."),
  });

  const createTopicoMutation = useMutation({
    mutationFn: async (descricao: string) => {
      const res = await api.post(`/disciplinas/${disciplinaId}/topicos`, {
        descricao,
        status: "nao_iniciado",
        numero_ordem: 0,
      });
      return res.data as { id: string; descricao: string };
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["disciplina-topicos-registro", disciplinaId] });
      setSelectedTopicos((s) => [...s, { id: row.id, nome: row.descricao, status: "nao_iniciado" }]);
      setNovoTopicoNome("");
      toast.success("Tópico criado.");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const baseDate = fmtDateValue(dateKind, dateCustom);
      const now = new Date();
      const segundos = hmsToSeconds(hours, minutes, seconds);
      let inicio: Date;
      if (sessaoId && sessaoData) {
        const o = new Date(sessaoData.inicio);
        const [y, mo, d] = baseDate.split("-").map(Number);
        inicio = new Date(y, mo - 1, d, o.getHours(), o.getMinutes(), o.getSeconds());
      } else {
        inicio = new Date(`${baseDate}T${now.toTimeString().slice(0, 8)}`);
      }
      const fim = new Date(inicio.getTime() + segundos * 1000);

      const body = {
        disciplina_id: disciplinaId,
        topico_id: selectedTopicos[0]?.id ?? null,
        topico_ids: selectedTopicos.map((t) => t.id),
        plano_id: sessaoId && sessaoData ? sessaoData.plano_id : null,
        concurso_id: defaultConcursoId ?? concursoAtivoId ?? (sessaoId && sessaoData ? sessaoData.concurso_id : null),
        modalidade,
        categoria_id: categoriaId || null,
        data_referencia: baseDate,
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        duracao_minutos: Math.max(1, Math.floor(segundos / 60)),
        tempo_estudo_segundos: segundos,
        tipo: "livre",
        material: material || null,
        teoria_finalizada: teoriaFinalizada,
        contabilizar_no_planejamento: contabilizar,
        programar_revisoes: programarRevisoes,
        revisoes_dias: programarRevisoes ? [...new Set(revisoesDias)].sort((a, b) => a - b) : [],
        questoes_acertos: acertos,
        questoes_erros: erros,
        questoes_em_branco: branco,
        paginas_blocos: paginas
          .filter((p) => p.inicio && p.fim)
          .map((p) => ({ inicio: Number(p.inicio), fim: Number(p.fim) })),
        videoaulas_blocos: [] as unknown[],
        comentarios: comentarios || null,
      };

      if (sessaoId) {
        await api.patch(`/sessoes-estudo/${sessaoId}`, body);
      } else {
        await api.post("/sessoes-estudo", body);
      }
    },
    onSuccess: () => {
      toast.success(sessaoId ? "Registro atualizado" : "Registro salvo");
      qc.invalidateQueries({ queryKey: ["disciplina-dashboard"] });
      qc.invalidateQueries({ queryKey: ["topico-sessoes"] });
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
      if (sessaoId) {
        qc.invalidateQueries({ queryKey: ["sessao-estudo", sessaoId] });
      }
      if (disciplinaId) {
        qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
        qc.invalidateQueries({ queryKey: ["disciplina-topicos-registro", disciplinaId] });
      }
      invalidateEstudosQueries(qc);
      onSaved?.();
      if (sessaoId) {
        onClose();
        return;
      }
      if (saveAndNew) {
        setHours(0);
        setMinutes(25);
        setSeconds(0);
        setMaterial("");
        setComentarios("");
        setSelectedTopicos([]);
        setPaginas([{ inicio: "", fim: "" }]);
      } else {
        onClose();
      }
    },
  });

  const handleCategoriaSelectValue = (v: string) => {
    if (v === NOVA_CATEGORIA_VALUE) {
      setNovaCategoriaNome("");
      setNovaCategoriaOpen(true);
      return;
    }
    setCategoriaId(v);
  };

  const incHours = () => setHours((h) => Math.min(24, h + 1));
  const decHours = () => setHours((h) => Math.max(0, h - 1));

  const incMinutes = () =>
    setMinutes((m) => {
      if (hours >= 24) return 0;
      return m >= 55 ? 55 : m + 5;
    });
  const decMinutes = () => setMinutes((m) => (m <= 0 ? 0 : m - 5));

  const incSeconds = () =>
    setSeconds((s) => {
      if (hours >= 24) return 0;
      return s >= 45 ? 45 : s + 15;
    });
  const decSeconds = () => setSeconds((s) => (s <= 0 ? 0 : s - 15));

  const addDiaRevisao = () => {
    const n = Number(novoDiaRevisao.trim());
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Informe um número de dias válido.");
      return;
    }
    setRevisoesDias((dias) => (dias.includes(n) ? dias : [...dias, n].sort((a, b) => a - b)));
    setNovoDiaRevisao("");
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        hideClose
        aria-describedby={undefined}
        className="block max-h-[94vh] w-full max-w-4xl gap-0 overflow-y-auto rounded-2xl border-[0.5px] border-slate-200/90 bg-white p-0 shadow-2xl dark:border-neutral-700 dark:bg-neutral-950"
      >
        <RegistroModalHeader editing={Boolean(sessaoId)} onClose={onClose} />

        <div className="relative space-y-5 px-6 pt-5 pb-10">
          {sessaoId && loadingSessao ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 dark:bg-neutral-950/80">
              <p className="text-sm font-medium text-slate-600 dark:text-neutral-300">Carregando registro…</p>
            </div>
          ) : null}
          <RegistroDateSelector kind={dateKind} customDate={dateCustom} onKindChange={setDateKind} onCustomDateChange={setDateCustom} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Categoria</span>
              <div className="mt-1.5">
                <Select
                  value={categoriaId || undefined}
                  onValueChange={handleCategoriaSelectValue}
                  disabled={createCategoriaMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categorias ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                    <SelectItem value={NOVA_CATEGORIA_VALUE}>+ Nova categoria…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Disciplina</span>
              <div className="mt-1.5">
                <Select
                  value={disciplinaId ? disciplinaId : NONE_DISCIPLINA}
                  onValueChange={(v) => setDisciplinaId(v === NONE_DISCIPLINA ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_DISCIPLINA}>Selecione…</SelectItem>
                    {(disciplinas ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Modalidade do estudo</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([['teoria', 'Teoria'], ['questoes', 'Questões'], ['revisao', 'Revisão']] as const).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={modalidade === value} onClick={() => setModalidade(value)} className={cn("min-h-11 rounded-lg border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", modalidade === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted")}>{label}</button>
              ))}
            </div>
          </fieldset>

          <section className="rounded-xl border-[0.5px] border-slate-200/90 bg-slate-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Tempo de estudo</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <TimeSegment label="Horas" value={hours} onInc={incHours} onDec={decHours} />
              <TimeSegment label="Minutos" value={minutes} onInc={incMinutes} onDec={decMinutes} />
              <TimeSegment label="Segundos" value={seconds} onInc={incSeconds} onDec={decSeconds} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-primary">
                {tempoDisplay}
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">Total registrado</span>
            </div>
          </section>

          <RegistroTopicosSection
            topics={filteredTopicos}
            selected={selectedTopicos}
            search={topicoBusca}
            newTopic={novoTopicoNome}
            onSearchChange={setTopicoBusca}
            onNewTopicChange={setNovoTopicoNome}
            onToggle={toggleTopico}
            onRemove={(id) => setSelectedTopicos((current) => current.filter((topic) => topic.id !== id))}
            onCreate={() => {
              const nome = novoTopicoNome.trim();
              if (!disciplinaId) {
                toast.error("Selecione uma disciplina para criar tópico.");
                return;
              }
              createTopicoMutation.mutate(nome);
            }}
          />

          <RegistroDetalhesSection material={material} comments={comentarios} correct={acertos} wrong={erros} blank={branco} pages={paginas} scheduleReviews={programarRevisoes} reviewDays={revisoesDias} newReviewDay={novoDiaRevisao} onMaterialChange={setMaterial} onCommentsChange={setComentarios} onCorrectChange={setAcertos} onWrongChange={setErros} onBlankChange={setBranco} onPagesChange={setPaginas} onReviewDaysChange={setRevisoesDias} onNewReviewDayChange={setNovoDiaRevisao} onAddReviewDay={addDiaRevisao} />

          <RegistroOptionsSection completedTheory={teoriaFinalizada} countInPlan={contabilizar} scheduleReviews={programarRevisoes} saveAndNew={saveAndNew} editing={Boolean(sessaoId)} onCompletedTheoryChange={setTeoriaFinalizada} onCountInPlanChange={setContabilizar} onScheduleReviewsChange={setProgramarRevisoes} onSaveAndNewChange={setSaveAndNew} />
        </div>

        <RegistroModalFooter
          editing={Boolean(sessaoId)}
          busy={saveMutation.isPending || (Boolean(sessaoId) && loadingSessao)}
          onClose={onClose}
          onSave={() => {
            if (!disciplinaId) return void toast.error("Selecione uma disciplina");
            const totalSeconds = hmsToSeconds(hours, minutes, seconds);
            if (totalSeconds <= 0) return void toast.error("Informe um tempo de estudo maior que zero");
            if (totalSeconds > 24 * 3600) return void toast.error("O tempo máximo é 24 horas");
            saveMutation.mutate();
          }}
        />
      </DialogContent>
    </Dialog>

    <NovaCategoriaDialog open={novaCategoriaOpen} name={novaCategoriaNome} busy={createCategoriaMutation.isPending} onOpenChange={setNovaCategoriaOpen} onNameChange={setNovaCategoriaNome} onSubmit={() => { const nome = novaCategoriaNome.trim(); if (nome) createCategoriaMutation.mutate(nome); }} />
    </>
  );
}

