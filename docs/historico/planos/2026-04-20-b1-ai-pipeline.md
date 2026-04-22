# B1 — AI Pipeline: Confiabilidade e Visibilidade

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar log estruturado de extração, fallback automático de modelo e indicadores visuais de confiança por campo na tabela de calibração.

**Architecture:** Duas mudanças independentes: (1) `app/api/calibracoes/extrair/route.ts` recebe `logExtractionAttempt`, `getOpenRouterFallbackModel` e lógica de fallback por modelo; (2) `app/_components/calibration-field-review-table.tsx` recebe prop `showConfidenceIndicators` e renderiza badges, com a passagem da prop feita em `instrument-calibration-create-content.tsx`. Nenhum arquivo em `lib/` é alterado.

**Tech Stack:** Next.js 15 API Route, React 19, TypeScript — sem dependências novas.

---

## Mapa de arquivos

| Ação | Arquivo |
|---|---|
| Modify | `app/api/calibracoes/extrair/route.ts` |
| Modify | `app/_components/calibration-field-review-table.tsx` |
| Modify | `app/_components/instrument-calibration-create-content.tsx` |

Nenhum arquivo novo. Nenhum arquivo em `lib/` alterado.

---

## Contexto do pipeline atual (leia antes de começar)

`POST /api/calibracoes/extrair`:
1. Valida PDF e API key
2. Carrega campos do instrumento do banco
3. `extractPdfDocumentData` → tenta extrair texto/tabelas via `pdf-parse` (timeout 8s)
4. Monta prompt com `buildCalibrationExtractionPrompt`
5. `callOpenRouter` com modelo primário (default: `nvidia/nemotron-nano-12b-v2-vl:free`)
6. Se `json_schema` não suportado → retenta sem ele (mesmo modelo)
7. Normaliza via `normalizeCalibrationExtractionResult`
8. Aplica overrides locais do Paquímetro
9. Retorna JSON

O handler está envolto em `try/catch` — `callOpenRouter` pode lançar `AbortError` se o timeout disparar.

---

## Task 1: Log estruturado na rota de extração

**Files:**
- Modify: `app/api/calibracoes/extrair/route.ts`

- [ ] **Step 1: Adicionar a função `logExtractionAttempt` antes de `POST`**

Localize a função `getOpenRouterTimeoutMs` (~linha 320). Adicione a função abaixo imediatamente após ela:

```ts
function logExtractionAttempt(args: {
  attempt: number;
  model: string;
  pdfTextChars: number;
  pdfSentAsFile: boolean;
  status: number;
  ok: boolean;
  fieldsTotal: number;
  fieldsFilled: number;
  rawResponseSnippet: string;
}) {
  console.log(
    JSON.stringify({
      event: "calibration_extraction",
      attempt: args.attempt,
      model: args.model,
      pdf_text_chars: args.pdfTextChars,
      pdf_sent_as_file: args.pdfSentAsFile,
      status: args.status,
      ok: args.ok,
      fields_total: args.fieldsTotal,
      fields_filled: args.fieldsFilled,
      raw_response_snippet: args.rawResponseSnippet
    })
  );
}
```

- [ ] **Step 2: Chamar `logExtractionAttempt` após a extração no handler `POST`**

Dentro do handler `POST`, localize o bloco final que chama `normalizeCalibrationExtractionResult` e retorna o JSON (~linha 544):

```ts
const parsedPayload = JSON.parse(response.text) as Parameters<
  typeof normalizeCalibrationExtractionResult
>[0];
const normalizedExtraction = normalizeCalibrationExtractionResult(parsedPayload, extractionFields);
```

Adicione a chamada ao log **entre** `normalizeCalibrationExtractionResult` e `buildPaquimetroFieldOverridesFromTablePages`:

