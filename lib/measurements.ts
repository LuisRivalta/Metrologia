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
  celsius: "\u00B0C",
  fahrenheit: "\u00B0F",
  kelvin: "K",
  grau: "\u00B0",
  graus: "\u00B0",
  numero: "Numero",
  ohm: "\u03A9",
  um: "\u00B5m",
  lb_in: "lbf in",
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
  numero: "numero",
  "\u00B0": "grau",
  "\u00BA": "grau",
  grau: "grau",
  graus: "grau",
  "lb in": "lbf_in",
  lb_in: "lbf_in",
  "lbf in": "lbf_in",
  lbf_in: "lbf_in",
  "lbf-in": "lbf_in",
  "lbf\u00B7in": "lbf_in",
  "\u00B0c": "celsius",
  "\u00BAc": "celsius",
  celsius: "celsius",
  "\u00B0f": "fahrenheit",
  "\u00BAf": "fahrenheit",
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
    .replace(/[µμ]/g, "u")
    .replace(/[Ωω]/g, "ohm")
    .replace(/[\u00B0\u00BA]\s*c/gi, "celsius")
    .replace(/[\u00B0\u00BA]\s*f/gi, "fahrenheit")
    .replace(/[\u00B0\u00BA]/g, "grau")
    .replace(/[%]/g, "pct")
    .replace(/[\u00D7\u00B7]/g, "*")
    .replace(/\u00B2/g, "2")
    .replace(/\u00B3/g, "3")
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
    .replace(/(^|[_* ])graus?(?=($|[_* ]))/g, (_match, prefix: string) => `${prefix}\u00B0`)
    .replace(/_mm3\b/g, "/mm\u00B3")
    .replace(/_cm3\b/g, "/cm\u00B3")
    .replace(/_m3\b/g, "/m\u00B3")
    .replace(/_mm2\b/g, "/mm\u00B2")
    .replace(/_cm2\b/g, "/cm\u00B2")
    .replace(/_m2\b/g, "/m\u00B2")
    .replace(/_s\b/g, "/s")
    .replace(/_min\b/g, "/min")
    .replace(/_h\b/g, "/h")
    .replace(/_hr\b/g, "/h")
    .replace(/\bmm3\b/g, "mm\u00B3")
    .replace(/\bcm3\b/g, "cm\u00B3")
    .replace(/\bm3\b/g, "m\u00B3")
    .replace(/\bmm2\b/g, "mm\u00B2")
    .replace(/\bcm2\b/g, "cm\u00B2")
    .replace(/\bm2\b/g, "m\u00B2")
    .replace(/_/g, " ")
    .replace(/\bshore ([a-z])\b/gi, (_match, suffix: string) => `Shore ${suffix.toUpperCase()}`)
    .replace(/\bhr([a-z])\b/gi, (_match, suffix: string) => `HR${suffix.toUpperCase()}`)
    .replace(/\bdb\b/gi, "dB")
    .replace(/\bph\b/gi, "pH")
    .replace(/\bhz\b/gi, "Hz")
    .replace(/\bbrix\b/gi, "Brix")
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
    .replace(/[µμ]/g, "u")
    .replace(/[Ωω]/g, "ohm")
    .replace(/\u00B2/g, "2")
    .replace(/\u00B3/g, "3")
    .replace(/[\u00B0\u00BA]\s*c/gi, "celsius")
    .replace(/[\u00B0\u00BA]\s*f/gi, "fahrenheit")
    .replace(/%/g, "pct")
    .replace(/\bgraus\b/gi, "grau")
    .replace(/\bshore\s+([a-z])\b/gi, (_match, suffix: string) => `shore_${suffix}`)
    .replace(/[\u00D7\u00B7]/g, "*")
    .replace(/[\u00B0\u00BA]/g, "grau")
    .replace(/\s*\/\s*/g, "_")
    .replace(/\s*\*\s*/g, "*")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_*]/g, "")
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

export function deduplicateMeasurementRows(rows: MeasurementRow[]): MeasurementRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = row.tipo.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
