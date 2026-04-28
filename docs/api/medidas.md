---
tags: [api, medidas]
arquivo: app/api/medidas/route.ts
---

# API: /api/medidas

**Arquivo:** `app/api/medidas/route.ts`  
**Tabela:** `calibracao.unidadas_medidas`

## Endpoints

| Método | Ação | Body | Resposta |
|--------|------|------|----------|
| `GET` | Lista medidas ordenadas por `tipo` | — | `{ items: MeasurementItem[] }` |
| `POST` | Cria medida | `{ tipo, tipoDesc? }` | `{ item: MeasurementItem }` 201 |
| `PATCH` | Edita medida | `{ id, tipo, tipoDesc? }` | `{ item: MeasurementItem }` |
| `DELETE` | Remove medida | `{ id }` | `{ success: true }` |

## Validações

- `tipo` obrigatório em POST e PATCH
- Tipo duplicado → 409
- `tipoDesc` é opcional (descrição amigável da unidade)

## Pontos de atenção

- Nome da tabela no banco tem typo intencional: `unidadas_medidas` (não `unidades`)
- Serialização usa `formatMeasurementType` / `serializeMeasurementType` de `lib/measurements.ts`

## Relacionado

- [[modulos/measurements]] — `MeasurementRow`, `MeasurementItem`, mappers e serialização
- [[api/categorias]] — categorias referenciam medidas nos campos do template
- [[api/instrumentos]] — metadata endpoint carrega medidas em paralelo

## Código-fonte
[[app/api/medidas/route.ts]]
