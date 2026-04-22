---
tags: [api, endpoint, categorias]
arquivo: app/api/categorias/route.ts
---

# /api/categorias

**Arquivo:** `app/api/categorias/route.ts`
**Métodos:** GET, POST, PATCH, DELETE
**Auth:** requer sessão via middleware

## GET /api/categorias

Retorna `CategoryItem[]` com todos os campos de cada categoria.

## POST /api/categorias

Cria categoria com nome e campos opcionais.

## PATCH /api/categorias

Atualiza categoria e sincroniza campos para todos os instrumentos vinculados.

## DELETE /api/categorias

Deleta categoria. **Falha** se houver instrumentos vinculados (retorna erro 409).

## Pontos de atenção

- O PATCH sincroniza campos dos instrumentos — operação pesada em categorias com muitos instrumentos
- DELETE retorna 409 Conflict quando há instrumentos vinculados; a UI deve exibir mensagem clara

## Relacionado

- [[modulos/categories]] — `mapCategoryRow`, `serializeCategorySlug`
- [[modulos/measurement-fields]] — campos do template da categoria
- [[dominio/regras-criticas]] — regra #5 (categoria não deletável com instrumentos)

## Código-fonte
[[app/api/categorias/route.ts]]
