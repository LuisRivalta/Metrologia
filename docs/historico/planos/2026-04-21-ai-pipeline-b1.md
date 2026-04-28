---
tags: [historico, plano, ia]
feature: B1 — Pipeline IA SSE Streaming
data: 2026-04-21
---
# B1 — Pipeline de IA: SSE + Table Markdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar o pipeline de extração por IA adicionando streaming SSE para feedback visual em tempo real e formatação de tabelas PDF em Markdown para reduzir campos `null`.

**Architecture:** O endpoint `POST /api/calibracoes/extrair` passa a retornar um `ReadableStream` com eventos SSE. A validação inicial ainda retorna JSON (respostas HTTP 4xx rápidas). A fase de extração emite eventos `status` → `result` ou `error`. Um helper `lib/api/extract-sse.ts` lê o stream nos dois componentes que usam o endpoint.

**Tech Stack:** Next.js App Router (ReadableStream nativo), React (useState), Vitest (testes unitários), TypeScript.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `lib/calibration-extraction.ts` | Modificar | Adicionar `formatTablePagesAsMarkdown`; atualizar `buildCalibrationExtractionPrompt` para aceitar `tableMarkdown` |
| `tests/lib/calibration-extraction.test.ts` | Modificar | Testes para `formatTablePagesAsMarkdown` e nova assinatura do prompt |
| `app/api/calibracoes/extrair/route.ts` | Modificar | Converter para SSE; integrar `tableMarkdown` no prompt |
| `lib/api/extract-sse.ts` | Criar | Helper async-generator para leitura de SSE no frontend |
| `app/_components/instrument-calibration-create-content.tsx` | Modificar | Consumir SSE; exibir `extractionStep` no botão |
| `app/_components/instrument-create-content.tsx` | Modificar | Idem; sem abort controller (não existe hoje) |

---

## Task 1: formatTablePagesAsMarkdown (TDD)

**Files:**
- Modify: `lib/calibration-extraction.ts`
- Modify: `tests/lib/calibration-extraction.test.ts`

- [ ] **Step 1.1: Adicionar import de tipo em calibration-extraction.ts**

No topo de `lib/calibration-extraction.ts`, adicionar ao import existente:

```ts
import type { CalibrationCertificateTablePage } from "@/lib/calibration-certificate-parsers";
```

- [ ] **Step 1.2: Escrever os testes que falham**

Adicionar ao final de `tests/lib/calibration-extraction.test.ts` (antes do fecha-chaves do `describe`):

```ts
import {
  buildCalibrationExtractionPrompt,
  buildCalibrationExtractionSchema,
  formatTablePagesAsMarkdown,
  normalizeCalibrationExtractionResult,
  prepareCalibrationExtractionDocumentText
} from "@/lib/calibration-extraction";
```

> Substituir o import existente no topo do arquivo pelo de cima (adiciona `formatTablePagesAsMarkdown`).

Adicionar os seguintes casos dentro do `describe("calibration-extraction", () => { ... })`:

```ts
describe("formatTablePagesAsMarkdown", () => {
  it("returns empty string when tablePages is empty", () => {
    expect(formatTablePagesAsMarkdown([])).toBe("");
  });

  it("returns empty string when all rows are empty", () => {
    const pages = [{ num: 1, tables: [[ ["", ""], ["", ""] ]] }];
    expect(formatTablePagesAsMarkdown(pages)).toBe("");
  });

  it("formats a single table with header and body rows", () => {
    const pages = [
      {
        num: 1,
        tables: [
          [
            ["Ponto", "Valor", "Erro"],
            ["1", "25,00", "0,01"],
            ["2", "50,00", "0,02"]
          ]
        ]
      }
    ];
    const result = formatTablePagesAsMarkdown(pages);
    expect(result).toContain("## Tabelas extraídas do PDF");
    expect(result).toContain("### Página 1 — Tabela 1");
    expect(result).toContain("| Ponto | Valor | Erro |");
    expect(result).toContain("| --- | --- | --- |");
    expect(result).toContain("| 1 | 25,00 | 0,01 |");
    expect(result).toContain("| 2 | 50,00 | 0,02 |");
  });

  it("filters out rows where all cells are empty", () => {
    const pages = [
      {
        num: 2,
        tables: [
          [
            ["Col A", "Col B"],
            ["", ""],
            ["val", "123"]
          ]
        ]
      }
    ];
    const result = formatTablePagesAsMarkdown(pages);
    expect(result).toContain("| val | 123 |");
    expect(result).not.toContain("| | |");
  });

  it("truncates output when it exceeds maxLength", () => {
    const longCell = "A".repeat(200);
    const pages = [
      {
        num: 1,
        tables: [
          Array.from({ length: 30 }, () => [longCell, longCell, longCell])
        ]
      }
    ];
    const result = formatTablePagesAsMarkdown(pages, 500);
    expect(result.length).toBeLessThanOrEqual(540); // 500 + "[tabelas truncadas]"
    expect(result).toContain("[tabelas truncadas]");
  });

  it("labels multiple tables across pages correctly", () => {
    const pages = [
      { num: 1, tables: [ [["H1"], ["V1"]] ] },
      { num: 3, tables: [ [["H2"], ["V2"]], [["H3"], ["V3"]] ] }
    ];
    const result = formatTablePagesAsMarkdown(pages);
    expect(result).toContain("### Página 1 — Tabela 1");
    expect(result).toContain("### Página 3 — Tabela 1");
    expect(result).toContain("### Página 3 — Tabela 2");
  });
});
```

