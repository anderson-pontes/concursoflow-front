import React from "react";
import { createPortal } from "react-dom";
import { Calendar, Check, Info, Minus, Plus, Search, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import { createCategoria, listCategorias } from "@/services/categorias";
import { getRevisoesConfig } from "@/services/revisoesConfig";
import { usePlanoAtivo, usePlanoStore } from "@/stores/planoStore";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultDisciplinaId?: string | null;
  /** Quando definido, o modal carrega a sessão e salva com PATCH. */
  sessaoId?: string | null;
  onSaved?: () => void;
};

type DisciplinaOpt = { id: string; nome: string };
type TopicoOpt = { id: string; nome: string; status?: string };

type SessaoEstudoApi = {
  id: string;
  disciplina_id: string;
  topico_id: string | null;
  topico_ids: string[];
  plano_id: string | null;
  categoria_id: string | null;
  data_referencia: string | null;
  inicio: string;
  fim: string | null;
  duracao_minutos: number;
  tempo_estudo_segundos: number;
  material: string | null;
  comentarios: string | null;
  teoria_finalizada: boolean;
  contabilizar_no_planejamento: boolean;
  programar_revisoes: boolean;
  revisoes_dias: number[];
  questoes_acertos: number;
  questoes_erros: number;
  questoes_em_branco: number;
  paginas_blocos: { inicio: number; fim: number }[];
};

const NOVA_CATEGORIA_VALUE = "__nova_categoria__";
/** Valor sentinela para o Select de disciplina quando nada está selecionado */
const NONE_DISCIPLINA = "__none_disciplina__";
const PRIMARY = "#534AB7";

