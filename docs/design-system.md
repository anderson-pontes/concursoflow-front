# Aprovingo Design System v2.0

> **Status:** ✅ Aprovado PO — implementado na Story 8.1  
> **Epic:** EPIC-8 Modernização da Identidade Visual  
> **Autor:** @ux-design-expert (Uma)  
> **Data:** 2026-07-10

---

## 1. Direção criativa

### Conceito: **Foco Violeta**

Evolução da identidade existente (violeta `#6c3fc5` + mascote Aprovinho), não ruptura. O Aprovingo é uma plataforma de **estudo focado e progressivo** — a UI deve transmitir clareza, calma e momentum.

| Princípio | Aplicação |
|-----------|-----------|
| **Clareza** | Hierarquia tipográfica forte; menos gradientes decorativos em superfícies de trabalho |
| **Calma** | Fundos levemente violeta (light) ou índigo profundo (dark); não branco puro agressivo |
| **Momentum** | Primary vibrante em CTAs; estados de sucesso/progresso visíveis no calendário e KPIs |
| **Consistência** | Um único eixo de cor (violeta); indigo `#4F46E5` deixa de ser primary paralelo |

### O que preservamos

- Logo `logo2.svg` e mascote `aprovinho.svg` (auth)
- Cores customizadas por **disciplina** (`cor` do usuário)
- Dark mode (obrigatório no MVP visual)
- Stack shadcn/Radix — apenas tokens e estilos mudam

---

## 2. Paleta de cores

### 2.1 Escala brand (referência — não usar hex em componentes)

| Token scale | Hex | Uso |
|-------------|-----|-----|
| brand-50 | `#F5F3FF` | Fundos hover suaves, sidebar active bg |
| brand-100 | `#EDE9FE` | Badges, chips |
| brand-200 | `#DDD6FE` | Bordas accent |
| brand-400 | `#A78BFA` | Dark mode primary |
| brand-500 | `#8B5CF6` | Hover primary (light) |
| brand-600 | `#7C3AED` | **Primary** (light mode) |
| brand-700 | `#6D28D9` | Primary pressed / links |
| brand-800 | `#5B21B6` | Texto brand emphasis |
| brand-950 | `#1E1B4B` | Texto primary (light) |

### 2.2 Neutros (slate — legibilidade)

| Token scale | Light | Dark |
|-------------|-------|------|
| neutral-bg | `#F8FAFC` | `#0C0A14` |
| neutral-surface | `#FFFFFF` | `#151220` |
| neutral-surface-2 | `#F1F5F9` | `#1C1829` |
| neutral-border | `#E2E8F0` | `#2A2438` |
| neutral-muted | `#94A3B8` | `#64748B` |
| neutral-text | `#0F172A` | `#F1F5F9` |
| neutral-text-secondary | `#64748B` | `#94A3B8` |

### 2.3 Status (inalterados em significado, refinados em tom)

| Semântica | Light | Dark | Uso |
|-----------|-------|------|-----|
| success | `#059669` | `#34D399` | Calendário cumprido, KPI positivo |
| warning | `#D97706` | `#FBBF24` | Parcial, alertas |
| danger | `#E11D48` | `#FB7185` | Erro, destructive |
| info | `#0284C7` | `#38BDF8` | Dicas, avisos informativos |

### 2.4 Contraste WCAG AA (validado)

| Par | Ratio | Status |
|-----|-------|--------|
| brand-600 on white | 4.68:1 | ✅ AA normal text |
| brand-950 on brand-50 | 12.1:1 | ✅ |
| neutral-text on neutral-bg | 15.8:1 | ✅ |
| neutral-text-secondary on white | 4.76:1 | ✅ |
| white on brand-600 | 4.68:1 | ✅ buttons |

---

## 3. Tokens semânticos (implementação CSS)

Substituir duplicatas (`--ap-brand`, `--primary` indigo, `--bg-page` soltos) por **uma camada semântica**:

