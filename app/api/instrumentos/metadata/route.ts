import { NextResponse } from "next/server";
import {
  mapCategoryMeasurementFieldRow,
  type CategoryMeasurementFieldRow,
  type MeasurementFieldItem
} from "@/lib/measurement-fields";
import { mapMeasurementRow, type MeasurementRow } from "@/lib/measurements";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type InstrumentCategoryRow = {
  id: number;
  nome: string | null;
  slug: string | null;
};

function buildSchemaPermissionError() {
  return NextResponse.json(
    {
      error:
        "Nao foi possivel acessar os metadados de instrumentos no schema calibracao. Verifique as permissoes da chave de servico."
    },
    { status: 500 }
  );
}

function buildGenericError() {
  return NextResponse.json(
    { error: "Nao foi possivel carregar os metadados dos instrumentos." },
    { status: 500 }
  );
}

function isPermissionDenied(message?: string) {
  return (message ?? "").toLowerCase().includes("permission denied");
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function mapMeasurementsById(rows: MeasurementRow[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function mapCategoryFieldsByCategoryId(
  rows: CategoryMeasurementFieldRow[],
  measurementsById: Map<number, MeasurementRow>
) {
  const nextMap = new Map<number, MeasurementFieldItem[]>();

  for (const row of rows) {
    if (!row.categoria_id) continue;

    const currentList = nextMap.get(row.categoria_id) ?? [];
    currentList.push(mapCategoryMeasurementFieldRow(row, measurementsById));
    nextMap.set(row.categoria_id, currentList);
  }

  for (const [categoryId, fields] of nextMap.entries()) {
    nextMap.set(
      categoryId,
      [...fields].sort((first, second) => {
        if (first.order !== second.order) {
          return first.order - second.order;
        }

        return first.name.localeCompare(second.name, "pt-BR", { sensitivity: "base" });
      })
    );
  }

  return nextMap;
}

export async function GET() {
  const [categoryRowsResponse, measurementRowsResponse, categoryFieldRowsResponse] =
    await Promise.all([
      supabaseAdmin
        .schema("calibracao")
        .from("categorias_instrumentos")
        .select("id, nome, slug")
        .order("nome", { ascending: true }),
      supabaseAdmin
        .schema("calibracao")
        .from("unidadas_medidas")
        .select("id, created_at, tipo, tipo_desc")
        .order("tipo", { ascending: true }),
      supabaseAdmin
        .schema("calibracao")
        .from("categoria_campos_medicao")
        .select("id, categoria_id, nome, slug, unidade_medida_id, tipo_valor, ordem, ativo")
        .eq("ativo", true)
        .order("ordem", { ascending: true })
        .order("id", { ascending: true })
    ]);

  const combinedError =
    categoryRowsResponse.error ??
    measurementRowsResponse.error ??
    categoryFieldRowsResponse.error;

  if (combinedError) {
    if (isPermissionDenied(combinedError.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const measurements = ((measurementRowsResponse.data ?? []) as MeasurementRow[]).map(
    mapMeasurementRow
  );
  const measurementsById = mapMeasurementsById(
    (measurementRowsResponse.data ?? []) as MeasurementRow[]
  );
  const categoryFieldsByCategoryId = mapCategoryFieldsByCategoryId(
    (categoryFieldRowsResponse.data ?? []) as CategoryMeasurementFieldRow[],
    measurementsById
  );
  const categories = ((categoryRowsResponse.data ?? []) as InstrumentCategoryRow[]).map(
    (row) => ({
      id: row.id,
      name: normalizeText(row.nome),
      slug: normalizeText(row.slug),
      fields: categoryFieldsByCategoryId.get(row.id) ?? []
    })
  );

  return NextResponse.json({ categories, measurements });
}
