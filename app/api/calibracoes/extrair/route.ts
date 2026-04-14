import { NextResponse } from "next/server";
import path from "node:path";
import {
  buildPaquimetroFieldOverridesFromTablePages,
  type CalibrationCertificateTablePage
} from "@/lib/calibration-certificate-parsers";
import {
  buildCalibrationExtractionPrompt,
  buildCalibrationExtractionSchema,
  defaultCalibrationExtractionModel,
  normalizeCalibrationExtractionResult,
  prepareCalibrationExtractionDocumentText
} from "@/lib/calibration-extraction";
import {
  MAX_CALIBRATION_CERTIFICATE_FILE_SIZE,
  isPdfCertificateFile
} from "@/lib/calibration-certificates";
import {
  serializeMeasurementFieldSlug,
  type MeasurementFieldItem
} from "@/lib/measurement-fields";
import { loadInstrumentDetailForCalibration } from "@/lib/server/instrument-details";

export const dynamic = "force-dynamic";

type FetchError = Error & {
  cause?: {
    code?: string;
    message?: string;
  };
};

type OpenRouterErrorPayload = {
  error?: {
    message?: string;
    code?: number | string;
  };
};

type OpenRouterSuccessPayload = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

type PdfParseInstance = {
  getText: (params?: { lineEnforce?: boolean }) => Promise<{ text: string }>;
  getTable: () => Promise<{ pages?: Array<{ num?: number; tables?: string[][][] }> }>;
  destroy: () => Promise<void>;
};

type PdfParseConstructor = new (args: { data: Buffer }) => PdfParseInstance;

const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
const defaultOpenRouterTimeoutMs = 25_000;
const freeModelOpenRouterTimeoutMs = 20_000;

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? normalizeText(value) : "";
}

function getFormFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value && typeof value !== "string" ? value : null;
}

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseManualExtractionFields(rawValue: string) {
  if (!rawValue) {
    return { error: "Defina os campos do instrumento antes de usar a extracao por IA." };
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Array<{
      name?: unknown;
      measurementName?: unknown;
      measurementRawName?: unknown;
    }>;

    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return { error: "Defina os campos do instrumento antes de usar a extracao por IA." };
    }

    const seenSlugs = new Set<string>();
    const fields: MeasurementFieldItem[] = [];

    for (const [index, item] of parsedValue.entries()) {
      const name = normalizeText(typeof item.name === "string" ? item.name : "");
      const slug = serializeMeasurementFieldSlug(name);
      const measurementName = normalizeText(
        typeof item.measurementName === "string" ? item.measurementName : ""
      );
      const measurementRawName = normalizeText(
        typeof item.measurementRawName === "string" ? item.measurementRawName : ""
      );

      if (!name || !slug || seenSlugs.has(slug)) {
        return {
          error: "Revise os campos do instrumento antes de usar a extracao por IA."
        };
      }

      seenSlugs.add(slug);
      fields.push({
        dbId: index + 1,
        name,
        slug,
        measurementId: "",
        measurementName,
        measurementRawName,
        valueType: "numero",
        order: index
      });
    }

    return { fields };
  } catch {
    return { error: "Nao foi possivel ler os campos informados para a extracao por IA." };
  }
}

function getOpenRouterApiKey() {
  return process.env.OPENROUTER_API_KEY?.trim() || "";
}

function getOpenRouterErrorMessage(
  status: number,
  payload: OpenRouterErrorPayload | null,
  fallbackMessage = ""
) {
  const rawMessage = normalizeText(payload?.error?.message) || normalizeText(fallbackMessage);

  if (status === 400) {
    if (/failed to parse/i.test(rawMessage)) {
      return "A OpenRouter nao conseguiu interpretar este PDF no formato enviado. O fluxo foi ajustado para leitura nativa do modelo, entao tente novamente.";
    }

    return rawMessage || "A IA nao conseguiu interpretar esse certificado.";
  }

  if (status === 401 || status === 403) {
    return "A chave da OpenRouter foi recusada. Revise OPENROUTER_API_KEY e as permissoes da conta.";
  }

  if (status === 402) {
    return "A conta da OpenRouter esta sem creditos ou sem acesso liberado para este modelo.";
  }

  if (status === 429) {
    return "A cota da OpenRouter foi atingida. Aguarde um pouco ou revise os limites da conta.";
  }

  if (status === 503) {
    return "O modelo da OpenRouter esta temporariamente indisponivel ou sobrecarregado. Tente novamente em instantes.";
  }

  return rawMessage || "Nao foi possivel se comunicar com a OpenRouter.";
}

function getTransportErrorMessage(error: unknown) {
  const fetchError = error as FetchError | null;
  const causeCode = fetchError?.cause?.code ?? "";
  const errorName = normalizeText((fetchError as { name?: string } | null)?.name);
  const rawMessage = normalizeText(fetchError?.message);

  if (causeCode === "SELF_SIGNED_CERT_IN_CHAIN") {
    return "A conexao com a OpenRouter foi bloqueada pelo certificado HTTPS da rede local. Configure a cadeia de certificados da maquina ou use um trust store valido para liberar a chamada.";
  }

  if (errorName === "AbortError") {
    return "A OpenRouter demorou mais do que o esperado para ler este PDF com o modelo atual. Tente novamente ou troque para um modelo mais rapido.";
  }

  return rawMessage || "Nao foi possivel se comunicar com a OpenRouter.";
}

function encodePdfAsDataUrl(file: File, bytes: ArrayBuffer) {
  const mimeType = normalizeText(file.type) || "application/pdf";
  return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}

