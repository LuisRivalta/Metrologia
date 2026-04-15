import { NextResponse } from "next/server";
import { mapCategoryRow, serializeCategorySlug, type CategoryRow } from "@/lib/categories";
import {
  mapCategoryMeasurementFieldRow,
  serializeMeasurementFieldSlug,
  serializeMeasurementFieldValueConfig,
  type CategoryMeasurementFieldRow,
  type InstrumentMeasurementFieldRow,
  type MeasurementFieldDraft,
  type MeasurementFieldItem
} from "@/lib/measurement-fields";
import { mapMeasurementRow, type MeasurementRow } from "@/lib/measurements";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SanitizedMeasurementFieldInput = {
  dbId: number | null;
  name: string;
  slug: string;
  measurementId: number;
  order: number;
  groupName: string;
  subgroupName: string;
  valueType: string;
};

type CategoryPayload = {
  id?: string;
  name?: string;
  fields?: MeasurementFieldDraft[];
};

function buildSchemaPermissionError() {
  return NextResponse.json(
    {
      error:
        "Nao foi possivel acessar os dados de categorias no schema calibracao. Verifique as permissoes da chave de servico."
    },
    { status: 500 }
  );
}

function buildGenericError() {
  return NextResponse.json(
    { error: "Nao foi possivel processar o cadastro de categorias." },
    { status: 500 }
  );
}

function buildCategoryInUseError(categoryName: string, instrumentTags: string[], total: number) {
  const normalizedCategoryName = normalizeText(categoryName) || "esta categoria";
  const uniqueTags = instrumentTags
    .map((tag) => normalizeText(tag))
    .filter(Boolean);

  const examples =
    uniqueTags.length > 0
      ? ` Instrumentos vinculados: ${uniqueTags.join(", ")}${total > uniqueTags.length ? "..." : ""}.`
      : "";

  return NextResponse.json(
    {
      error: `Nao e possivel excluir a categoria ${normalizedCategoryName} porque ela ainda esta vinculada a ${total} instrumento${total === 1 ? "" : "s"}. Reclassifique ou exclua esses instrumentos antes.${examples}`
    },
    { status: 409 }
  );
}

function buildDeleteCategoryGenericError() {
  return NextResponse.json(
    { error: "Nao foi possivel excluir a categoria." },
    { status: 500 }
  );
}

function isPermissionDenied(message?: string) {
  return (message ?? "").toLowerCase().includes("permission denied");
}

function isForeignKeyViolation(message?: string) {
  return (message ?? "").toLowerCase().includes("foreign key");
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

function sanitizeMeasurementFields(rawFields: MeasurementFieldDraft[] | undefined) {
  const fields = rawFields ?? [];

  if (fields.length === 0) {
    return { error: "Adicione pelo menos um item ao template de calibracao da categoria." };
  }

  const seenSlugs = new Set<string>();
  const sanitizedFields: SanitizedMeasurementFieldInput[] = [];

  for (const [index, rawField] of fields.entries()) {
    const dbId = rawField.dbId === undefined ? null : Number(rawField.dbId);
    const name = normalizeText(rawField.name);
    const groupName = normalizeText(rawField.groupName);
    const subgroupName = normalizeText(rawField.subgroupName);
    const slug = serializeMeasurementFieldSlug({
      name,
      groupName,
      subgroupName
    });
    const measurementId = Number(rawField.measurementId);

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
      dbId: Number.isFinite(dbId) && dbId !== null && dbId > 0 ? dbId : null,
      name,
      slug,
      measurementId,
      order: index,
      groupName,
      subgroupName,
      valueType: "numero"
    });
  }

  return { fields: sanitizedFields };
}

async function findDuplicateCategory(rawSlug: string, excludeSlug?: string) {
  let query = supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .select("slug")
    .eq("slug", rawSlug)
    .limit(1);

  if (excludeSlug) {
    query = query.neq("slug", excludeSlug);
  }

  return query.maybeSingle();
}

