# Guideline — Densidade e legibilidade (Cronograma + Calendário)

> **Status:** ✅ Aprovado — implementado 2026-07-11  
> **Epic:** follow-up EPIC-11 / UX hardening  
> **Autor:** @ux-design-expert (Uma)  
> **Gate:** `npm run check:design-tokens` + `npm run typecheck`

---

## 1. Problema que resolve

Widgets de **cronograma semanal** e **calendário mensal** em grids de 7 colunas tendem a usar fontes `8px`–`10px` para caber conteúdo — resultado: ilegível, abaixo do piso de acessibilidade e inconsistente com o restante do app (`body` = 14px, `caption` = 12px).

**Regra:** nunca sacrificar legibilidade para caber em coluna estreita. Preferir **scroll horizontal** ou **menos itens visíveis** a fontes microscópicas.

---

## 2. Piso tipográfico (obrigatório)

| Papel | Tailwind | px | Quando usar |
|-------|----------|-----|-------------|
| **Dado principal** | `text-xs` ou `text-sm` | 12–14 | Nome disciplina, número do dia |
| **Dado secundário** | `text-[11px]` ou `text-xs` | 11–12 | Horário, minutos, tópico, sessões |
| **Meta / chip** | `text-[11px]` | 11 | Badges de tipo, contadores |
| **Overline** | `text-xs` uppercase | 12 | Cabeçalho Dom–Sáb, labels de seção |

### Proibido em widgets de agenda

| Classe | px | Motivo |
|--------|-----|--------|
| `text-[8px]` | 8 | Ilegível em qualquer densidade |
| `text-[9px]` | 9 | Abaixo do overline do design system |
| `text-[10px]` | 10 | Só aceitável em KPI labels uppercase com tracking — evitar em conteúdo de célula |

**Verificação:**

```bash
rg "text-\[(8|9|10)px\]" front/concursoflow-front/src/components/calendario
rg "text-\[(8|9|10)px\]" front/concursoflow-front/src/components/cronograma
rg "text-\[(8|9)px\]" front/concursoflow-front/src/pages/Dashboard.tsx
```

Meta: **zero** em conteúdo de célula/card de bloco.

---

## 3. Linguagem visual unificada — bolinha de status

Todos os blocos e dias usam **indicador circular** (`h-2 w-2 rounded-full`) alinhado à cor semântica — nunca hex inline.

### Cronograma — tipo de bloco

Helper: `getTipoDot(tipo)` em `src/lib/cronograma/constants.ts`

| Tipo | Token |
|------|-------|
| estudo | `bg-primary-500` |
| revisao | `bg-amber-500` |
| questoes | `bg-emerald-500` |
| livre | `bg-neutral-400` |
| pomodoro | `bg-rose-500` |

### Calendário — status do dia

Helper: `STATUS_DOT_CLASS[status]` em `src/lib/calendario/constants.ts`

| Status | Token |
|--------|-------|
| cumprido | `bg-emerald-500` |
| parcial | `bg-amber-500` |
| nao_cumprido | `bg-violet-400` |
| estudou_sem_plano | `bg-sky-500` |
| sem_planejamento / futuro | sem bolinha (fundo da célula basta) |

**Padrão de layout:**

```tsx
<div className="flex items-center gap-1.5">
  <span className={cn("h-2 w-2 shrink-0 rounded-full", getTipoDot(bloco.tipo))} />
  <span className="truncate text-xs font-medium">{nome}</span>
</div>
```

---

## 4. Cronograma semanal

### 4.1 Widget dashboard (`Dashboard.tsx`)

| Propriedade | Valor |
|-------------|-------|
| Grid | `grid-cols-7`, `min-w-[720px]`, scroll horizontal |
| Gap | `gap-2` |
| Altura mínima coluna | `min-h-[132px]` |
| Blocos visíveis/dia | até **3** + link "+N mais" → `/cronograma` |
| Card de bloco | `rounded-md border bg-card px-1.5 py-1 shadow-sm` |

**Conteúdo por bloco (ordem):**

1. Bolinha + nome completo da disciplina (`text-xs font-medium`)
2. Tópico opcional (`text-[11px] text-muted-foreground`)
3. Horário de início (`text-[11px] tabular-nums`)

### 4.2 Página completa (`Cronograma.tsx` + `CronogramaBlocoCard`)

