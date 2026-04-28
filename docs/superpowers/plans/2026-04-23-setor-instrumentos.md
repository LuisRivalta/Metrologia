---
tags: [superpowers, plano, instrumentos, setores]
feature: Setor de Uso em Instrumentos
data: 2026-04-23
---
# Setor de Uso nos Instrumentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o conceito de "Setor de Uso" aos instrumentos — tabela própria `calibracao.setores` com FK opcional em `calibracao.instrumentos`, CRUD em `/configuracoes/setores`, e campo setor nos formulários de instrumento.

**Architecture:** Nova tabela `calibracao.setores (id, codigo, nome)` referenciada por FK nullable em `instrumentos.setor_id` com `ON DELETE SET NULL`. O tipo `InstrumentItem` ganha `setor: SetorItem | null`. As rotas de instrumentos carregam setores em paralelo e passam um `Map` para o mapper (mesmo padrão de `categorias`).

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL schema `calibracao`), TypeScript, Vitest, `lib/api/client.ts` (`fetchApi`) no cliente.

---

## File Map

| Ação | Arquivo |
|---|---|
| **Criar** | `lib/setores.ts` |
| **Criar** | `tests/lib/setores.test.ts` |
| **Criar** | `app/api/setores/route.ts` |
| **Criar** | `app/_components/setores-content.tsx` |
| **Criar** | `app/configuracoes/setores/page.tsx` |
| **Modificar** | `lib/instruments.ts` |
| **Modificar** | `tests/lib/instruments.test.ts` |
| **Modificar** | `app/api/instrumentos/route.ts` |
| **Modificar** | `app/api/instrumentos/metadata/route.ts` |
| **Modificar** | `lib/dashboard-metrics.ts` |
| **Modificar** | `lib/server/instrument-details.ts` |
| **Modificar** | `app/api/calibracoes/route.ts` |
| **Modificar** | `app/_components/settings-home-content.tsx` |
| **Modificar** | `app/_components/instrument-create-content.tsx` |
| **Modificar** | `app/_components/instruments-content.tsx` |

---

## Task 1: `lib/setores.ts` + testes unitários

**Files:**
- Create: `lib/setores.ts`
- Create: `tests/lib/setores.test.ts`

- [ ] **Step 1: Escrever o teste antes do código**

```typescript
// tests/lib/setores.test.ts
import { describe, expect, it } from "vitest";
import { mapSetorRow, formatSetorLabel } from "@/lib/setores";

describe("setores", () => {
  it("maps a db row to a SetorItem", () => {
    expect(mapSetorRow({ id: 1, codigo: " 3.03 ", nome: " Laboratório de Pressão " })).toEqual({
      id: 1,
      codigo: "3.03",
      nome: "Laboratório de Pressão"
    });
  });

  it("formats the display label as 'codigo – nome'", () => {
    expect(formatSetorLabel({ id: 1, codigo: "3.03", nome: "Lab. Pressão" })).toBe("3.03 – Lab. Pressão");
  });

  it("handles rows without created_at", () => {
    expect(mapSetorRow({ id: 5, codigo: "1.01", nome: "Elétrica" })).toEqual({
      id: 5,
      codigo: "1.01",
      nome: "Elétrica"
    });
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar que ele FALHA**

```bash
npx vitest run tests/lib/setores.test.ts
```
Esperado: FAIL com `Cannot find module '@/lib/setores'`

- [ ] **Step 3: Criar `lib/setores.ts`**

```typescript
// lib/setores.ts
export type SetorRow = {
  id: number;
  codigo: string;
  nome: string;
  created_at?: string | null;
};

export type SetorItem = {
  id: number;
  codigo: string;
  nome: string;
};

export function mapSetorRow(row: SetorRow): SetorItem {
  return {
    id: row.id,
    codigo: row.codigo.trim(),
    nome: row.nome.trim()
  };
}

