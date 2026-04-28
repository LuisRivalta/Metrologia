---
tags: [componente, ui, instrumentos]
arquivo: app/_components/instrument-detail-content.tsx
---

# instrument-detail-content

**Arquivo:** `app/_components/instrument-detail-content.tsx`  
**Página:** `app/instrumentos/[id]/page.tsx` → `/instrumentos/:id`  
**Tipo:** Client Component  
**Responsabilidade:** exibe os detalhes completos de um instrumento com último valor por campo

## O que faz

- Carrega instrumento via `GET /api/instrumentos?id=<id>`
- Exibe: tag, categoria, fabricante, setor, datas de calibração, status (tone)
- Renderiza campos agrupados (`groupName` / `subgroupName`) com último valor registrado
- Exibe banner de alerta contextual se instrumento está vencido (`danger`) ou perto de vencer (`warning`)
- Link direto para nova calibração (`/instrumentos/:id/calibracoes/nova`)

## Layout de campos

Usa `groupMeasurementFieldsByLayout` + `hasMeasurementFieldGrouping` de `lib/measurement-fields`:
- Se há grupos: renderiza seções com labels de grupo e subgrupo
- Se não há grupos: renderiza tabela flat
- Label de subgrupo omitida quando é igual ao label do grupo (`areSameLabels`)

## Pontos de atenção

- Os valores exibidos vêm do último registro de calibração via `mergeInstrumentFieldsWithLatestCalibration` (processado no server via `lib/server/instrument-details.ts`)
- `InstrumentDetailItem` tem `fields: MeasurementFieldItem[]` com `lastValue` + `lastUnit` populados

## Relacionado

- [[modulos/instruments]] — `InstrumentDetailItem`
- [[modulos/measurement-fields]] — layout de grupos
- [[modulos/server-instrument-details]] — carregamento server-side
- [[componentes/instrument-calibrations-content]] — histórico completo (link a partir do detalhe)

## Código-fonte
[[app/_components/instrument-detail-content.tsx]]
