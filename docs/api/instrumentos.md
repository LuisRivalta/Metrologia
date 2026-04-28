---
tags: [api, endpoint, instrumentos]
arquivo: app/api/instrumentos/route.ts
---

# /api/instrumentos

**Arquivo:** `app/api/instrumentos/route.ts`
**Métodos:** GET, POST, PATCH, DELETE
**Auth:** requer sessão via middleware

## GET /api/instrumentos

Lista todos os instrumentos ou retorna um por id.

**Query params:**

| Param | Tipo | Descrição |
|-------|------|-----------|
| `id` | number | Retorna instrumento específico |

Sem `id`: retorna `InstrumentItem[]`.
Com `id`: retorna `InstrumentDetailItem` (com campos e última calibração).

## GET /api/instrumentos/metadata

Retorna `{ categories: CategoryItem[], measurements: MeasurementItem[], setores: SetorItem[] }` para alimentar o formulário de criação/edição de instrumento. Carrega os três recursos em paralelo. Erro em `setores` não bloqueia — retorna `[]` silenciosamente.

## POST /api/instrumentos

Cria instrumento. **Não cria calibração.** Quem orquestra instrumento + calibração é `/instrumentos/novo`.

## PATCH /api/instrumentos

Atualiza campos do instrumento (tag, fabricante, categoria, datas de calibração).

## DELETE /api/instrumentos

Deleta instrumento. Exige confirmação explícita na UI.

## Pontos de atenção

- `POST` aceita `fields` mas o frontend normalmente parte do template da categoria
- `laboratory` e `certificate` são aceitos no body mas não expostos na UI atual

## Relacionado

- [[modulos/instruments]] — `mapInstrumentRow`, `mergeInstrumentFieldsWithLatestCalibration`
- [[modulos/measurement-fields]] — campos do instrumento
- [[componentes/instrument-create-flow]] — chama POST + rollback em falha

## Código-fonte
[[app/api/instrumentos/route.ts]]
