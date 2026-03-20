import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api } from "@/services/api";
import type { CreateDisciplinaDTO, CreatePlanoDTO, DisciplinaPlano, PlanoEstudo, PlanoStatsResponse, TopicoPlano } from "@/types/plano";

type PlanoStoreState = {
  planos: PlanoEstudo[];
  planoAtivoId: string | null;
  carregandoPlanos: boolean;
};

type PlanoStoreGetters = {
  planoAtivo: () => PlanoEstudo | null;
};

type PlanoStoreActions = {
  loadPlanos: () => Promise<void>;
  criarPlano: (data: CreatePlanoDTO) => Promise<PlanoEstudo | null>;
  editarPlano: (id: string, data: Partial<CreatePlanoDTO>) => Promise<PlanoEstudo | null>;
  excluirPlano: (id: string) => Promise<void>;
  setPlanoAtivo: (id: string) => Promise<void>;
  uploadPlanoLogo: (planoId: string, file: File) => Promise<void>;
  uploadPlanoEdital: (planoId: string, file: File) => Promise<void>;

  listarPlanoDisciplinas: (planoId: string) => Promise<DisciplinaPlano[]>;
  listarPlanoTopicos: (planoId: string, disciplinaId: string) => Promise<TopicoPlano[]>;

  adicionarDisciplina: (planoId: string, data: CreateDisciplinaDTO) => Promise<DisciplinaPlano>;
  excluirDisciplina: (planoDisciplinaId: string) => Promise<void>;

  adicionarTopico: (planoId: string, disciplinaId: string, topicoId: string) => Promise<TopicoPlano>;
  atualizarTopicoEstudado: (planoTopicoId: string, estudado: boolean) => Promise<TopicoPlano>;
  excluirTopico: (planoTopicoId: string) => Promise<void>;
};

type PlanoStore = PlanoStoreState & PlanoStoreGetters & PlanoStoreActions;

function mapPlanoStats(stats: PlanoStatsResponse) {
  return {
    disciplinas_qty: stats.disciplinas_qty,
    topicos_total: stats.topicos_total,
    topicos_estudados: stats.topicos_estudados,
    progresso_pct: stats.progresso_pct,
  };
}