function fmtDateValue(kind: "hoje" | "ontem" | "outro", custom: string) {
  if (kind === "outro") return custom;
  const d = new Date();
  if (kind === "ontem") d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function hmsToSeconds(hours: number, minutes: number, seconds: number) {
  return hours * 3600 + minutes * 60 + seconds;
}

function fmtHms(hours: number, minutes: number, seconds: number) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type TimeSegmentProps = {
  label: string;
  value: number;
  onInc: () => void;
  onDec: () => void;
};

function TimeSegment({ label, value, onInc, onDec }: TimeSegmentProps) {
  return (
    <div className="flex-1 rounded-lg border-[0.5px] border-slate-200/90 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onDec}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border-[0.5px] border-slate-300 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          aria-label={`Diminuir ${label.toLowerCase()}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-neutral-100">{String(value).padStart(2, "0")}</span>
        <button
          type="button"
          onClick={onInc}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border-[0.5px] border-slate-300 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          aria-label={`Aumentar ${label.toLowerCase()}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function RegistroEstudoModal({ open, onClose, defaultDisciplinaId, sessaoId, onSaved }: Props) {
  const qc = useQueryClient();
  const planoAtivo = usePlanoAtivo();
  const listarPlanoDisciplinas = usePlanoStore((s) => s.listarPlanoDisciplinas);

  const [dateKind, setDateKind] = React.useState<"hoje" | "ontem" | "outro">("hoje");
  const [dateCustom, setDateCustom] = React.useState(new Date().toISOString().slice(0, 10));

  const [categoriaId, setCategoriaId] = React.useState("");
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

  React.useEffect(() => {
    if (!open) return;
    if (sessaoId) return;
    setHours(0);
    setMinutes(25);
    setSeconds(0);
    setSelectedTopicos([]);
    setTopicoBusca("");
    setMaterial("");
    setComentarios("");
    setTeoriaFinalizada(false);
    setContabilizar(true);
    setProgramarRevisoes(false);
    setAcertos(0);
    setErros(0);
    setBranco(0);
    setPaginas([{ inicio: "", fim: "" }]);
    setSaveAndNew(false);
    setDisciplinaId(defaultDisciplinaId ?? "");
    setDateKind("hoje");
    setDateCustom(new Date().toISOString().slice(0, 10));
  }, [open, sessaoId, defaultDisciplinaId]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
    queryKey: ["registro-disciplinas", planoAtivo?.id],
    enabled: open && Boolean(planoAtivo?.id),
    queryFn: async () => {
      const rows = await listarPlanoDisciplinas(planoAtivo!.id);
      return rows.map((r) => ({ id: r.disciplinaId, nome: r.nome })) as DisciplinaOpt[];
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
  }, [topicos, sessaoData?.id]);

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
    const showAll = programarRevisoes || acertos > 0 || erros > 0 || branco > 0;
    if (showAll) return list;
    return list.filter((t) => t.status !== "dominado");
  }, [topicos, programarRevisoes, acertos, erros, branco]);

  const filteredTopicos = React.useMemo(() => {
    const term = topicoBusca.trim().toLowerCase();
    if (!term) return listaTopicosCheckbox;
    return listaTopicosCheckbox.filter((t) => t.nome.toLowerCase().includes(term));
  }, [listaTopicosCheckbox, topicoBusca]);

  const isTopicoSelected = React.useCallback(
    (id: string) => selectedTopicos.some((t) => t.id === id),
    [selectedTopicos],
  );

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
        plano_id: sessaoId && sessaoData ? sessaoData.plano_id : (planoAtivo?.id ?? null),
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
      if (sessaoId) {
        qc.invalidateQueries({ queryKey: ["sessao-estudo", sessaoId] });
      }
      if (disciplinaId) {
        qc.invalidateQueries({ queryKey: ["topicos", disciplinaId] });
        qc.invalidateQueries({ queryKey: ["disciplina-topicos-registro", disciplinaId] });
      }
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
      const nome = window.prompt("Nome da nova categoria");
      if (nome?.trim()) createCategoriaMutation.mutate(nome.trim());
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

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-labelledby="registro-estudo-titulo">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl border-[0.5px] border-slate-200/90 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-950">
        <div className="border-b border-[0.5px] border-slate-200/90 px-6 py-5 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 id="registro-estudo-titulo" className="text-2xl font-semibold text-slate-900 dark:text-neutral-100">
              {sessaoId ? "Editar registro de estudo" : "Registro de estudo"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border-[0.5px] border-slate-300 p-1.5 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative space-y-5 px-6 pt-5 pb-10">
          {sessaoId && loadingSessao ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 dark:bg-neutral-950/80">
              <p className="text-sm font-medium text-slate-600 dark:text-neutral-300">Carregando registro…</p>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: PRIMARY }} aria-hidden />
            {(["hoje", "ontem", "outro"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setDateKind(k)}
                className={`rounded-lg border-[0.5px] px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  dateKind === k
                    ? "border-transparent text-white"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                }`}
                style={dateKind === k ? { backgroundColor: PRIMARY } : undefined}
              >
                {k === "hoje" ? "Hoje" : k === "ontem" ? "Ontem" : "Outro"}
              </button>
            ))}
            {dateKind === "outro" ? (
              <input
                type="date"
                value={dateCustom}
                onChange={(e) => setDateCustom(e.target.value)}
                className="rounded-lg border-[0.5px] border-slate-300 px-3 py-1.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-900"
              />
            ) : null}
          </div>

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

          <section className="rounded-xl border-[0.5px] border-slate-200/90 bg-slate-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Tempo de estudo</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <TimeSegment label="Horas" value={hours} onInc={incHours} onDec={decHours} />
              <TimeSegment label="Minutos" value={minutes} onInc={incMinutes} onDec={decMinutes} />
              <TimeSegment label="Segundos" value={seconds} onInc={incSeconds} onDec={decSeconds} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold" style={{ color: PRIMARY }}>
                {tempoDisplay}
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">Total registrado</span>
            </div>
          </section>

          <section className="rounded-xl border-[0.5px] border-slate-200/90 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Tópicos estudados</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-neutral-500">
              Tópicos já concluídos no edital ficam ocultos aqui, exceto se você marcar &quot;Programar revisões&quot; ou preencher questões
              (certas/erradas/branco) — aí todos aparecem para revisão ou registro de desempenho.
            </p>

            <div className="mt-2 rounded-lg border-[0.5px] border-slate-300 px-3 py-2 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={topicoBusca}
                  onChange={(e) => setTopicoBusca(e.target.value)}
                  placeholder="Buscar tópico..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border-[0.5px] border-slate-200/90 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              {filteredTopicos.length === 0 ? (
                <p className="px-3 py-4 text-sm text-slate-500">Nenhum tópico encontrado.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {filteredTopicos.map((topico, idx) => (
                    <li key={topico.id} className="flex items-center gap-3 px-3 py-2">
                      <Checkbox
                        checked={isTopicoSelected(topico.id)}
                        onCheckedChange={() => toggleTopico(topico)}
                        aria-label={`Selecionar tópico ${topico.nome}`}
                        className="mt-0.5"
                      />
                      <span className="w-4 text-xs text-slate-400">{idx + 1}</span>
                      <span className="text-sm text-slate-800 dark:text-neutral-200">{topico.nome}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">{selectedTopicos.length} selecionado(s)</p>
              <div className="flex items-center gap-2">
                <input
                  value={novoTopicoNome}
                  onChange={(e) => setNovoTopicoNome(e.target.value)}
                  placeholder="Novo tópico"
                  className="h-9 rounded-lg border-[0.5px] border-slate-300 px-2.5 text-xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nome = novoTopicoNome.trim();
                    if (!nome) return;
                    if (!disciplinaId) {
                      toast.error("Selecione uma disciplina para criar tópico.");
                      return;
                    }
                    createTopicoMutation.mutate(nome);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[0.5px] border-slate-300 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <Plus className="h-3.5 w-3.5" /> Novo tópico
                </button>
              </div>
            </div>

            {selectedTopicos.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTopicos.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 rounded-full border-[0.5px] border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
                  >
                    <Check className="h-3 w-3" />
                    {t.nome}
                    <button type="button" onClick={() => setSelectedTopicos((s) => s.filter((x) => x.id !== t.id))} className="rounded p-0.5 hover:bg-violet-200/70 dark:hover:bg-violet-900" aria-label={`Remover ${t.nome}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Material</span>
              <input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="mt-1.5 w-full rounded-lg border-[0.5px] border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900"
                placeholder="Ex: Livro, PDF, apostila..."
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Comentários</span>
              <input
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                className="mt-1.5 w-full rounded-lg border-[0.5px] border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900"
                placeholder="Observações sobre o estudo"
              />
            </label>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border-[0.5px] border-slate-200/90 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Questões</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Certas</span>
                  <input
                    type="number"
                    min={0}
                    value={acertos}
                    onChange={(e) => setAcertos(Number(e.target.value || 0))}
                    className="rounded-md border-[0.5px] border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">Erradas</span>
                  <input
                    type="number"
                    min={0}
                    value={erros}
                    onChange={(e) => setErros(Number(e.target.value || 0))}
                    className="rounded-md border-[0.5px] border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Em branco</span>
                  <input
                    type="number"
                    min={0}
                    value={branco}
                    onChange={(e) => setBranco(Number(e.target.value || 0))}
                    className="rounded-md border-[0.5px] border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border-[0.5px] border-slate-200/90 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Páginas</p>
              {paginas.map((p, i) => (
                <div key={i} className="mt-2 grid grid-cols-2 gap-2">
                  <input value={p.inicio} onChange={(e) => setPaginas((s) => s.map((x, idx) => (idx === i ? { ...x, inicio: e.target.value } : x)))} placeholder="Início" className="rounded-md border-[0.5px] border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-primary-500 dark:border-neutral-700 dark:bg-neutral-900" />
                  <input value={p.fim} onChange={(e) => setPaginas((s) => s.map((x, idx) => (idx === i ? { ...x, fim: e.target.value } : x)))} placeholder="Fim" className="rounded-md border-[0.5px] border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-primary-500 dark:border-neutral-700 dark:bg-neutral-900" />
                </div>
              ))}
              <button type="button" onClick={() => setPaginas((s) => [...s, { inicio: "", fim: "" }])} className="mt-2 inline-flex items-center gap-1 rounded-md border-[0.5px] border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800">
                <Plus className="h-3 w-3" />
                Linha
              </button>
            </div>

            <div className="rounded-xl border-[0.5px] border-slate-200/90 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revisões</p>
              {programarRevisoes ? (
                <>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[...new Set(revisoesDias)]
                      .sort((a, b) => a - b)
                      .map((d) => (
                        <span key={d} className="inline-flex items-center gap-1 rounded-full border-[0.5px] border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-800 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200">
                          D+{d}
                          <button type="button" onClick={() => setRevisoesDias((s) => s.filter((x) => x !== d))} className="rounded p-0.5 hover:bg-violet-200/70 dark:hover:bg-violet-900" aria-label={`Remover dia ${d}`}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input type="number" min={1} value={novoDiaRevisao} onChange={(e) => setNovoDiaRevisao(e.target.value)} placeholder="Dia" className="h-8 w-20 rounded-md border-[0.5px] border-slate-300 px-2 text-sm outline-none focus:border-primary-500 dark:border-neutral-700 dark:bg-neutral-900" />
                    <button type="button" onClick={addDiaRevisao} className="h-8 rounded-md border-[0.5px] border-slate-300 px-2.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800">Adicionar</button>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Ative &quot;Programar revisões&quot; para definir os dias.</p>
              )}
            </div>
          </div>

          <section
            className="mt-10 rounded-xl border-[0.5px] border-slate-200/90 bg-slate-50/80 p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900/55"
            aria-labelledby="registro-opcoes-titulo"
          >
            <h3 id="registro-opcoes-titulo" className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
              Opções do registro
            </h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-10 sm:gap-y-4">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="registro-teoria-finalizada"
                  className="mt-0.5"
                  checked={teoriaFinalizada}
                  onCheckedChange={(v) => setTeoriaFinalizada(v === true)}
                />
                <Label htmlFor="registro-teoria-finalizada" className="cursor-pointer pt-0.5 text-sm font-normal leading-snug text-slate-700 dark:text-neutral-300">
                  Teoria finalizada
                </Label>
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="registro-contabilizar-planejamento"
                  className="mt-0.5"
                  checked={contabilizar}
                  onCheckedChange={(v) => setContabilizar(v === true)}
                />
                <Label
                  htmlFor="registro-contabilizar-planejamento"
                  className="inline-flex cursor-pointer items-center gap-1.5 pt-0.5 text-sm font-normal leading-snug text-slate-700 dark:text-neutral-300"
                >
                  Contabilizar no planejamento
                  <Info className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-neutral-500" aria-hidden />
                </Label>
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="registro-programar-revisoes"
                  className="mt-0.5"
                  checked={programarRevisoes}
                  onCheckedChange={(v) => setProgramarRevisoes(v === true)}
                />
                <Label htmlFor="registro-programar-revisoes" className="cursor-pointer pt-0.5 text-sm font-normal leading-snug text-slate-700 dark:text-neutral-300">
                  Programar revisões
                </Label>
              </div>
              {!sessaoId ? (
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="registro-salvar-e-novo"
                    className="mt-0.5"
                    checked={saveAndNew}
                    onCheckedChange={(v) => setSaveAndNew(v === true)}
                  />
                  <Label htmlFor="registro-salvar-e-novo" className="cursor-pointer pt-0.5 text-sm font-normal leading-snug text-slate-700 dark:text-neutral-300">
                    Salvar e criar novo
                  </Label>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[0.5px] border-slate-200/90 px-6 py-5 dark:border-neutral-800">
          <button type="button" onClick={onClose} className="rounded-xl border-[0.5px] border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!disciplinaId) {
                toast.error("Selecione uma disciplina");
                return;
              }
              const seg = hmsToSeconds(hours, minutes, seconds);
              if (seg <= 0) {
                toast.error("Informe um tempo de estudo maior que zero");
                return;
              }
              if (seg > 24 * 3600) {
                toast.error("O tempo máximo é 24 horas");
                return;
              }
              saveMutation.mutate();
            }}
            disabled={saveMutation.isPending || (Boolean(sessaoId) && loadingSessao)}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
            style={{ backgroundColor: PRIMARY }}
          >
            {sessaoId ? "Salvar alterações" : "Salvar registro"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