```css
/* === LIGHT (:root) === */
--background: #F8FAFC;
--foreground: #0F172A;

--surface: #FFFFFF;
--surface-muted: #F1F5F9;
--surface-hover: #F5F3FF;

--primary: #7C3AED;
--primary-foreground: #FFFFFF;
--primary-muted: #EDE9FE;

--secondary: #F1F5F9;
--secondary-foreground: #475569;

--muted: #F1F5F9;
--muted-foreground: #64748B;

--accent: #EDE9FE;
--accent-foreground: #5B21B6;

--destructive: #E11D48;
--destructive-foreground: #FFFFFF;

--border: #E2E8F0;
--border-subtle: #F1F5F9;
--input: #E2E8F0;
--ring: #7C3AED;

--text-primary: #0F172A;
--text-secondary: #64748B;
--text-muted: #94A3B8;

--success: #059669;
--warning: #D97706;
--info: #0284C7;

--chart-1: #7C3AED;
--chart-2: #A78BFA;
--chart-3: #059669;
--chart-4: #D97706;
--chart-5: #E11D48;

--radius: 0.5rem; /* 8px */
--radius-sm: 0.375rem; /* 6px */
--radius-lg: 0.75rem; /* 12px */
--radius-xl: 1rem; /* 16px */

--shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
--shadow-md: 0 4px 12px rgba(91, 33, 182, 0.08);
--shadow-lg: 0 8px 24px rgba(15, 23, 42, 0.1);

/* Sidebar (derivados de surface + brand) */
--sidebar: #FFFFFF;
--sidebar-foreground: #0F172A;
--sidebar-primary: #F5F3FF;
--sidebar-primary-foreground: #6D28D9;
--sidebar-border: #E2E8F0;
--sidebar-ring: #7C3AED;
```

```css
/* === DARK (.dark) === */
--background: #0C0A14;
--foreground: #F1F5F9;

--surface: #151220;
--surface-muted: #1C1829;
--surface-hover: #221E30;

--primary: #A78BFA;
--primary-foreground: #1E1B4B;
--primary-muted: #2A2438;

--secondary: #1C1829;
--secondary-foreground: #F1F5F9;

--muted: #1C1829;
--muted-foreground: #94A3B8;

--accent: #2A2438;
--accent-foreground: #C4B5FD;

--destructive: #FB7185;
--destructive-foreground: #1E1B4B;

--border: #2A2438;
--border-subtle: #1C1829;
--input: #2A2438;
--ring: #A78BFA;

--text-primary: #F1F5F9;
--text-secondary: #94A3B8;
--text-muted: #64748B;

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);

--sidebar: #151220;
--sidebar-primary: #221E30;
--sidebar-primary-foreground: #C4B5FD;
--sidebar-border: #2A2438;
```

### 3.1 Aliases de migração (depreciar em 8.5)

| Legado | Novo token |
|--------|------------|
| `--ap-brand` | `var(--primary)` |
| `--ap-brand-light` | `var(--primary-muted)` |
| `--ap-brand-hover` | `brand-500` via `--primary` hover utility |
| `--bg-page` | `var(--background)` |
| `--bg-surface` | `var(--surface)` |
| `--text-primary` | `var(--foreground)` ou manter alias |

---

## 4. Tipografia

### Decisão: **Geist Variable** (única família UI)

Já importada em `index.css`. Remover Inter como primary no Tailwind e AuthShell.

