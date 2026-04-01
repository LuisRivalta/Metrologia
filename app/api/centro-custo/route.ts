import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim() ?? "";

  if (!code) {
    return NextResponse.json({ error: "Codigo do centro de custo obrigatorio." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .schema("datasul")
    .from("centro_custo")
    .select("cc_codigo, descricao")
    .eq("cc_codigo", code)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel consultar o centro de custo." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Centro de custo nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    code: data.cc_codigo,
    description: data.descricao?.trim() ?? ""
  });
}
