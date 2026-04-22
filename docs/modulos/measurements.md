---
tags: [modulo, lib, medidas]
arquivo: lib/measurements.ts
---

# measurements

**Arquivo:** `lib/measurements.ts`
**Responsabilidade:** normalização entre representação de UI e formato técnico do banco para unidades de medida

## O que faz

Converte entre o formato do banco (ex: `celsius`, `grau`, `pct`) e o formato de exibição (ex: `°C`, `°`, `%`). Também mapeia rows do banco para `MeasurementItem`.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `formatMeasurementType` | ~96 | `rawValue` (banco) → string de exibição na UI (`°C`, `mm²`, etc.) |
| `serializeMeasurementType` | ~137 | String da UI → formato do banco para salvar |
| `mapMeasurementRow` | ~173 | Converte `MeasurementRow` do banco para `MeasurementItem` |

## Mapeamentos especiais

- `celsius` ↔ `°C`, `fahrenheit` ↔ `°F`, `grau`/`graus` ↔ `°`
- `pct` ↔ `%`, `ohm` ↔ `Ω`, `um` ↔ `µm`
- `hz` ↔ `Hz`, `ph` ↔ `pH`, `db` ↔ `dB`
- Compostos: `mm_s` → `mm/s`, `mm2` → `mm²`, `shore_a` → `Shore A`

## Contexto de criação

O banco armazena tipos em formato normalizado (sem acentos, underscores). A UI exibe em formato técnico com símbolos Unicode. Este módulo é a ponte bidirecional.

## Relacionado

- [[modulos/measurement-fields]] — usa `formatMeasurementType` ao mapear campos
- [[api/calibracoes]] — usa `mapMeasurementRow` para retornar medidas

## Código-fonte
[[lib/measurements.ts]]
