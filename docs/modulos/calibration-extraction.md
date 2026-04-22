---
tags: [modulo, lib, ia, extracao]
arquivo: lib/calibration-extraction.ts
---

# calibration-extraction

**Arquivo:** `lib/calibration-extraction.ts`
**Responsabilidade:** prompt, schema JSON e normalização da extração por IA

## O que faz

Constrói o prompt enviado ao modelo, o schema JSON que o modelo deve respeitar, prepara o texto do PDF e normaliza o retorno bruto da IA para o tipo `CalibrationExtractionResult`.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `buildCalibrationExtractionSchema` | ~99 | Gera schema JSON dinâmico com enum dos `fieldSlug` válidos |
| `buildCalibrationExtractionPrompt` | ~133 | Monta o prompt completo com campos, texto do PDF e tabelas |
| `prepareCalibrationExtractionDocumentText` | ~184 | Limpa e trunca o texto extraído do PDF |
| `formatTablePagesAsMarkdown` | ~211 | Converte `string[][][]` do pdf-parse em Markdown de tabelas |
| `normalizeCalibrationExtractionResult` | ~252 | Normaliza resposta bruta da IA para `CalibrationExtractionResult` |

## Constantes

| Constante | Valor |
|-----------|-------|
| `defaultCalibrationExtractionModel` | `nvidia/nemotron-nano-12b-v2-vl:free` (ou env) |
| `maxCalibrationExtractionDocumentTextLength` | `18_000` chars |

## Tipos exportados

| Tipo | Descrição |
|------|-----------|
| `CalibrationExtractionHeader` | `responsible`, `calibrationDate`, `certificateDate`, `validityDate`, `observations` |
| `CalibrationExtractionFieldSuggestion` | Sugestão por campo com `value`, `unit`, `conforme`, `confidence`, `evidence` |
| `CalibrationExtractionResult` | `{ header, fields[], warnings[] }` |

## Regras críticas

- O prompt instrui o modelo a **não inventar** dados ausentes — usar `null`
- `hasDocumentContent` controla se o prompt instrui a usar texto ou o PDF anexo
- `formatTablePagesAsMarkdown` aplica budget: se tabelas + texto excedem `maxLength`, trunca com `[tabelas truncadas]`
- `normalizeCalibrationExtractionResult` filtra slugs inválidos e desduplicados

## Relacionado

- [[arquitetura/ia-pipeline]] — visão geral do pipeline
- [[api/calibracoes-extrair]] — usa todas as funções deste módulo
- [[modulos/calibration-certificate-parsers]] — overrides aplicados após normalização
- [[modulos/measurement-fields]] — `MeasurementFieldItem` usado no schema e no prompt

## Código-fonte
[[lib/calibration-extraction.ts]]
