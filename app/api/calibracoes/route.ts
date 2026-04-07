import { NextResponse } from "next/server";
import {
  getCalibrationFilterStartDate,
  isCalibrationFilterPreset,
  isValidIsoDate,
  mapCalibrationHistoryRow,
  type CalibrationFilterPreset,
  type CalibrationDbRow,
  type CalibrationResultDbRow
} from "@/lib/calibrations";
import {
  mapInstrumentRow,
  type InstrumentCategoryRow,
  type InstrumentDbRow
} from "@/lib/instruments";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function buildSchemaPermissionError() {
  return NextResponse.json(
    {
      error:
        "Não foi possível acessar o histórico de calibrações no schema calibracao. Verifique as permissões da chave de serviço."
    },
    { status: 500 }
  );
}

function buildGenericError() {
  return NextResponse.json(
    { error: "Não foi possível carregar o log de calibrações do instrumento." },
    { status: 500 }
  );
}

function isPermissionDenied(message?: string) {
  return (message ?? "").toLowerCase().includes("permission denied");
}

function mapCategoriesById(rows: InstrumentCategoryRow[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function mapResultsByCalibrationId(rows: CalibrationResultDbRow[]) {
  const nextMap = new Map<number, CalibrationResultDbRow[]>();

  for (const row of rows) {
    const currentItems = nextMap.get(row.calibracao_id) ?? [];
    currentItems.push(row);
    nextMap.set(row.calibracao_id, currentItems);
  }

  return nextMap;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedInstrumentId = url.searchParams.get("instrumentId");
  const requestedPeriod = url.searchParams.get("period") ?? "1y";
  const requestedDateFrom = url.searchParams.get("dateFrom") ?? "";
  const requestedDateTo = url.searchParams.get("dateTo") ?? "";

  if (!requestedInstrumentId) {
    return NextResponse.json({ error: "Id do instrumento obrigatório." }, { status: 400 });
  }

  const instrumentId = Number(requestedInstrumentId);

  if (!Number.isFinite(instrumentId) || instrumentId <= 0) {
    return NextResponse.json({ error: "Id do instrumento inválido." }, { status: 400 });
  }

  if (requestedDateFrom && !isValidIsoDate(requestedDateFrom)) {
    return NextResponse.json({ error: "Data inicial do filtro inválida." }, { status: 400 });
  }

  if (requestedDateTo && !isValidIsoDate(requestedDateTo)) {
    return NextResponse.json({ error: "Data final do filtro inválida." }, { status: 400 });
  }

  if (
    requestedDateFrom &&
    requestedDateTo &&
    requestedDateFrom > requestedDateTo
  ) {
    return NextResponse.json(
      { error: "A data inicial não pode ser maior que a data final." },
      { status: 400 }
    );
  }

  if (!requestedDateFrom && !requestedDateTo && !isCalibrationFilterPreset(requestedPeriod)) {
    return NextResponse.json({ error: "Período do filtro inválido." }, { status: 400 });
  }

  const activePeriod = (
    requestedDateFrom || requestedDateTo ? "1y" : requestedPeriod
  ) as CalibrationFilterPreset;
  const queryStartDate = requestedDateFrom || getCalibrationFilterStartDate(activePeriod);
  const queryEndDate = requestedDateTo || new Date().toISOString().slice(0, 10);

  let calibrationQuery = supabaseAdmin
    .schema("calibracao")
    .from("calibracoes")
    .select(
      "id, instrumento_id, data_calibracao, data_emissao_certificado, data_validade, certificado, laboratorio, responsavel, status_geral, observacoes, arquivo_certificado_url, created_at, updated_at"
    )
    .eq("instrumento_id", instrumentId)
    .order("data_calibracao", { ascending: false })
    .order("id", { ascending: false });

  if (queryStartDate) {
    calibrationQuery = calibrationQuery.gte("data_calibracao", queryStartDate);
  }

  if (queryEndDate) {
    calibrationQuery = calibrationQuery.lte("data_calibracao", queryEndDate);
  }

  const [instrumentResponse, categoryRowsResponse, calibrationRowsResponse] = await Promise.all([
    supabaseAdmin
      .schema("calibracao")
      .from("instrumentos")
      .select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao")
      .eq("id", instrumentId)
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .schema("calibracao")
      .from("categorias_instrumentos")
      .select("id, nome, slug"),
    calibrationQuery
  ]);

  const baseError =
    instrumentResponse.error ?? categoryRowsResponse.error ?? calibrationRowsResponse.error;

  if (baseError) {
    if (isPermissionDenied(baseError.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  if (!instrumentResponse.data) {
    return NextResponse.json({ error: "Instrumento não encontrado." }, { status: 404 });
  }

  const calibrationRows = (calibrationRowsResponse.data ?? []) as CalibrationDbRow[];
  const calibrationIds = calibrationRows.map((row) => row.id);

  const calibrationResultsResponse =
    calibrationIds.length === 0
      ? { data: [] as CalibrationResultDbRow[], error: null as { message?: string } | null }
      : await supabaseAdmin
          .schema("calibracao")
          .from("calibracao_resultados")
          .select("id, calibracao_id, instrumento_campo_medicao_id, conforme, created_at")
          .in("calibracao_id", calibrationIds)
          .order("id", { ascending: true });

  if (calibrationResultsResponse.error) {
    if (isPermissionDenied(calibrationResultsResponse.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildGenericError();
  }

  const categoriesById = mapCategoriesById(
    (categoryRowsResponse.data ?? []) as InstrumentCategoryRow[]
  );
  const instrument = mapInstrumentRow(
    instrumentResponse.data as InstrumentDbRow,
    categoriesById
  );
  const resultsByCalibrationId = mapResultsByCalibrationId(
    (calibrationResultsResponse.data ?? []) as CalibrationResultDbRow[]
  );
  const items = calibrationRows
    .map((row) => mapCalibrationHistoryRow(row, resultsByCalibrationId.get(row.id) ?? []))
    .filter((item) => item.statusTone === "neutral");

  return NextResponse.json({
    instrument,
    items
  });
}
