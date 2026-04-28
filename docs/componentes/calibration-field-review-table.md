---
tags: [componente, ui, calibracao, tabela]
arquivo: app/_components/calibration-field-review-table.tsx
---

# calibration-field-review-table

**Arquivo:** `app/_components/calibration-field-review-table.tsx`  
**Tipo:** Client Component (puro — sem fetch próprio)  
**Responsabilidade:** tabela de campos de calibração com suporte a edição, badges de confiança e campos derivados

## O que faz

Renderiza os campos de calibração em dois layouts:
- **Flat** — tabela linear simples (sem grupos)
- **Agrupado** — seções por `groupName` + `subgroupName`

Suporta dois modos por prop:
- `editable=true` — inputs de texto + select de conformidade por campo
- `editable=false` (padrão) — valores só-leitura

## Props principais

| Prop | Tipo | Default | O que faz |
|------|------|---------|-----------|
| `rows` | `CalibrationFieldReviewTableRow[]` | — | Campos a renderizar |
| `editable` | `boolean` | `false` | Habilita edição inline |
| `showConfidenceIndicators` | `boolean` | `false` | Exibe badges de confiança após extração IA |
| `showStatusColumn` | `boolean` | `false` | Coluna "Conforme/Não conforme" |
| `onValueChange` | `fn(rowId, value)` | — | Callback de edição de valor |
| `onStatusChange` | `fn(rowId, status)` | — | Callback de edição de status |

## Badges de confiança (quando `showConfidenceIndicators=true`)

| Badge | Condição |
|-------|----------|
| `"baixa confiança"` (amarelo) | `confidence < 0.7` |
| `"não encontrado"` (cinza) | `value` vazio + `confidence` null |
| Sem badge | Campos `autoCalculated` nunca recebem badge |

## Pontos de atenção

- Campos com `autoCalculated=true` são bloqueados para edição (input desabilitado)
- Usado em 3 contextos: fluxo de criação de instrumento, fluxo de nova calibração e histórico de calibrações (read-only)
- Layout agrupado ou flat é determinado por `hasMeasurementFieldGrouping(rows)`

## Relacionado

- [[modulos/calibration-records]] — `CalibrationFieldReviewStatus`
- [[modulos/calibration-derivations]] — define quais campos têm `autoCalculated=true`
- [[modulos/measurement-fields]] — `groupMeasurementFieldsByLayout`
- [[componentes/calibration-create-flow]] — usa com `editable=true` + `showConfidenceIndicators`
- [[componentes/instrument-create-flow]] — usa com `editable=true` + `showConfidenceIndicators`
- [[componentes/instrument-calibrations-content]] — usa com `editable=false`

## Código-fonte
[[app/_components/calibration-field-review-table.tsx]]