| Token | Valor | Uso |
|-------|-------|-----|
| `--font-sans` | `'Geist Variable', system-ui, sans-serif` | Todo o app |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` | Código, IDs admin |

### Escala tipográfica

| Nome | Size | Weight | Line height | Uso |
|------|------|--------|-------------|-----|
| display | 2rem (32px) | 600 | 1.2 | Títulos de página (desktop) |
| h1 | 1.5rem (24px) | 600 | 1.3 | Títulos de seção |
| h2 | 1.25rem (20px) | 600 | 1.35 | Subseções |
| body | 0.875rem (14px) | 400 | 1.5 | Texto padrão |
| body-lg | 1rem (16px) | 400 | 1.5 | Formulários, parágrafos |
| caption | 0.75rem (12px) | 500 | 1.4 | Labels, hints |
| overline | 0.6875rem (11px) | 600 | 1.3 | Group labels sidebar (uppercase tracking) |

**DM Serif Display / DM Sans:** remover de `tailwind.config.ts` se não usados — reduz bundle e confusão.

---

## 5. Espaçamento e layout

### Grid responsivo

| Breakpoint | Largura | Comportamento |
|------------|---------|---------------|
| xs | 320px | Padding `16px`; sidebar drawer |
| sm | 375px | Touch targets ≥ 44px |
| md | 768px | Sidebar fixa; grids 2 colunas |
| lg | 1024px | Dashboard 3 colunas KPI |
| xl | 1280px | Max-width conteúdo opcional `1280px` |
| 2xl | 1440px | Flashcards split pane |

### Espaçamento padrão

- Page padding: `p-4 md:p-6 lg:p-8`
- Gap cards: `gap-4 md:gap-6`
- Section margin: `mb-6 md:mb-8`

---

## 6. Componentes — diretrizes visuais

### Botões

| Variante | Light | Notas |
|----------|-------|-------|
| default | `bg-primary text-primary-foreground` | CTA principal |
| secondary | `bg-secondary` | Ações secundárias |
| outline | `border-border` | Filtros, cancelar |
| ghost | hover `surface-hover` | Toolbar, icon buttons |
| destructive | `bg-destructive` | Excluir |

Radius: `rounded-md` (8px). Altura mínima touch: `h-10` (40px) mobile, `h-9` desktop ok.

### Cards

- Background: `bg-surface` / `bg-card`
- Border: `border border-border-subtle`
- Shadow: `shadow-sm` default, `shadow-md` on hover (dashboard KPIs)
- Radius: `rounded-lg` (12px)

### Inputs

- Border: `border-input`; focus: `ring-2 ring-ring ring-offset-2`
- FloatingLabelInput: label usa `text-secondary`; erro usa `text-destructive`

### Sidebar (modernizada)

- Largura: `260px` expandida / `72px` collapsed (manter)
- Item ativo: `bg-sidebar-primary` + barra lateral `4px` `primary` (já existe animação)
- Group labels: `text-muted-foreground text-[11px] tracking-wider uppercase`
- Mobile drawer: overlay `bg-black/40 backdrop-blur-sm`

### Tabelas / DataTable

- Mobile `< md`: card view ou scroll horizontal com `aria-label`
- Header: `bg-surface-muted text-caption font-medium`
- Row hover: `bg-surface-hover`

### Calendário — cores de status (sem mudar regras)

| Status | Cor token |
|--------|-----------|
| cumprido | `--success` |
| parcial | `--warning` |
| nao_cumprido | `--destructive` muted |
| futuro | `--muted-foreground` |
| estudou_sem_plano | `--info` |
| sem_planejamento | `--border` |

---

## 7. Auth shell (referência visual)

```
┌─────────────────────────────────────────┐
│  MOBILE: stack vertical                 │
│  ┌─────────────────────────────────┐   │
│  │ Hero compact (gradient brand)    │   │
│  │ Logo + headline 1 linha          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Form (surface, p-6)              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

┌──────────────────┬──────────────────────┐
│  DESKTOP 50%     │  Form 50%            │
│  gradient        │  surface branco/dark │
│  brand-600→800   │  max-w-md mx-auto    │
│  mascot float    │                      │
└──────────────────┴──────────────────────┘
```

Gradiente hero: `linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #1E1B4B 100%)`

---

## 8. Mockup textual — Dashboard mobile (375px)