function mapPlano(raw: any): PlanoEstudo {
  return {
    id: String(raw.id),
    nome: raw.nome,
    orgao: raw.orgao,
    cargo: raw.cargo,
    banca: raw.banca ?? undefined,
    dataProva: raw.data_prova ?? undefined,
    editalUrl: raw.edital_url ?? undefined,
    logoUrl: raw.logo_url ?? undefined,
    status: raw.status,
    ativo: Boolean(raw.ativo),
    stats: mapPlanoStats(raw.stats),
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

function mapDisciplina(raw: any): DisciplinaPlano {
  return {
    id: String(raw.id), // id (linha) em `plano_disciplinas`
    disciplinaId: String(raw.disciplina_id), // id global em `disciplinas`
    codigo: raw.codigo,
    nome: raw.nome,
    pesoEdital: Number(raw.peso_edital),
    cor: raw.cor ?? "#4F46E5",
    topicos: [],
  };
}

function mapTopico(raw: any): TopicoPlano {
  return {
    id: String(raw.id), // id (linha) em `plano_topicos`
    topicoId: String(raw.topico_id), // id global em `topicos`
    nome: raw.nome,
    estudado: Boolean(raw.estudado),
    dataEstudo: raw.data_estudo ? String(raw.data_estudo) : undefined,
    anotacoes: raw.anotacoes ?? undefined,
  };
}

export const usePlanoStore = create<PlanoStore>()(
  persist(
    (set, get) => ({
      planos: [],
      planoAtivoId: null,
      carregandoPlanos: false,

      planoAtivo: () => {
        const state = get();
        return state.planoAtivoId ? state.planos.find((p) => p.id === state.planoAtivoId) ?? null : null;
      },

      loadPlanos: async () => {
        if (get().carregandoPlanos) return;
        set({ carregandoPlanos: true });
        try {
          const res = await api.get("/planos");
          const planos = (res.data as any[]).map(mapPlano);
          const planoAtivo = planos.find((p) => p.ativo) ?? null;
          set({ planos, planoAtivoId: planoAtivo?.id ?? null });
        } finally {
          set({ carregandoPlanos: false });
        }
      },

      criarPlano: async (data) => {
        const res = await api.post("/planos", {
          nome: data.nome,
          orgao: data.orgao,
          cargo: data.cargo,
          banca: data.banca ?? null,
          data_prova: data.dataProva ?? null,
          edital_url: data.editalUrl ?? null,
          logo_url: data.logoUrl ?? null,
          status: data.status,
          ativo: data.ativo,
        });
        await get().loadPlanos();

        const createdId = String(res.data?.id);
        const created = get().planos.find((p) => p.id === createdId) ?? null;
        if (created?.ativo) await get().setPlanoAtivo(created.id);
        await get().loadPlanos();
        return created;
      },

      editarPlano: async (id, data) => {
        await api.put(`/planos/${id}`, {
          nome: data.nome,
          orgao: data.orgao,
          cargo: data.cargo,
          banca: data.banca ?? undefined,
          data_prova: data.dataProva ?? undefined,
          edital_url: data.editalUrl ?? undefined,
          logo_url: data.logoUrl ?? undefined,
          status: data.status,
          ativo: data.ativo,
        });
        await get().loadPlanos();

        const atualizado = get().planos.find((p) => p.id === id) ?? null;
        if (atualizado?.ativo) await get().setPlanoAtivo(atualizado.id);
        await get().loadPlanos();
        return atualizado;
      },

      excluirPlano: async (id) => {
        await api.delete(`/planos/${id}`);
        await get().loadPlanos();
      },

      setPlanoAtivo: async (id) => {
        await api.post(`/planos/${id}/ativar`);
        await get().loadPlanos();
      },

      uploadPlanoLogo: async (planoId, file) => {
        const form = new FormData();
        form.append("file", file);
        await api.post(`/planos/${planoId}/upload-logo`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await get().loadPlanos();
      },

      uploadPlanoEdital: async (planoId, file) => {
        const form = new FormData();
        form.append("file", file);
        await api.post(`/planos/${planoId}/upload-edital`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await get().loadPlanos();
      },

      listarPlanoDisciplinas: async (planoId) => {
        const res = await api.get(`/planos/${planoId}/disciplinas`);
        return (res.data as any[]).map(mapDisciplina);
      },

      listarPlanoTopicos: async (planoId, disciplinaId) => {
        const res = await api.get(`/planos/${planoId}/disciplinas/${disciplinaId}/topicos`);
        return (res.data as any[]).map(mapTopico);
      },

      adicionarDisciplina: async (planoId, data) => {
        const res = await api.post(`/planos/${planoId}/disciplinas`, {
          disciplina_id: data.disciplinaId,
          codigo: data.codigo ?? undefined,
          peso_edital: data.pesoEdital ?? undefined,
          cor: data.cor ?? undefined,
          observacoes: data.observacoes ?? undefined,
        });
        return mapDisciplina(res.data);
      },

      excluirDisciplina: async (planoDisciplinaId) => {
        await api.delete(`/planos/disciplinas/${planoDisciplinaId}`);
      },

      adicionarTopico: async (planoId, disciplinaId, topicoId) => {
        const res = await api.post(`/planos/${planoId}/disciplinas/${disciplinaId}/topicos`, {
          topico_id: topicoId,
        });
        return mapTopico(res.data);
      },

      atualizarTopicoEstudado: async (planoTopicoId, estudado) => {
        const res = await api.patch(`/planos/topicos/${planoTopicoId}`, {
          estudado,
        });
        return mapTopico(res.data);
      },

      excluirTopico: async (planoTopicoId) => {
        await api.delete(`/planos/topicos/${planoTopicoId}`);
      },
    }),
    {
      name: "cf-planos",
      partialize: (state) => ({ planoAtivoId: state.planoAtivoId }),
      version: 2,
      migrate: (persistedState) => {
        const raw = persistedState as { planoAtivoId?: string | null } | undefined;
        return {
          planos: [],
          planoAtivoId: raw?.planoAtivoId ?? null,
          carregandoPlanos: false,
        };
      },
    },
  ),
);

export function usePlanoAtivo() {
  return usePlanoStore((s) => (s.planoAtivoId ? s.planos.find((p) => p.id === s.planoAtivoId) ?? null : null));
}

