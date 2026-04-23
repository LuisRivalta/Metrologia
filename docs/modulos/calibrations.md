---
tags: [modulo, lib, historico]
arquivo: lib/calibrations.ts
---

# calibrations

**Arquivo:** `lib/calibrations.ts`
**Responsabilidade:** mapeamento do histórico de calibrações, filtros por período e derivação de status

## O que faz

Converte linhas brutas do banco (`CalibrationDbRow` + `CalibrationResultDbRow[]`) em `CalibrationHistoryItem` com datas formatadas, status derivado e campos estruturados. Fornece constantes e helpers para filtros de período.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `mapCalibrationHistoryRow` | ~273 | Mapeia row do banco para `CalibrationHistoryItem` |
| `getCalibrationFilterStartDate` | ~113 | Retorna data ISO de início do período (3m, 6m, 1y, 3y, 5y) |
| `isCalibrationFilterPreset` | ~105 | Type guard para `CalibrationFilterPreset` |
| `isCalibrationStatusValue` | ~109 | Type guard para `CalibrationStatusValue` |

## Constantes exportadas

| Constante | Descrição |
|-----------|-----------|
| `calibrationFilterOptions` | Array `[{ value, label }]` para os 5 presets de período |
| `calibrationStatusOptions` | Opções de status: Aprovado, Em revisao, Perto de vencer, Reprovado |

## Como status é derivado (função `deriveStatus`, linha ~205)

1. Se `status_geral` tem valor e tom reconhecível → usa o label explícito
2. Se há resultados com conformidade → `danger` (algum não conforme) ou `neutral` (todos conformes)
3. Se há `data_validade` → usa `getRelativeCalibration` de `lib/instruments.ts`
4. Fallback: `"Em revisão"` com tom `warning`

A função prefere resultados do payload de `observacoes` sobre `calibracao_resultados` quando ambos existem.

## Contexto de criação

Centraliza a lógica de "como uma linha do banco vira um item do histórico". Separa formatação de datas, derivação de status e leitura do payload estruturado em um único lugar testável.

## Relacionado

- [[modulos/calibration-records]] — `parseCalibrationRecord` chamado aqui
- [[modulos/instruments]] — `getRelativeCalibration` usado no deriveStatus
- `app/_components/instrument-calibrations-content.tsx` — exibe o histórico via GET /api/calibracoes
- [[api/calibracoes]] — retorna `CalibrationHistoryItem[]`

## Código-fonte
[[lib/calibrations.ts]]