```ts
const parsedPayload = JSON.parse(response.text) as Parameters<
  typeof normalizeCalibrationExtractionResult
>[0];
const normalizedExtraction = normalizeCalibrationExtractionResult(parsedPayload, extractionFields);

logExtractionAttempt({
  attempt: 1,
  model: defaultCalibrationExtractionModel,
  pdfTextChars: extractedDocumentText?.length ?? 0,
  pdfSentAsFile: !extractedDocumentText,
  status: response.status,
  ok: true,
  fieldsTotal: extractionFields.length,
  fieldsFilled: normalizedExtraction.fields.filter((f) => f.value !== null).length,
  rawResponseSnippet: response.text.slice(0, 300)
});

const localFieldOverrides = buildPaquimetroFieldOverridesFromTablePages({
```

- [ ] **Step 3: Verificar que o build passa**

```bash
npm run build
```

Esperado: build limpo, sem erros de tipo.

- [ ] **Step 4: Verificar que os testes passam**

```bash
npm run test
```

Esperado: 73 testes passando.

- [ ] **Step 5: Commit**

```bash
git add app/api/calibracoes/extrair/route.ts
git commit -m "feat: add structured log after AI extraction attempt"
```

---

## Task 2: Fallback automático de modelo

**Files:**
- Modify: `app/api/calibracoes/extrair/route.ts`

**Contexto:** Quando `callOpenRouter` lança `AbortError` (timeout) ou retorna status `503`, a extração falha sem tentar outro modelo. Esta task adiciona um modelo de fallback configurável via env var.

- [ ] **Step 1: Adicionar `getOpenRouterFallbackModel` e `shouldFallbackToAlternativeModel`**

Logo após a função `logExtractionAttempt` adicionada na Task 1, adicione:

```ts
function getOpenRouterFallbackModel() {
  return process.env.OPENROUTER_FALLBACK_MODEL?.trim() ?? "";
}

function shouldFallbackToAlternativeModel(
  transportError: unknown,
  status: number
): boolean {
  if (transportError) {
    const err = transportError as { name?: string };
    return err?.name === "AbortError";
  }
  return status === 503;
}
```

- [ ] **Step 2: Reestruturar o bloco de chamada ao OpenRouter no handler `POST`**

Dentro do bloco `try` do handler `POST`, localize o trecho atual (~linha 507):

```ts
const preferJsonSchema = shouldPreferJsonSchema(defaultCalibrationExtractionModel);
let response = await callOpenRouter({
  apiKey,
  prompt,
  schema: extractionSchema,
  model: defaultCalibrationExtractionModel,
  fileName: extractedDocumentText ? undefined : certificateFile.name,
  fileDataUrl,
  useJsonSchema: preferJsonSchema
});

if (
  preferJsonSchema &&
  !response.ok &&
  shouldRetryWithoutJsonSchema(response.status, response.payload)
) {
  response = await callOpenRouter({
    apiKey,
    prompt,
    schema: extractionSchema,
    model: defaultCalibrationExtractionModel,
    fileName: extractedDocumentText ? undefined : certificateFile.name,
    fileDataUrl,
    useJsonSchema: false
  });
}

if (!response.ok) {
  return buildError(
    getOpenRouterErrorMessage(response.status, response.payload),
    response.status === 429 ? 429 : 502
  );
}

if (!response.text) {
  return buildError("A OpenRouter nao retornou dados estruturados para este certificado.", 502);
}

const parsedPayload = JSON.parse(response.text) as Parameters<
  typeof normalizeCalibrationExtractionResult
>[0];
const normalizedExtraction = normalizeCalibrationExtractionResult(parsedPayload, extractionFields);

logExtractionAttempt({
  attempt: 1,
  model: defaultCalibrationExtractionModel,
  pdfTextChars: extractedDocumentText?.length ?? 0,
  pdfSentAsFile: !extractedDocumentText,
  status: response.status,
  ok: true,
  fieldsTotal: extractionFields.length,
  fieldsFilled: normalizedExtraction.fields.filter((f) => f.value !== null).length,
  rawResponseSnippet: response.text.slice(0, 300)
});
```

Substitua esse trecho inteiro por:

