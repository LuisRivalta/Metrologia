import { NextResponse } from "next/server";
import { mapSetorRow, type SetorRow } from "@/lib/setores";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function buildSchemaPermissionError() {
  return NextResponse.json(
    { error: "Nao foi possivel acessar calibracao.setores. Verifique as permissoes da chave de servico." },
    { status: 500 }
  );
}

function buildGenericError() {
  return NextResponse.json(
    { error: "Nao foi possivel processar o cadastro de setores." },
    { status: 500 }
  );
}

function isPermissionDenied(message?: string) {
  return (message ?? "").toLowerCase().includes("permission denied");
}

async function findDuplicateSetor(rawCodigo: string, excludeId?: number) {
  let query = supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .select("id")
    .eq("codigo", rawCodigo)
    .limit(1);

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  return query.maybeSingle();
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .select("id, codigo, nome, created_at")
    .order("codigo", { ascending: true });

  if (error) {
    if (isPermissionDenied(error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  const items = ((data ?? []) as SetorRow[]).map(mapSetorRow);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as { codigo?: string; nome?: string };
  const codigo = payload.codigo?.trim() ?? "";
  const nome = payload.nome?.trim() ?? "";

  if (!codigo) {
    return NextResponse.json({ error: "Codigo do setor obrigatorio." }, { status: 400 });
  }

  if (!nome) {
    return NextResponse.json({ error: "Nome do setor obrigatorio." }, { status: 400 });
  }

  const duplicateLookup = await findDuplicateSetor(codigo);

  if (duplicateLookup.error) {
    if (isPermissionDenied(duplicateLookup.error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  if (duplicateLookup.data) {
    return NextResponse.json({ error: `O codigo ${codigo} ja esta cadastrado.` }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .insert({ codigo, nome })
    .select("id, codigo, nome, created_at")
    .single();

  if (error) {
    if (isPermissionDenied(error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  return NextResponse.json({ item: mapSetorRow(data as SetorRow) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as { id?: string | number; codigo?: string; nome?: string };
  const id = Number(payload.id);
  const codigo = payload.codigo?.trim() ?? "";
  const nome = payload.nome?.trim() ?? "";

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Id do setor obrigatorio." }, { status: 400 });
  }

  if (!codigo) {
    return NextResponse.json({ error: "Codigo do setor obrigatorio." }, { status: 400 });
  }

  if (!nome) {
    return NextResponse.json({ error: "Nome do setor obrigatorio." }, { status: 400 });
  }

  const duplicateLookup = await findDuplicateSetor(codigo, id);

  if (duplicateLookup.error) {
    if (isPermissionDenied(duplicateLookup.error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  if (duplicateLookup.data) {
    return NextResponse.json({ error: `O codigo ${codigo} ja esta cadastrado.` }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("setores")
    .update({ codigo, nome })
    .eq("id", id)
    .select("id, codigo, nome, created_at")
    .single();

  if (error) {
    if (isPermissionDenied(error.message)) {
      return buildSchemaPermissionError();
    }
    return buildGenericError();
  }

  return NextResponse.json({ item: mapSetorRow(data as SetorRow) });
}

export async function DELETE(request: Request) {
  const payload = (await request.json()) as { id?: string | number };
  const id = Number(payload.id);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Id do setor obrigatorio." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .schema("calibracao")
    .from("setores")
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
