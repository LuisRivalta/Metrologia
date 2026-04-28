---
tags: [componente, ui, instrumentos]
arquivo: app/_components/instruments-content.tsx
---

# instruments-content

**Arquivo:** `app/_components/instruments-content.tsx`
**Tipo:** Client Component
**Responsabilidade:** lista de instrumentos com filtros, busca, linhas clicáveis e atalhos de ação

## O que faz

Renderiza a lista de instrumentos com:
- Filtro por status de calibração (`all`, `neutral`, `warning`, `danger`)
- Filtro por categoria, fabricante e setor
- Busca por texto
- Linhas da tabela clicáveis — clique em qualquer célula navega para `/instrumentos/:id`
- Coluna "Ações" com dois ícones: editar (abre modal) e calibrar (navega para `/instrumentos/:id/calibracoes/nova`)
- Modal de edição/criação rápida (legado — sem calibração inicial)
- Inicialização do filtro de status via `?status=` URL param

## Estado relevante

| Estado | O que controla |
|--------|---------------|
| `calibrationFilter` | Filtro ativo (`all` \| `neutral` \| `warning` \| `danger`) |
| `categoryFilter` | Filtro por nome de categoria (string) |
| `manufacturerFilter` | Filtro por fabricante (string) |
| `setorFilter` | Filtro por setor — string com id, `"none"` = sem setor |
| `searchQuery` | Texto de busca |

## Inicialização via URL

```ts
const searchParams = useSearchParams();
const initialStatus = searchParams.get("status");
// VALID_CALIBRATION_FILTER_STATUSES = ["neutral", "warning", "danger"]
// Se status válido → usa como filtro inicial; senão → "all"
```

A constante `VALID_CALIBRATION_FILTER_STATUSES` está em escopo de módulo.

## Linhas clicáveis

`onClick` no `<tr>` chama `router.push("/instrumentos/:id")`.  
`stopPropagation` aplicado na tag pill e no wrapper de ações para evitar dupla navegação.

## Pontos de atenção

- `useSearchParams` exige `<Suspense>` no page pai (`app/instrumentos/page.tsx`) — obrigatório para build estático do Next.js
- O modal de criação rápida nesta tela não suporta calibração inicial — para isso usar `/instrumentos/novo`
- `calibrationFilter` não persiste na URL ao mudar manualmente (só inicializa por URL)

## Relacionado

- [[componentes/dashboard-content]] — origem dos links `?status=`
- [[api/instrumentos]] — fonte dos dados
- [[modulos/setores]] — `SetorItem` usado no filtro de setor
- [[historico/specs/2026-04-21-b3-dashboard-navigation-design]] — spec que adicionou inicialização por URL

## Código-fonte
[[app/_components/instruments-content.tsx]]
