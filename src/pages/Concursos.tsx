import React from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ConcursoDetalheModal } from "@/components/concursos/ConcursoDetalheModal";
import { ConcursoCardSkeleton } from "@/components/concursos/ConcursoCardSkeleton";
import { ConcursoListCard } from "@/components/concursos/ConcursoListCard";
import {
  ConcursosEmptyState,
  ConcursosHeader,
  ConcursosSummaryBar,
  ConcursosToolbar,
} from "@/components/concursos/ConcursosToolbar";
import { ModalConcurso, type ConcursoFormInput, type ConcursoSaveFeedback } from "@/components/concursos/ModalConcurso";
import type { DocumentKind } from "@/components/concursos/DocumentUploadCard";
import {
  DEFAULT_CONCURSO_INPUT,
  type Concurso,
  type ConcursoStatusFilter,
} from "@/lib/concursos/types";
import { getProximaProva, isEncerradoStatus } from "@/lib/concursos/utils";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import type { Disciplina } from "@/lib/disciplinas/types";

function buildPayload({ nome, orgao, cargo, banca, data_prova, status }: Omit<ConcursoFormInput, "logo_file" | "edital_file">) {
  return { nome, orgao, cargo, banca, data_prova, status };
}

function saveErrorMessage(error: unknown, kind?: DocumentKind) {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (!status) return "Falha na comunicação com o servidor. Tente novamente.";
    if (status === 401 || status === 403) return "Sua sessão não permite concluir o cadastro. Entre novamente.";
    if (status === 413) return "O arquivo excede o limite de tamanho aceito pelo servidor.";
    const detail = error.response?.data?.detail;
    if (status < 500 && typeof detail === "string") return detail;
  }
  return kind ? "Não foi possível armazenar o arquivo. Tente novamente." : "Não foi possível salvar o concurso. Tente novamente.";
}

