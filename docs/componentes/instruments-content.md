---
tags: [componente, ui, instrumentos]
arquivo: app/_components/instruments-content.tsx
---

# instruments-content

**Arquivo:** `app/_components/instruments-content.tsx`
**Tipo:** Client Component
**Responsabilidade:** lista de instrumentos com filtros de status e busca

## O que faz

Renderiza a lista de instrumentos com:
- Filtro por status de calibração (`all`, `neutral`, `warning`, `danger`)
- Busca por texto
- Modal de edição/criação rápida (legado — sem calibração inicial)
- Inicialização do filtro via `?status=` URL param

## Estado relevante

| Estado | O que controla |
|--------|---------------|
| `calibrationFilter` | Filtro ativo (`all` \| `neutral` \| `warning` \| `danger`) |
| `searchQuery` | Texto de busca |

## Inicialização via URL

```ts
const searchParams = useSearchParams();
const initialStatus = searchParams.get("status");
// VALID_CALIBRATION_FILTER_STATUSES = ["neutral", "warning", "danger"]
// Se status válido → usa como filtro inicial; senão → "all"
```

A constante `VALID_CALIBRATION_FILTER_STATUSES` está em escopo de módulo.

## Pontos de atenção

- `useSearchParams` exige `<Suspense>` no page pai (`app/instrumentos/page.tsx`) — obrigatório para build estático do Next.js
- O modal de criação rápida nesta tela não suporta calibração inicial — para isso usar `/instrumentos/novo`
- `calibrationFilter` não persiste na URL ao mudar manualmente (só inicializa por URL)

## Relacionado

- [[componentes/dashboard-content]] — origem dos links `?status=`
- [[historico/specs/2026-04-21-b3-dashboard-navigation-design]] — spec que adicionou inicialização por URL

## Código-fonte
[[app/_components/instruments-content.tsx]]
