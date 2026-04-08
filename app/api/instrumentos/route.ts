import { NextResponse } from "next/server";
import { serializeCategorySlug } from "@/lib/categories";
import { isValidIsoDate } from "@/lib/date-utils";
import {
  mapCategoryMeasurementFieldRow,
  mapInstrumentMeasurementFieldRow,
  serializeMeasurementFieldSlug,
  type CategoryMeasurementFieldRow,
  type InstrumentMeasurementFieldRow,
  type MeasurementFieldDraft,
  type MeasurementFieldItem,
  type MeasurementFieldSource
} from "@/lib/measurement-fields";
import {
  mapInstrumentRow,
  type InstrumentCategoryRow,
  type InstrumentDbRow
} from "@/lib/instruments";
import { type MeasurementRow } from "@/lib/measurements";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SanitizedMeasurementFieldInput = {
  name: string;
  slug: string;
  measurementId: number;
  source: MeasurementFieldSource;
  categoryFieldId: number | null;
  order: number;
};

type InstrumentPayload = {
  id?: string | number;
  tag?: string;
  category?: string;
  useNewCategory?: boolean;
  newCategoryName?: string;
  manufacturer?: string;
  calibrationDate?: string;
  fields?: MeasurementFieldDraft[];
};

function buildSchemaPermissionError() {
  return NextResponse.json(
    {
      error:
        "Nao foi possivel acessar os dados de instrumentos no schema calibracao. Verifique as permissoes da chave de servico."
    },
    { status: 500 }
  );
}

function buildGenericError() {
  return NextResponse.json(
    { error: "Nao foi possivel processar o cadastro de instrumentos." },
    { status: 500 }
  );
}

