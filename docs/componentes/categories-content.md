---
tags: [componente, ui, categorias]
arquivo: app/_components/categories-content.tsx
---

# categories-content

**Arquivo:** `app/_components/categories-content.tsx`  
**Página:** `app/categorias/page.tsx` → `/categorias`  
**Tipo:** Client Component  
**Responsabilidade:** CRUD de categorias com editor completo de template de calibração

## O que faz

- Lista categorias com busca textual
- Cria e edita categoria (modal) incluindo o template de campos de calibração
- Copia grupos de campos entre categorias
- Exclui categoria com confirmação (bloqueado se houver instrumentos vinculados)
- Sincroniza template com instrumentos vinculados ao salvar

## Editor de template (modal de campo)

O editor organiza os campos em **grupos** → **subgrupos** → **linhas** (draft hierarchy):

| Nível | Tipo | Campos |
|-------|------|--------|
| Subgrupo | `CategoryFieldDraftSubgroup` | `name`, `defaultMeasurementId`, `rows[]` |
| Linha | `CategoryFieldDraftRow` | `name`, `measurementId`, `hint` |

`defaultMeasurementId` no subgrupo: ao definir, propaga a medida para todas as linhas existentes e novas do subgrupo.

### Ações disponíveis no editor

- Adicionar / remover / reordenar subgrupos
- Copiar subgrupo (duplica com novos `clientId`)
- Remover grupo inteiro ou subgrupo inteiro — com confirmação modal (`pendingRemoveFieldIds`)
- Adicionar / remover linhas individuais dentro de um subgrupo

## Pontos de atenção

- Template pode ser salvo vazio (validação "mínimo 1 campo" foi removida)
- Slug de campo é derivado de `name + groupName + subgroupName` — alterar qualquer um quebra registros existentes (ver [[dominio/campo-slugs]])
- A sincronização com instrumentos vinculados acontece no backend ao salvar a categoria

## Relacionado

- [[api/categorias]] — `GET|POST|PATCH|DELETE /api/categorias`
- [[dominio/campo-slugs]] — como slugs são derivados
- [[dominio/regras-criticas]] — regra #5 (categoria com instrumentos)
- [[modulos/measurement-fields]] — `serializeMeasurementFieldSlug`
- [[modulos/categories]] — `CategoryItem` e helpers

## Código-fonte
[[app/_components/categories-content.tsx]]