- [ ] **Step 1.3: Executar os testes — confirmar que falham**

```bash
npx vitest run tests/lib/calibration-extraction.test.ts
```

Esperado: falha com `formatTablePagesAsMarkdown is not a function` (ou similar).

- [ ] **Step 1.4: Implementar formatTablePagesAsMarkdown em calibration-extraction.ts**

Adicionar a seguinte função exportada ao final de `lib/calibration-extraction.ts` (antes do último export existente ou no fim do arquivo):

```ts
export function formatTablePagesAsMarkdown(
  tablePages: CalibrationCertificateTablePage[],
  maxLength = maxCalibrationExtractionDocumentTextLength
): string {
  const sections: string[] = [];

  for (const page of tablePages) {
    for (let tableIndex = 0; tableIndex < page.tables.length; tableIndex++) {
      const table = page.tables[tableIndex];
      if (!table || table.length === 0) continue;

      const rows = table.filter((row) => row.some((cell) => cell.trim() !== ""));
      if (rows.length === 0) continue;

      const header = rows[0]!;
      const body = rows.slice(1);
      const headerRow = `| ${header.map((c) => c.trim() || " ").join(" | ")} |`;
      const separatorRow = `| ${header.map(() => "---").join(" | ")} |`;
      const bodyRows = body.map(
        (row) => `| ${row.map((c) => c.trim() || " ").join(" | ")} |`
      );

      sections.push(
        [
          `### Página ${page.num} — Tabela ${tableIndex + 1}`,
          headerRow,
          separatorRow,
          ...bodyRows
        ].join("\n")
      );
    }
  }

  if (sections.length === 0) return "";

  const result = ["## Tabelas extraídas do PDF", ...sections].join("\n\n");
  if (result.length <= maxLength) return result;

  return `${result.slice(0, maxLength).trimEnd()}\n\n[tabelas truncadas]`;
}
```

- [ ] **Step 1.5: Executar os testes — confirmar que passam**

```bash
npx vitest run tests/lib/calibration-extraction.test.ts
```

Esperado: todos os testes passam.

- [ ] **Step 1.6: Commit**

```bash
git add lib/calibration-extraction.ts tests/lib/calibration-extraction.test.ts
git commit -m "feat: add formatTablePagesAsMarkdown to calibration-extraction"
```

---

## Task 2: Integrar tableMarkdown no buildCalibrationExtractionPrompt

**Files:**
- Modify: `lib/calibration-extraction.ts`
- Modify: `tests/lib/calibration-extraction.test.ts`

- [ ] **Step 2.1: Escrever testes para o novo parâmetro tableMarkdown**

Adicionar dentro do `describe("calibration-extraction", () => { ... })`, após os testes existentes de `buildCalibrationExtractionPrompt`:

```ts
it("includes table markdown in the prompt when tableMarkdown is provided", () => {
  const prompt = buildCalibrationExtractionPrompt({
    instrumentTag: "DI-048",
    category: "Paquimetro",
    fields,
    documentText: "Texto do certificado",
    tableMarkdown: "## Tabelas extraídas do PDF\n### Página 1 — Tabela 1\n| Col | Val |\n| --- | --- |\n| a | 1 |"
  });

  expect(prompt).toContain("Texto do certificado");
  expect(prompt).toContain("## Tabelas extraídas do PDF");
  expect(prompt).toContain("Use apenas o texto extraido abaixo.");
});

