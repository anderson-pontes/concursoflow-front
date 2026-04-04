# Aprovingo — Frontend (SPA)

Interface web do **Aprovingo**: gestão de planos de estudo, disciplinas, questões, cronograma, Pomodoro/cronômetro, flashcards estilo Anki, simulados, avisos e dashboard com KPIs.

## Stack

- **React 18** + **TypeScript**
- **Vite 5** (dev server e build)
- **React Router v6**
- **TanStack Query (React Query)** — cache e sincronização com a API
- **Zustand** — estado global (auth, plano ativo, Pomodoro, etc.)
- **Axios** — cliente HTTP (`/api/v1` com interceptors de token)
- **Tailwind CSS 3** — estilização utilitária
- **Radix UI / shadcn** — componentes acessíveis (dialog, etc.)
- **Tiptap** — editor rich text nos flashcards
- **Lucide React** — ícones
- **Sonner** — toasts
- **Recharts** — gráficos (onde aplicável)
- **React Hook Form + Zod** — formulários e validação

## Requisitos

- **Node.js 20+**
- **npm** (ou pnpm/yarn, ajustando comandos)

## Estrutura do projeto

```
frontend/
├── public/
├── src/
│   ├── main.tsx              # Entrada React + BrowserRouter
│   ├── App.tsx               # Rotas principais
│   ├── index.css             # Estilos globais / Tailwind
│   ├── assets/               # SVGs, imagens estáticas
│   ├── components/
│   │   ├── layout/           # Layout, sidebar, header
│   │   ├── dashboard/        # KPIs, heatmap, estatísticas do plano
│   │   ├── flashcards/       # RichTextEditor, modais de baralho/cartão
│   │   ├── disciplinas/, estudos/, planos/, pomodoro/, ui/, ...
│   ├── pages/                # Páginas por rota
│   ├── services/
│   │   └── api.ts            # Instância Axios + refresh token
│   ├── stores/               # Zustand (authStore, planoStore, pomodoroStore, ...)
│   ├── hooks/, lib/, types/
├── vite.config.ts            # Alias @ → src, proxy /api e /uploads
├── tailwind.config.*, postcss.config.*
├── tsconfig.json
└── package.json
```

## Instalação

```bash
cd frontend
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Por padrão o Vite sobe em **`http://localhost:3000`** (`strictPort: true`).

### Proxy para o backend

Em `vite.config.ts`, em desenvolvimento:

- **`/api`** → `http://localhost:8000` (API FastAPI em `/api/v1` vira `/api/v1` no browser)
- **`/uploads`** → `http://localhost:8000` (imagens enviadas pelo backend, ex. flashcards)

Garanta que o backend esteja rodando na porta configurada (geralmente **8000**).

## Build e preview de produção

```bash
npm run build      # tsc -b && vite build → saída em dist/
npm run preview    # servidor estático de teste na porta 3000
```

Em produção, o servidor que entrega o `dist/` deve:

- Servir o SPA nas rotas do React Router (fallback para `index.html`).
- **Ou** fazer proxy reverso de `/api` e `/uploads` para a mesma origem da API, para evitar CORS e quebrar URLs relativas de uploads.

## Variáveis de ambiente

O cliente usa caminhos relativos (`baseURL: "/api/v1"` em `src/services/api.ts`). Não é obrigatório `.env` para o fluxo local com proxy.

Se precisar apontar para outra origem (ex.: API em outro host), ajuste `api.ts` ou use variáveis `import.meta.env.VITE_*` e configure `vite.config` conforme a política de deploy.

## Rotas principais (`App.tsx`)

| Rota | Descrição |
|------|-----------|
| `/`, `/login`, `/register` | Redirecionamento e autenticação |
| `/dashboard` | KPIs, heatmap, **Desempenho do plano** (filtros disciplina/ano/mês) |
| `/perfil` | Perfil do usuário |
| `/concursos` | Concursos |
| `/concursos/planos`, `/concursos/planos/:id` | Planos de estudo e detalhe |
| `/disciplinas`, `/disciplinas/:disciplinaId` | Lista e dashboard da disciplina |
| `/cronograma` | Cronograma semanal |
| `/pomodoro` | Pomodoro / cronômetro e registro de estudo |
| `/questoes` | Registro de questões |
| `/simulados` | Simulados |
| `/avisos` | Avisos |
| `/flashcards` | Baralhos, revisão, configuração Anki, editor rich text |
| `/materiais` | Materiais |
| `/admin/estudos` | Área administrativa de estudos |

Rotas autenticadas usam `Layout` com `requireAuth` conforme o estado do `authStore`.

## Autenticação

- Tokens armazenados no **Zustand** (`authStore`), com persistência conforme implementação atual.
- O **Axios** anexa `Authorization: Bearer <access_token>` e tenta **refresh** em 401 antes de falhar.

## Scripts úteis (`package.json`)

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento Vite |
| `npm run build` | Typecheck + build de produção |
| `npm run preview` | Preview do build |
| `npm run typecheck` | Apenas `tsc -b` |

## Qualidade e padrões

- **TypeScript** estrito no build (`tsc -b`).
- Componentes e páginas alinhados a **Tailwind** e padrões do projeto (cards, modais, `cn()` em `lib/utils`).

## Docker

O `docker-compose.yml` na raiz do monorepo pode subir o serviço `frontend` com build em `./frontend`. Consulte o README da raiz e o Dockerfile do frontend para detalhes de imagem e porta.

---

Documentação da API: com o backend rodando, acesse **`http://localhost:8000/docs`**.  
README do backend: `../backend/README.md`. Visão geral do monorepo: `../README.md`.