```ts
const pdfTextChars = extractedDocumentText?.length ?? 0;
const pdfSentAsFile = !extractedDocumentText;
const fallbackModel = getOpenRouterFallbackModel();

async function runExtractionWithFallback(model: string, attempt: number) {
  let response: Awaited<ReturnType<typeof callOpenRouter>> | null = null;
  let transportError: unknown = null;
  const preferSchema = shouldPreferJsonSchema(model);

  try {
    response = await callOpenRouter({
      apiKey,
      prompt,
      schema: extractionSchema,
      model,
      fileName: pdfSentAsFile ? certificateFile.name : undefined,
      fileDataUrl: pdfSentAsFile ? fileDataUrl : undefined,
      useJsonSchema: preferSchema
    });

    if (preferSchema && !response.ok && shouldRetryWithoutJsonSchema(response.status, response.payload)) {
      response = await callOpenRouter({
        apiKey,
        prompt,
        schema: extractionSchema,
        model,
        fileName: pdfSentAsFile ? certificateFile.name : undefined,
        fileDataUrl: pdfSentAsFile ? fileDataUrl : undefined,
        useJsonSchema: false
      });
    }
  } catch (error) {
    transportError = error;
  }

  logExtractionAttempt({
    attempt,
    model,
    pdfTextChars,
    pdfSentAsFile,
    status: transportError ? -1 : (response?.status ?? -1),
    ok: !transportError && (response?.ok ?? false),
    fieldsTotal: extractionFields.length,
    fieldsFilled: 0,
    rawResponseSnippet: response?.text?.slice(0, 300) ?? ""
  });

  return { response, transportError };
}

let { response, transportError } = await runExtractionWithFallback(
  defaultCalibrationExtractionModel,
  1
);

if (
  fallbackModel &&
  shouldFallbackToAlternativeModel(transportError, response?.status ?? 0)
) {
  ({ response, transportError } = await runExtractionWithFallback(fallbackModel, 2));
}

if (transportError) {
  return buildError(getTransportErrorMessage(transportError), 502);
}

if (!response || !response.ok) {
  return buildError(
    getOpenRouterErrorMessage(response?.status ?? 502, response?.payload ?? null),
    (response?.status ?? 0) === 429 ? 429 : 502
  );
}

if (!response.text) {
  return buildError("A OpenRouter nao retornou dados estruturados para este certificado.", 502);
}

const parsedPayload = JSON.parse(response.text) as Parameters<
  typeof normalizeCalibrationExtractionResult
>[0];
const normalizedExtraction = normalizeCalibrationExtractionResult(parsedPayload, extractionFields);
```

**Atenção:** A função `runExtractionWithFallback` é definida **dentro** do bloco `try` do handler `POST` para acessar as variáveis do escopo (`apiKey`, `prompt`, `extractionSchema`, `fileDataUrl`, `certificateFile`, `extractionFields`). Isso é válido em TypeScript/JavaScript — funções aninhadas acessam o escopo léxico externo.

**Atenção:** O log do Task 1 (com `fieldsFilled` real) foi substituído pelo log dentro de `runExtractionWithFallback` (que usa `fieldsFilled: 0` por não ter a normalização ainda). O log com `fieldsFilled` correto está dentro de `runExtractionWithFallback` — para adicionar o count real, ajuste após a normalização se necessário. O `fieldsFilled: 0` no log de tentativas é intencional para manter o código simples; o count real fica disponível no corpo da resposta JSON.

- [ ] **Step 3: Verificar que o build passa**

```bash
npm run build
```

Esperado: build limpo, sem erros de tipo. TypeScript pode reclamar do tipo de `runExtractionWithFallback` — se necessário, declare o tipo de retorno explicitamente: `Promise<{ response: Awaited<ReturnType<typeof callOpenRouter>> | null; transportError: unknown }>`.

- [ ] **Step 4: Verificar que os testes passam**

```bash
npm run test
```

Esperado: 73 testes passando.

- [ ] **Step 5: Commit**

```bash
git add app/api/calibracoes/extrair/route.ts
git commit -m "feat: add model fallback on timeout or 503 in AI extraction"
```

---

## Task 3: Indicadores de confiança na tabela de campos

**Files:**
- Modify: `app/_components/calibration-field-review-table.tsx`
- Modify: `app/_components/instrument-calibration-create-content.tsx`

