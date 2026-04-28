---
tags: [modulo, lib, datas]
arquivo: lib/date-utils.ts
---

# date-utils

**Arquivo:** `lib/date-utils.ts`
**Responsabilidade:** parse e validação de datas ISO (`YYYY-MM-DD`) de forma segura

## Funções

| Função | O que faz |
|--------|-----------|
| `parseValidIsoDate(value)` | Parseia string `YYYY-MM-DD` → `Date` local. Retorna `null` se o formato for inválido ou se a data não existir (ex: `2024-02-30`) |
| `isValidIsoDate(value)` | Wrapper booleano de `parseValidIsoDate` |

## Regras

- Aceita somente o formato `YYYY-MM-DD` — qualquer outro retorna `null`
- Usa `new Date(year, month-1, day)` para evitar problemas de timezone (sem UTC)
- Valida que a data reconstruída bate com os componentes originais (detecta dias inválidos)

## Testes

`tests/lib/date-utils.test.ts`

## Relacionado

- [[modulos/instruments]] — usa `parseValidIsoDate` para calcular prazos
- [[modulos/calibrations]] — usa para validar e filtrar datas de calibração

## Código-fonte
[[lib/date-utils.ts]]
