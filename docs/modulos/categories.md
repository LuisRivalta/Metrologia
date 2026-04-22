---
tags: [modulo, lib, categorias]
arquivo: lib/categories.ts
---

# categories

**Arquivo:** `lib/categories.ts`
**Responsabilidade:** mapeamento de categorias do banco para `CategoryItem` e serialização de slug

## O que faz

Converte `CategoryRow` do banco para `CategoryItem` com campos de medição e fornece a função de serialização de slug de categoria.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `mapCategoryRow` | ~30 | Converte `CategoryRow` + `MeasurementFieldItem[]` para `CategoryItem` |
| `serializeCategorySlug` | ~21 | Nome da categoria → slug (lowercase, sem acentos, `-` entre palavras) |

## Tipos exportados

| Tipo | Descrição |
|------|-----------|
| `CategoryItem` | `{ id (slug), dbId, name, slug, fields[] }` |
| `CategoryRow` | Row bruta do banco: `{ id, nome, slug }` |

## Relacionado

- [[dominio/modelo]] — categoria como raiz da hierarquia
- [[modulos/measurement-fields]] — `MeasurementFieldItem` usado nos fields da categoria
- [[api/categorias]] — retorna `CategoryItem[]`

## Código-fonte
[[lib/categories.ts]]
