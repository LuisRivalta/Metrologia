---
tags: [dominio, campos]
---

# Campo Slugs

## Como um slug é derivado

```ts
slug = serializeMeasurementFieldSlug({ name, groupName, subgroupName })
// Implementação em lib/measurement-fields.ts:108
```

Algoritmo:
1. Concatena `[groupName, subgroupName, name]` filtrando vazios
2. Remove acentos (NFD + strip combining marks)
3. Lowercase
4. Substitui não-alfanuméricos por `-`
5. Remove `-` inicial e final

Exemplo:
- `name="Maior erro externo"`, sem grupo → slug: `maior-erro-externo`
- `name="Erro"`, `groupName="Externo"` → slug: `externo-erro`

## Por que não mudar slug independentemente

O slug é a chave que liga:
- Template da categoria (`categoria_campos_medicao`)
- Campos do instrumento (`instrumento_campos_medicao`)
- Entradas de calibração em `observacoes` (`fieldSlug`)
- Regras de derivação em `calibration-derivations.ts` (os `targetSlug` e `sourceSlugs`)

Alterar `name`, `groupName` ou `subgroupName` sem atualizar todos os registros históricos quebra a leitura do histórico.

## Onde slugs são usados

| Local | Uso |
|-------|-----|
| `calibration-derivations.ts` | `targetSlug` e `sourceSlugs` das regras de Paquímetro |
| `calibration-extraction.ts` | Schema JSON enviado para a IA (`enum` de slugs válidos) |
| `calibration-records.ts` | `fieldSlug` dentro do payload de observacoes |
| `calibration-certificate-parsers.ts` | Mapeamento de overrides por slug |

## Relacionado
- [[modulos/measurement-fields]] — função `serializeMeasurementFieldSlug`
- [[modulos/calibration-derivations]] — regras que dependem de slugs exatos
- [[dominio/regras-criticas]] — regra #7
