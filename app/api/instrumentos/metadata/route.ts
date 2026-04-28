import { NextResponse } from "next/server";
import {
  mapCategoryMeasurementFieldRow,
  type CategoryMeasurementFieldRow
} from "@/lib/measurement-fields";
import { mapMeasurementRow, type MeasurementRow } from "@/lib/measurements";
import { mapSetorRow, type SetorRow } from "@/lib/setores";
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
  const nextMap = new Map<number, ReturnType<typeof mapCategoryMeasurementFieldRow>[]>();

  for (const row of rows) {
    if (!row.categoria_id) {
      continue;
    }

    const currentItems = nextMap.get(row.categoria_id) ?? [];
    currentItems.push(mapCategoryMeasurementFieldRow(row, measurementsById));
    nextMap.set(row.categoria_id, currentItems);
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
  const [categoryRowsResponse, measurementRowsResponse, categoryFieldRowsResponse, setorRowsResponse] = await Promise.all([
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
      .order("id", { ascending: true }),
    supabaseAdmin
      .schema("calibracao")
      .from("setores")
      .select("id, codigo, nome")
      .order("codigo", { ascending: true })
  ]);

  const coreError =
    categoryRowsResponse.error ?? measurementRowsResponse.error ?? categoryFieldRowsResponse.error;

  if (coreError) {
    if (isPermissionDenied(coreError.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const measurementRows = (measurementRowsResponse.data ?? []) as MeasurementRow[];
  const measurements = measurementRows.map(mapMeasurementRow);
  const measurementsById = mapMeasurementsById(measurementRows);
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

  const setores = setorRowsResponse.error
    ? []
    : ((setorRowsResponse.data ?? []) as SetorRow[]).map(mapSetorRow);

  return NextResponse.json({ categories, measurements, setores });
}
