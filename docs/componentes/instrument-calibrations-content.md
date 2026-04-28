---
tags: [componente, ui, calibracao, historico]
arquivo: app/_components/instrument-calibrations-content.tsx
---

# instrument-calibrations-content

**Arquivo:** `app/_components/instrument-calibrations-content.tsx`  
**Página:** `app/instrumentos/[id]/calibracoes/page.tsx` → `/instrumentos/:id/calibracoes`  
**Tipo:** Client Component  
**Responsabilidade:** histórico de calibrações de um instrumento com filtros de período

## O que faz

- Carrega histórico via `GET /api/calibracoes?instrumentoId=<id>`
- Filtros de período: preset (`30d`, `90d`, `1y`, `all`) + datas manual (`from`/`to`)
- Inicializa filtro via `?periodo=` URL param
- Exibe cada calibração: data, nome do PDF (link para download), campos medidos via `CalibrationFieldReviewTable` (read-only)

## Estado relevante

| Estado | O que controla |
|--------|---------------|
| `selectedPeriod` | Preset de período ativo |
| `dateFrom` / `dateTo` | Datas manuais de filtro |
| `items` | Lista de `CalibrationHistoryItem` |

## Pontos de atenção

- `useSearchParams` exige `<Suspense>` no page pai
- O PDF é exibido como link de download direto da URL do Supabase Storage
- Campos de calibração renderizados via `CalibrationFieldReviewTable` com `editable=false`

## Relacionado

- [[api/calibracoes]] — `GET /api/calibracoes`
- [[modulos/calibrations]] — `CalibrationHistoryItem`, `calibrationFilterOptions`
- [[componentes/calibration-field-review-table]] — tabela de campos (read-only)
- [[arquitetura/data-layer]] — Storage dos PDFs

## Código-fonte
[[app/_components/instrument-calibrations-content.tsx]]
