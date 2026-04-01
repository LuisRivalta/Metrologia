export type MeasurementRow = {
  id: number;
  created_at?: string;
  tipo: string;
  tipo_desc: string | null;
};

export type MeasurementItem = {
  id: string;
  rawName: string;
  name: string;
  description: string;
};

const exactDisplayByRaw: Record<string, string> = {
  celsius: "°C",
  fahrenheit: "°F",
  kelvin: "K",
  db: "dB",
  ph: "pH",
  hrc: "HRC",
  hrb: "HRB",
  hra: "HRA",
  hrd: "HRD",
  hv: "HV",
  hb: "HB",
  pct: "%",
  hz: "Hz",
  ra: "Ra",
  rz: "Rz",
  rpm: "rpm",
  brix: "Brix"
};

const exactRawByDisplay: Record<string, string> = {
  "°c": "celsius",
  celsius: "celsius",
  "°f": "fahrenheit",
  fahrenheit: "fahrenheit",
  kelvin: "kelvin",
  k: "kelvin",
  db: "db",
  ph: "ph",
  hrc: "hrc",
  hrb: "hrb",
  hra: "hra",
  hrd: "hrd",
  hv: "hv",
  hb: "hb",
  "%": "pct",
  pct: "pct",
  porcentagem: "pct",
  hz: "hz",
  ra: "ra",
  rz: "rz",
  rpm: "rpm",
  brix: "brix"
};

function normalizeMeasurementLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .toLowerCase()
    .trim();
}

export function formatMeasurementType(rawValue: string) {
  const raw = rawValue.trim().toLowerCase();

  if (!raw) {
    return "";
  }

  if (exactDisplayByRaw[raw]) {
    return exactDisplayByRaw[raw];
  }

  const display = raw
    .replace(/_mm3\b/g, "/mm³")
    .replace(/_cm3\b/g, "/cm³")
    .replace(/_m3\b/g, "/m³")
    .replace(/_mm2\b/g, "/mm²")
    .replace(/_cm2\b/g, "/cm²")
    .replace(/_m2\b/g, "/m²")
    .replace(/_s\b/g, "/s")
    .replace(/_min\b/g, "/min")
    .replace(/_h\b/g, "/h")
    .replace(/_hr\b/g, "/h")
    .replace(/_/g, " ")
    .replace(/\bshore ([a-z])\b/gi, (_match, suffix: string) => `Shore ${suffix.toUpperCase()}`)
    .replace(/\bhr([a-z])\b/gi, (_match, suffix: string) => `HR${suffix.toUpperCase()}`)
    .replace(/\b(ra|rz)\b/gi, (token: string) => `${token.charAt(0).toUpperCase()}${token.slice(1).toLowerCase()}`);

  return display;
}

export function serializeMeasurementType(inputValue: string) {
  const input = inputValue.trim();

  if (!input) {
    return "";
  }

  const normalizedLookup = normalizeMeasurementLookup(input);

  if (exactRawByDisplay[normalizedLookup]) {
    return exactRawByDisplay[normalizedLookup];
  }

  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/°\s*c/gi, "celsius")
    .replace(/°\s*f/gi, "fahrenheit")
    .replace(/%/g, "pct")
    .replace(/\bshore\s+([a-z])\b/gi, (_match, suffix: string) => `shore_${suffix}`)
    .replace(/\s*\/\s*/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase()
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function mapMeasurementRow(row: MeasurementRow): MeasurementItem {
  return {
    id: String(row.id),
    rawName: row.tipo.trim(),
    name: formatMeasurementType(row.tipo),
    description: row.tipo_desc?.trim() ?? ""
  };
}