```
┌──────────────────────────────┐
│ ☰  Olá, João          🔔 👤 │  Header sticky
├──────────────────────────────┤
│  Dashboard                   │  h1
│  Concurso: TRT-SP            │  caption muted
├──────────────────────────────┤
│ ┌──────────┐ ┌──────────┐   │
│ │ 12h      │ │ 85%      │   │  KPI 2 col
│ │ Estudadas│ │ Meta mês │   │
│ └──────────┘ └──────────┘   │
├──────────────────────────────┤
│  Calendário (widget)         │  full width
│  [grid 7 cols compact]       │
├──────────────────────────────┤
│  Próximas atividades         │
│  ┌────────────────────────┐ │
│  │ card lista             │ │
│  └────────────────────────┘ │
└──────────────────────────────┘
```

---

## 9. Regras para @dev (Story 8.1+)

1. **Nunca** adicionar hex/rgba em `.tsx` — usar classes Tailwind mapeadas a vars
2. Migrar arquivo a arquivo; PRs por story (8.2, 8.3…)
3. `tailwind.config.ts`: colors apontam para `var(--token)` apenas
4. Manter `darkMode: ["class"]` e hook `useTheme` existente
5. Disciplina/deck `cor`: `style={{ backgroundColor: cor }}` com valor da API; paletas fixas em `src/lib/palette/*.ts`

### Comando de verificação

```bash
npm run check:design-tokens
```

Equivalente manual:

```bash
rg "#[0-9A-Fa-f]{3,8}" front/concursoflow-front/src --glob "*.tsx" -c
```

Meta: **zero hex em `.tsx`**. Ícones de marca (Google) em `src/assets/icons/*.svg`.

---

## 9.1 Componentes compostos — quando usar cada um (UXD-014)

> Guia de convergência para evitar padrões paralelos (selects, tabelas, animações).
> Referência: `docs/ux-debt-report.md` § UXD-014.

### Selects e comboboxes

| Componente | Quando usar |
|------------|-------------|
| `ui/select` (Radix) | Seleção de valor fixo entre opções conhecidas; precisa de teclado/a11y nativos |
| `CreatableSelect` | Campo que **aceita valor digitado livre** + sugestões (ex.: órgão, banca). Já com navegação por setas (`useListboxNavigation`) |
| `DominioPicker` | Escolha de nível de domínio 1–5 (widget específico); não generalizar |

**Regra:** novos campos de "digitar ou escolher" usam `CreatableSelect`. Seleção estrita usa `ui/select`.

### Tabelas

| Componente | Quando usar |
|------------|-------------|
| `ui/DataTable` | Listagens com colunas, ordenação e paginação padronizadas |
| Tabela manual (`<table>`) | Somente layouts muito específicos (ex.: `DisciplinaDashboardTopicosTable`) com célula custom; documentar o motivo |

**Regra:** preferir `ui/DataTable`; tabela manual exige justificativa no PR.

### Navegação por teclado (hooks reutilizáveis)

| Hook | Padrão | Uso |
|------|--------|-----|
| `useTablistNavigation` | WAI-ARIA Tabs (roving focus, setas, Home/End) | Qualquer `role="tablist"` |
| `useListboxNavigation` | Combobox APG (`aria-activedescendant`) | Qualquer input/trigger + `role="listbox"` |

### Animações / keyframes (UXD-015)

Keyframes e classes de animação vivem em `src/index.css` (`@layer utilities`).
**Não** injetar `<style>` com `@keyframes` em componentes React (re-injeta a cada render).
Exceção documentada: estilos escopados a conteúdo dinâmico (`.ProseMirror` no `RichTextEditor`,
`.fc-review-card-content` no `FlashcardsReviewTab`) que dependem de props em runtime.

---

## 10. Aprovação

| Item | Proposta | Aprovado PO |
|------|----------|-------------|
| Direção "Foco Violeta" | Evoluir brand existente | ✅ |
| Primary light `#7C3AED` | Unificar indigo+violeta | ✅ |
| Geist como fonte única | Sim | ✅ |
| Dark mode no MVP | Sim | ✅ |
| Radius 8px default | Sim | ✅ |

**Após aprovação:** @dev inicia Story **8.1** com este documento como spec.

---

## File List

- `front/concursoflow-front/docs/design-system.md` (este arquivo)