function loadPdfParseConstructor(): PdfParseConstructor {
  const modulePath = path.join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "dist",
    "pdf-parse",
    "cjs",
    "index.cjs"
  );
  const runtimeRequire = eval("require") as NodeRequire;
  const loadedModule = runtimeRequire(modulePath) as { PDFParse?: PdfParseConstructor };

  if (typeof loadedModule.PDFParse !== "function") {
    throw new Error("Nao foi possivel carregar o parser de PDF.");
  }

  return loadedModule.PDFParse;
}

async function extractPdfDocumentData(fileBytes: ArrayBuffer) {
  let parser: PdfParseInstance | null = null;
  let documentText: string | null = null;
  let tablePages: CalibrationCertificateTablePage[] = [];

  try {
    const PDFParse = loadPdfParseConstructor();

    parser = new PDFParse({
      data: Buffer.from(fileBytes)
    });

    const textResult = await parser.getText({
      lineEnforce: true
    });

    documentText = prepareCalibrationExtractionDocumentText(textResult.text);

    const tableResult = await parser.getTable();
    tablePages = Array.isArray(tableResult?.pages)
      ? tableResult.pages.map((page) => ({
          num: page?.num ?? 0,
          tables: Array.isArray(page?.tables) ? page.tables : []
        }))
      : [];
  } catch {
    // fallback to IA-only flow below
  } finally {
    if (parser) {
      await parser.destroy().catch(() => undefined);
    }
  }

  return {
    documentText,
    tablePages
  };
}

function buildOpenRouterPrompt(
  basePrompt: string,
  schema: ReturnType<typeof buildCalibrationExtractionSchema>,
  includeSchemaHint: boolean
) {
  if (!includeSchemaHint) {
    return basePrompt;
  }

  return [
    basePrompt,
    "",
    "Retorne somente um objeto JSON valido, sem markdown, sem comentarios e sem texto extra.",
    "Siga exatamente este JSON Schema:",
    JSON.stringify(schema)
  ].join("\n");
}

function extractAssistantText(payload: OpenRouterSuccessPayload | null) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (part?.type === "text" ? normalizeText(part.text) : ""))
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

function shouldRetryWithoutJsonSchema(status: number, payload: OpenRouterErrorPayload | null) {
  const message = normalizeText(payload?.error?.message).toLowerCase();

  return (
    status === 400 &&
    /(json_schema|structured output|structured outputs|response_format|unsupported|not support)/i.test(
      message
    )
  );
}

function shouldPreferJsonSchema(model: string) {
  return !/:free$/i.test(normalizeText(model));
}

function getOpenRouterTimeoutMs(model: string) {
  return /:free$/i.test(normalizeText(model))
    ? freeModelOpenRouterTimeoutMs
    : defaultOpenRouterTimeoutMs;
}

async function callOpenRouter(args: {
  apiKey: string;
  prompt: string;
  schema: ReturnType<typeof buildCalibrationExtractionSchema>;
  model: string;
  fileName?: string;
  fileDataUrl?: string;
  useJsonSchema: boolean;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getOpenRouterTimeoutMs(args.model));
  const content: Array<
    | {
        type: "text";
        text: string;
      }
    | {
        type: "file";
        file: {
          filename: string;
          file_data: string;
        };
      }
  > = [
    {
      type: "text",
      text: buildOpenRouterPrompt(args.prompt, args.schema, !args.useJsonSchema)
    }
  ];

  if (args.fileName && args.fileDataUrl) {
    content.push({
      type: "file",
      file: {
        filename: args.fileName,
        file_data: args.fileDataUrl
      }
    });
  }

  const response = await fetch(openRouterUrl, {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
      "X-Title": "Metrologia PRO"
    },
    body: JSON.stringify({
      model: args.model,
      messages: [
        {
          role: "user",
          content
        }
      ],
      response_format: args.useJsonSchema
        ? {
            type: "json_schema",
            json_schema: {
              name: "calibration_extraction",
              strict: true,
              schema: args.schema
            }
          }
        : {
            type: "json_object"
          },
      temperature: 0,
      stream: false
    })
  }).finally(() => {
    clearTimeout(timeout);
  });

  const rawText = await response.text();
  const payload = rawText ? (JSON.parse(rawText) as OpenRouterSuccessPayload & OpenRouterErrorPayload) : null;

  return {
    ok: response.ok,
    status: response.status,
    payload,
    text: extractAssistantText(payload)
  };
}

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

  try {
    const extractionSchema = buildCalibrationExtractionSchema(extractionFields);
    const extractionPrompt = buildCalibrationExtractionPrompt({
      instrumentTag: extractionTarget.tag,
      category: extractionTarget.category,
      fields: extractionFields
    });
    const fileBytes = await certificateFile.arrayBuffer();
    const extractedDocumentData = await extractPdfDocumentData(fileBytes);
    const extractedDocumentText = extractedDocumentData.documentText;
    const prompt = extractedDocumentText
      ? buildCalibrationExtractionPrompt({
          instrumentTag: extractionTarget.tag,
          category: extractionTarget.category,
          fields: extractionFields,
          documentText: extractedDocumentText
        })
      : extractionPrompt;
    const fileDataUrl = extractedDocumentText
      ? undefined
      : encodePdfAsDataUrl(certificateFile, fileBytes);
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
    const localFieldOverrides = buildPaquimetroFieldOverridesFromTablePages({
      categoryIdentifier: extractionTarget.category,
      documentText: extractedDocumentText,
      tablePages: extractedDocumentData.tablePages,
      fields: extractionFields
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

    return NextResponse.json({
      instrument: {
        id: extractionTarget.id,
        tag: extractionTarget.tag,
        category: extractionTarget.category
      },
      extraction
    });
  } catch (error) {
    return buildError(getTransportErrorMessage(error), 502);
  }
}
