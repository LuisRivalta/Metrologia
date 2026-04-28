---
tags: [componente, ui, configuracoes]
arquivo: app/_components/setores-content.tsx
---

# setores-content

**Arquivo:** `app/_components/setores-content.tsx`  
**Página:** `app/configuracoes/setores/page.tsx` → `/configuracoes/setores`  
**Tipo:** Client Component  
**Responsabilidade:** CRUD de setores de uso dos instrumentos

## O que faz

- Lista todos os setores ordenados por código
- Cria novo setor (modal)
- Edita setor existente (modal)
- Exclui setor com confirmação

## Relacionado

- [[api/setores]] — `GET|POST|PATCH|DELETE /api/setores`
- [[modulos/setores]] — tipos e helpers
- [[componentes/instruments-content]] — usa setores no filtro e no modal de edição

## Código-fonte
[[app/_components/setores-content.tsx]]