| Propriedade | Valor |
|-------------|-------|
| Grid | `md:grid-cols-7`, `gap-3` — sem `min-w` forçado (desktop tem espaço) |
| Card | componente `CronogramaBlocoCard` |
| Horário | `{hora_inicio}–{hora_fim} · {minutos}` em `text-xs` |
| Ações | botões `h-7`, ícones `h-3.5`, labels `text-[11px]` |

### 4.3 Sidebar "Plano de hoje" (`Dashboard.tsx`)

Mesmo padrão do `CronogramaBlocoCard` em versão compacta:

- Bolinha de tipo (não checkbox vazio)
- Disciplina `text-xs font-semibold`
- Horário + duração + badge de tipo na mesma linha

---

## 5. Calendário mensal

### 5.1 Grade (`CalendarioMensalGrid` + `CalendarioDiaCell`)

| Propriedade | Valor |
|-------------|-------|
| `min-w` | `560px` (scroll horizontal no mobile) |
| Gap | `gap-1.5` |
| Cabeçalho semana | `text-xs font-semibold uppercase tracking-wide` |
| Célula altura | `min-h-[88px]` / `sm:min-h-[104px]` |
| Número do dia | `text-sm font-semibold tabular-nums` |
| Métricas | `text-xs` (realizado/planejado, sessões) |
| Estado vazio | "Sem estudo" em `text-xs text-muted-foreground/70` |

**Hierarquia da célula:**

```
┌─────────────────┐
│ 15          ●   │  ← dia + bolinha status
│                 │
│ 45m / 60m       │  ← métricas (mt-auto)
│ 2 sess.         │
└─────────────────┘
```

### 5.2 Resumo e legenda

| Componente | Tipografia |
|------------|------------|
| `CalendarioResumoMes` compact | `text-sm` |
| `CalendarioResumoMes` cards | labels `text-xs`, valores `text-sm` |
| `CalendarioLegenda` | título `text-sm`, itens `text-sm` |

### 5.3 Widget vs página completa

Ambos usam os **mesmos componentes** (`CalendarioMensalGrid`, `CalendarioDiaCell`). Diferença:

| Contexto | Comportamento |
|----------|---------------|
| Dashboard widget | scroll horizontal dentro da coluna principal |
| `/estudos/calendario` | scroll horizontal em mobile; grade confortável em `md+` |

---

## 6. Decisões de layout (não negociáveis)

1. **Scroll horizontal > fonte menor** — grids de 7 colunas sempre têm `overflow-x-auto` + `min-w` adequado.
2. **Truncar com reticências > abreviar palavras** — nunca `split(" ")[0]` para nome de disciplina.
3. **Limite de itens visíveis** — widget mostra 3 blocos/dia; calendário mostra métricas resumidas na célula (detalhe no dialog).
4. **Tokens Tailwind only** — cores de status via `STATUS_*` / `getTipoDot`; zero hex em `.tsx`.
5. **Dark mode** — todas as classes têm par `dark:` onde aplicável (bordas, fundos de status).

---

## 7. Componentes de referência

| Componente | Caminho |
|------------|---------|
| Célula de dia | `src/components/calendario/CalendarioDiaCell.tsx` |
| Grade mensal | `src/components/calendario/CalendarioMensalGrid.tsx` |
| Card de bloco | `src/components/cronograma/CronogramaBlocoCard.tsx` |
| Widget cronograma | `src/pages/Dashboard.tsx` (seção "Cronograma da semana") |
| Helpers tipo | `src/lib/cronograma/constants.ts` (`getTipo`, `getTipoDot`) |
| Helpers status | `src/lib/calendario/constants.ts` (`STATUS_CELL_CLASS`, `STATUS_DOT_CLASS`) |

---

## 8. Checklist PR (cronograma/calendário)

- [ ] Nenhum `text-[8px]`, `text-[9px]` em conteúdo de célula/card
- [ ] Bolinha de status presente (tipo ou dia)
- [ ] Horário visível onde há bloco de cronograma
- [ ] `min-w` + `overflow-x-auto` em grids de 7 colunas
- [ ] `npm run typecheck` verde
- [ ] `npm run check:design-tokens` verde
- [ ] Testado em 375px (mobile) e dark mode

---

## 9. Histórico

| Data | Mudança |
|------|---------|
| 2026-07-11 | Guideline criada após correção de legibilidade em Dashboard, Cronograma e Calendário (EPIC-11 follow-up) |

---

## File List

- `front/concursoflow-front/docs/guidelines-schedule-density.md` (este arquivo)
- `front/concursoflow-front/docs/design-system.md` (referência § 6.1)