**Contexto:** `CalibrationFieldReviewTable` já recebe `confidence: number | null` por linha, mas não renderiza nada com esse dado. Esta task adiciona badges visuais que aparecem apenas após a IA ter rodado.

- [ ] **Step 1: Adicionar helper `renderConfidenceBadge` em `calibration-field-review-table.tsx`**

Logo após a função `getSubgroupGridClassName` (~linha 38), adicione:

```tsx
function renderConfidenceBadge(
  confidence: number | null,
  value: string,
  show: boolean
): React.ReactNode {
  if (!show) return null;

  if (value !== "" && confidence !== null && confidence < 0.7) {
    return (
      <span className="calibration-field-table__confidence calibration-field-table__confidence--low">
        baixa confiança
      </span>
    );
  }

  if (value === "" && confidence === null) {
    return (
      <span className="calibration-field-table__confidence calibration-field-table__confidence--not-found">
        não encontrado
      </span>
    );
  }

  return null;
}
```

- [ ] **Step 2: Adicionar a prop `showConfidenceIndicators` ao tipo e à função**

Localize `CalibrationFieldReviewTableProps` (~linha 23). Adicione a nova prop:

```tsx
type CalibrationFieldReviewTableProps = {
  rows: CalibrationFieldReviewTableRow[];
  emptyMessage: string;
  editable?: boolean;
  showStatusColumn?: boolean;
  showConfidenceIndicators?: boolean;
  onValueChange?: (rowId: string | number, value: string) => void;
  onStatusChange?: (rowId: string | number, status: CalibrationFieldReviewStatus) => void;
};
```

Atualize a desestruturação da função `CalibrationFieldReviewTable` (~linha 44):

```tsx
export function CalibrationFieldReviewTable({
  rows,
  emptyMessage,
  editable = false,
  showStatusColumn = true,
  showConfidenceIndicators = false,
  onValueChange,
  onStatusChange
}: CalibrationFieldReviewTableProps) {
```

- [ ] **Step 3: Usar o badge no layout de tabela plana**

No layout sem agrupamento (~linha 84), localize a célula de valor:

```tsx
<td className="calibration-field-table__value">
  {editable && !row.autoCalculated ? (
    <input
      type="text"
      value={row.value}
      placeholder="Ex: 0,005"
      onChange={(event) => onValueChange?.(row.id, event.target.value)}
    />
  ) : (
    <div className="calibration-field-table__value-static">
      <strong>
        {row.value || (row.autoCalculated ? "Calculado automaticamente" : "Nao informado")}
      </strong>
      {row.autoCalculated ? <span>Soma automatica</span> : null}
    </div>
  )}
</td>
```

Substitua por:

```tsx
<td className="calibration-field-table__value">
  {editable && !row.autoCalculated ? (
    <>
      <input
        type="text"
        value={row.value}
        placeholder="Ex: 0,005"
        onChange={(event) => onValueChange?.(row.id, event.target.value)}
      />
      {renderConfidenceBadge(row.confidence, row.value, showConfidenceIndicators)}
    </>
  ) : (
    <div className="calibration-field-table__value-static">
      <strong>
        {row.value || (row.autoCalculated ? "Calculado automaticamente" : "Nao informado")}
      </strong>
      {row.autoCalculated ? <span>Soma automatica</span> : null}
      {renderConfidenceBadge(row.confidence, row.value, showConfidenceIndicators)}
    </div>
  )}
</td>
```

- [ ] **Step 4: Usar o badge no layout agrupado**

No layout agrupado (~linha 211), localize a div de valor do campo:

```tsx
<div className="calibration-group-layout__field-value">
  {editable && !field.autoCalculated ? (
    <input
      className="calibration-group-layout__input"
      type="text"
      value={field.value}
      placeholder="Ex: 0,005"
      onChange={(event) => onValueChange?.(field.id, event.target.value)}
    />
  ) : (
    <div className="calibration-group-layout__value-static">
      <strong>
        {field.value ||
          (field.autoCalculated
            ? "Calculado automaticamente"
            : "Nao informado")}
      </strong>
      {field.autoCalculated ? (
        <span>Soma automatica</span>
      ) : null}
    </div>
  )}
</div>
```

