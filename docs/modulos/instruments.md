---
tags: [modulo, lib, instrumentos]
arquivo: lib/instruments.ts
---

# instruments

**Arquivo:** `lib/instruments.ts`
**Responsabilidade:** mapeamento de instrumentos, cálculo de prazo de calibração e tag de exibição

## O que faz

Converte rows do banco em `InstrumentItem` com tag exibível, fabricante, calibração formatada e tom de alerta. Também fornece funções para calcular o status relativo de prazo e mesclar campos com a última calibração.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `mapInstrumentRow` | ~219 | Converte `InstrumentDbRow` para `InstrumentItem` com tom calculado |
| `getRelativeCalibration` | ~127 | Retorna `{ tone, diffInDays, description }` para uma data ISO |
| `formatInstrumentCalibration` | ~174 | Retorna `{ calibration, tone, diffInDays }` com texto formatado |
| `formatInstrumentAlertNote` | ~200 | Gera texto de nota do alerta ("Vencido há X dias") |
| `buildInstrumentDisplayTag` | ~122 | Gera tag de exibição `PRE-001` a partir de categoria e id |
| `mergeInstrumentFieldsWithLatestCalibration` | ~246 | Mescla campos do instrumento com valores da última calibração |
| `serializeDate` | ~115 | Date → string ISO `YYYY-MM-DD` |

## Tons de alerta

| Tom | Condição |
|-----|----------|
| `"danger"` | `diffInDays < 0` (vencido) |
| `"warning"` | `diffInDays <= 30` (vence em até 30 dias) |
| `"neutral"` | `diffInDays > 30` ou sem prazo definido |

## Regras críticas

- `buildInstrumentDisplayTag` é fallback — só usado quando a `tag` salva no banco parecer UUID
- `getRelativeCalibration` compara datas por dia (ignora hora) usando `getStartOfDay`
- `mergeInstrumentFieldsWithLatestCalibration` resolve conflito por `fieldId` primeiro, depois por `fieldSlug`

## Relacionado

- [[modulos/calibrations]] — usa `getRelativeCalibration` no deriveStatus
- [[modulos/dashboard-metrics]] — usa `mapInstrumentRow` e `formatInstrumentAlertNote`
- [[modulos/measurement-fields]] — `MeasurementFieldItem` usado em `InstrumentDetailItem`

## Código-fonte
[[lib/instruments.ts]]