function isPermissionDenied(message?: string) {
  return (message ?? "").toLowerCase().includes("permission denied");
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function mapCategoriesById(rows: InstrumentCategoryRow[]) {
  return new Map(rows.map((row) => [row.id, row]));
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

function mapInstrumentFieldsByInstrumentId(
  rows: InstrumentMeasurementFieldRow[],
  measurementsById: Map<number, MeasurementRow>
) {
  const nextMap = new Map<number, MeasurementFieldItem[]>();

  for (const row of rows) {
    if (!row.instrumento_id) continue;

    const currentList = nextMap.get(row.instrumento_id) ?? [];
    currentList.push(mapInstrumentMeasurementFieldRow(row, measurementsById));
    nextMap.set(row.instrumento_id, currentList);
  }

  for (const [instrumentId, fields] of nextMap.entries()) {
    nextMap.set(
      instrumentId,
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

function sanitizeMeasurementFields(rawFields: MeasurementFieldDraft[] | undefined) {
  const fields = rawFields ?? [];

  if (fields.length === 0) {
    return { error: "Adicione pelo menos um campo de medicao." };
  }

  const seenSlugs = new Set<string>();
  const sanitizedFields: SanitizedMeasurementFieldInput[] = [];

  for (const [index, rawField] of fields.entries()) {
    const name = normalizeText(rawField.name);
    const slug = serializeMeasurementFieldSlug(name);
    const measurementId = Number(rawField.measurementId);
    const source = rawField.source === "category" ? "category" : "instrument";
    const rawCategoryFieldId =
      rawField.categoryFieldId === "" || rawField.categoryFieldId === undefined
        ? null
        : Number(rawField.categoryFieldId);

    if (!name) {
      return { error: `Preencha o nome do campo ${index + 1}.` };
    }

    if (!slug) {
      return { error: `O campo ${name} possui um nome invalido.` };
    }

    if (!Number.isFinite(measurementId) || measurementId <= 0) {
      return { error: `Selecione a medida do campo ${name}.` };
    }

    if (seenSlugs.has(slug)) {
      return { error: `O campo ${name} esta duplicado.` };
    }

    seenSlugs.add(slug);
    sanitizedFields.push({
      name,
      slug,
      measurementId,
      source,
      categoryFieldId: Number.isFinite(rawCategoryFieldId) ? rawCategoryFieldId : null,
      order: index
    });
  }

  return { fields: sanitizedFields };
}

async function findDuplicateInstrumentTag(rawTag: string, excludeId?: number) {
  let query = supabaseAdmin
    .schema("calibracao")
    .from("instrumentos")
    .select("id")
    .eq("tag", rawTag)
    .limit(1);

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  return query.maybeSingle();
}

async function findDuplicateCategorySlug(rawSlug: string) {
  return supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .select("id, nome, slug")
    .eq("slug", rawSlug)
    .limit(1)
    .maybeSingle();
}

async function loadCategories() {
  return supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .select("id, nome, slug")
    .order("nome", { ascending: true });
}

async function loadMeasurements() {
  return supabaseAdmin
    .schema("calibracao")
    .from("unidadas_medidas")
    .select("id, created_at, tipo, tipo_desc")
    .order("tipo", { ascending: true });
}

async function loadCategoryMeasurementFields(categoryIds: number[]) {
  if (categoryIds.length === 0) {
    return {
      data: [] as CategoryMeasurementFieldRow[],
      error: null as null | { message: string }
    };
  }

  const response = await supabaseAdmin
    .schema("calibracao")
    .from("categoria_campos_medicao")
    .select("id, categoria_id, nome, slug, unidade_medida_id, tipo_valor, ordem, ativo")
    .eq("ativo", true)
    .in("categoria_id", categoryIds)
    .order("ordem", { ascending: true })
    .order("id", { ascending: true });

  return {
    data: (response.data ?? []) as CategoryMeasurementFieldRow[],
    error: response.error
  };
}

async function loadInstrumentMeasurementFields(instrumentIds: number[]) {
  if (instrumentIds.length === 0) {
    return {
      data: [] as InstrumentMeasurementFieldRow[],
      error: null as null | { message: string }
    };
  }

  const response = await supabaseAdmin
    .schema("calibracao")
    .from("instrumento_campos_medicao")
    .select("id, instrumento_id, categoria_campo_medicao_id, nome, slug, unidade_medida_id, tipo_valor, ordem, ativo")
    .eq("ativo", true)
    .in("instrumento_id", instrumentIds)
    .order("ordem", { ascending: true })
    .order("id", { ascending: true });

  return {
    data: (response.data ?? []) as InstrumentMeasurementFieldRow[],
    error: response.error
  };
}

async function findCategoryByNameOrSlug(rawCategory: string) {
  const category = normalizeText(rawCategory);
  const slug = serializeCategorySlug(category);

  const byNameResponse = await supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .select("id, nome, slug")
    .eq("nome", category)
    .limit(1)
    .maybeSingle();

  if (byNameResponse.data || byNameResponse.error) {
    return byNameResponse;
  }

  return supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .select("id, nome, slug")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
}

async function replaceCategoryMeasurementFields(
  categoryId: number,
  fields: SanitizedMeasurementFieldInput[]
) {
  const deleteResponse = await supabaseAdmin
    .schema("calibracao")
    .from("categoria_campos_medicao")
    .delete()
    .eq("categoria_id", categoryId);

  if (deleteResponse.error) {
    return { data: null, error: deleteResponse.error };
  }

  const insertPayload = fields.map((field, index) => ({
    categoria_id: categoryId,
    nome: field.name,
    slug: field.slug,
    unidade_medida_id: field.measurementId,
    tipo_valor: "numero",
    ordem: index,
    ativo: true
  }));

  const insertResponse = await supabaseAdmin
    .schema("calibracao")
    .from("categoria_campos_medicao")
    .insert(insertPayload)
    .select("id, categoria_id, nome, slug, unidade_medida_id, tipo_valor, ordem, ativo");

  return {
    data: (insertResponse.data ?? null) as CategoryMeasurementFieldRow[] | null,
    error: insertResponse.error
  };
}

async function replaceInstrumentMeasurementFields(
  instrumentId: number,
  fields: SanitizedMeasurementFieldInput[],
  categoryFieldIdsBySlug: Map<string, number>
) {
  const deleteResponse = await supabaseAdmin
    .schema("calibracao")
    .from("instrumento_campos_medicao")
    .delete()
    .eq("instrumento_id", instrumentId);

  if (deleteResponse.error) {
    return { error: deleteResponse.error };
  }

  const insertPayload = fields.map((field, index) => ({
    instrumento_id: instrumentId,
    categoria_campo_medicao_id:
      field.source === "category"
        ? field.categoryFieldId ?? categoryFieldIdsBySlug.get(field.slug) ?? null
        : null,
    nome: field.name,
    slug: field.slug,
    unidade_medida_id: field.measurementId,
    tipo_valor: "numero",
    ordem: index,
    ativo: true
  }));

  const insertResponse = await supabaseAdmin
    .schema("calibracao")
    .from("instrumento_campos_medicao")
    .insert(insertPayload);

  return { error: insertResponse.error };
}

function buildCategoryFieldIdsBySlug(rows: CategoryMeasurementFieldRow[]) {
  return new Map(rows.map((row) => [normalizeText(row.slug), row.id] as const));
}

function buildInstrumentDetail(
  row: InstrumentDbRow,
  categoriesById: Map<number, InstrumentCategoryRow>,
  instrumentFieldsByInstrumentId: Map<number, MeasurementFieldItem[]>,
  categoryFieldsByCategoryId: Map<number, MeasurementFieldItem[]>
) {
  const baseItem = mapInstrumentRow(row, categoriesById);
  const fields =
    instrumentFieldsByInstrumentId.get(row.id) ??
    (row.categoria_id ? categoryFieldsByCategoryId.get(row.categoria_id) : undefined) ??
    [];

  return {
    ...baseItem,
    fields
  };
}

async function resolveCategory(
  rawCategory: string,
  useNewCategory: boolean,
  fields: SanitizedMeasurementFieldInput[]
) {
  if (useNewCategory) {
    const categoryName = normalizeText(rawCategory);
    const categorySlug = serializeCategorySlug(categoryName);

    if (!categoryName) {
      return { response: NextResponse.json({ error: "Nome da nova categoria obrigatorio." }, { status: 400 }) };
    }

    if (!categorySlug) {
      return { response: NextResponse.json({ error: "Nome da categoria invalido." }, { status: 400 }) };
    }

    const duplicateCategory = await findDuplicateCategorySlug(categorySlug);

    if (duplicateCategory.error) {
      if (isPermissionDenied(duplicateCategory.error.message)) {
        return { response: buildSchemaPermissionError() };
      }

      return { response: buildGenericError() };
    }

    if (duplicateCategory.data) {
      return { response: NextResponse.json({ error: "Essa categoria ja esta cadastrada." }, { status: 409 }) };
    }

    const insertCategory = await supabaseAdmin
      .schema("calibracao")
      .from("categorias_instrumentos")
      .insert({
        nome: categoryName,
        slug: categorySlug
      })
      .select("id, nome, slug")
      .single();

    if (insertCategory.error) {
      if (isPermissionDenied(insertCategory.error.message)) {
        return { response: buildSchemaPermissionError() };
      }

      return { response: buildGenericError() };
    }

    const categoryFieldResponse = await replaceCategoryMeasurementFields(
      insertCategory.data.id,
      fields.map((field) => ({ ...field, source: "category" }))
    );

    if (categoryFieldResponse.error) {
      if (isPermissionDenied(categoryFieldResponse.error.message)) {
        return { response: buildSchemaPermissionError() };
      }

      return { response: buildGenericError() };
    }

    return {
      category: insertCategory.data as InstrumentCategoryRow,
      categoryFieldRows: categoryFieldResponse.data ?? []
    };
  }

  const categoryLookup = await findCategoryByNameOrSlug(rawCategory);

  if (categoryLookup.error) {
    if (isPermissionDenied(categoryLookup.error.message)) {
      return { response: buildSchemaPermissionError() };
    }

    return { response: buildGenericError() };
  }

  if (!categoryLookup.data) {
    return { response: NextResponse.json({ error: "Categoria nao encontrada." }, { status: 400 }) };
  }

  const categoryFieldRowsResponse = await loadCategoryMeasurementFields([categoryLookup.data.id]);

  if (categoryFieldRowsResponse.error) {
    if (isPermissionDenied(categoryFieldRowsResponse.error.message)) {
      return { response: buildSchemaPermissionError() };
    }

    return { response: buildGenericError() };
  }

  return {
    category: categoryLookup.data as InstrumentCategoryRow,
    categoryFieldRows: categoryFieldRowsResponse.data
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedId = url.searchParams.get("id");

  if (requestedId) {
    const instrumentId = Number(requestedId);

    if (!Number.isFinite(instrumentId)) {
      return NextResponse.json({ error: "Id do instrumento invalido." }, { status: 400 });
    }

    const instrumentResponse = await supabaseAdmin
      .schema("calibracao")
      .from("instrumentos")
      .select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao")
      .eq("id", instrumentId)
      .limit(1)
      .maybeSingle();

    if (instrumentResponse.error) {
      if (isPermissionDenied(instrumentResponse.error.message)) {
        return buildSchemaPermissionError();
      }

      return buildGenericError();
    }

    if (!instrumentResponse.data) {
      return NextResponse.json({ error: "Instrumento nao encontrado." }, { status: 404 });
    }

    const [categoryRowsResponse, measurementRowsResponse, categoryFieldRowsResponse, instrumentFieldRowsResponse] =
      await Promise.all([
        loadCategories(),
        loadMeasurements(),
        loadCategoryMeasurementFields(
          instrumentResponse.data.categoria_id ? [instrumentResponse.data.categoria_id] : []
        ),
        loadInstrumentMeasurementFields([instrumentId])
      ]);

    const combinedError =
      categoryRowsResponse.error ??
      measurementRowsResponse.error ??
      categoryFieldRowsResponse.error ??
      instrumentFieldRowsResponse.error;

    if (combinedError) {
      if (isPermissionDenied(combinedError.message)) {
        return buildSchemaPermissionError();
      }

      return buildGenericError();
    }

    const categoriesById = mapCategoriesById(
      (categoryRowsResponse.data ?? []) as InstrumentCategoryRow[]
    );
    const measurementsById = mapMeasurementsById(
      (measurementRowsResponse.data ?? []) as MeasurementRow[]
    );
    const categoryFieldsByCategoryId = mapCategoryFieldsByCategoryId(
      categoryFieldRowsResponse.data,
      measurementsById
    );
    const instrumentFieldsByInstrumentId = mapInstrumentFieldsByInstrumentId(
      instrumentFieldRowsResponse.data,
      measurementsById
    );

    const item = buildInstrumentDetail(
      instrumentResponse.data as InstrumentDbRow,
      categoriesById,
      instrumentFieldsByInstrumentId,
      categoryFieldsByCategoryId
    );

    return NextResponse.json({ item });
  }

  const [instrumentRowsResponse, categoryRowsResponse] = await Promise.all([
    supabaseAdmin
      .schema("calibracao")
      .from("instrumentos")
      .select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao")
      .order("id", { ascending: true }),
    loadCategories()
  ]);

  if (instrumentRowsResponse.error || categoryRowsResponse.error) {
    const errorMessage =
      instrumentRowsResponse.error?.message ?? categoryRowsResponse.error?.message ?? "";

    if (isPermissionDenied(errorMessage)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const categoriesById = mapCategoriesById(
    (categoryRowsResponse.data ?? []) as InstrumentCategoryRow[]
  );
  const items = ((instrumentRowsResponse.data ?? []) as InstrumentDbRow[]).map((row) =>
    mapInstrumentRow(row, categoriesById)
  );

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as InstrumentPayload;
  const tag = normalizeText(payload.tag);
  const category = normalizeText(payload.useNewCategory ? payload.newCategoryName : payload.category);
  const manufacturer = normalizeText(payload.manufacturer);
  const calibrationDate = payload.calibrationDate?.trim() ?? "";
  const sanitizedFields = sanitizeMeasurementFields(payload.fields);

  if (!tag) {
    return NextResponse.json({ error: "Tag obrigatoria." }, { status: 400 });
  }

  if (!category) {
    return NextResponse.json(
      {
        error: payload.useNewCategory
          ? "Nome da nova categoria obrigatorio."
          : "Categoria obrigatoria."
      },
      { status: 400 }
    );
  }

  if (!manufacturer) {
    return NextResponse.json({ error: "Fabricante obrigatorio." }, { status: 400 });
  }

  if (!calibrationDate || !isValidIsoDate(calibrationDate)) {
    return NextResponse.json({ error: "Prazo de calibracao obrigatorio." }, { status: 400 });
  }

  if ("error" in sanitizedFields) {
    return NextResponse.json({ error: sanitizedFields.error }, { status: 400 });
  }

  const duplicateTagLookup = await findDuplicateInstrumentTag(tag);

  if (duplicateTagLookup.error) {
    if (isPermissionDenied(duplicateTagLookup.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  if (duplicateTagLookup.data) {
    return NextResponse.json({ error: "Essa tag ja esta cadastrada." }, { status: 409 });
  }

  const resolvedCategory = await resolveCategory(
    category,
    Boolean(payload.useNewCategory),
    sanitizedFields.fields
  );

  if ("response" in resolvedCategory) {
    return resolvedCategory.response;
  }

  const insertInstrument = await supabaseAdmin
    .schema("calibracao")
    .from("instrumentos")
    .insert({
      tag,
      categoria_id: resolvedCategory.category.id,
      fabricante: manufacturer,
      proxima_calibracao: calibrationDate
    })
    .select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao")
    .single();

  if (insertInstrument.error) {
    if (isPermissionDenied(insertInstrument.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const categoryFieldIdsBySlug = buildCategoryFieldIdsBySlug(
    resolvedCategory.categoryFieldRows
  );
  const instrumentFields =
    payload.useNewCategory
      ? sanitizedFields.fields.map((field) => ({ ...field, source: "category" as const }))
      : sanitizedFields.fields;
  const replaceInstrumentFields = await replaceInstrumentMeasurementFields(
    insertInstrument.data.id,
    instrumentFields,
    categoryFieldIdsBySlug
  );

  if (replaceInstrumentFields.error) {
    if (isPermissionDenied(replaceInstrumentFields.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const item = mapInstrumentRow(
    insertInstrument.data as InstrumentDbRow,
    mapCategoriesById([resolvedCategory.category])
  );
  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as InstrumentPayload;
  const id = Number(payload.id);
  const tag = normalizeText(payload.tag);
  const category = normalizeText(payload.useNewCategory ? payload.newCategoryName : payload.category);
  const manufacturer = normalizeText(payload.manufacturer);
  const calibrationDate = payload.calibrationDate?.trim() ?? "";
  const sanitizedFields = sanitizeMeasurementFields(payload.fields);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Id do instrumento obrigatorio." }, { status: 400 });
  }

  if (!tag) {
    return NextResponse.json({ error: "Tag obrigatoria." }, { status: 400 });
  }

  if (!category) {
    return NextResponse.json(
      {
        error: payload.useNewCategory
          ? "Nome da nova categoria obrigatorio."
          : "Categoria obrigatoria."
      },
      { status: 400 }
    );
  }

  if (!manufacturer) {
    return NextResponse.json({ error: "Fabricante obrigatorio." }, { status: 400 });
  }

  if (!calibrationDate || !isValidIsoDate(calibrationDate)) {
    return NextResponse.json({ error: "Prazo de calibracao obrigatorio." }, { status: 400 });
  }

  if ("error" in sanitizedFields) {
    return NextResponse.json({ error: sanitizedFields.error }, { status: 400 });
  }

  const duplicateTagLookup = await findDuplicateInstrumentTag(tag, id);

  if (duplicateTagLookup.error) {
    if (isPermissionDenied(duplicateTagLookup.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  if (duplicateTagLookup.data) {
    return NextResponse.json({ error: "Essa tag ja esta cadastrada." }, { status: 409 });
  }

  const resolvedCategory = await resolveCategory(
    category,
    Boolean(payload.useNewCategory),
    sanitizedFields.fields
  );

  if ("response" in resolvedCategory) {
    return resolvedCategory.response;
  }

  const updateInstrument = await supabaseAdmin
    .schema("calibracao")
    .from("instrumentos")
    .update({
      tag,
      categoria_id: resolvedCategory.category.id,
      fabricante: manufacturer,
      proxima_calibracao: calibrationDate
    })
    .eq("id", id)
    .select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao")
    .single();

  if (updateInstrument.error) {
    if (isPermissionDenied(updateInstrument.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const categoryFieldIdsBySlug = buildCategoryFieldIdsBySlug(
    resolvedCategory.categoryFieldRows
  );
  const instrumentFields =
    payload.useNewCategory
      ? sanitizedFields.fields.map((field) => ({ ...field, source: "category" as const }))
      : sanitizedFields.fields;
  const replaceInstrumentFields = await replaceInstrumentMeasurementFields(
    id,
    instrumentFields,
    categoryFieldIdsBySlug
  );

  if (replaceInstrumentFields.error) {
    if (isPermissionDenied(replaceInstrumentFields.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const item = mapInstrumentRow(
    updateInstrument.data as InstrumentDbRow,
    mapCategoriesById([resolvedCategory.category])
  );
  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const payload = (await request.json()) as {
    id?: string | number;
  };

  const id = Number(payload.id);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Id do instrumento obrigatorio." }, { status: 400 });
  }

  const deleteFields = await supabaseAdmin
    .schema("calibracao")
    .from("instrumento_campos_medicao")
    .delete()
    .eq("instrumento_id", id);

  if (deleteFields.error) {
    if (isPermissionDenied(deleteFields.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const { error } = await supabaseAdmin
    .schema("calibracao")
    .from("instrumentos")
    .delete()
    .eq("id", id);

  if (error) {
    if (isPermissionDenied(error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  return NextResponse.json({ success: true });
}
