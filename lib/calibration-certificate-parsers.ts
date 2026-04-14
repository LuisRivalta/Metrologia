import type { MeasurementFieldItem } from "@/lib/measurement-fields";

export type CalibrationCertificateTable = string[][];

export type CalibrationCertificateTablePage = {
  num: number;
  tables: CalibrationCertificateTable[];
};

export type CalibrationExtractionFieldOverride = {
  fieldId: number;
  fieldSlug: string;
  value: string | null;
  unit: string | null;
  confidence: number | null;
  evidence: string | null;
  conforme: boolean | null;
};

type FieldKind = "error" | "uncertainty" | "derived" | null;
type SectionKey = "externo" | "interno" | "ressalto" | "profundidade";

type SectionMetrics = {
  error: string | null;
  u: string | null;
  evidence: string | null;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeToken(value: string | null | undefined) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseLocaleNumber(value: string | null | undefined) {
  const normalizedValue = normalizeText(value).replace(/\s/g, "");

  if (!normalizedValue) {
    return null;
  }

  const lastComma = normalizedValue.lastIndexOf(",");
  const lastDot = normalizedValue.lastIndexOf(".");
  let numericValue = normalizedValue;

  if (lastComma >= 0 && lastDot >= 0) {
    numericValue =
      lastComma > lastDot
        ? normalizedValue.replace(/\./g, "").replace(",", ".")
        : normalizedValue.replace(/,/g, "");
  } else if (lastComma >= 0) {
    numericValue = normalizedValue.replace(",", ".");
  }

  numericValue = numericValue.replace(/[^0-9.+-]/g, "");

  if (!numericValue || numericValue === "." || numericValue === "-" || numericValue === "+") {
    return null;
  }

  const parsedValue = Number(numericValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function findColumnIndex(headerRow: string[], matcher: (value: string) => boolean) {
  return headerRow.findIndex((cell) => matcher(normalizeToken(cell)));
}

function selectMaxMagnitudeValue(values: Array<string | null | undefined>) {
  let selectedValue: string | null = null;
  let selectedMagnitude = -1;

  for (const value of values) {
    const parsedValue = parseLocaleNumber(value);

    if (parsedValue === null) {
      continue;
    }

    const magnitude = Math.abs(parsedValue);

    if (magnitude > selectedMagnitude) {
      selectedMagnitude = magnitude;
      selectedValue = normalizeText(value);
    }
  }

  return selectedValue;
}

function selectMaxNumericValue(values: Array<string | null | undefined>) {
  let selectedValue: string | null = null;
  let selectedNumericValue = -1;

  for (const value of values) {
    const parsedValue = parseLocaleNumber(value);

    if (parsedValue === null) {
      continue;
    }

    if (parsedValue > selectedNumericValue) {
      selectedNumericValue = parsedValue;
      selectedValue = normalizeText(value);
    }
  }

  return selectedValue;
}

function extractMeasurementTableMetrics(table: CalibrationCertificateTable) {
  const headerRow = table[0] ?? [];
  const dataRows = table.slice(1);
  const errorColumnIndex = findColumnIndex(headerRow, (cell) => cell === "erro");
  const uColumnIndex = findColumnIndex(headerRow, (cell) => cell === "u");

  if (errorColumnIndex < 0 && uColumnIndex < 0) {
    return null;
  }

  return {
    error:
      errorColumnIndex >= 0
        ? selectMaxMagnitudeValue(dataRows.map((row) => row[errorColumnIndex]))
        : null,
    u: uColumnIndex >= 0 ? selectMaxNumericValue(dataRows.map((row) => row[uColumnIndex])) : null
  };
}

function extractParallelTableMetrics(table: CalibrationCertificateTable) {
  const headerRow = table[0] ?? [];
  const dataRow = table[1] ?? [];
  const hasMaximumHeader = headerRow.some((cell) => normalizeToken(cell).includes("maximo"));
  const uColumnIndex = findColumnIndex(headerRow, (cell) => cell === "u");

  if (!hasMaximumHeader || dataRow.length === 0) {
    return null;
  }

  return {
    error: normalizeText(dataRow[0]),
    u: uColumnIndex >= 0 ? normalizeText(dataRow[uColumnIndex]) : null
  };
}

function mergeSectionMetrics(
  evidence: string,
  ...metrics: Array<{ error: string | null; u: string | null } | null>
): SectionMetrics {
  const validMetrics = metrics.filter(Boolean);

  if (validMetrics.length === 0) {
    return {
      error: null,
      u: null,
      evidence: null
    };
  }

  return {
    error: selectMaxMagnitudeValue(validMetrics.map((metric) => metric?.error)),
    u: selectMaxNumericValue(validMetrics.map((metric) => metric?.u)),
    evidence
  };
}

function isLikelyMetrusPaquimetroCertificate(
  categoryIdentifier: string | null | undefined,
  documentText: string | null | undefined,
  tablePages: CalibrationCertificateTablePage[]
) {
  const normalizedCategory = normalizeToken(categoryIdentifier);
  const normalizedText = normalizeToken(documentText);

  return (
    normalizedCategory.includes("paquimetro") &&
    normalizedText.includes("metrus") &&
    normalizedText.includes("for-0004-paq") &&
    tablePages.length >= 2 &&
    (tablePages[0]?.tables.length ?? 0) >= 4 &&
    (tablePages[1]?.tables.length ?? 0) >= 2
  );
}

function getFieldSection(field: MeasurementFieldItem): SectionKey | null {
  const token = normalizeToken(`${field.slug} ${field.name}`);

  if (token.includes("externo")) return "externo";
  if (token.includes("interno")) return "interno";
  if (token.includes("ressalto")) return "ressalto";
  if (token.includes("profundidade")) return "profundidade";
  return null;
}

function getFieldKind(field: MeasurementFieldItem): FieldKind {
  const token = normalizeToken(`${field.slug} ${field.name}`);

  if (token.includes("incerteza-maior-erro") || token.includes("incerteza maior erro")) {
    return "derived";
  }

  if (token.includes("incerteza")) {
    return "uncertainty";
  }

  if (token.includes("erro")) {
    return "error";
  }

  return null;
}

export function buildPaquimetroFieldOverridesFromTablePages(args: {
  categoryIdentifier: string | null | undefined;
  documentText: string | null | undefined;
  tablePages: CalibrationCertificateTablePage[];
  fields: MeasurementFieldItem[];
}) {
  if (
    !isLikelyMetrusPaquimetroCertificate(
      args.categoryIdentifier,
      args.documentText,
      args.tablePages
    )
  ) {
    return [] as CalibrationExtractionFieldOverride[];
  }

  const pageOneTables = args.tablePages[0]?.tables ?? [];
  const pageTwoTables = args.tablePages[1]?.tables ?? [];

  const metricsBySection: Partial<Record<SectionKey, SectionMetrics>> = {
    externo: mergeSectionMetrics(
      "Tabela do certificado: medicao da face externa e paralelismo externo.",
      extractMeasurementTableMetrics(pageOneTables[0] ?? []),
      extractParallelTableMetrics(pageOneTables[1] ?? [])
    ),
    interno: mergeSectionMetrics(
      "Tabela do certificado: medicao da face interna e paralelismo interno.",
      extractMeasurementTableMetrics(pageOneTables[2] ?? []),
      extractParallelTableMetrics(pageOneTables[3] ?? [])
    ),
    ressalto: mergeSectionMetrics(
      "Tabela do certificado: medicao da face do ressalto.",
      extractMeasurementTableMetrics(pageTwoTables[0] ?? [])
    ),
    profundidade: mergeSectionMetrics(
      "Tabela do certificado: medicao da haste de profundidade.",
      extractMeasurementTableMetrics(pageTwoTables[1] ?? [])
    )
  };

  return args.fields.flatMap((field) => {
    if (typeof field.dbId !== "number") {
      return [];
    }

    const section = getFieldSection(field);
    const kind = getFieldKind(field);

    if (!section || !kind || kind === "derived") {
      return [];
    }

    const metrics = metricsBySection[section];

    if (!metrics) {
      return [];
    }

    const value = kind === "error" ? metrics.error : metrics.u;

    if (!value) {
      return [];
    }

    return [{
      fieldId: field.dbId,
      fieldSlug: field.slug,
      value,
      unit: field.measurementName || field.measurementRawName || "mm",
      confidence: 1,
      evidence: metrics.evidence,
      conforme: null
    }];
  });
}