async function loadMeasurements() {
  return supabaseAdmin
    .schema("calibracao")
    .from("unidadas_medidas")
    .select("id, created_at, tipo, tipo_desc")
    .order("tipo", { ascending: true });
}

async function loadCategoryMeasurementFields() {
  return supabaseAdmin
    .schema("calibracao")
    .from("categoria_campos_medicao")
    .select("id, categoria_id, nome, slug, unidade_medida_id, tipo_valor, ordem, ativo")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("id", { ascending: true });
}

async function replaceCategoryMeasurementFields(
  categoryId: number,
  fields: SanitizedMeasurementFieldInput[]
) {
  const existingFieldsResponse = await supabaseAdmin
    .schema("calibracao")
    .from("categoria_campos_medicao")
    .select("id")
    .eq("categoria_id", categoryId);

  if (existingFieldsResponse.error) {
    return { error: existingFieldsResponse.error };
  }

  const existingFieldIds = new Set(
    ((existingFieldsResponse.data ?? []) as Array<{ id: number | null }>)
      .map((field) => field.id)
      .filter((fieldId): fieldId is number => Number.isFinite(fieldId))
  );
  const incomingFieldIds = new Set(
    fields
      .map((field) => field.dbId)
      .filter((fieldId): fieldId is number => Number.isFinite(fieldId))
  );
  const idsToDelete = [...existingFieldIds].filter((fieldId) => !incomingFieldIds.has(fieldId));

  if (idsToDelete.length > 0) {
    const deactivateResponse = await supabaseAdmin
      .schema("calibracao")
      .from("categoria_campos_medicao")
      .update({
        ativo: false
      })
      .eq("categoria_id", categoryId)
      .in("id", idsToDelete);

    if (deactivateResponse.error) {
      return { error: deactivateResponse.error };
    }
  }

  const fieldsToUpdate = fields.filter((field) => field.dbId && existingFieldIds.has(field.dbId));

  for (const field of fieldsToUpdate) {
    const updateResponse = await supabaseAdmin
      .schema("calibracao")
      .from("categoria_campos_medicao")
      .update({
        nome: field.name,
        slug: field.slug,
        unidade_medida_id: field.measurementId,
        tipo_valor: serializeMeasurementFieldValueConfig({
          type: field.valueType,
          groupName: field.groupName,
          subgroupName: field.subgroupName
        }),
        ordem: field.order,
        ativo: true
      })
      .eq("categoria_id", categoryId)
      .eq("id", field.dbId as number);

    if (updateResponse.error) {
      return { error: updateResponse.error };
    }
  }

  const insertPayload = fields
    .filter((field) => !field.dbId || !existingFieldIds.has(field.dbId))
    .map((field, index) => ({
      categoria_id: categoryId,
      nome: field.name,
      slug: field.slug,
      unidade_medida_id: field.measurementId,
      tipo_valor: serializeMeasurementFieldValueConfig({
        type: field.valueType,
        groupName: field.groupName,
        subgroupName: field.subgroupName
      }),
      ordem: field.order ?? index,
      ativo: true
    }));

  if (insertPayload.length > 0) {
    const insertResponse = await supabaseAdmin
      .schema("calibracao")
      .from("categoria_campos_medicao")
      .insert(insertPayload);

    if (insertResponse.error) {
      return { error: insertResponse.error };
    }
  }

  return { error: null };
}

