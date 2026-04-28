---
tags: [componente, ui, dashboard]
arquivo: app/_components/dashboard-content.tsx
---

# dashboard-content

**Arquivo:** `app/_components/dashboard-content.tsx`
**Tipo:** Server Component (RSC)
**Responsabilidade:** renderiza o dashboard com métricas navegáveis

## O que faz

Carrega `DashboardMetrics` via `getDashboardMetrics()` (server-side) e renderiza:
- Cards de resumo clicáveis (Total instrumentos → `/instrumentos`, Categorias → `/categorias`)
- Lista de alertas com dois alvos de clique:
  - Área principal do card → `/instrumentos/{id}` (detalhe)
  - Botão "Registrar calibração" → `/instrumentos/{id}/calibracoes/nova`
- Donut chart com legenda clicável (cada linha → `/instrumentos?status={tone}`)

## Mapeamento de tons para status de filtro

| `item.tone` do dashboard | `?status=` na URL |
|--------------------------|-------------------|
| `"ok"` | `neutral` |
| `"warning"` | `warning` |
| `"danger"` | `danger` |

Este mapeamento existe porque `DashboardBreakdownItem` usa `"ok"` enquanto o filtro de instrumentos usa `"neutral"`.

## Pontos de atenção

- É RSC — não usar hooks de cliente aqui
- `breakdownToneToStatus` está em escopo de módulo (não dentro do componente) para evitar recriação
- Links são `next/link` com `<Link>` — não `<a>`
- O grid do `.dashboard-alert-item` tem 2 colunas: `__main` (link detalhe) e `__calibrate` (botão calibrar)

## Relacionado

- [[modulos/dashboard-metrics]] — fonte dos dados
- [[componentes/instruments-content]] — destino dos links de status
- [[historico/specs/2026-04-21-b3-dashboard-navigation-design]] — spec original dos links
- [[superpowers/specs/2026-04-25-b4-calibration-shortcuts-design]] — spec do botão "Registrar calibração"

## Código-fonte
[[app/_components/dashboard-content.tsx]]