export function Concursos() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: concursos,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["concursos"],
    queryFn: async () => (await api.get("/concursos")).data as Concurso[],
  });

  const { data: disciplinas = [], isSuccess: disciplinasLoaded } = useQuery({
    queryKey: ["disciplinas", "catalog"],
    queryFn: async () => (await api.get("/disciplinas")).data as Disciplina[],
  });

  const disciplinasCountByConcurso = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const d of disciplinas) {
      for (const cid of d.concurso_ids) {
        m.set(cid, (m.get(cid) ?? 0) + 1);
      }
    }
    return m;
  }, [disciplinas]);

  const orgaoSuggestions = React.useMemo(() => {
    const s = new Set<string>();
    (concursos ?? []).forEach((c) => {
      if (c.orgao?.trim()) s.add(c.orgao.trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [concursos]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Concurso | null>(null);
  const [input, setInput] = React.useState<ConcursoFormInput>(DEFAULT_CONCURSO_INPUT);
  const [saveState, setSaveState] = React.useState({ contest: null as Concurso | null, baseline: DEFAULT_CONCURSO_INPUT });
  const [uploading, setUploading] = React.useState<DocumentKind | null>(null);
  const [saveError, setSaveError] = React.useState<ConcursoSaveFeedback | null>(null);
  const saving = React.useRef(false);
  const [detalhe, setDetalhe] = React.useState<Concurso | null>(null);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ConcursoStatusFilter>("todos");

  const filteredConcursos = React.useMemo(() => {
    const list = concursos ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (statusFilter === "ativos" && isEncerradoStatus(c.status)) return false;
      if (statusFilter === "encerrados" && !isEncerradoStatus(c.status)) return false;
      if (!q) return true;
      const hay = [c.nome, c.orgao, c.cargo, c.banca].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [concursos, search, statusFilter]);

  const totalCadastrados = concursos?.length ?? 0;
  const totalAtivos = concursos?.filter((c) => !isEncerradoStatus(c.status)).length ?? 0;

  const openCreate = () => {
    setEditing(null);
    setInput(DEFAULT_CONCURSO_INPUT);
    setSaveState({ contest: null, baseline: DEFAULT_CONCURSO_INPUT });
    setSaveError(null);
    setIsModalOpen(true);
  };

  React.useEffect(() => {
    if (searchParams.get("novo") !== "manual") return;
    openCreate();
    setSearchParams({}, { replace: true });
    // Executa apenas quando a URL solicita explicitamente o fluxo manual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openEdit = (c: Concurso) => {
    setEditing(c);
    const baseline = {
      ...buildPayload(c),
      logo_file: null,
      edital_file: null,
    };
    setInput(baseline);
    setSaveState({ contest: c, baseline });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setInput(DEFAULT_CONCURSO_INPUT);
    setSaveState({ contest: null, baseline: DEFAULT_CONCURSO_INPUT });
    setSaveError(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: ConcursoFormInput) => {
      let { contest, baseline } = saveState;
      let currentUpload: DocumentKind | undefined;
      const payload = buildPayload(values);
      try {
        if (!contest || JSON.stringify(payload) !== JSON.stringify(buildPayload(baseline))) {
          const response = contest
            ? await api.put<Concurso>(`/concursos/${contest.id}`, payload)
            : await api.post<Concurso>("/concursos", payload);
          contest = response.data;
          baseline = { ...baseline, ...payload };
          setSaveState({ contest, baseline });
        }
        const contestId = contest.id;

        for (const kind of ["logo", "edital"] as const) {
          const key = `${kind}_file` as const;
          const file = values[key];
          if (!file || file === baseline[key]) continue;
          currentUpload = kind;
          setUploading(kind);
          const form = new FormData();
          form.append("file", file);
          const response = await api.post<Concurso>(`/concursos/${contestId}/upload-${kind}`, form);
          contest = response.data;
          baseline = { ...baseline, [key]: file };
          setSaveState({ contest, baseline });
        }
      } catch (error) {
        setSaveError({
          kind: currentUpload,
          file: currentUpload ? values[`${currentUpload}_file`] : null,
          message: saveErrorMessage(error, currentUpload),
        });
        throw error;
      } finally {
        setUploading(null);
      }
    },
    onSuccess: () => {
      closeModal();
      toast.success(editing ? "Concurso atualizado!" : "Concurso criado com sucesso!");
    },
    onSettled: () => {
      saving.current = false;
      void qc.invalidateQueries({ queryKey: ["concursos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/concursos/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concursos"] });
    },
  });

  const submitForm = () => {
    if (saving.current) return;
    saving.current = true;
    setSaveError(null);
    saveMutation.mutate(input);
  };

  const showSkeleton = isLoading;
  const listRefreshing = isFetching && !isLoading;

  return (
    <div className="min-h-full space-y-6 pb-8 font-sans">
      <ConcursosHeader onCreate={openCreate} onChooseCatalog={() => navigate("/planos/novo")} />
      <ConcursosSummaryBar totalCadastrados={totalCadastrados} totalAtivos={totalAtivos} proximaProva={getProximaProva(concursos ?? [])} loading={isLoading} unavailable={isError && !concursos} />
      <ConcursosToolbar
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
      />

      {isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Erro ao carregar"}
        </div>
      ) : null}

      {showSkeleton ? (
        <div aria-label="Carregando concursos" className="grid grid-cols-1 gap-5 min-[900px]:grid-cols-2 min-[1440px]:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ConcursoCardSkeleton key={i} />
          ))}
        </div>
      ) : isError && !concursos ? null : !concursos?.length ? (
        <ConcursosEmptyState onCreate={openCreate} onChooseCatalog={() => navigate("/planos/novo")} />
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 items-stretch gap-5 min-[900px]:grid-cols-2 min-[1440px]:grid-cols-3",
            filteredConcursos.length === 1 && "[&>article]:min-[900px]:col-span-2 [&>article]:min-[900px]:max-w-2xl",
            listRefreshing && "opacity-70 transition-opacity duration-200",
          )}
        >
          {filteredConcursos.length === 0 ? (
            <div className="col-span-full rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-12 text-center text-sm text-[var(--text-secondary)] shadow-sm">
              Nenhum concurso encontrado com os filtros atuais.
            </div>
          ) : null}
          {filteredConcursos.map((c) => {
            const count = disciplinasCountByConcurso.get(c.id) ?? 0;
            const cardTotals = {
              disciplinasCount: disciplinasLoaded ? count : null,
              questoesTotal: null,
              acertoMedioPct: null,
            };

            return (
              <ConcursoListCard
                key={c.id}
                concurso={c}
                cardTotals={cardTotals}
                deletePending={deleteMutation.isPending}
                onViewDetails={() => setDetalhe(c)}
                onEdit={() => openEdit(c)}
                onConfirmDelete={() => deleteMutation.mutate(c.id)}
              />
            );
          })}
        </div>
      )}

      <ModalConcurso
        open={isModalOpen}
        onClose={closeModal}
        editing={Boolean(editing)}
        input={input}
        baseline={saveState.baseline}
        setInput={setInput}
        onSubmit={submitForm}
        isPending={saveMutation.isPending}
        uploading={uploading}
        storedUrls={{ logo: saveState.contest?.logo_url ?? null, edital: saveState.contest?.edital_url ?? null }}
        error={saveError}
        orgaoSuggestions={orgaoSuggestions}
      />

      <ConcursoDetalheModal
        concurso={detalhe}
        onClose={() => setDetalhe(null)}
        onEdit={
          detalhe
            ? () => {
                const c = detalhe;
                setDetalhe(null);
                openEdit(c);
              }
            : undefined
        }
      />
    </div>
  );
}