async function syncCategoryFieldsToInstruments(
  categoryId: number,
  fields: SanitizedMeasurementFieldInput[]
) {
  const linkedInstrumentsResponse = await supabaseAdmin
    .schema("calibracao")
    .from("instrumentos")
    .select("id")
    .eq("categoria_id", categoryId);

  if (linkedInstrumentsResponse.error) {
    return { error: linkedInstrumentsResponse.error };
  }

  const instrumentIds = ((linkedInstrumentsResponse.data ?? []) as Array<{ id: number | null }>)
    .map((instrument) => instrument.id)
    .filter((instrumentId): instrumentId is number => Number.isFinite(instrumentId));

  if (instrumentIds.length === 0) {
    return { error: null };
  }

  const instrumentFieldsResponse = await supabaseAdmin
    .schema("calibracao")
    .from("instrumento_campos_medicao")
    .select(
      "id, instrumento_id, categoria_campo_medicao_id, nome, slug, unidade_medida_id, tipo_valor, ordem, ativo"
    )
    .in("instrumento_id", instrumentIds);

  if (instrumentFieldsResponse.error) {
    return { error: instrumentFieldsResponse.error };
  }

  const fieldsByInstrumentId = new Map<number, InstrumentMeasurementFieldRow[]>();

  for (const row of (instrumentFieldsResponse.data ?? []) as InstrumentMeasurementFieldRow[]) {
    if (!row.instrumento_id) {
      continue;
    }

    const currentFields = fieldsByInstrumentId.get(row.instrumento_id) ?? [];
    currentFields.push(row);
    fieldsByInstrumentId.set(row.instrumento_id, currentFields);
  }

  for (const instrumentId of instrumentIds) {
    const currentFields = fieldsByInstrumentId.get(instrumentId) ?? [];
    const currentFieldsByCategoryFieldId = new Map(
      currentFields
        .filter(
          (
            field
          ): field is InstrumentMeasurementFieldRow & {
            id: number;
            categoria_campo_medicao_id: number;
          } =>
            Number.isFinite(field.id) && Number.isFinite(field.categoria_campo_medicao_id)
        )
        .map((field) => [field.categoria_campo_medicao_id, field])
    );
    const desiredCategoryFieldIds = new Set(
      fields
        .map((field) => field.dbId)
        .filter((fieldId): fieldId is number => Number.isFinite(fieldId))
    );

    for (const field of fields) {
      if (!field.dbId) {
        continue;
      }

      const payload = {
        nome: field.name,
        slug: field.slug,
        unidade_medida_id: field.measurementId,
        tipo_valor: serializeMeasurementFieldValueConfig({
          type: field.valueType,
          groupName: field.groupName,
          subgroupName: field.subgroupName
        }),
        ordem: field.order,
        ativo: true
      };
      const currentField = currentFieldsByCategoryFieldId.get(field.dbId);

      if (currentField) {
        const updateResponse = await supabaseAdmin
          .schema("calibracao")
          .from("instrumento_campos_medicao")
          .update(payload)
          .eq("id", currentField.id);

        if (updateResponse.error) {
          return { error: updateResponse.error };
        }

        continue;
      }

      const insertResponse = await supabaseAdmin
        .schema("calibracao")
        .from("instrumento_campos_medicao")
        .insert({
          instrumento_id: instrumentId,
          categoria_campo_medicao_id: field.dbId,
          ...payload
        });

      if (insertResponse.error) {
        return { error: insertResponse.error };
      }
    }

    const categoryFieldIdsToDeactivate = currentFields
      .filter(
        (field): field is InstrumentMeasurementFieldRow & { id: number; categoria_campo_medicao_id: number } =>
          Number.isFinite(field.id) && Number.isFinite(field.categoria_campo_medicao_id)
      )
      .filter((field) => !desiredCategoryFieldIds.has(field.categoria_campo_medicao_id))
      .map((field) => field.id);

    if (categoryFieldIdsToDeactivate.length > 0) {
      const deactivateResponse = await supabaseAdmin
        .schema("calibracao")
        .from("instrumento_campos_medicao")
        .update({
          ativo: false
        })
        .in("id", categoryFieldIdsToDeactivate);

      if (deactivateResponse.error) {
        return { error: deactivateResponse.error };
      }
    }
  }

  return { error: null };
}

