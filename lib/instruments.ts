import type { MeasurementFieldItem } from "@/lib/measurement-fields";

export type InstrumentTone = "neutral" | "warning" | "danger";

export type InstrumentDbRow = {
  id: number;
  tag: string | null;
  categoria_id: number | null;
  fabricante: string | null;
  faixa_unidade_id?: number | null;
  resolucao_unidade_id?: number | null;
  divisao_unidade_id?: number | null;
  capacidade_unidade_id?: number | null;
  data_ultima_calibracao: string | null;
  proxima_calibracao: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type InstrumentCategoryRow = {
  id: number;
  nome: string | null;
  slug: string | null;
  created_at?: string | null;
};

export type InstrumentItem = {
  id: number;
  tag: string;
  category: string;
  categoryId?: number;
  categorySlug?: string;
  manufacturer: string;
  calibration: string;
  calibrationDateValue?: string;
  tone: InstrumentTone;
  diffInDays: number;
};

export type InstrumentDetailItem = InstrumentItem & {
  fields: MeasurementFieldItem[];
};

const shortMonthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const categoryPrefixStopWords = new Set(["a", "as", "da", "das", "de", "do", "dos", "e", "o", "os"]);

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeSlugValue(value: string | null | undefined) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStartOfDay(referenceDate: Date) {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
}

function formatDateShort(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${String(day).padStart(2, "0")} ${shortMonthNames[(month ?? 1) - 1]} ${year}`;
}

function buildCategoryPrefix(categorySlug: string, categoryName: string) {
  const normalizedSlug = normalizeSlugValue(categorySlug || categoryName);
  const significantParts = normalizedSlug
    .split("-")
    .filter(Boolean)
    .filter((part) => !categoryPrefixStopWords.has(part));

  if (significantParts.length >= 2) {
    return significantParts
      .slice(0, 3)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  const base = significantParts[0] ?? normalizedSlug.replace(/-/g, "");

  if (base.length >= 3) {
    return base.slice(0, 3).toUpperCase();
  }

  if (base.length >= 2) {
    return base.toUpperCase();
  }

  return "INS";
}

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function serializeDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildInstrumentDisplayTag(id: number, categorySlug: string, categoryName: string) {
  const prefix = buildCategoryPrefix(categorySlug, categoryName);
  return `${prefix}-${String(id).padStart(3, "0")}`;
}

export function getRelativeCalibration(calibrationDateValue: string | null, referenceDate = new Date()) {
  if (!calibrationDateValue) {
    return {
      tone: "neutral" as const,
      diffInDays: 0,
      description: "Sem prazo definido"
    };
  }

  const currentDay = getStartOfDay(referenceDate);
  const targetDay = parseIsoDate(calibrationDateValue);
  const diffInDays = Math.ceil((targetDay.getTime() - currentDay.getTime()) / 86400000);

  if (diffInDays < 0) {
    return {
      tone: "danger" as const,
      diffInDays,
      description: "Vencido"
    };
  }

  if (diffInDays <= 30) {
    return {
      tone: "warning" as const,
      diffInDays,
      description: `Vence em ${diffInDays} ${diffInDays === 1 ? "dia" : "dias"}`
    };
  }

  const diffInMonths = Math.ceil(diffInDays / 30);

  return {
    tone: "neutral" as const,
    diffInDays,
    description: `Vence em ${diffInMonths} ${diffInMonths === 1 ? "mes" : "meses"}`
  };
}

export function formatInstrumentCalibration(calibrationDateValue: string | null, referenceDate = new Date()) {
  if (!calibrationDateValue) {
    return {
      calibration: "Sem prazo definido",
      tone: "neutral" as const,
      diffInDays: 0
    };
  }

  const relativeCalibration = getRelativeCalibration(calibrationDateValue, referenceDate);

  return {
    calibration: `${formatDateShort(calibrationDateValue)} (${relativeCalibration.description})`,
    tone: relativeCalibration.tone,
    diffInDays: relativeCalibration.diffInDays
  };
}

export function formatInstrumentAlertNote(calibrationDateValue: string | null, diffInDays: number) {
  if (!calibrationDateValue) {
    return "Sem prazo de calibração definido";
  }

  const dateLabel = calibrationDateValue.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3/$2/$1");

  if (diffInDays < 0) {
    const overdueDays = Math.abs(diffInDays);
    return `Vencido há ${overdueDays} ${overdueDays === 1 ? "dia" : "dias"} - calibração ${dateLabel}`;
  }

  return `Vence em ${diffInDays} ${diffInDays === 1 ? "dia" : "dias"} - calibração ${dateLabel}`;
}

export function mapInstrumentRow(
  row: InstrumentDbRow,
  categoriesById: Map<number, InstrumentCategoryRow>,
  referenceDate = new Date()
): InstrumentItem {
  const category = row.categoria_id ? categoriesById.get(row.categoria_id) : undefined;
  const categoryName = normalizeText(category?.nome) || "Sem categoria";
  const categorySlug = normalizeText(category?.slug);
  const manufacturer = normalizeText(row.fabricante) || "Não informado";
  const calibrationInfo = formatInstrumentCalibration(row.proxima_calibracao, referenceDate);
  const rawTag = normalizeText(row.tag);
  const displayTag = rawTag && !isUuidLike(rawTag) ? rawTag : buildInstrumentDisplayTag(row.id, categorySlug, categoryName);

  return {
    id: row.id,
    tag: displayTag,
    category: categoryName,
    categoryId: row.categoria_id ?? undefined,
    categorySlug: categorySlug || undefined,
    manufacturer,
    calibration: calibrationInfo.calibration,
    calibrationDateValue: row.proxima_calibracao ?? undefined,
    tone: calibrationInfo.tone,
    diffInDays: calibrationInfo.diffInDays
  };
}
