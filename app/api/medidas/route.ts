import { NextResponse } from "next/server";
import {
  formatMeasurementType,
  mapMeasurementRow,
  serializeMeasurementType,
  type MeasurementRow
} from "@/lib/measurements";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function buildSchemaPermissionError() {
  return NextResponse.json(
    {
      error:
        "Nao foi possivel acessar calibracao.unidadas_medidas. Verifique as permissoes do schema calibracao para a chave de servico."
    },
    { status: 500 }
  );
}

function buildGenericError() {
  return NextResponse.json(
    { error: "Nao foi possivel processar o cadastro de medidas." },
    { status: 500 }
  );
}

async function findDuplicateMeasurement(rawType: string, excludeId?: number) {
  let query = supabaseAdmin
    .schema("calibracao")
    .from("unidadas_medidas")
    .select("id")
    .eq("tipo", rawType)
    .limit(1);

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  return query.maybeSingle();
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("unidadas_medidas")
    .select("id, created_at, tipo, tipo_desc")
    .order("tipo", { ascending: true });

  if (error) {
    if (error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const items = ((data ?? []) as MeasurementRow[]).map(mapMeasurementRow);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    name?: string;
    description?: string;
  };

  const rawType = serializeMeasurementType(payload.name ?? "");
  const description = payload.description?.trim() ?? "";

  if (!rawType) {
    return NextResponse.json({ error: "Nome da medida obrigatorio." }, { status: 400 });
  }

  const duplicateLookup = await findDuplicateMeasurement(rawType);

  if (duplicateLookup.error) {
    if (duplicateLookup.error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  if (duplicateLookup.data) {
    return NextResponse.json(
      { error: `A medida ${formatMeasurementType(rawType) || rawType} ja esta cadastrada.` },
      { status: 409 }
    );
  }

  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("unidadas_medidas")
    .insert({
      tipo: rawType,
      tipo_desc: description || null
    })
    .select("id, created_at, tipo, tipo_desc")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  return NextResponse.json({ item: mapMeasurementRow(data as MeasurementRow) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as {
    id?: string;
    name?: string;
    description?: string;
  };

  const id = Number(payload.id);
  const rawType = serializeMeasurementType(payload.name ?? "");
  const description = payload.description?.trim() ?? "";

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Id da medida obrigatorio." }, { status: 400 });
  }

  if (!rawType) {
    return NextResponse.json({ error: "Nome da medida obrigatorio." }, { status: 400 });
  }

  const duplicateLookup = await findDuplicateMeasurement(rawType, id);

  if (duplicateLookup.error) {
    if (duplicateLookup.error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  if (duplicateLookup.data) {
    return NextResponse.json(
      { error: `A medida ${formatMeasurementType(rawType) || rawType} ja esta cadastrada.` },
      { status: 409 }
    );
  }

  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("unidadas_medidas")
    .update({
      tipo: rawType,
      tipo_desc: description || null
    })
    .eq("id", id)
    .select("id, created_at, tipo, tipo_desc")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  return NextResponse.json({ item: mapMeasurementRow(data as MeasurementRow) });
}

export async function DELETE(request: Request) {
  const payload = (await request.json()) as {
    id?: string;
  };

  const id = Number(payload.id);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Id da medida obrigatorio." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .schema("calibracao")
    .from("unidadas_medidas")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  return NextResponse.json({ success: true });
}
