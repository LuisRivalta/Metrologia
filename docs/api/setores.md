---
tags: [api, setores]
arquivo: app/api/setores/route.ts
---

# API: /api/setores

**Arquivo:** `app/api/setores/route.ts`  
**Tabela:** `calibracao.setores`

## Endpoints

| Método | Ação | Body | Resposta |
|--------|------|------|----------|
| `GET` | Lista setores ordenados por `codigo` | — | `{ items: SetorItem[] }` |
| `POST` | Cria setor | `{ codigo, nome }` | `{ item: SetorItem }` 201 |
| `PATCH` | Edita setor | `{ id, codigo, nome }` | `{ item: SetorItem }` |
| `DELETE` | Remove setor | `{ id }` | `{ success: true }` |

## Validações

- `codigo` e `nome` obrigatórios em POST e PATCH
- Código duplicado → 409

## Pontos de atenção

- Setor pode ser deletado mesmo com instrumentos vinculados — o banco usa `ON DELETE SET NULL` na FK `instrumentos.setor_id`
- Erro de permissão no schema retorna 500 com mensagem específica

## Relacionado

- [[modulos/setores]] — tipos `SetorRow`, `SetorItem` e mappers
- [[componentes/setores-content]] — consumidor principal (UI CRUD)

## Código-fonte
[[app/api/setores/route.ts]]
