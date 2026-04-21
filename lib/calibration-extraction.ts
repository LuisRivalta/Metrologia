import type { MeasurementFieldItem } from "@/lib/measurement-fields";
import type { CalibrationCertificateTablePage } from "@/lib/calibration-certificate-parsers";

export const defaultCalibrationExtractionModel =
  process.env.OPENROUTER_CALIBRATION_EXTRACTION_MODEL?.trim() ||
  "nvidia/nemotron-nano-12b-v2-vl:free";
export const maxCalibrationExtractionDocumentTextLength = 18_000;

export type CalibrationExtractionHeader = {
  responsible: string | null;
  calibrationDate: string | null;
  certificateDate: string | null;
  validityDate: string | null;
  observations: string | null;
};

export type CalibrationExtractionFieldSuggestion = {
  fieldId: number;
  fieldSlug: string;
  fieldName: string;
  measurementName: string;
  value: string | null;
  unit: string | null;
  conforme: boolean | null;
  confidence: number | null;
  evidence: string | null;
};

export type CalibrationExtractionResult = {
  header: CalibrationExtractionHeader;
  fields: CalibrationExtractionFieldSuggestion[];
  warnings: string[];
};

type RawCalibrationExtractionField = {
  field_slug?: unknown;
  value?: unknown;
  unit?: unknown;
  conforme?: unknown;
  confidence?: unknown;
  evidence?: unknown;
};

type RawCalibrationExtractionPayload = {
  header?: Partial<Record<keyof CalibrationExtractionHeader, unknown>>;
  fields?: RawCalibrationExtractionField[];
  warnings?: unknown;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeNullableText(value: unknown) {
  const normalizedValue = normalizeText(value);
  return normalizedValue || null;
}

function normalizeNullableIsoDate(value: unknown) {
  const normalizedValue = normalizeText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue) ? normalizedValue : null;
}

function normalizeConfidence(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  if (value < 0) return 0;
  if (value > 1) return 1;
  return Number(value.toFixed(3));
}

function normalizeBooleanOrNull(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function buildHeaderSchema() {
  return {
    type: "object",
    properties: {
      responsible: { type: ["string", "null"] },
      calibrationDate: { type: ["string", "null"] },
      certificateDate: { type: ["string", "null"] },
      validityDate: { type: ["string", "null"] },
      observations: { type: ["string", "null"] }
    },
    required: [
      "responsible",
      "calibrationDate",
      "certificateDate",
      "validityDate",
      "observations"
    ],
    additionalProperties: false
  };
}

export function buildCalibrationExtractionSchema(fields: MeasurementFieldItem[]) {
  return {
    type: "object",
    properties: {
      header: buildHeaderSchema(),
      fields: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field_slug: {
              type: "string",
              enum: fields.map((field) => field.slug)
            },
            value: { type: ["string", "null"] },
            unit: { type: ["string", "null"] },
            conforme: { type: ["boolean", "null"] },
            confidence: { type: ["number", "null"] },
            evidence: { type: ["string", "null"] }
          },
          required: ["field_slug", "value", "unit", "conforme", "confidence", "evidence"],
          additionalProperties: false
        }
      },
      warnings: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["header", "fields", "warnings"],
    additionalProperties: false
  };
}

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

export function prepareCalibrationExtractionDocumentText(
  rawText: string | null | undefined,
  maxLength = maxCalibrationExtractionDocumentTextLength
) {
  const normalizedText = (rawText ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim().replace(/[ \t]+/g, " "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalizedText) {
    return null;
  }

  if (normalizedText.replace(/\s+/g, "").length < 120) {
    return null;
  }

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength).trimEnd()}\n\n[texto extraido truncado]`;
}

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

export function normalizeCalibrationExtractionResult(
  payload: RawCalibrationExtractionPayload,
  fields: MeasurementFieldItem[]
): CalibrationExtractionResult {
  const rawFieldMap = new Map<string, RawCalibrationExtractionField>();

  for (const rawField of payload.fields ?? []) {
    const fieldSlug = normalizeText(rawField.field_slug);

    if (!fieldSlug || rawFieldMap.has(fieldSlug)) {
      continue;
    }

    rawFieldMap.set(fieldSlug, rawField);
  }

  return {
    header: {
      responsible: normalizeNullableText(payload.header?.responsible),
      calibrationDate: normalizeNullableIsoDate(payload.header?.calibrationDate),
      certificateDate: normalizeNullableIsoDate(payload.header?.certificateDate),
      validityDate: normalizeNullableIsoDate(payload.header?.validityDate),
      observations: normalizeNullableText(payload.header?.observations)
    },
    fields: fields
      .filter((field): field is MeasurementFieldItem & { dbId: number } => typeof field.dbId === "number")
      .map((field) => {
        const rawField = rawFieldMap.get(field.slug);

        return {
          fieldId: field.dbId,
          fieldSlug: field.slug,
          fieldName: field.name,
          measurementName: field.measurementName || field.measurementRawName || "",
          value: normalizeNullableText(rawField?.value),
          unit: normalizeNullableText(rawField?.unit),
          conforme: normalizeBooleanOrNull(rawField?.conforme),
          confidence: normalizeConfidence(rawField?.confidence),
          evidence: normalizeNullableText(rawField?.evidence)
        };
      }),
    warnings: Array.isArray(payload.warnings)
      ? payload.warnings.map(normalizeText).filter(Boolean)
      : []
  };
}
