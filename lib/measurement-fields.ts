import { formatMeasurementType, type MeasurementRow } from "@/lib/measurements";

type BaseMeasurementFieldRow = {
  id: number;
  nome: string | null;
  slug: string | null;
  unidade_medida_id: number | null;
  tipo_valor: string | null;
  ordem: number | null;
  ativo: boolean | null;
};

export type InstrumentMeasurementFieldRow = {
} & BaseMeasurementFieldRow & {
  instrumento_id: number | null;
  categoria_campo_medicao_id: number | null;
  created_at?: string | null;
};

export type CategoryMeasurementFieldRow = BaseMeasurementFieldRow & {
  categoria_id: number | null;
};

export type MeasurementFieldItem = {
  dbId?: number;
  name: string;
  slug: string;
  measurementId: string;
  measurementName: string;
  measurementRawName: string;
  valueType: string;
  order: number;
};

export type MeasurementFieldDraft = {
  dbId?: string | number;
  name?: string;
  measurementId?: string | number;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function serializeMeasurementFieldSlug(value: string) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMeasurementInfo(
  measurementId: number | null | undefined,
  measurementsById: Map<number, MeasurementRow>
) {
  const measurement = measurementId ? measurementsById.get(measurementId) : undefined;
  const rawName = normalizeText(measurement?.tipo);

  return {
    measurementId: measurementId ? String(measurementId) : "",
    measurementName: rawName ? formatMeasurementType(rawName) : "",
    measurementRawName: rawName
  };
}

function mapMeasurementFieldRow(
  row: BaseMeasurementFieldRow,
  measurementsById: Map<number, MeasurementRow>
): MeasurementFieldItem {
  const measurementInfo = getMeasurementInfo(row.unidade_medida_id, measurementsById);

  return {
    dbId: row.id,
    name: normalizeText(row.nome),
    slug: normalizeText(row.slug) || serializeMeasurementFieldSlug(row.nome ?? ""),
    measurementId: measurementInfo.measurementId,
    measurementName: measurementInfo.measurementName,
    measurementRawName: measurementInfo.measurementRawName,
    valueType: normalizeText(row.tipo_valor) || "numero",
    order: row.ordem ?? 0
  };
}

export function mapInstrumentMeasurementFieldRow(
  row: InstrumentMeasurementFieldRow,
  measurementsById: Map<number, MeasurementRow>
) {
  return mapMeasurementFieldRow(row, measurementsById);
}

export function mapCategoryMeasurementFieldRow(
  row: CategoryMeasurementFieldRow,
  measurementsById: Map<number, MeasurementRow>
) {
  return mapMeasurementFieldRow(row, measurementsById);
}