export function formatSetorLabel(setor: SetorItem): string {
  return `${setor.codigo} – ${setor.nome}`;
}
```

- [ ] **Step 4: Rodar o teste para confirmar que PASSA**

```bash
npx vitest run tests/lib/setores.test.ts
```
Esperado: PASS — 3 testes verdes

- [ ] **Step 5: Commit**

```bash
git add lib/setores.ts tests/lib/setores.test.ts
git commit -m "feat: add lib/setores with SetorRow, SetorItem, mapSetorRow, formatSetorLabel"
```

---

## Task 2: Migração do banco de dados (passo manual)

**Files:** nenhum arquivo de código — executar no Supabase Dashboard ou via MCP.

> **ATENÇÃO:** Esta task requer executar SQL no Supabase. Sem ela, as tasks 3+ falharão em produção, mas o código pode ser escrito antes.

- [ ] **Step 1: Executar o SQL no Supabase Dashboard (SQL Editor)**

Acesse o projeto Metrologia no Supabase → SQL Editor e execute:

```sql
-- Cria tabela de setores
CREATE TABLE calibracao.setores (
  id         serial PRIMARY KEY,
  codigo     text NOT NULL UNIQUE,
  nome       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Adiciona FK opcional em instrumentos
ALTER TABLE calibracao.instrumentos
  ADD COLUMN setor_id int REFERENCES calibracao.setores(id) ON DELETE SET NULL;
```

- [ ] **Step 2: Verificar no Table Editor**

Confirmar que a tabela `calibracao.setores` existe e que `calibracao.instrumentos` tem a coluna `setor_id` nullable.

---

## Task 3: `app/api/setores/route.ts`

**Files:**
- Create: `app/api/setores/route.ts`

> Espelha `app/api/medidas/route.ts`. GET/POST/PATCH/DELETE. Deduplicação por `codigo`.

- [ ] **Step 1: Criar a rota**

```typescript
// app/api/setores/route.ts
import { NextResponse } from "next/server";
import { mapSetorRow, type SetorRow } from "@/lib/setores";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function buildSchemaPermissionError() {
  return NextResponse.json(
    { error: "Nao foi possivel acessar calibracao.setores. Verifique as permissoes da chave de servico." },
    { status: 500 }
  );
}

function buildGenericError() {
  return NextResponse.json(
    { error: "Nao foi possivel processar o cadastro de setores." },
    { status: 500 }
  );
}

function isPermissionDenied(message?: string) {
  return (message ?? "").toLowerCase().includes("permission denied");
}

async function findDuplicateSetor(rawCodigo: string, excludeId?: number) {
  let query = supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .select("id")
    .eq("codigo", rawCodigo)
    .limit(1);

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  return query.maybeSingle();
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .select("id, codigo, nome, created_at")
    .order("codigo", { ascending: true });

  if (error) {
    if (isPermissionDenied(error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  const items = ((data ?? []) as SetorRow[]).map(mapSetorRow);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as { codigo?: string; nome?: string };
  const codigo = payload.codigo?.trim() ?? "";
  const nome = payload.nome?.trim() ?? "";

  if (!codigo) {
    return NextResponse.json({ error: "Codigo do setor obrigatorio." }, { status: 400 });
  }

  if (!nome) {
    return NextResponse.json({ error: "Nome do setor obrigatorio." }, { status: 400 });
  }

  const duplicateLookup = await findDuplicateSetor(codigo);

  if (duplicateLookup.error) {
    if (isPermissionDenied(duplicateLookup.error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  if (duplicateLookup.data) {
    return NextResponse.json({ error: `O codigo ${codigo} ja esta cadastrado.` }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .insert({ codigo, nome })
    .select("id, codigo, nome, created_at")
    .single();

  if (error) {
    if (isPermissionDenied(error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  return NextResponse.json({ item: mapSetorRow(data as SetorRow) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as { id?: string | number; codigo?: string; nome?: string };
  const id = Number(payload.id);
  const codigo = payload.codigo?.trim() ?? "";
  const nome = payload.nome?.trim() ?? "";

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Id do setor obrigatorio." }, { status: 400 });
  }

  if (!codigo) {
    return NextResponse.json({ error: "Codigo do setor obrigatorio." }, { status: 400 });
  }

  if (!nome) {
    return NextResponse.json({ error: "Nome do setor obrigatorio." }, { status: 400 });
  }

  const duplicateLookup = await findDuplicateSetor(codigo, id);

  if (duplicateLookup.error) {
    if (isPermissionDenied(duplicateLookup.error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  if (duplicateLookup.data) {
    return NextResponse.json({ error: `O codigo ${codigo} ja esta cadastrado.` }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .update({ codigo, nome })
    .eq("id", id)
    .select("id, codigo, nome, created_at")
    .single();

  if (error) {
    if (isPermissionDenied(error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  return NextResponse.json({ item: mapSetorRow(data as SetorRow) });
}

export async function DELETE(request: Request) {
  const payload = (await request.json()) as { id?: string | number };
  const id = Number(payload.id);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Id do setor obrigatorio." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .delete()
    .eq("id", id);

  if (error) {
    if (isPermissionDenied(error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Verificar que o build não quebra**

```bash
npm run build
```
Esperado: build sem erros de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add app/api/setores/route.ts
git commit -m "feat: add POST/PATCH/DELETE/GET /api/setores"
```

---

## Task 4: Atualizar `lib/instruments.ts` + testes

**Files:**
- Modify: `lib/instruments.ts`
- Modify: `tests/lib/instruments.test.ts`

> Adicionar `setor_id` ao `InstrumentDbRow`, `setor` ao `InstrumentItem`, e atualizar `mapInstrumentRow` para aceitar `setoresById` como 3º parâmetro. `referenceDate` passa a ser 4º.

- [ ] **Step 1: Atualizar o teste para a nova assinatura**

Em `tests/lib/instruments.test.ts`, linha 49, o teste atual chama:
```typescript
mapInstrumentRow({ ... }, categoriesById, referenceDate)
```

Atualizar para passar um Map vazio de setores como 3º argumento:

```typescript
// tests/lib/instruments.test.ts
import { describe, expect, it } from "vitest";

import {
  buildInstrumentDisplayTag,
  formatInstrumentAlertNote,
  formatInstrumentCalibration,
  getRelativeCalibration,
  mergeInstrumentFieldsWithLatestCalibration,
  mapInstrumentRow
} from "@/lib/instruments";
import { serializeMeasurementFieldSlug } from "@/lib/measurement-fields";

const referenceDate = new Date(2026, 3, 1);

describe("instruments", () => {
  it("builds a human friendly tag from the category slug", () => {
    expect(buildInstrumentDisplayTag(7, "medidor-pressao", "Medidor de Pressao")).toBe("MP-007");
  });

  it("classifies near due calibrations as warning", () => {
    expect(getRelativeCalibration("2026-04-20", referenceDate)).toEqual({
      tone: "warning",
      diffInDays: 19,
      description: "Vence em 19 dias"
    });
  });

  it("flags invalid calibration dates before they reach the UI", () => {
    expect(formatInstrumentCalibration("2026-02-31", referenceDate)).toEqual({
      calibration: "Data invalida (2026-02-31)",
      tone: "danger",
      diffInDays: Number.MIN_SAFE_INTEGER
    });
  });

  it("regenerates instrument tags when the stored tag is just a UUID", () => {
    const categoriesById = new Map([
      [3, { id: 3, nome: "Medidor de Pressao", slug: "medidor-pressao" }]
    ]);

    expect(
      mapInstrumentRow(
        {
          id: 12,
          tag: "550e8400-e29b-41d4-a716-446655440000",
          categoria_id: 3,
          fabricante: "Mitutoyo",
          data_ultima_calibracao: null,
          proxima_calibracao: "2026-04-20",
          setor_id: null
        },
        categoriesById,
        new Map(),
        referenceDate
      )
    ).toMatchObject({
      id: 12,
      tag: "MP-012",
      category: "Medidor de Pressao",
      manufacturer: "Mitutoyo",
      tone: "warning",
      diffInDays: 19,
      calibrationDateValue: "2026-04-20",
      setor: null
    });
  });

  it("populates setor when setor_id is present in the row", () => {
    const categoriesById = new Map([
      [3, { id: 3, nome: "Medidor de Pressao", slug: "medidor-pressao" }]
    ]);
    const setoresById = new Map([
      [7, { id: 7, codigo: "3.03", nome: "Lab. Pressão" }]
    ]);

    expect(
      mapInstrumentRow(
        {
          id: 5,
          tag: "MP-001",
          categoria_id: 3,
          fabricante: null,
          data_ultima_calibracao: null,
          proxima_calibracao: null,
          setor_id: 7
        },
        categoriesById,
        setoresById,
        referenceDate
      )
    ).toMatchObject({
      setor: { id: 7, codigo: "3.03", nome: "Lab. Pressão" }
    });
  });
```

- [ ] **Step 2: Rodar os testes para confirmar que FALHAM**

```bash
npx vitest run tests/lib/instruments.test.ts
```
Esperado: FAIL — `setor_id` não existe em `InstrumentDbRow` e 4º argumento não é aceito.

- [ ] **Step 3: Atualizar `lib/instruments.ts`**

Adicionar import de `SetorItem` e atualizar os tipos + a função `mapInstrumentRow`:

```typescript
// No topo de lib/instruments.ts, adicionar import:
import type { SetorItem } from "@/lib/setores";
```

Atualizar `InstrumentDbRow` (adicionar `setor_id`):

```typescript
export type InstrumentDbRow = {
  id: number;
  tag: string | null;
  categoria_id: number | null;
  fabricante: string | null;
  data_ultima_calibracao: string | null;
  proxima_calibracao: string | null;
  setor_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};
```

Atualizar `InstrumentItem` (adicionar `setor`):

```typescript
export type InstrumentItem = {
  id: number;
  tag: string;
  category: string;
  categoryId?: number;
  categorySlug?: string;
  manufacturer: string;
  calibration: string;
  calibrationDateValue?: string;
  tone: InstrumentTone;
  diffInDays: number;
  setor: SetorItem | null;
};
```

Atualizar a assinatura e corpo de `mapInstrumentRow` (a função começa na linha 219):

```typescript
export function mapInstrumentRow(
  row: InstrumentDbRow,
  categoriesById: Map<number, InstrumentCategoryRow>,
  setoresById: Map<number, SetorItem> = new Map(),
  referenceDate = new Date()
): InstrumentItem {
  const category = row.categoria_id ? categoriesById.get(row.categoria_id) : undefined;
  const categoryName = normalizeText(category?.nome) || "Sem categoria";
  const categorySlug = normalizeText(category?.slug);
  const manufacturer = normalizeText(row.fabricante) || "Não informado";
  const calibrationInfo = formatInstrumentCalibration(row.proxima_calibracao, referenceDate);
  const rawTag = normalizeText(row.tag);
  const displayTag = rawTag && !isUuidLike(rawTag) ? rawTag : buildInstrumentDisplayTag(row.id, categorySlug, categoryName);
  const setor = (row.setor_id != null ? setoresById.get(row.setor_id) : undefined) ?? null;

  return {
    id: row.id,
    tag: displayTag,
    category: categoryName,
    categoryId: row.categoria_id ?? undefined,
    categorySlug: categorySlug || undefined,
    manufacturer,
    calibration: calibrationInfo.calibration,
    calibrationDateValue: row.proxima_calibracao ?? undefined,
    tone: calibrationInfo.tone,
    diffInDays: calibrationInfo.diffInDays,
    setor
  };
}
```

- [ ] **Step 4: Rodar os testes para confirmar que PASSAM**

```bash
npx vitest run tests/lib/instruments.test.ts
```
Esperado: PASS — todos os testes verdes (incluindo os novos).

- [ ] **Step 5: Corrigir callers que passam `referenceDate` como 3º arg**

**`lib/dashboard-metrics.ts`, linha ~63** — mudar de:
```typescript
mapInstrumentRow(row, categoriesById, referenceDate)
```
para:
```typescript
mapInstrumentRow(row, categoriesById, new Map(), referenceDate)
```

- [ ] **Step 6: Confirmar que o build passa sem erros de tipo**

```bash
npm run build
```
Esperado: build limpo. Se houver erros de tipo em `app/api/calibracoes/route.ts` ou `lib/server/instrument-details.ts`, eles agora têm `setor: null` no retorno automaticamente (o parâmetro tem default `new Map()`), então não precisam de alteração.

- [ ] **Step 7: Commit**

```bash
git add lib/instruments.ts lib/dashboard-metrics.ts tests/lib/instruments.test.ts
git commit -m "feat: add setor_id to InstrumentDbRow and setor to InstrumentItem"
```

---

## Task 5: Atualizar rotas de instrumentos para carregar setores

**Files:**
- Modify: `app/api/instrumentos/route.ts`
- Modify: `app/api/instrumentos/metadata/route.ts`

> Incluir `setor_id` nos SELECTs/payloads de `instrumentos`, carregar `setores` em paralelo e passar `setoresById` para `mapInstrumentRow`. Adicionar `setores` à resposta do endpoint `metadata`.

- [ ] **Step 1: Atualizar `app/api/instrumentos/route.ts`**

**1a. Adicionar import de `SetorItem` e `mapSetorRow`:**

```typescript
import { mapSetorRow, type SetorItem, type SetorRow } from "@/lib/setores";
```

**1b. Adicionar `setor_id` ao `InstrumentPayload`:**

```typescript
type InstrumentPayload = {
  id?: string | number;
  tag?: string;
  category?: string;
  useNewCategory?: boolean;
  newCategoryName?: string;
  manufacturer?: string;
  calibrationDate?: string;
  fields?: MeasurementFieldDraft[];
  setorId?: number | null;
};
```

**1c. Adicionar helper `loadSetores`:**

```typescript
async function loadSetores() {
  return supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .select("id, codigo, nome")
    .order("codigo", { ascending: true });
}

function mapSetoresById(rows: SetorRow[]) {
  return new Map(rows.map((row) => [row.id, mapSetorRow(row)]));
}
```

**1d. No `GET` (instrumento por id, linha ~545):**

Adicionar `setor_id` ao SELECT:
```typescript
.select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao, setor_id")
```

Adicionar `loadSetores()` ao `Promise.all`:
```typescript
const [categoryRowsResponse, measurementRowsResponse, instrumentFieldRowsResponse, latestCalibrationResponse, setorRowsResponse] =
  await Promise.all([
    loadCategories(),
    loadMeasurements(),
    loadInstrumentMeasurementFields([instrumentId]),
    supabaseAdmin
      .schema("calibracao")
      .from("calibracoes")
      .select("id, observacoes")
      .eq("instrumento_id", instrumentId)
      .order("data_calibracao", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
    loadSetores()
  ]);
```

Atualizar verificação de erro:
```typescript
const combinedError =
  categoryRowsResponse.error ??
  measurementRowsResponse.error ??
  instrumentFieldRowsResponse.error ??
  latestCalibrationResponse.error ??
  setorRowsResponse.error;
```

Passar `setoresById` para `buildInstrumentDetail`:
```typescript
const setoresById = mapSetoresById((setorRowsResponse.data ?? []) as SetorRow[]);
// ... (já existentes: categoriesById, measurementsById, etc.)
const item = buildInstrumentDetail(
  instrumentResponse.data as InstrumentDbRow,
  categoriesById,
  setoresById,
  instrumentFieldsByInstrumentId,
  parseCalibrationRecord(latestCalibrationResponse.data?.observacoes).fields
);
```

**1e. Atualizar `buildInstrumentDetail` para aceitar `setoresById`:**

```typescript
function buildInstrumentDetail(
  row: InstrumentDbRow,
  categoriesById: Map<number, InstrumentCategoryRow>,
  setoresById: Map<number, SetorItem>,
  instrumentFieldsByInstrumentId: Map<number, MeasurementFieldItem[]>,
  latestFieldEntries: ReturnType<typeof parseCalibrationRecord>["fields"] = []
) {
  const baseItem = mapInstrumentRow(row, categoriesById, setoresById);

  return {
    ...baseItem,
    fields: mergeInstrumentFieldsWithLatestCalibration(
      instrumentFieldsByInstrumentId.get(row.id) ?? [],
      latestFieldEntries
    )
  };
}
```

**1f. No `GET` (lista de instrumentos, linha ~596):**

Adicionar `setor_id` ao SELECT e carregar setores em paralelo:
```typescript
const [instrumentRowsResponse, categoryRowsResponse, setorRowsResponse] = await Promise.all([
  supabaseAdmin
    .schema("calibracao")
    .from("instrumentos")
    .select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao, setor_id")
    .order("id", { ascending: true }),
  loadCategories(),
  loadSetores()
]);
```

Atualizar verificação de erro e uso:
```typescript
if (instrumentRowsResponse.error || categoryRowsResponse.error || setorRowsResponse.error) {
  const errorMessage =
    instrumentRowsResponse.error?.message ??
    categoryRowsResponse.error?.message ??
    setorRowsResponse.error?.message ?? "";

  if (isPermissionDenied(errorMessage)) {
    return buildSchemaPermissionError();
  }

  return buildGenericError();
}

const categoriesById = mapCategoriesById(
  (categoryRowsResponse.data ?? []) as InstrumentCategoryRow[]
);
const setoresById = mapSetoresById((setorRowsResponse.data ?? []) as SetorRow[]);
const items = ((instrumentRowsResponse.data ?? []) as InstrumentDbRow[]).map((row) =>
  mapInstrumentRow(row, categoriesById, setoresById)
);
```

**1g. No `POST` (linha ~727), adicionar `setor_id` ao insert:**

```typescript
const insertInstrument = await supabaseAdmin
  .schema("calibracao")
  .from("instrumentos")
  .insert({
    tag,
    categoria_id: resolvedCategory.category.id,
    fabricante: manufacturer || null,
    proxima_calibracao: calibrationDate,
    setor_id: payload.setorId ?? null
  })
  .select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao, setor_id")
  .single();
```

**1h. No `PATCH` (linha ~873), adicionar `setor_id` ao update:**

```typescript
const updateInstrument = await supabaseAdmin
  .schema("calibracao")
  .from("instrumentos")
  .update({
    tag,
    categoria_id: resolvedCategory.category.id,
    fabricante: manufacturer || null,
    proxima_calibracao: calibrationDate,
    setor_id: payload.setorId ?? null
  })
  .eq("id", id)
  .select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao, setor_id")
  .single();
```

**1i. No `POST` e `PATCH`, ao chamar `mapInstrumentRow` para montar o retorno, passar `new Map()` (setor_id do INSERT/UPDATE retorna o id, mas não temos o objeto completo — é aceitável retornar `setor: null` aqui, a lista recarrega em seguida):**

As chamadas já terão `setor: null` por default do `mapInstrumentRow`. Nenhuma alteração adicional.

- [ ] **Step 2: Atualizar `app/api/instrumentos/metadata/route.ts`**

Adicionar `setores` à resposta do GET:

Adicionar import:
```typescript
import { mapSetorRow, type SetorRow } from "@/lib/setores";
```

Adicionar query de setores no `Promise.all`:
```typescript
const [categoryRowsResponse, measurementRowsResponse, categoryFieldRowsResponse, setorRowsResponse] = await Promise.all([
  supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .select("id, nome, slug")
    .order("nome", { ascending: true }),
  supabaseAdmin
    .schema("calibracao")
    .from("unidadas_medidas")
    .select("id, created_at, tipo, tipo_desc")
    .order("tipo", { ascending: true }),
  supabaseAdmin
    .schema("calibracao")
    .from("categoria_campos_medicao")
    .select("id, categoria_id, nome, slug, unidade_medida_id, tipo_valor, ordem, ativo")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("id", { ascending: true }),
  supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .select("id, codigo, nome")
    .order("codigo", { ascending: true })
]);
```

Atualizar verificação de erro:
```typescript
const combinedError =
  categoryRowsResponse.error ?? measurementRowsResponse.error ?? categoryFieldRowsResponse.error ?? setorRowsResponse.error;
```

Adicionar `setores` ao retorno:
```typescript
const setores = ((setorRowsResponse.data ?? []) as SetorRow[]).map(mapSetorRow);
return NextResponse.json({ categories, measurements, setores });
```

- [ ] **Step 3: Verificar que o build passa**

```bash
npm run build
```
Esperado: sem erros de tipo.

- [ ] **Step 4: Commit**

```bash
git add app/api/instrumentos/route.ts app/api/instrumentos/metadata/route.ts
git commit -m "feat: include setor_id in instrumentos API and add setores to metadata endpoint"
```

---

## Task 6: UI de configurações — página Setores

**Files:**
- Create: `app/_components/setores-content.tsx`
- Create: `app/configuracoes/setores/page.tsx`
- Modify: `app/_components/settings-home-content.tsx`

> Espelha o padrão de `settings-content.tsx` + `configuracoes/medidas/page.tsx`. Modal com `codigo` e `nome`. Confirmação de exclusão com "CONFIRMAR".

- [ ] **Step 1: Criar `app/_components/setores-content.tsx`**

```typescript
// app/_components/setores-content.tsx
"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api/client";
import { formatSetorLabel, type SetorItem } from "@/lib/setores";
import { PageTransitionLink } from "./page-transition-link";

type SetorModalMode = "create" | "edit";

type SetorApiResponse = {
  error?: string;
  item?: SetorItem;
  items?: SetorItem[];
  success?: boolean;
};

export function SetoresContent() {
  const [setores, setSetores] = useState<SetorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<SetorModalMode>("create");
  const [editingSetorId, setEditingSetorId] = useState<number | null>(null);
  const [codigoValue, setCodigoValue] = useState("");
  const [nomeValue, setNomeValue] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSetorId, setDeletingSetorId] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [pendingDeleteSetor, setPendingDeleteSetor] = useState<SetorItem | null>(null);

  const sortedSetores = useMemo(() => {
    return [...setores].sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR", { sensitivity: "base" }));
  }, [setores]);

  useEffect(() => {
    void loadSetores();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) closeModal();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, isSubmitting]);

  useEffect(() => {
    if (!isDeleteConfirmOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deletingSetorId) closeDeleteConfirm();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDeleteConfirmOpen, deletingSetorId]);

  async function loadSetores() {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await fetchApi("/api/setores", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as SetorApiResponse;

      if (!response.ok) {
        setSetores([]);
        setLoadError(payload.error ?? "Nao foi possivel carregar os setores.");
        setIsLoading(false);
        return;
      }

      setSetores(payload.items ?? []);
      setLoadError("");
      setIsLoading(false);
    } catch {
      setSetores([]);
      setLoadError("Nao foi possivel carregar os setores.");
      setIsLoading(false);
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setModalMode("create");
    setEditingSetorId(null);
    setCodigoValue("");
    setNomeValue("");
    setValidationError("");
    setIsSubmitting(false);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingSetorId(null);
    setCodigoValue("");
    setNomeValue("");
    setValidationError("");
    setIsModalOpen(true);
  }

  function openEditModal(setor: SetorItem) {
    setModalMode("edit");
    setEditingSetorId(setor.id);
    setCodigoValue(setor.codigo);
    setNomeValue(setor.nome);
    setValidationError("");
    setIsModalOpen(true);
  }

  function openDeleteConfirm(setor: SetorItem) {
    setPendingDeleteSetor(setor);
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    setPendingDeleteSetor(null);
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCodigo = codigoValue.trim();
    const trimmedNome = nomeValue.trim();

    if (!trimmedCodigo) {
      setValidationError("Codigo do setor obrigatorio.");
      return;
    }

    if (!trimmedNome) {
      setValidationError("Nome do setor obrigatorio.");
      return;
    }

    setIsSubmitting(true);
    setValidationError("");

    try {
      const response = await fetchApi("/api/setores", {
        method: modalMode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingSetorId, codigo: trimmedCodigo, nome: trimmedNome })
      });

      const payload = (await response.json()) as SetorApiResponse;

      if (!response.ok || !payload.item) {
        setValidationError(payload.error ?? "Nao foi possivel salvar o setor.");
        setIsSubmitting(false);
        return;
      }

      await loadSetores();
      setLoadError("");
      closeModal();
    } catch {
      setValidationError("Nao foi possivel salvar o setor.");
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSetor() {
    const setorId = pendingDeleteSetor?.id;

    if (!setorId || deleteConfirmationText.trim() !== "CONFIRMAR") return;

    setDeletingSetorId(setorId);

    try {
      const response = await fetchApi("/api/setores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: setorId })
      });

      const payload = (await response.json()) as SetorApiResponse;

      if (!response.ok) {
        setLoadError(payload.error ?? "Nao foi possivel excluir o setor.");
        setDeletingSetorId(null);
        return;
      }

      setSetores((current) => current.filter((s) => s.id !== setorId));
      setLoadError("");
      closeDeleteConfirm();
      setDeletingSetorId(null);
    } catch {
      setLoadError("Nao foi possivel excluir o setor.");
      setDeletingSetorId(null);
    }
  }

  return (
    <>
      <section className="inventory-content">
        <div className="settings-back-link-wrap">
          <PageTransitionLink href="/configuracoes" className="settings-back-link">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 6 9 12l6 6"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Voltar para configuracoes
          </PageTransitionLink>
        </div>

        <div className="inventory-actions settings-measure-actions">
          <button type="button" className="primary-toolbar-button" onClick={openCreateModal}>
            <span className="primary-toolbar-button__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            Cadastrar setor
          </button>
        </div>

        <section className="inventory-table-card settings-card settings-card--table">
          <div className="settings-card__header settings-card__header--split">
            <div>
              <h2>Setores cadastrados</h2>
              <p>Setores de uso fisico dos instrumentos. O codigo segue o formato definido pela empresa (ex: 3.03).</p>
            </div>
            <span className="category-card__count">{sortedSetores.length} setores</span>
          </div>

          {loadError ? <p className="settings-status-banner settings-status-banner--error">{loadError}</p> : null}

          <div className="inventory-table-wrap settings-measure-table-wrap">
            <table className="inventory-table settings-measure-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nome</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="inventory-table__empty">Carregando setores...</td>
                  </tr>
                ) : null}

                {!isLoading && sortedSetores.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="inventory-table__empty">Nenhum setor cadastrado.</td>
                  </tr>
                ) : null}

                {!isLoading
                  ? sortedSetores.map((setor) => (
                      <tr key={setor.id}>
                        <td data-label="Codigo">
                          <strong className="settings-measure-list__name">{setor.codigo}</strong>
                        </td>
                        <td data-label="Nome">
                          <p className="settings-measure-table__description">{setor.nome}</p>
                        </td>
                        <td data-label="Acoes" className="settings-measure-table__actions">
                          <div className="settings-measure-list__actions">
                            <button
                              type="button"
                              className="settings-measure-list__action settings-measure-list__action--edit"
                              aria-label={`Editar setor ${formatSetorLabel(setor)}`}
                              onClick={() => openEditModal(setor)}
                              disabled={deletingSetorId === setor.id}
                            >
                              <svg viewBox="0 0 24 24" fill="none">
                                <path d="M4 16.8V20h3.2L18 9.2 14.8 6 4 16.8Z" fill="currentColor" />
                                <path d="m13.8 7 3.2 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="settings-measure-list__action settings-measure-list__action--delete"
                              aria-label={`Excluir setor ${formatSetorLabel(setor)}`}
                              onClick={() => openDeleteConfirm(setor)}
                              disabled={deletingSetorId === setor.id}
                            >
                              <svg viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M6.5 7.5h11M9 7.5V6.2c0-.7.5-1.2 1.2-1.2h3.6c.7 0 1.2.5 1.2 1.2v1.3M8.2 10.2l.6 7.1c.1 1 .9 1.7 1.9 1.7h2.6c1 0 1.8-.8 1.9-1.7l.6-7.1"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path d="M10.5 11.2v5.2M13.5 11.2v5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>

          <div className="inventory-table-footer">
            <p>Exibindo {sortedSetores.length} setores</p>
          </div>
        </section>
      </section>

      {isModalOpen ? (
        <div className="instrument-modal-backdrop" role="presentation" onClick={closeModal}>
          <section
            className="instrument-modal category-modal settings-measure-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-setor-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="instrument-modal__header">
              <h2 id="settings-setor-modal-title">
                {modalMode === "edit" ? "Editar setor" : "Cadastrar setor"}
              </h2>
              <button
                type="button"
                className="instrument-modal__close"
                aria-label="Fechar modal"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <form className="instrument-modal__body" onSubmit={handleSubmit}>
              <div className="instrument-modal__content">
                <div className="instrument-modal__grid category-modal__grid">
                  <label className="instrument-modal__field instrument-modal__field--full">
                    <span>Codigo</span>
                    <input
                      type="text"
                      value={codigoValue}
                      onChange={(event) => {
                        setCodigoValue(event.target.value);
                        if (validationError) setValidationError("");
                      }}
                      placeholder="Ex: 3.03"
                      className={validationError && !nomeValue.trim() ? "is-invalid" : ""}
                    />
                    <small className="instrument-modal__field-help">
                      Identificador unico do setor. Use o formato padrao da empresa, ex: 3.03.
                    </small>
                  </label>

                  <label className="instrument-modal__field instrument-modal__field--full">
                    <span>Nome</span>
                    <input
                      type="text"
                      value={nomeValue}
                      onChange={(event) => {
                        setNomeValue(event.target.value);
                        if (validationError) setValidationError("");
                      }}
                      placeholder="Ex: Laboratorio de Pressao"
                    />
                  </label>

                  {validationError ? (
                    <small className="instrument-modal__field-error">{validationError}</small>
                  ) : null}
                </div>
              </div>

              <footer className="instrument-modal__footer">
                <button type="button" className="instrument-modal__cancel" onClick={closeModal} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="instrument-modal__submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : modalMode === "edit" ? "Salvar alteracao" : "Salvar setor"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {isDeleteConfirmOpen && pendingDeleteSetor ? (
        <div
          className="instrument-delete-confirm-backdrop"
          role="presentation"
          onClick={deletingSetorId ? undefined : closeDeleteConfirm}
        >
          <section
            className="instrument-delete-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-setor-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="settings-setor-delete-title">Confirmar exclusao</h3>
            <p>
              Para apagar o setor <strong>{formatSetorLabel(pendingDeleteSetor)}</strong>, digite{" "}
              <strong>CONFIRMAR</strong> no campo abaixo. Os instrumentos vinculados nao serao excluidos.
            </p>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(event) => setDeleteConfirmationText(event.target.value)}
              placeholder="Digite CONFIRMAR"
              disabled={Boolean(deletingSetorId)}
            />
            <div className="instrument-delete-confirm__actions">
              <button type="button" onClick={closeDeleteConfirm} disabled={Boolean(deletingSetorId)}>
                Voltar
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={handleDeleteSetor}
                disabled={deleteConfirmationText.trim() !== "CONFIRMAR" || Boolean(deletingSetorId)}
              >
                {deletingSetorId ? "Excluindo..." : "Excluir Setor"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Criar `app/configuracoes/setores/page.tsx`**

```typescript
// app/configuracoes/setores/page.tsx
import { ManagementShell } from "../../_components/management-shell";
import { SetoresContent } from "../../_components/setores-content";

export default function ConfiguracoesSetoresPage() {
  return (
    <ManagementShell activeItem="configuracoes">
      <SetoresContent />
    </ManagementShell>
  );
}
```

- [ ] **Step 3: Adicionar atalho em `app/_components/settings-home-content.tsx`**

Localizar o array `settingsShortcuts` e adicionar:

```typescript
const settingsShortcuts = [
  {
    href: "/configuracoes/medidas",
    title: "Cadastro de medidas",
    description: "Abra a tela de medidas para cadastrar, editar e excluir os tipos usados no sistema."
  },
  {
    href: "/configuracoes/setores",
    title: "Cadastro de setores",
    description: "Abra a tela de setores para cadastrar, editar e excluir os setores de uso dos instrumentos."
  }
];
```

- [ ] **Step 4: Verificar que o build passa**

```bash
npm run build
```
Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add app/_components/setores-content.tsx app/configuracoes/setores/page.tsx app/_components/settings-home-content.tsx
git commit -m "feat: add /configuracoes/setores page with CRUD UI"
```

---

## Task 7: Campo setor no formulário de criação de instrumentos

**Files:**
- Modify: `app/_components/instrument-create-content.tsx`

> Carregar setores do endpoint `/api/instrumentos/metadata` (já retorna `setores` após Task 5). Adicionar dropdown "Setor de uso" (opcional) no formulário. Incluir `setorId` no payload do POST.

- [ ] **Step 1: Adicionar `setores` ao tipo de metadados e ao estado do formulário**

Localizar o tipo de resposta da API de metadata no componente (buscar por `MetadataApiResponse` ou `categories`) e adicionar `setores`:

```typescript
// Tipo da resposta do metadata
type MetadataApiResponse = {
  error?: string;
  categories?: CategoryItem[];
  measurements?: MeasurementItem[];
  setores?: SetorItem[];
};
```

Adicionar import no topo:
```typescript
import { type SetorItem } from "@/lib/setores";
```

Adicionar estado `setores`:
```typescript
const [setores, setSetores] = useState<SetorItem[]>([]);
```

Adicionar `setorId` ao `formState`:
```typescript
// Dentro do tipo FormState e do estado inicial:
setorId: null as number | null
```

- [ ] **Step 2: Popular `setores` quando a metadata é carregada**

Localizar onde `payload.categories` e `payload.measurements` são lidos e adicionar:
```typescript
setSetores(payload.setores ?? []);
```

- [ ] **Step 3: Adicionar o dropdown de setor no JSX**

Após o campo `fabricante` no formulário, adicionar:
```tsx
<label className="instrument-modal__field instrument-modal__field--full">
  <span>Setor de uso</span>
  <select
    value={formState.setorId ?? ""}
    onChange={(event) => {
      const val = event.target.value;
      setFormState((current) => ({
        ...current,
        setorId: val === "" ? null : Number(val)
      }));
    }}
  >
    <option value="">Sem setor definido</option>
    {setores.map((setor) => (
      <option key={setor.id} value={setor.id}>
        {setor.codigo} – {setor.nome}
      </option>
    ))}
  </select>
  <small className="instrument-modal__field-help">
    Opcional. Identifica o local fisico onde o instrumento e utilizado.
  </small>
</label>
```

- [ ] **Step 4: Incluir `setorId` no payload do POST**

Localizar onde o `fetchApi` é chamado com `method: "POST"` para criar instrumento e adicionar `setorId`:
```typescript
body: JSON.stringify({
  tag: formState.tag.trim(),
  category: formState.category,
  manufacturer: formState.manufacturer.trim(),
  calibrationDate: formState.calibrationDate,
  fields: formState.fields,
  setorId: formState.setorId
})
```

- [ ] **Step 5: Verificar que o build passa**

```bash
npm run build
```
Esperado: sem erros de tipo.

- [ ] **Step 6: Commit**

```bash
git add app/_components/instrument-create-content.tsx
git commit -m "feat: add setor dropdown to instrument create form"
```

---

## Task 8: Campo setor na lista e no modal de edição de instrumentos

**Files:**
- Modify: `app/_components/instruments-content.tsx`

> Carregar setores ao montar o componente. Adicionar coluna "Setor" na tabela, filtro por setor, e campo setor no modal de edição inline.

- [ ] **Step 1: Adicionar import e estado de setores**

Adicionar import no topo:
```typescript
import { formatSetorLabel, type SetorItem } from "@/lib/setores";
```

Adicionar estado:
```typescript
const [setores, setSetores] = useState<SetorItem[]>([]);
```

Adicionar `setorId` ao tipo de formulário e ao estado inicial do modal de edição (buscar pelo bloco que define `manufacturer`, `tag`, etc.):
```typescript
setorId: null as number | null
```

- [ ] **Step 2: Carregar setores no mount**

Junto ao `useEffect` que já carrega instrumentos, adicionar ou ampliar para buscar setores:
```typescript
useEffect(() => {
  void loadSetores();
}, []);

async function loadSetores() {
  try {
    const response = await fetchApi("/api/setores", { method: "GET", cache: "no-store" });
    const payload = (await response.json()) as { items?: SetorItem[] };
    setSetores(payload.items ?? []);
  } catch {
    // setores são opcionais — falha silenciosa
  }
}
```

- [ ] **Step 3: Adicionar filtro por setor**

Adicionar estado:
```typescript
const [setorFilter, setSetorFilter] = useState("");
```

Adicionar ao `useMemo` de filtragem (junto com `matchesManufacturer`):
```typescript
const matchesSetor = !setorFilter || (row.setor?.id === Number(setorFilter));
// incluir matchesSetor no filtro final: && matchesSetor
```

Adicionar o elemento `<select>` de filtro junto ao filtro de fabricante:
```tsx
<label className="inventory-filter-field">
  <span>Setor</span>
  <select value={setorFilter} onChange={(event) => setSetorFilter(event.target.value)}>
    <option value="">Todos os setores</option>
    <option value="none">Sem setor</option>
    {setores.map((setor) => (
      <option key={setor.id} value={setor.id}>{formatSetorLabel(setor)}</option>
    ))}
  </select>
</label>
```

Para o filtro "Sem setor", ajustar a lógica:
```typescript
const matchesSetor =
  !setorFilter ||
  (setorFilter === "none" ? row.setor === null : row.setor?.id === Number(setorFilter));
```

- [ ] **Step 4: Adicionar coluna "Setor" na tabela**

No `<thead>`, adicionar após a coluna Fabricante:
```tsx
<th>Setor</th>
```

No `<tbody>`, adicionar após `<td data-label="Fabricante">`:
```tsx
<td data-label="Setor">
  {row.setor ? formatSetorLabel(row.setor) : <span className="inventory-table__empty-cell">Sem setor</span>}
</td>
```

- [ ] **Step 5: Adicionar campo setor no modal de edição**

Localizar onde `openEditModal` popula o `formState` e adicionar:
```typescript
setorId: row.setor?.id ?? null
```

No JSX do modal de edição, adicionar dropdown após o campo fabricante:
```tsx
<label className="instrument-modal__field instrument-modal__field--full">
  <span>Setor de uso</span>
  <select
    value={formState.setorId ?? ""}
    onChange={(event) => {
      const val = event.target.value;
      setFormState((current) => ({
        ...current,
        setorId: val === "" ? null : Number(val)
      }));
    }}
  >
    <option value="">Sem setor definido</option>
    {setores.map((setor) => (
      <option key={setor.id} value={setor.id}>
        {setor.codigo} – {setor.nome}
      </option>
    ))}
  </select>
</label>
```

Localizar o payload do `fetchApi` com `method: "PATCH"` e adicionar:
```typescript
setorId: formState.setorId
```

- [ ] **Step 6: Verificar que o build passa e rodar todos os testes**

```bash
npm run build && npm run test
```
Esperado: build limpo, 82+ testes passando.

- [ ] **Step 7: Commit**

```bash
git add app/_components/instruments-content.tsx
git commit -m "feat: add setor column, filter, and edit field to instruments list"
```

---

## Checklist Final

Após implementar todas as tasks:

- [ ] `npm run test` — todos os testes passam
- [ ] `npm run build` — build sem erros
- [ ] Testar manualmente:
  - [ ] Criar um setor em `/configuracoes/setores`
  - [ ] Editar um setor
  - [ ] Excluir um setor (verificar que o instrumento vinculado fica com `setor: null`)
  - [ ] Criar instrumento com setor em `/instrumentos/novo`
  - [ ] Editar instrumento e mudar o setor na lista de instrumentos
  - [ ] Filtrar instrumentos por setor
  - [ ] Verificar que instrumento sem setor exibe "Sem setor" corretamente

## Relacionado
- [[modulos/setores]] — lib implementada
- [[api/setores]] — CRUD implementado
- [[componentes/setores-content]] — UI implementada
- [[componentes/instruments-content]] — filtro e coluna setor
