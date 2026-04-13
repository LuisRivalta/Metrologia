import type { MeasurementFieldItem } from "@/lib/measurement-fields";

export const defaultCalibrationExtractionModel =
  process.env.GEMINI_CALIBRATION_EXTRACTION_MODEL?.trim() || "gemini-2.5-flash";

export type CalibrationExtractionHeader = {
  certificate: string | null;
  laboratory: string | null;
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
      certificate: { type: ["string", "null"] },
      laboratory: { type: ["string", "null"] },
      responsible: { type: ["string", "null"] },
      calibrationDate: { type: ["string", "null"] },
      certificateDate: { type: ["string", "null"] },
      validityDate: { type: ["string", "null"] },
      observations: { type: ["string", "null"] }
    },
    required: [
      "certificate",
      "laboratory",
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
}) {
  const fieldsBlock = args.fields
    .map(
      (field) =>
        `- slug: ${field.slug}; nome: ${field.name}; medida esperada: ${field.measurementName || field.measurementRawName || "nao informada"}`
    )
    .join("\n");

  return [
    "Extraia os dados do certificado de calibracao em PDF.",
    "Retorne somente dados que estejam explicitamente no documento ou claramente derivados dele.",
    "Se um dado nao estiver visivel, use null.",
    "Nao invente resultados, datas, nomes ou status.",
    "Para cada campo esperado, procure a linha correspondente e indique se esta conforme quando isso aparecer no certificado.",
    "Use somente os field_slug fornecidos abaixo.",
    "",
    `Instrumento: ${args.instrumentTag}`,
    `Categoria: ${args.category}`,
    "Campos esperados:",
    fieldsBlock
  ].join("\n");
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
      certificate: normalizeNullableText(payload.header?.certificate),
      laboratory: normalizeNullableText(payload.header?.laboratory),
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
