---
tags: [modulo, lib, calibracao]
arquivo: lib/calibration-records.ts
---

# calibration-records

**Arquivo:** `lib/calibration-records.ts`
**Responsabilidade:** serialização e parse do payload estruturado dentro de `calibracoes.observacoes`

## O que faz

Gerencia o formato dual de `observacoes`: o campo pode ser texto puro ou pode conter um bloco JSON estruturado entre marcadores. Este módulo é o único ponto de leitura/escrita desse formato.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `serializeCalibrationRecord` | ~74 | Serializa `{ notes, fields[] }` para string de observacoes com bloco JSON |
| `parseCalibrationRecord` | ~103 | Faz parse da string de observacoes; retorna `{ notes, fields[] }` |

## Tipos exportados

| Tipo | Descrição |
|------|-----------|
| `CalibrationStoredFieldEntry` | Uma entrada de campo: `fieldId`, `fieldSlug`, `fieldName`, `measurementName`, `value`, `unit`, `status`, `confidence`, `evidence` |
| `CalibrationFieldReviewStatus` | `"unknown" \| "conforming" \| "non_conforming"` |

## Contexto de criação

Criado para armazenar dados estruturados de calibração sem alterar o schema do banco. O campo `observacoes` existia como texto; o sistema passou a embutir JSON dentro de marcadores para manter compatibilidade.

## Regras críticas

- **Nunca** tratar `observacoes` como texto puro sem passar por `parseCalibrationRecord` — o bloco JSON pode estar lá
- `serializeCalibrationRecord` descarta campos com `value`, `unit`, `evidence` vazios e `confidence` null e `status` unknown — isso é intencional
- Os marcadores são literais: `[[METROLOGIA_CALIBRATION_DATA]]` e `[[/METROLOGIA_CALIBRATION_DATA]]`

## Relacionado

- [[dominio/modelo]] — onde observacoes vive no modelo de dados
- [[dominio/regras-criticas]] — regra #6 (formato dual)
- [[arquitetura/data-layer]] — formato dual explicado
- [[modulos/calibrations]] — usa `parseCalibrationRecord` ao mapear histórico
- [[componentes/calibration-create-flow]] — usa `serializeCalibrationRecord` ao salvar

## Código-fonte
[[lib/calibration-records.ts]]
