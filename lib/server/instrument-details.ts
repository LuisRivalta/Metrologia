import {
  mapInstrumentMeasurementFieldRow,
  type InstrumentMeasurementFieldRow,
  type MeasurementFieldItem
} from "@/lib/measurement-fields";
import {
  mapInstrumentRow,
  type InstrumentCategoryRow,
  type InstrumentDbRow,
  type InstrumentDetailItem
} from "@/lib/instruments";
import { type MeasurementRow } from "@/lib/measurements";
import { supabaseAdmin } from "@/lib/supabase/admin";

function mapCategoriesById(rows: InstrumentCategoryRow[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function mapMeasurementsById(rows: MeasurementRow[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function mapInstrumentFieldsByInstrumentId(
  rows: InstrumentMeasurementFieldRow[],
  measurementsById: Map<number, MeasurementRow>
) {
  const nextMap = new Map<number, MeasurementFieldItem[]>();

  for (const row of rows) {
    if (!row.instrumento_id) continue;

    const currentItems = nextMap.get(row.instrumento_id) ?? [];
    currentItems.push(mapInstrumentMeasurementFieldRow(row, measurementsById));
    nextMap.set(row.instrumento_id, currentItems);
  }

  return nextMap;
}

function sortFields(fields: MeasurementFieldItem[]) {
  return [...fields].sort((first, second) => {
    if (first.order !== second.order) {
      return first.order - second.order;
    }

    return first.name.localeCompare(second.name, "pt-BR", { sensitivity: "base" });
  });
}

function buildInstrumentDetail(
  row: InstrumentDbRow,
  categoriesById: Map<number, InstrumentCategoryRow>,
  instrumentFieldsByInstrumentId: Map<number, MeasurementFieldItem[]>
): InstrumentDetailItem {
  const baseItem = mapInstrumentRow(row, categoriesById);
  const fields = instrumentFieldsByInstrumentId.get(row.id) ?? [];

  return {
    ...baseItem,
    fields: sortFields(fields)
  };
}

export async function loadInstrumentDetailForCalibration(instrumentId: number) {
  const instrumentResponse = await supabaseAdmin
    .schema("calibracao")
    .from("instrumentos")
    .select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao")
    .eq("id", instrumentId)
    .limit(1)
    .maybeSingle();

  if (instrumentResponse.error || !instrumentResponse.data) {
    return {
      item: null,
      error: instrumentResponse.error
    };
  }

  const [categoryRowsResponse, measurementRowsResponse, instrumentFieldRowsResponse] =
    await Promise.all([
      supabaseAdmin
        .schema("calibracao")
        .from("categorias_instrumentos")
        .select("id, nome, slug"),
      supabaseAdmin
        .schema("calibracao")
        .from("unidadas_medidas")
        .select("id, created_at, tipo, tipo_desc")
        .order("tipo", { ascending: true }),
      supabaseAdmin
        .schema("calibracao")
        .from("instrumento_campos_medicao")
        .select("id, instrumento_id, categoria_campo_medicao_id, nome, slug, unidade_medida_id, tipo_valor, ordem, ativo")
        .eq("ativo", true)
        .eq("instrumento_id", instrumentId)
        .order("ordem", { ascending: true })
        .order("id", { ascending: true })
    ]);

  const combinedError =
    categoryRowsResponse.error ??
    measurementRowsResponse.error ??
    instrumentFieldRowsResponse.error;

  if (combinedError) {
    return {
      item: null,
      error: combinedError
    };
  }

  const categoriesById = mapCategoriesById(
    (categoryRowsResponse.data ?? []) as InstrumentCategoryRow[]
  );
  const measurementsById = mapMeasurementsById((measurementRowsResponse.data ?? []) as MeasurementRow[]);
  const instrumentFieldsByInstrumentId = mapInstrumentFieldsByInstrumentId(
    (instrumentFieldRowsResponse.data ?? []) as InstrumentMeasurementFieldRow[],
    measurementsById
  );

  return {
    item: buildInstrumentDetail(
      instrumentResponse.data as InstrumentDbRow,
      categoriesById,
      instrumentFieldsByInstrumentId
    ),
    error: null
  };
}