it("uses tableMarkdown as document section when documentText is absent", () => {
  const prompt = buildCalibrationExtractionPrompt({
    instrumentTag: "DI-048",
    category: "Paquimetro",
    fields,
    tableMarkdown: "## Tabelas extraídas do PDF\n| Col | Val |"
  });

  expect(prompt).toContain("## Tabelas extraídas do PDF");
  expect(prompt).toContain("Use apenas o texto extraido abaixo.");
  expect(prompt).not.toContain("Use o PDF anexado como fonte principal.");
});
```

- [ ] **Step 2.2: Executar para confirmar falha**

```bash
npx vitest run tests/lib/calibration-extraction.test.ts
```

Esperado: os 2 novos testes falham.

- [ ] **Step 2.3: Atualizar buildCalibrationExtractionPrompt em calibration-extraction.ts**

Substituir a função `buildCalibrationExtractionPrompt` existente (linhas 132–174) pela versão abaixo:

```ts
export function buildCalibrationExtractionPrompt(args: {
  instrumentTag: string;
  category: string;
  fields: MeasurementFieldItem[];
  documentText?: string | null;
  tableMarkdown?: string | null;
}) {
  const fieldsBlock = args.fields
    .map((field) => {
      const base = `- slug: ${field.slug}; nome: ${field.name}; grupo: ${field.groupName || "nenhum"}; subgrupo: ${field.subgroupName || "nenhum"}; medida esperada: ${field.measurementName || field.measurementRawName || "nao informada"}`;
      return field.hint ? `${base}; dica: ${field.hint}` : base;
    })
    .join("\n");

  const documentParts: string[] = [];
  if (args.documentText) documentParts.push(args.documentText);
  if (args.tableMarkdown) documentParts.push(args.tableMarkdown);

  const hasDocumentContent = documentParts.length > 0;

  const documentTextBlock = hasDocumentContent
    ? [
        "",
        "Texto extraido do certificado:",
        '"""',
        documentParts.join("\n\n"),
        '"""'
      ].join("\n")
    : "";

  return [
    "Extraia os dados do certificado de calibracao em PDF.",
    "Retorne somente dados que estejam explicitamente no documento ou claramente derivados dele.",
    "Se um dado nao estiver visivel, use null.",
    "Nao invente resultados, datas, nomes ou status.",
    "Nao retorne numero do certificado nem laboratorio.",
    "Para cada campo esperado, procure a linha correspondente e indique se esta conforme quando isso aparecer no certificado.",
    "Alguns campos representam caracteristicas tecnicas do instrumento (como capacidade, divisao, resolucao, classe) que podem estar na secao de identificacao ou cabecalho do certificado, e nao somente nas tabelas de medicao.",
    "Use somente os field_slug fornecidos abaixo.",
    hasDocumentContent
      ? "Use apenas o texto extraido abaixo. Ele pode conter quebras de linha imperfeitas, colunas quebradas e cabecalhos repetidos."
      : "Use o PDF anexado como fonte principal.",
    "",
    `Instrumento: ${args.instrumentTag}`,
    `Categoria: ${args.category}`,
    "Campos esperados:",
    fieldsBlock,
    documentTextBlock
  ].join("\n");
}
```

- [ ] **Step 2.4: Executar testes — confirmar que passam**

```bash
npx vitest run tests/lib/calibration-extraction.test.ts
```

Esperado: todos os testes passam (incluindo os pré-existentes que não usam `tableMarkdown`).

- [ ] **Step 2.5: Commit**

```bash
git add lib/calibration-extraction.ts tests/lib/calibration-extraction.test.ts
git commit -m "feat: add tableMarkdown param to buildCalibrationExtractionPrompt"
```

---

## Task 3: Converter endpoint para SSE e integrar tableMarkdown

**Files:**
- Modify: `app/api/calibracoes/extrair/route.ts`

- [ ] **Step 3.1: Adicionar imports de formatTablePagesAsMarkdown e maxCalibrationExtractionDocumentTextLength**

No topo de `app/api/calibracoes/extrair/route.ts`, adicionar `formatTablePagesAsMarkdown` e `maxCalibrationExtractionDocumentTextLength` ao import de `@/lib/calibration-extraction`:

```ts
import {
  buildCalibrationExtractionPrompt,
  buildCalibrationExtractionSchema,
  defaultCalibrationExtractionModel,
  formatTablePagesAsMarkdown,
  maxCalibrationExtractionDocumentTextLength,
  normalizeCalibrationExtractionResult,
  prepareCalibrationExtractionDocumentText
} from "@/lib/calibration-extraction";
```

- [ ] **Step 3.2: Substituir a função POST pela versão SSE**

Substituir a função `export async function POST(request: Request)` inteira (da linha 455 até o fim do arquivo) pela implementação abaixo.

> **Atenção:** todas as funções auxiliares acima da função `POST` (como `callOpenRouter`, `runExtractionAttempt`, `buildOpenRouterPrompt`, etc.) permanecem inalteradas. Apenas a função `POST` é substituída.

```ts
export async function POST(request: Request) {
  const apiKey = getOpenRouterApiKey();

  if (!apiKey) {
    return buildError("Defina OPENROUTER_API_KEY para habilitar a extracao por IA.", 503);
  }

  const formData = await request.formData();
  const instrumentId = Number(getFormValue(formData, "instrumentId"));
  const instrumentTag = getFormValue(formData, "instrumentTag");
  const category = getFormValue(formData, "category");
  const manualFieldsJson = getFormValue(formData, "fieldsJson");
  const certificateFile = getFormFile(formData, "certificateFile");

  if (!certificateFile) {
    return buildError("Envie o certificado em PDF.");
  }

  if (!isPdfCertificateFile(certificateFile.name, certificateFile.type)) {
    return buildError("O certificado deve estar no formato PDF.");
  }

  if (certificateFile.size <= 0) {
    return buildError("O arquivo do certificado esta vazio.");
  }

  if (certificateFile.size > MAX_CALIBRATION_CERTIFICATE_FILE_SIZE) {
    return buildError("O certificado deve ter no maximo 10 MB.");
  }

  let extractionFields: MeasurementFieldItem[] = [];
  let extractionTarget = {
    id: Number.isFinite(instrumentId) && instrumentId > 0 ? instrumentId : null,
    tag: instrumentTag || "Novo instrumento",
    category: category || "Sem categoria"
  };

  if (Number.isFinite(instrumentId) && instrumentId > 0) {
    const instrumentDetailResponse = await loadInstrumentDetailForCalibration(instrumentId);

    if (instrumentDetailResponse.error) {
      return buildError("Nao foi possivel carregar os campos do instrumento.", 500);
    }

    if (!instrumentDetailResponse.item) {
      return buildError("Instrumento nao encontrado.", 404);
    }

    extractionFields = instrumentDetailResponse.item.fields.filter(
      (field): field is typeof field & { dbId: number } => typeof field.dbId === "number"
    );
    extractionTarget = {
      id: instrumentId,
      tag: instrumentDetailResponse.item.tag,
      category: instrumentDetailResponse.item.category
    };
  } else {
    const parsedManualFields = parseManualExtractionFields(manualFieldsJson);

    if ("error" in parsedManualFields) {
      return buildError(parsedManualFields.error ?? "Campos invalidos para extracao.");
    }

    extractionFields = parsedManualFields.fields;
  }

  if (extractionFields.length === 0) {
    return buildError(
      "Esse instrumento nao possui campos configurados para receber a extracao por IA."
    );
  }

  const encoder = new TextEncoder();

  function emitSse(
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: string,
    data: unknown
  ) {
    controller.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  }

  const capturedFile = certificateFile;
  const capturedFields = extractionFields;
  const capturedTarget = extractionTarget;
  const capturedApiKey = apiKey;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const extractionSchema = buildCalibrationExtractionSchema(capturedFields);
        const fallbackModel = getOpenRouterFallbackModel();

        emitSse(controller, "status", { step: "reading_pdf", message: "Lendo o certificado..." });

        const fileBytes = await capturedFile.arrayBuffer();
        const extractedDocumentData = await extractPdfDocumentData(fileBytes);
        const extractedDocumentText = extractedDocumentData.documentText;

        const tablesBudget = Math.max(
          0,
          maxCalibrationExtractionDocumentTextLength - (extractedDocumentText?.length ?? 0)
        );
        const tableMarkdown = formatTablePagesAsMarkdown(
          extractedDocumentData.tablePages,
          tablesBudget
        );

        const prompt = buildCalibrationExtractionPrompt({
          instrumentTag: capturedTarget.tag,
          category: capturedTarget.category,
          fields: capturedFields,
          documentText: extractedDocumentText,
          tableMarkdown: tableMarkdown || undefined
        });

        const fileDataUrl =
          extractedDocumentText || tableMarkdown
            ? undefined
            : encodePdfAsDataUrl(capturedFile, fileBytes);
        const pdfTextChars = (extractedDocumentText?.length ?? 0) + (tableMarkdown?.length ?? 0);
        const pdfSentAsFile = !extractedDocumentText && !tableMarkdown;

        emitSse(controller, "status", { step: "calling_ai", message: "Enviando para a IA..." });

        const runExtractionAttempt = async (
          model: string,
          attempt: number
        ): Promise<{
          response: Awaited<ReturnType<typeof callOpenRouter>> | null;
          transportError: unknown;
        }> => {
          let response: Awaited<ReturnType<typeof callOpenRouter>> | null = null;
          let transportError: unknown = null;
          const preferSchema = shouldPreferJsonSchema(model);

          try {
            response = await callOpenRouter({
              apiKey: capturedApiKey,
              prompt,
              schema: extractionSchema,
              model,
              fileName: pdfSentAsFile ? capturedFile.name : undefined,
              fileDataUrl: pdfSentAsFile ? fileDataUrl : undefined,
              useJsonSchema: preferSchema
            });

            if (
              preferSchema &&
              !response.ok &&
              shouldRetryWithoutJsonSchema(response.status, response.payload)
            ) {
              response = await callOpenRouter({
                apiKey: capturedApiKey,
                prompt,
                schema: extractionSchema,
                model,
                fileName: pdfSentAsFile ? capturedFile.name : undefined,
                fileDataUrl: pdfSentAsFile ? fileDataUrl : undefined,
                useJsonSchema: false
              });
            }
          } catch (error) {
            transportError = error;
          }

          let fieldsFilled = 0;
          if (response?.text) {
            try {
              const parsed = JSON.parse(response.text) as { fields?: Array<{ value: unknown }> };
              fieldsFilled = (parsed.fields ?? []).filter((f) => f.value !== null).length;
            } catch {
              // leave fieldsFilled as 0
            }
          }

          logExtractionAttempt({
            attempt,
            model,
            pdfTextChars,
            pdfSentAsFile,
            status: transportError ? -1 : (response?.status ?? -1),
            ok: !transportError && (response?.ok ?? false),
            fieldsTotal: capturedFields.length,
            fieldsFilled,
            rawResponseSnippet: response?.text?.slice(0, 300) ?? ""
          });

          return { response, transportError };
        };

        let result = await runExtractionAttempt(defaultCalibrationExtractionModel, 1);
        let response = result.response;
        let transportError = result.transportError;

        if (
          fallbackModel &&
          shouldFallbackToAlternativeModel(transportError, response?.status ?? 0)
        ) {
          const fallbackResult = await runExtractionAttempt(fallbackModel, 2);
          response = fallbackResult.response;
          transportError = fallbackResult.transportError;
        }

        if (transportError) {
          emitSse(controller, "error", {
            message: getTransportErrorMessage(transportError),
            status: 502
          });
          return;
        }

        if (!response || !response.ok) {
          const status = response?.status ?? 502;
          emitSse(controller, "error", {
            message: getOpenRouterErrorMessage(status, response?.payload ?? null),
            status: status === 429 ? 429 : 502
          });
          return;
        }

        if (!response.text) {
          emitSse(controller, "error", {
            message: "A OpenRouter nao retornou dados estruturados para este certificado.",
            status: 502
          });
          return;
        }

        emitSse(controller, "status", { step: "processing", message: "Processando resposta..." });

        const parsedPayload = JSON.parse(response.text) as Parameters<
          typeof normalizeCalibrationExtractionResult
        >[0];
        const normalizedExtraction = normalizeCalibrationExtractionResult(
          parsedPayload,
          capturedFields
        );

        const localFieldOverrides = buildPaquimetroFieldOverridesFromTablePages({
          categoryIdentifier: capturedTarget.category,
          documentText: extractedDocumentText,
          tablePages: extractedDocumentData.tablePages,
          fields: capturedFields
        });
        const overridesByFieldId = new Map(
          localFieldOverrides.map((field) => [field.fieldId, field])
        );
        const extraction = {
          ...normalizedExtraction,
          fields: normalizedExtraction.fields.map((field) => {
            const override = overridesByFieldId.get(field.fieldId);

            return override
              ? {
                  ...field,
                  value: override.value,
                  unit: override.unit,
                  confidence: override.confidence,
                  evidence: override.evidence,
                  conforme: override.conforme
                }
              : field;
          })
        };

        emitSse(controller, "result", {
          instrument: {
            id: capturedTarget.id,
            tag: capturedTarget.tag,
            category: capturedTarget.category
          },
          extraction
        });
      } catch (error) {
        emitSse(controller, "error", {
          message: getTransportErrorMessage(error),
          status: 502
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
```

- [ ] **Step 3.3: Verificar build**

```bash
npm run build 2>&1 | tail -30
```

Esperado: build sem erros de TypeScript.

- [ ] **Step 3.4: Commit**

```bash
git add app/api/calibracoes/extrair/route.ts
git commit -m "feat: convert extraction endpoint to SSE streaming"
```

---

## Task 4: Criar helper de leitura SSE

**Files:**
- Create: `lib/api/extract-sse.ts`

- [ ] **Step 4.1: Criar o arquivo lib/api/extract-sse.ts**

```ts
export type SseExtractionStatusEvent = {
  type: "status";
  step: string;
  message: string;
};

export type SseExtractionResultEvent = {
  type: "result";
  data: Record<string, unknown>;
};

export type SseExtractionErrorEvent = {
  type: "error";
  message: string;
  status: number;
};

export type SseExtractionEvent =
  | SseExtractionStatusEvent
  | SseExtractionResultEvent
  | SseExtractionErrorEvent;

export async function* readExtractionSseStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<SseExtractionEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (!part.trim()) continue;

        const lines = part.trim().split("\n");
        let eventType = "message";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6);
          }
        }

        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr) as Record<string, unknown>;

          if (eventType === "status") {
            yield {
              type: "status",
              step: String(parsed.step ?? ""),
              message: String(parsed.message ?? "")
            };
          } else if (eventType === "result") {
            yield { type: "result", data: parsed };
          } else if (eventType === "error") {
            yield {
              type: "error",
              message: String(parsed.message ?? "Erro desconhecido"),
              status: Number(parsed.status ?? 502)
            };
          }
        } catch {
          // skip malformed events
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

- [ ] **Step 4.2: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Esperado: sem erros de tipo.

- [ ] **Step 4.3: Commit**

```bash
git add lib/api/extract-sse.ts
git commit -m "feat: add SSE stream reader helper for extraction endpoint"
```

---

## Task 5: Atualizar instrument-calibration-create-content.tsx

**Files:**
- Modify: `app/_components/instrument-calibration-create-content.tsx`

- [ ] **Step 5.1: Adicionar import do helper SSE**

No topo do arquivo, adicionar o import:

```ts
import { readExtractionSseStream } from "@/lib/api/extract-sse";
```

- [ ] **Step 5.2: Adicionar tipo ExtractionStep e novo estado**

Adicionar após as definições de tipo existentes (antes de `const maxCertificateFileSize`):

```ts
type ExtractionStep = "reading_pdf" | "calling_ai" | "processing";
```

Na lista de estados dentro do componente `InstrumentCalibrationCreateContent`, adicionar após `const [isExtracting, setIsExtracting] = useState(false);`:

```ts
const [extractionStep, setExtractionStep] = useState<ExtractionStep | null>(null);
```

- [ ] **Step 5.3: Substituir handleExtractWithAi**

Substituir a função `handleExtractWithAi` inteira (linha 372–465) pela versão abaixo:

```ts
async function handleExtractWithAi() {
  if (!formState.certificateFile || !instrument) {
    return;
  }

  setIsExtracting(true);
  setExtractionStep(null);
  setExtractionError("");
  setExtractionMessage("");
  setExtractionWarnings([]);

  const extractionAbortController = new AbortController();
  const extractionTimeoutId = window.setTimeout(
    () => extractionAbortController.abort(),
    75_000
  );

  try {
    const payload = new FormData();
    payload.set("instrumentId", String(instrumentId));
    payload.set("certificateFile", formState.certificateFile);

    const response = await fetchApi("/api/calibracoes/extrair", {
      method: "POST",
      body: payload,
      signal: extractionAbortController.signal
    });

    if (!response.ok) {
      const errorPayload = (await response.json()) as { error?: string };
      setExtractionError(
        errorPayload.error ?? "Nao foi possivel ler o certificado com a IA."
      );
      return;
    }

    if (!response.body) {
      setExtractionError("Nao foi possivel ler o certificado com a IA.");
      return;
    }

    for await (const event of readExtractionSseStream(response.body)) {
      if (event.type === "status") {
        setExtractionStep(event.step as ExtractionStep);
      } else if (event.type === "error") {
        setExtractionError(event.message);
        return;
      } else if (event.type === "result") {
        const extraction = (event.data as CalibrationExtractionApiResponse)?.extraction;

        if (!extraction) {
          setExtractionError("Nao foi possivel ler o certificado com a IA.");
          return;
        }

        setFormState((current) => ({
          ...current,
          responsible: extraction.header.responsible ?? current.responsible,
          calibrationDate: extraction.header.calibrationDate ?? current.calibrationDate,
          certificateDate: extraction.header.certificateDate ?? current.certificateDate,
          validityDate: extraction.header.validityDate ?? current.validityDate,
          observations: extraction.header.observations ?? current.observations
        }));
        setFieldResults((current) =>
          applyCalibrationDerivedValues(
            getCalibrationCategoryIdentifier(instrument),
            current.map((field) => {
              const extractedField = extraction.fields.find(
                (item) => item.fieldId === field.fieldId
              );

              if (!extractedField) {
                return field;
              }

              return {
                ...field,
                value: extractedField.value ?? "",
                unit: extractedField.unit ?? "",
                confidence: extractedField.confidence,
                evidence: extractedField.evidence ?? "",
                status:
                  extractedField.conforme === true
                    ? "conforming"
                    : "unknown"
              };
            })
          )
        );
        setExtractionWarnings(extraction.warnings);
        setExtractionMessage(
          "Leitura concluida. Revise os dados sugeridos pela IA antes de registrar a calibracao."
        );
        setValidationErrors((current) => ({
          ...current,
          responsible: undefined,
          calibrationDate: undefined,
          certificateDate: undefined,
          validityDate: undefined,
          form: undefined
        }));
      }
    }
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    setExtractionError(
      isAbort
        ? "A leitura demorou mais do que o esperado. Tente novamente."
        : "Nao foi possivel ler o certificado com a IA."
    );
  } finally {
    window.clearTimeout(extractionTimeoutId);
    setIsExtracting(false);
    setExtractionStep(null);
  }
}
```

- [ ] **Step 5.4: Atualizar o label do botão de extração na JSX**

Localizar o trecho do botão "Extrair com IA" (por volta da linha 650):

```tsx
{isExtracting ? "Lendo certificado..." : "Extrair com IA"}
```

Substituir por:

```tsx
{isExtracting
  ? extractionStep === "reading_pdf"
    ? "Lendo o certificado..."
    : extractionStep === "calling_ai"
      ? "Enviando para a IA..."
      : extractionStep === "processing"
        ? "Processando resposta..."
        : "Lendo certificado..."
  : "Extrair com IA"}
```

- [ ] **Step 5.5: Verificar build**

```bash
npm run build 2>&1 | tail -30
```

Esperado: sem erros.

- [ ] **Step 5.6: Commit**

```bash
git add app/_components/instrument-calibration-create-content.tsx
git commit -m "feat: add SSE progress steps to calibration create form"
```

---

## Task 6: Atualizar instrument-create-content.tsx

**Files:**
- Modify: `app/_components/instrument-create-content.tsx`

- [ ] **Step 6.1: Adicionar import do helper SSE**

No topo do arquivo, adicionar o import:

```ts
import { readExtractionSseStream } from "@/lib/api/extract-sse";
```

- [ ] **Step 6.2: Adicionar tipo ExtractionStep e estado extractionStep**

Localizar onde os outros tipos locais estão definidos e adicionar:

```ts
type ExtractionStep = "reading_pdf" | "calling_ai" | "processing";
```

Na lista de estados do componente, adicionar após `const [isExtracting, setIsExtracting] = useState(false);`:

```ts
const [extractionStep, setExtractionStep] = useState<ExtractionStep | null>(null);
```

- [ ] **Step 6.3: Substituir handleExtractWithAi**

Substituir a função `handleExtractWithAi` inteira (linhas 386–472) pela versão abaixo:

```ts
async function handleExtractWithAi() {
  if (!calibrationForm.certificateFile) return;

  setIsExtracting(true);
  setExtractionStep(null);
  clearExtractionFeedback();

  try {
    const measurementsById = new Map(
      measurements.map((measurement) => [measurement.id, measurement])
    );
    const payload = new FormData();
    payload.set("instrumentTag", formState.tag.trim());
    payload.set("category", selectedCategoryLabel);
    payload.set(
      "fieldsJson",
      JSON.stringify(
        fieldRows.map((field) => {
          const measurement = measurementsById.get(field.measurementId);

          return {
            name: field.name.trim(),
            groupName: field.groupName.trim(),
            subgroupName: field.subgroupName.trim(),
            measurementName: measurement?.name ?? "",
            measurementRawName: measurement?.rawName ?? measurement?.name ?? ""
          };
        })
      )
    );
    payload.set("certificateFile", calibrationForm.certificateFile);

    const response = await fetchApi("/api/calibracoes/extrair", {
      method: "POST",
      body: payload
    });

    if (!response.ok) {
      const errorPayload = (await response.json()) as { error?: string };
      setExtractionError(
        errorPayload.error ?? "Nao foi possivel ler o certificado com a IA."
      );
      return;
    }

    if (!response.body) {
      setExtractionError("Nao foi possivel ler o certificado com a IA.");
      return;
    }

    for await (const event of readExtractionSseStream(response.body)) {
      if (event.type === "status") {
        setExtractionStep(event.step as ExtractionStep);
      } else if (event.type === "error") {
        setExtractionError(event.message);
        return;
      } else if (event.type === "result") {
        const extraction = (event.data as CalibrationExtractionApiResponse)?.extraction;

        if (!extraction) {
          setExtractionError("Nao foi possivel ler o certificado com a IA.");
          return;
        }

        setCalibrationForm((current) => ({
          ...current,
          responsible: extraction.header.responsible ?? current.responsible,
          calibrationDate: extraction.header.calibrationDate ?? current.calibrationDate,
          certificateDate: extraction.header.certificateDate ?? current.certificateDate,
          validityDate: extraction.header.validityDate ?? current.validityDate,
          observations: extraction.header.observations ?? current.observations
        }));
        setFieldReviewItems((current) =>
          applyCalibrationDerivedValues(
            getCategoryCalculationIdentifier(selectedCategory?.slug, selectedCategory?.name),
            current.map((field) => {
              const extractedField = extraction.fields.find(
                (item) => item.fieldSlug === field.fieldSlug
              );

              if (!extractedField) return field;

              return {
                ...field,
                value: extractedField.value ?? "",
                unit: extractedField.unit ?? "",
                confidence: extractedField.confidence,
                evidence: extractedField.evidence ?? "",
                status:
                  extractedField.conforme === true
                    ? "conforming"
                    : "unknown"
              };
            })
          )
        );
        setExtractionWarnings(extraction.warnings);
        setExtractionMessage(
          "Leitura concluida. Revise os dados sugeridos pela IA antes de salvar o cadastro."
        );
        setValidationErrors((current) => ({
          ...current,
          responsible: undefined,
          calibrationDate: undefined,
          certificateDate: undefined,
          validityDate: undefined,
          certificateFile: undefined,
          form: undefined
        }));
      }
    }
  } catch {
    setExtractionError("Nao foi possivel ler o certificado com a IA.");
  } finally {
    setIsExtracting(false);
    setExtractionStep(null);
  }
}
```

- [ ] **Step 6.4: Atualizar o label do botão de extração na JSX**

Localizar o trecho do botão (por volta da linha 747):

```tsx
{isExtracting ? "Lendo certificado..." : "Extrair com IA"}
```

Substituir por:

```tsx
{isExtracting
  ? extractionStep === "reading_pdf"
    ? "Lendo o certificado..."
    : extractionStep === "calling_ai"
      ? "Enviando para a IA..."
      : extractionStep === "processing"
        ? "Processando resposta..."
        : "Lendo certificado..."
  : "Extrair com IA"}
```

- [ ] **Step 6.5: Executar suite de testes completa**

```bash
npm run test
```

Esperado: todos os testes passam.

- [ ] **Step 6.6: Executar build final**

```bash
npm run build 2>&1 | tail -30
```

Esperado: build limpo.

- [ ] **Step 6.7: Commit final**

```bash
git add app/_components/instrument-create-content.tsx
git commit -m "feat: add SSE progress steps to instrument create form"
```
## Relacionado
- [[historico/specs/2026-04-21-ai-pipeline-design]] — spec desta feature
- [[arquitetura/ia-pipeline]] — SSE documentado
- [[modulos/calibration-extraction]] — formatação de tabelas
