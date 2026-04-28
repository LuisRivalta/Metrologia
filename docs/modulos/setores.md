---
tags: [modulo, lib]
arquivo: lib/setores.ts
---

# setores

**Arquivo:** `lib/setores.ts`
**Responsabilidade:** tipos e funções puras para a entidade Setor de Uso

## Tipos

| Tipo | Campos | Notas |
|------|--------|-------|
| `SetorRow` | `id`, `codigo`, `nome`, `created_at?` | Row bruta do banco |
| `SetorItem` | `id`, `codigo`, `nome` | Forma canônica usada na UI |

## Funções

| Função | Linhas | O que faz |
|--------|--------|-----------|
| `mapSetorRow(row)` | ~14 | Converte `SetorRow` → `SetorItem`, trimando `codigo` e `nome` |
| `formatSetorLabel(setor)` | ~22 | Formata exibição: `"codigo – nome"` |

## Uso

`mapSetorRow` é chamado em `app/api/setores/route.ts` e `app/api/instrumentos/metadata/route.ts`.
`formatSetorLabel` é usado nos dropdowns dos formulários de instrumento.

## Testes

`tests/lib/setores.test.ts` — 3 testes: mapeamento com espaços, formatação de label, `created_at` ausente.

## Relacionado

- [[api/setores]] — CRUD REST de setores
- [[modulos/instruments]] — `InstrumentItem.setor: SetorItem | null`
- [[componentes/setores-content]] — UI CRUD de setores

## Código-fonte
[[lib/setores.ts]]