async function loadCategoryItem(categoryRow: CategoryRow) {
  const [measurementRowsResponse, categoryFieldRowsResponse] = await Promise.all([
    loadMeasurements(),
    loadCategoryMeasurementFields()
  ]);

  const combinedError = measurementRowsResponse.error ?? categoryFieldRowsResponse.error;

  if (combinedError) {
    return {
      item: null,
      measurements: [] as ReturnType<typeof mapMeasurementRow>[],
      error: combinedError
    };
  }

  const measurementRows = (measurementRowsResponse.data ?? []) as MeasurementRow[];
  const measurementsById = mapMeasurementsById(measurementRows);
  const categoryFieldsByCategoryId = mapCategoryFieldsByCategoryId(
    (categoryFieldRowsResponse.data ?? []) as CategoryMeasurementFieldRow[],
    measurementsById
  );

  return {
    item: mapCategoryRow(categoryRow, categoryFieldsByCategoryId.get(categoryRow.id) ?? []),
    measurements: measurementRows.map(mapMeasurementRow),
    error: null
  };
}

export async function GET() {
  const [categoryRowsResponse, measurementRowsResponse, categoryFieldRowsResponse] =
    await Promise.all([
      supabaseAdmin
        .schema("calibracao")
        .from("categorias_instrumentos")
        .select("id, nome, slug")
        .order("nome", { ascending: true }),
      loadMeasurements(),
      loadCategoryMeasurementFields()
    ]);

  const combinedError =
    categoryRowsResponse.error ?? measurementRowsResponse.error ?? categoryFieldRowsResponse.error;

  if (combinedError) {
    if (isPermissionDenied(combinedError.message)) {
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
  const items = ((categoryRowsResponse.data ?? []) as CategoryRow[]).map((row) =>
    mapCategoryRow(row, categoryFieldsByCategoryId.get(row.id) ?? [])
  );

  return NextResponse.json({ items, measurements });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CategoryPayload;
  const name = normalizeText(payload.name);
  const slug = serializeCategorySlug(name);
  const sanitizedFields = sanitizeMeasurementFields(payload.fields);

  if (!name) {
    return NextResponse.json({ error: "Nome da categoria obrigatorio." }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ error: "Nome da categoria invalido." }, { status: 400 });
  }

  if ("error" in sanitizedFields) {
    return NextResponse.json({ error: sanitizedFields.error }, { status: 400 });
  }

  const duplicateLookup = await findDuplicateCategory(slug);

  if (duplicateLookup.error) {
    if (isPermissionDenied(duplicateLookup.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  if (duplicateLookup.data) {
    return NextResponse.json({ error: "Essa categoria ja esta cadastrada." }, { status: 409 });
  }

  const insertCategoryResponse = await supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .insert({
      nome: name,
      slug
    })
    .select("id, nome, slug")
    .single();

  if (insertCategoryResponse.error) {
    if (isPermissionDenied(insertCategoryResponse.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const replaceFieldsResponse = await replaceCategoryMeasurementFields(
    insertCategoryResponse.data.id,
    sanitizedFields.fields
  );

  if (replaceFieldsResponse.error) {
    if (isPermissionDenied(replaceFieldsResponse.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const loadedCategory = await loadCategoryItem(insertCategoryResponse.data as CategoryRow);

  if (loadedCategory.error || !loadedCategory.item) {
    if (loadedCategory.error && isPermissionDenied(loadedCategory.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  return NextResponse.json({ item: loadedCategory.item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as CategoryPayload;
  const currentSlug = payload.id?.trim() ?? "";
  const name = normalizeText(payload.name);
  const nextSlug = serializeCategorySlug(name);
  const sanitizedFields = sanitizeMeasurementFields(payload.fields);

  if (!currentSlug) {
    return NextResponse.json({ error: "Id da categoria obrigatorio." }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "Nome da categoria obrigatorio." }, { status: 400 });
  }

  if (!nextSlug) {
    return NextResponse.json({ error: "Nome da categoria invalido." }, { status: 400 });
  }

  if ("error" in sanitizedFields) {
    return NextResponse.json({ error: sanitizedFields.error }, { status: 400 });
  }

  const duplicateLookup = await findDuplicateCategory(nextSlug, currentSlug);

  if (duplicateLookup.error) {
    if (isPermissionDenied(duplicateLookup.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  if (duplicateLookup.data) {
    return NextResponse.json({ error: "Essa categoria ja esta cadastrada." }, { status: 409 });
  }

  const updateCategoryResponse = await supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .update({
      nome: name,
      slug: nextSlug
    })
    .eq("slug", currentSlug)
    .select("id, nome, slug")
    .single();

  if (updateCategoryResponse.error) {
    if (isPermissionDenied(updateCategoryResponse.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const replaceFieldsResponse = await replaceCategoryMeasurementFields(
    updateCategoryResponse.data.id,
    sanitizedFields.fields
  );

  if (replaceFieldsResponse.error) {
    if (isPermissionDenied(replaceFieldsResponse.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const loadedCategory = await loadCategoryItem(updateCategoryResponse.data as CategoryRow);

  if (loadedCategory.error || !loadedCategory.item) {
    if (loadedCategory.error && isPermissionDenied(loadedCategory.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const syncResponse = await syncCategoryFieldsToInstruments(
    updateCategoryResponse.data.id,
    loadedCategory.item.fields
      .filter((field): field is MeasurementFieldItem & { dbId: number } => typeof field.dbId === "number")
      .map((field) => ({
        dbId: field.dbId,
        name: field.name,
        slug: field.slug,
        measurementId: Number(field.measurementId),
        order: field.order,
        groupName: field.groupName ?? "",
        subgroupName: field.subgroupName ?? "",
        valueType: field.valueType || "numero"
      }))
  );

  if (syncResponse.error) {
    if (isPermissionDenied(syncResponse.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  return NextResponse.json({ item: loadedCategory.item });
}

export async function DELETE(request: Request) {
  const payload = (await request.json()) as CategoryPayload;

  const id = payload.id?.trim() ?? "";

  if (!id) {
    return NextResponse.json({ error: "Id da categoria obrigatorio." }, { status: 400 });
  }

  const categoryLookup = await supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .select("id, nome")
    .eq("slug", id)
    .limit(1)
    .maybeSingle();

  if (categoryLookup.error) {
    if (isPermissionDenied(categoryLookup.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  if (categoryLookup.data?.id) {
    const linkedInstrumentsLookup = await supabaseAdmin
      .schema("calibracao")
      .from("instrumentos")
      .select("id, tag", { count: "exact" })
      .eq("categoria_id", categoryLookup.data.id);

    if (linkedInstrumentsLookup.error) {
      if (isPermissionDenied(linkedInstrumentsLookup.error.message)) {
        return buildSchemaPermissionError();
      }

      return buildGenericError();
    }

    const linkedInstrumentCount = linkedInstrumentsLookup.count ?? 0;

    if (linkedInstrumentCount > 0) {
      return buildCategoryInUseError(
        categoryLookup.data.nome ?? "",
        (linkedInstrumentsLookup.data ?? [])
          .slice(0, 3)
          .map((instrument) => instrument.tag ?? ""),
        linkedInstrumentCount
      );
    }

    const deleteFieldsResponse = await supabaseAdmin
      .schema("calibracao")
      .from("categoria_campos_medicao")
      .delete()
      .eq("categoria_id", categoryLookup.data.id);

    if (deleteFieldsResponse.error) {
      if (isPermissionDenied(deleteFieldsResponse.error.message)) {
        return buildSchemaPermissionError();
      }

      return buildDeleteCategoryGenericError();
    }
  }

  const { error } = await supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .delete()
    .eq("slug", id);

  if (error) {
    if (isPermissionDenied(error.message)) {
      return buildSchemaPermissionError();
    }

    if (isForeignKeyViolation(error.message)) {
      return buildCategoryInUseError(categoryLookup.data?.nome ?? "", [], 1);
    }

    return buildDeleteCategoryGenericError();
  }

  return NextResponse.json({ success: true });
}
