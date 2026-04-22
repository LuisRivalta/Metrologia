---
tags: [modulo, lib, campos]
arquivo: lib/measurement-fields.ts
---

# measurement-fields

**Arquivo:** `lib/measurement-fields.ts`
**Responsabilidade:** derivação de slug, agrupamento por grupo/subgrupo e mapeamento de campos de medição

## O que faz

Converte rows do banco de campos (de categoria ou de instrumento) para `MeasurementFieldItem`, deriva slugs, agrupa campos para renderização em layout hierárquico e serializa/parseia a configuração de tipo de valor.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `serializeMeasurementFieldSlug` | ~108 | Deriva slug de `{ name, groupName, subgroupName }` |
| `mapInstrumentMeasurementFieldRow` | ~325 | Row de `instrumento_campos_medicao` → `MeasurementFieldItem` |
| `mapCategoryMeasurementFieldRow` | ~332 | Row de `categoria_campos_medicao` → `MeasurementFieldItem` |
| `groupMeasurementFieldsByLayout` | ~242 | Agrupa fields em `Group > Subgroup > fields[]` ordenados |
| `sortMeasurementFields` | ~238 | Ordena por `order` e depois por `name` (pt-BR) |
| `hasMeasurementFieldGrouping` | ~318 | Retorna `true` se algum campo tem groupName ou subgroupName |
| `parseMeasurementFieldValueConfig` | ~117 | Parse do campo `tipo_valor` (JSON ou string legacy) |
| `serializeMeasurementFieldValueConfig` | ~161 | Serializa configuração para salvar no banco |

## Tipos exportados

| Tipo | Descrição |
|------|-----------|
| `MeasurementFieldItem` | Campo completo com `slug`, `name`, `groupName`, `subgroupName`, `hint`, etc. |
| `MeasurementFieldLayoutGroup` | Grupo com lista de subgrupos |
| `MeasurementFieldLayoutSubgroup` | Subgrupo com lista de campos |

## Contexto de criação

Centraliza toda a lógica de campos de medição. O `tipo_valor` do banco é um JSON `{ type, groupName, subgroupName }` — este módulo faz o parse e a serialização. O agrupamento hierárquico é necessário para renderizar categorias complexas como Paquímetro.

## Regras críticas

- Slug é derivado de `[groupName, subgroupName, name]` concatenados (ver [[dominio/campo-slugs]])
- `tipo_valor` legacy (plain string) é tratado como `type` sem grupo
- `hint` (campo `dica_extracao`) é opcional; presente apenas em campos de categoria

## Relacionado

- [[dominio/campo-slugs]] — explicação detalhada da derivação de slugs
- [[modulos/calibration-derivations]] — usa `serializeMeasurementFieldSlug` nas regras
- [[modulos/measurements]] — `formatMeasurementType` usada internamente

## Código-fonte
[[lib/measurement-fields.ts]]
