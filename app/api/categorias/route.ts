import { NextResponse } from "next/server";
import {
  mapCategoryRow,
  serializeCategorySlug,
  type CategoryRow
} from "@/lib/categories";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function buildSchemaPermissionError() {
  return NextResponse.json(
    {
      error:
        "Nao foi possivel acessar calibracao.categorias_instrumentos. Verifique as permissoes do schema calibracao para a chave de servico."
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

export async function GET() {
  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .select("nome, slug")
    .order("nome", { ascending: true });

  if (error) {
    if (error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const items = ((data ?? []) as CategoryRow[]).map(mapCategoryRow);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    name?: string;
  };

  const name = payload.name?.trim().replace(/\s+/g, " ") ?? "";
  const slug = serializeCategorySlug(name);

  if (!name) {
    return NextResponse.json({ error: "Nome da categoria obrigatorio." }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ error: "Nome da categoria invalido." }, { status: 400 });
  }

  const duplicateLookup = await findDuplicateCategory(slug);

  if (duplicateLookup.error) {
    if (duplicateLookup.error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  if (duplicateLookup.data) {
    return NextResponse.json({ error: "Essa categoria ja esta cadastrada." }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .insert({
      nome: name,
      slug
    })
    .select("nome, slug")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  return NextResponse.json({ item: mapCategoryRow(data as CategoryRow) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as {
    id?: string;
    name?: string;
  };

  const currentSlug = payload.id?.trim() ?? "";
  const name = payload.name?.trim().replace(/\s+/g, " ") ?? "";
  const nextSlug = serializeCategorySlug(name);

  if (!currentSlug) {
    return NextResponse.json({ error: "Id da categoria obrigatorio." }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "Nome da categoria obrigatorio." }, { status: 400 });
  }

  if (!nextSlug) {
    return NextResponse.json({ error: "Nome da categoria invalido." }, { status: 400 });
  }

  const duplicateLookup = await findDuplicateCategory(nextSlug, currentSlug);

  if (duplicateLookup.error) {
    if (duplicateLookup.error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  if (duplicateLookup.data) {
    return NextResponse.json({ error: "Essa categoria ja esta cadastrada." }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .update({
      nome: name,
      slug: nextSlug
    })
    .eq("slug", currentSlug)
    .select("nome, slug")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  return NextResponse.json({ item: mapCategoryRow(data as CategoryRow) });
}

export async function DELETE(request: Request) {
  const payload = (await request.json()) as {
    id?: string;
  };

  const id = payload.id?.trim() ?? "";

  if (!id) {
    return NextResponse.json({ error: "Id da categoria obrigatorio." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .schema("calibracao")
    .from("categorias_instrumentos")
    .delete()
    .eq("slug", id);

  if (error) {
    if (error.message.toLowerCase().includes("permission denied")) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  return NextResponse.json({ success: true });
}
