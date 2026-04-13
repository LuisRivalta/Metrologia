export type CalibrationFieldReviewStatus = "unknown" | "conforming" | "non_conforming";

export type CalibrationStoredFieldEntry = {
  fieldId: number;
  fieldSlug: string;
  fieldName: string;
  measurementName: string;
  value: string;
  unit: string;
  status: CalibrationFieldReviewStatus;
  confidence: number | null;
  evidence: string;
};

type CalibrationStoredPayload = {
  version: 1;
  fields: CalibrationStoredFieldEntry[];
};

type ParsedCalibrationRecord = {
  notes: string;
  fields: CalibrationStoredFieldEntry[];
};

const payloadStartMarker = "[[METROLOGIA_CALIBRATION_DATA]]";
const payloadEndMarker = "[[/METROLOGIA_CALIBRATION_DATA]]";

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeConfidence(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return Number(value.toFixed(3));
}

function normalizeStatus(value: string | null | undefined): CalibrationFieldReviewStatus {
  if (value === "conforming" || value === "non_conforming") {
    return value;
  }

  return "unknown";
}

function normalizeFieldEntry(
  entry: Partial<CalibrationStoredFieldEntry>
): CalibrationStoredFieldEntry | null {
  const fieldId = Number(entry.fieldId);
  const fieldSlug = normalizeText(entry.fieldSlug);
  const fieldName = normalizeText(entry.fieldName);

  if (!Number.isFinite(fieldId) || fieldId <= 0 || !fieldSlug || !fieldName) {
    return null;
  }

  return {
    fieldId,
    fieldSlug,
    fieldName,
    measurementName: normalizeText(entry.measurementName),
    value: normalizeText(entry.value),
    unit: normalizeText(entry.unit),
    status: normalizeStatus(entry.status),
    confidence: normalizeConfidence(entry.confidence),
    evidence: normalizeText(entry.evidence)
  };
}

export function serializeCalibrationRecord(args: {
  notes?: string | null;
  fields?: Array<Partial<CalibrationStoredFieldEntry>>;
}) {
  const notes = normalizeText(args.notes);
  const fields = (args.fields ?? [])
    .map(normalizeFieldEntry)
    .filter((entry): entry is CalibrationStoredFieldEntry => entry !== null)
    .filter(
      (entry) =>
        entry.value ||
        entry.unit ||
        entry.evidence ||
        entry.confidence !== null ||
        entry.status !== "unknown"
    );

  if (fields.length === 0) {
    return notes;
  }

  const payload: CalibrationStoredPayload = {
    version: 1,
    fields
  };

  return `${payloadStartMarker}\n${JSON.stringify(payload)}\n${payloadEndMarker}${notes ? `\n${notes}` : ""}`;
}

export function parseCalibrationRecord(rawValue: string | null | undefined): ParsedCalibrationRecord {
  const normalizedValue = (rawValue ?? "").trim();

  if (!normalizedValue.startsWith(payloadStartMarker)) {
    return {
      notes: normalizeText(normalizedValue),
      fields: []
    };
  }

  const payloadEndIndex = normalizedValue.indexOf(payloadEndMarker);

  if (payloadEndIndex <= payloadStartMarker.length) {
    return {
      notes: normalizeText(normalizedValue),
      fields: []
    };
  }

  const payloadText = normalizedValue
    .slice(payloadStartMarker.length, payloadEndIndex)
    .trim();
  const remainingNotes = normalizeText(
    normalizedValue.slice(payloadEndIndex + payloadEndMarker.length)
  );

  try {
    const parsedPayload = JSON.parse(payloadText) as Partial<CalibrationStoredPayload>;
    const fields = Array.isArray(parsedPayload.fields)
      ? parsedPayload.fields
          .map(normalizeFieldEntry)
          .filter((entry): entry is CalibrationStoredFieldEntry => entry !== null)
      : [];

    return {
      notes: remainingNotes,
      fields
    };
  } catch {
    return {
      notes: normalizeText(normalizedValue),
      fields: []
    };
  }
}