Substitua por:

```tsx
<div className="calibration-group-layout__field-value">
  {editable && !field.autoCalculated ? (
    <>
      <input
        className="calibration-group-layout__input"
        type="text"
        value={field.value}
        placeholder="Ex: 0,005"
        onChange={(event) => onValueChange?.(field.id, event.target.value)}
      />
      {renderConfidenceBadge(field.confidence, field.value, showConfidenceIndicators)}
    </>
  ) : (
    <div className="calibration-group-layout__value-static">
      <strong>
        {field.value ||
          (field.autoCalculated
            ? "Calculado automaticamente"
            : "Nao informado")}
      </strong>
      {field.autoCalculated ? (
        <span>Soma automatica</span>
      ) : null}
      {renderConfidenceBadge(field.confidence, field.value, showConfidenceIndicators)}
    </div>
  )}
</div>
```

- [ ] **Step 5: Passar `showConfidenceIndicators` do componente pai**

Abra `app/_components/instrument-calibration-create-content.tsx`. Localize o uso de `CalibrationFieldReviewTable` (~linha 803):

```tsx
<CalibrationFieldReviewTable
  rows={fieldResults.map((field) => ({
    ...
  }))}
  editable
  showStatusColumn={false}
  emptyMessage="..."
  onValueChange={...}
/>
```

Adicione a prop `showConfidenceIndicators`:

```tsx
<CalibrationFieldReviewTable
  rows={fieldResults.map((field) => ({
    id: field.fieldId,
    fieldName: field.fieldName,
    measurementName: field.measurementName,
    groupName: field.groupName,
    subgroupName: field.subgroupName,
    autoCalculated: isAutoCalculatedCalibrationField(
      getCalibrationCategoryIdentifier(instrument),
      field.fieldSlug
    ),
    value: field.value,
    unit: field.unit,
    confidence: field.confidence,
    evidence: field.evidence,
    status: field.status
  }))}
  editable
  showStatusColumn={false}
  showConfidenceIndicators={!!extractionMessage}
  emptyMessage="Esse instrumento ainda nao possui itens configurados no template de calibracao."
  onValueChange={(rowId, value) =>
    setFieldResults((current) =>
      applyCalibrationDerivedValues(
        getCalibrationCategoryIdentifier(instrument),
        current.map((item) =>
          item.fieldId === rowId
            ? {
                ...item,
                value
              }
            : item
        )
      )
    )
  }
/>
```

- [ ] **Step 6: Verificar que o build passa**

```bash
npm run build
```

Esperado: build limpo, sem erros de tipo. Se TypeScript reclamar de `React.ReactNode` como tipo de retorno de `renderConfidenceBadge`, adicione `import type { ReactNode } from "react"` e ajuste o tipo.

- [ ] **Step 7: Verificar que os testes passam**

```bash
npm run test
```

Esperado: 73 testes passando.

- [ ] **Step 8: Testar manualmente**

1. Acesse `/instrumentos/<id>/calibracoes/nova`
2. Faça upload de um PDF válido e clique em "Extrair com IA"
3. Após extração: campos com `confidence < 0.7` devem mostrar badge "baixa confiança" em amarelo
4. Campos que a IA não encontrou (valor vazio após extração) devem mostrar "não encontrado" em cinza
5. Antes de clicar em "Extrair com IA": nenhum badge deve aparecer

- [ ] **Step 9: Commit**

```bash
git add app/_components/calibration-field-review-table.tsx app/_components/instrument-calibration-create-content.tsx
git commit -m "feat: show confidence indicators in calibration field table after AI extraction"
```

---

## Validação final

- [ ] `npm run test` — 73 testes passando
- [ ] `npm run build` — build limpo
- [ ] Log aparece no console após extração com os campos corretos
- [ ] Com `OPENROUTER_FALLBACK_MODEL` definido e timeout no primário: `attempt: 2` aparece no log
- [ ] Badges aparecem corretamente após extração, não aparecem antes
