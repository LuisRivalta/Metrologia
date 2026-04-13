import { serializeMeasurementFieldSlug } from "@/lib/measurement-fields";

type CalibrationDerivedRow = {
  fieldSlug: string;
  value: string;
  unit?: string;
  confidence?: number | null;
  evidence?: string;
};

type CalibrationDerivationRule = {
  targetSlug: string;
  sourceSlugs: [string, string];
};

const paquimetroDerivationRules: CalibrationDerivationRule[] = [
  {
    targetSlug: serializeMeasurementFieldSlug("Incerteza + maior Erro externo"),
    sourceSlugs: [
      serializeMeasurementFieldSlug("Maior erro externo"),
      serializeMeasurementFieldSlug("Incerteza de medicao externo")
    ]
  },
  {
    targetSlug: serializeMeasurementFieldSlug("Incerteza + maior Erro interno"),
    sourceSlugs: [
      serializeMeasurementFieldSlug("Incerteza de medicao interno"),
      serializeMeasurementFieldSlug("Maior erro interno")
    ]
  },
  {
    targetSlug: serializeMeasurementFieldSlug("Incerteza + maior Erro profundidade"),
    sourceSlugs: [
      serializeMeasurementFieldSlug("Maior erro profundidade"),
      serializeMeasurementFieldSlug("Incerteza de medicao profundidade")
    ]
  }
];

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeToken(value: string | null | undefined) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isPaquimetroCategory(categoryIdentifier: string | null | undefined) {
  return normalizeToken(categoryIdentifier).includes("paquimetro");
}

function getDecimalPlaces(value: string) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return 0;
  }

  const lastComma = normalizedValue.lastIndexOf(",");
  const lastDot = normalizedValue.lastIndexOf(".");
  const separatorIndex = Math.max(lastComma, lastDot);

  if (separatorIndex < 0) {
    return 0;
  }

  return normalizedValue.slice(separatorIndex + 1).replace(/\D/g, "").length;
}

function parseLocaleNumber(value: string) {
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

function formatDerivedSum(value: number, referenceValues: string[]) {
  const decimalPlaces = Math.max(...referenceValues.map(getDecimalPlaces), 0);
  const formattedValue = value.toFixed(decimalPlaces);
  return formattedValue.replace(".", ",");
}

function getPaquimetroRules(categoryIdentifier: string | null | undefined) {
  return isPaquimetroCategory(categoryIdentifier) ? paquimetroDerivationRules : [];
}

export function isAutoCalculatedCalibrationField(
  categoryIdentifier: string | null | undefined,
  fieldSlug: string
) {
  return getPaquimetroRules(categoryIdentifier).some((rule) => rule.targetSlug === fieldSlug);
}

export function applyCalibrationDerivedValues<T extends CalibrationDerivedRow>(
  categoryIdentifier: string | null | undefined,
  rows: T[]
) {
  const derivationRules = getPaquimetroRules(categoryIdentifier);

  if (derivationRules.length === 0 || rows.length === 0) {
    return rows;
  }

  const nextRows = rows.map((row) => ({ ...row }));
  const rowsBySlug = new Map(nextRows.map((row) => [row.fieldSlug, row]));

  for (const rule of derivationRules) {
    const targetRow = rowsBySlug.get(rule.targetSlug);
    const [firstSource, secondSource] = rule.sourceSlugs.map((sourceSlug) =>
      rowsBySlug.get(sourceSlug)
    );

    if (!targetRow) {
      continue;
    }

    const firstValue = parseLocaleNumber(firstSource?.value ?? "");
    const secondValue = parseLocaleNumber(secondSource?.value ?? "");

    if (firstValue === null || secondValue === null) {
      targetRow.value = "";
      if ("unit" in targetRow) targetRow.unit = "";
      if ("confidence" in targetRow) targetRow.confidence = null;
      if ("evidence" in targetRow) targetRow.evidence = "";
      continue;
    }

    targetRow.value = formatDerivedSum(firstValue + secondValue, [
      firstSource?.value ?? "",
      secondSource?.value ?? ""
    ]);
    if ("unit" in targetRow) targetRow.unit = "";
    if ("confidence" in targetRow) targetRow.confidence = null;
    if ("evidence" in targetRow) targetRow.evidence = "";
  }

  return nextRows;
}
