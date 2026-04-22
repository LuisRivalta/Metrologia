---
tags: [api, endpoint, calibracao]
arquivo: app/api/calibracoes/route.ts
---

# /api/calibracoes

**Arquivo:** `app/api/calibracoes/route.ts`
**Métodos:** GET, POST
**Auth:** requer sessão via middleware

## GET /api/calibracoes

Retorna histórico de calibrações de um instrumento.

**Query params:**

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `instrumentId` | number | sim | ID do instrumento |
| `period` | `3m\|6m\|1y\|3y\|5y` | não | Preset de período |
| `dateFrom` | `YYYY-MM-DD` | não | Data início (alternativa ao period) |
| `dateTo` | `YYYY-MM-DD` | não | Data fim (alternativa ao period) |

Retorna `CalibrationHistoryItem[]`.

## POST /api/calibracoes

Cria nova calibração.

**Body (JSON):**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `instrumentId` | sim | ID do instrumento |
| `calibrationDate` | sim | Data da calibração (ISO) |
| `certificateUrl` | sim | URL do PDF já enviado para Storage |
| `fields` | não | Array de campos com valores |
| `notes` | não | Observações livres |

Após salvar: atualiza `data_ultima_calibracao` e `proxima_calibracao` no instrumento.

## Relacionado

- [[modulos/calibrations]] — `mapCalibrationHistoryRow`
- [[modulos/calibration-records]] — `serializeCalibrationRecord` usado no POST
- [[componentes/calibration-create-flow]] — chama POST
- [[componentes/instrument-create-flow]] — chama POST

## Código-fonte
[[app/api/calibracoes/route.ts]]
