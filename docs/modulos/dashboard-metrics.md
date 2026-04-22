---
tags: [modulo, lib, dashboard]
arquivo: lib/dashboard-metrics.ts
---

# dashboard-metrics

**Arquivo:** `lib/dashboard-metrics.ts`
**Responsabilidade:** agregações do dashboard (totais, alertas, breakdown por status)

## O que faz

Carrega dados do banco e calcula as métricas do dashboard: total de instrumentos, categorias, percentual em conformidade, alertas priorizados e breakdown por tom.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `getDashboardMetrics` | ~122 | Async: carrega dados do banco e retorna `DashboardMetrics` |
| `computeDashboardMetrics` | ~72 | Pura: calcula métricas a partir de rows já carregadas (testável) |

`getDashboardMetrics` chama `loadDashboardRows` (função interna, linha ~38) que usa `supabaseAdmin` com import dinâmico para compatibilidade com Vitest.

## Tipos exportados

| Tipo | Descrição |
|------|-----------|
| `DashboardSummaryCard` | `{ title, value, note?, tone, href }` — card clicável do dashboard |
| `DashboardAlert` | `{ id, tag, title, note, badgeLabel, tone }` — alerta com link para instrumento |
| `DashboardBreakdownItem` | `{ label, count, tone }` — linha do donut chart |
| `DashboardMetrics` | Objeto completo com todos os agregados |

## Lógica de alertas

- Filtra instrumentos com `tone !== "neutral"`
- Ordena por prioridade: `danger` antes de `warning`, depois por `diffInDays` crescente
- Limita a 5 alertas no dashboard

## Relacionado

- [[modulos/instruments]] — `mapInstrumentRow` e `formatInstrumentAlertNote` usados aqui
- [[componentes/dashboard-content]] — consume `getDashboardMetrics`
- [[historico/specs/2026-04-21-b3-dashboard-navigation-design]] — spec que adicionou `id` e `href`

## Código-fonte
[[lib/dashboard-metrics.ts]]
