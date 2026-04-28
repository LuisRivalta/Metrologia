---
tags: [modulo, lib, server, instrumentos]
arquivo: lib/server/instrument-details.ts
---

# server/instrument-details

**Arquivo:** `lib/server/instrument-details.ts`
**Responsabilidade:** carregamento server-side do instrumento com campos para os fluxos de calibração

## O que faz

Carrega em paralelo instrumento + categorias + medidas + campos do instrumento e monta um `InstrumentDetailItem` com `fields` preenchidos. Usado em RSC pages antes de passar os dados para componentes cliente.

## Funções

| Função | O que faz |
|--------|-----------|
| `loadInstrumentDetailForCalibration(instrumentId)` | Busca instrumento + dados relacionados via `supabaseAdmin`; retorna `{ item, error }` |

## Fluxo interno

1. Busca o instrumento por `id`
2. Em paralelo: `categorias_instrumentos`, `unidadas_medidas`, `instrumento_campos_medicao`
3. Monta `categoriesById`, `measurementsById`, `instrumentFieldsByInstrumentId`
4. Chama `mergeInstrumentFieldsWithLatestCalibration` para popular valores da última calibração
5. Retorna `InstrumentDetailItem` com `fields` ordenados por `ordem` + nome

## Pontos de atenção

- Usa `supabaseAdmin` — só para server-side (RSC, Server Actions)
- `instrumento_campos_medicao` filtrado por `ativo = true` e pelo `instrumentId`
- Não carrega setores — é focado no fluxo de calibração

## Relacionado

- [[modulos/instruments]] — `InstrumentDetailItem`, `mergeInstrumentFieldsWithLatestCalibration`
- [[modulos/measurement-fields]] — `mapInstrumentMeasurementFieldRow`
- [[componentes/calibration-create-flow]] — principal consumidor
- [[componentes/instrument-create-flow]] — consumidor na etapa 2

## Código-fonte
[[lib/server/instrument-details.ts]]
