import { NextResponse } from "next/server";
import {
  CALIBRATION_CERTIFICATE_BUCKET,
  MAX_CALIBRATION_CERTIFICATE_FILE_SIZE,
  buildCalibrationCertificatePath,
  isPdfCertificateFile
} from "@/lib/calibration-certificates";
import {
  serializeCalibrationRecord,
  type CalibrationFieldReviewStatus
} from "@/lib/calibration-records";
import {
  getCalibrationFilterStartDate,
  isCalibrationFilterPreset,
  isCalibrationStatusValue,
  mapCalibrationHistoryRow,
  type CalibrationDbRow,
  type CalibrationFilterPreset,
  type CalibrationResultDbRow
} from "@/lib/calibrations";
import { isValidIsoDate } from "@/lib/date-utils";
import {
  mapInstrumentRow,
  type InstrumentCategoryRow,
  type InstrumentDbRow
} from "@/lib/instruments";
import { loadInstrumentDetailForCalibration } from "@/lib/server/instrument-details";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const calibrationSelectColumns =
  "id, instrumento_id, data_calibracao, data_emissao_certificado, data_validade, certificado, laboratorio, responsavel, status_geral, observacoes, arquivo_certificado_url, created_at, updated_at";

function buildSchemaPermissionError() {
  return NextResponse.json(
    {
      error:
        "Nao foi possivel acessar o historico de calibracoes no schema calibracao. Verifique as permissoes da chave de servico."
    },
    { status: 500 }
  );
}

function buildGenericError() {
  return NextResponse.json(
    { error: "Nao foi possivel carregar o log de calibracoes do instrumento." },
    { status: 500 }
  );
}

function buildCreateCalibrationGenericError() {
  return NextResponse.json(
    { error: "Nao foi possivel processar o registro da calibracao." },
    { status: 500 }
  );
}

function buildCreateCalibrationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function buildUploadError() {
  return NextResponse.json(
    {
      error: `Nao foi possivel enviar o certificado para o bucket ${CALIBRATION_CERTIFICATE_BUCKET}.`
    },
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

function mapResultsByCalibrationId(rows: CalibrationResultDbRow[]) {
  const nextMap = new Map<number, CalibrationResultDbRow[]>();

  for (const row of rows) {
    const currentItems = nextMap.get(row.calibracao_id) ?? [];
    currentItems.push(row);
    nextMap.set(row.calibracao_id, currentItems);
  }

  return nextMap;
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? normalizeText(value) : "";
}

function getFormFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value && typeof value !== "string" ? value : null;
}

function parseSubmittedResults(
  rawValue: string,
  validFieldIds: Set<number>
) {
  if (!rawValue) {
    return {
      items: [] as Array<{
        fieldId: number;
        fieldSlug: string;
        fieldName: string;
        measurementName: string;
        value: string;
        unit: string;
        confidence: number | null;
        evidence: string;
        status: CalibrationFieldReviewStatus;
        conforme: boolean | null;
      }>
    };
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Array<{
      fieldId?: unknown;
      fieldSlug?: unknown;
      fieldName?: unknown;
      measurementName?: unknown;
      value?: unknown;
      unit?: unknown;
      confidence?: unknown;
      evidence?: unknown;
      status?: unknown;
    }>;

    if (!Array.isArray(parsedValue)) {
      return { error: "Resultados da calibracao invalidos." };
    }

    const items: Array<{
      fieldId: number;
      fieldSlug: string;
      fieldName: string;
      measurementName: string;
      value: string;
      unit: string;
      confidence: number | null;
      evidence: string;
      status: CalibrationFieldReviewStatus;
      conforme: boolean | null;
    }> = [];

    for (const item of parsedValue) {
      const fieldId = Number(item.fieldId);
      const status = typeof item.status === "string" ? item.status.trim() : "";
      const fieldSlug = normalizeText(typeof item.fieldSlug === "string" ? item.fieldSlug : "");
      const fieldName = normalizeText(typeof item.fieldName === "string" ? item.fieldName : "");
      const measurementName = normalizeText(
        typeof item.measurementName === "string" ? item.measurementName : ""
      );
      const value = normalizeText(typeof item.value === "string" ? item.value : "");
      const unit = normalizeText(typeof item.unit === "string" ? item.unit : "");
      const evidence = normalizeText(typeof item.evidence === "string" ? item.evidence : "");
      const confidence =
        typeof item.confidence === "number" && Number.isFinite(item.confidence)
          ? Math.min(1, Math.max(0, Number(item.confidence.toFixed(3))))
          : null;

      if (!Number.isFinite(fieldId) || !validFieldIds.has(fieldId)) {
        continue;
      }

      if (status === "conforming") {
        items.push({
          fieldId,
          fieldSlug,
          fieldName,
          measurementName,
          value,
          unit,
          confidence,
          evidence,
          status: "conforming" as const,
          conforme: true
        });
        continue;
      }

      if (status === "non_conforming") {
        items.push({
          fieldId,
          fieldSlug,
          fieldName,
          measurementName,
          value,
          unit,
          confidence,
          evidence,
          status: "non_conforming" as const,
          conforme: false
        });
        continue;
      }

      items.push({
        fieldId,
        fieldSlug,
        fieldName,
        measurementName,
        value,
        unit,
        confidence,
        evidence,
        status: "unknown" as const,
        conforme: null
      });
    }

    return { items };
  } catch {
    return { error: "Resultados da calibracao invalidos." };
  }
}

async function deleteCalibrationRecord(calibrationId: number) {
  await supabaseAdmin
    .schema("calibracao")
    .from("calibracoes")
    .delete()
    .eq("id", calibrationId);
}

async function removeUploadedCertificate(storagePath: string) {
  await supabaseAdmin.storage.from(CALIBRATION_CERTIFICATE_BUCKET).remove([storagePath]);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedInstrumentId = url.searchParams.get("instrumentId");
  const requestedPeriod = url.searchParams.get("period") ?? "1y";
  const requestedDateFrom = url.searchParams.get("dateFrom") ?? "";
  const requestedDateTo = url.searchParams.get("dateTo") ?? "";

  if (!requestedInstrumentId) {
    return NextResponse.json({ error: "Id do instrumento obrigatorio." }, { status: 400 });
  }

  const instrumentId = Number(requestedInstrumentId);

  if (!Number.isFinite(instrumentId) || instrumentId <= 0) {
    return NextResponse.json({ error: "Id do instrumento invalido." }, { status: 400 });
  }

  if (requestedDateFrom && !isValidIsoDate(requestedDateFrom)) {
    return NextResponse.json({ error: "Data inicial do filtro invalida." }, { status: 400 });
  }

  if (requestedDateTo && !isValidIsoDate(requestedDateTo)) {
    return NextResponse.json({ error: "Data final do filtro invalida." }, { status: 400 });
  }

  if (requestedDateFrom && requestedDateTo && requestedDateFrom > requestedDateTo) {
    return NextResponse.json(
      { error: "A data inicial nao pode ser maior que a data final." },
      { status: 400 }
    );
  }

  if (!requestedDateFrom && !requestedDateTo && !isCalibrationFilterPreset(requestedPeriod)) {
    return NextResponse.json({ error: "Periodo do filtro invalido." }, { status: 400 });
  }

  const activePeriod = (
    requestedDateFrom || requestedDateTo ? "1y" : requestedPeriod
  ) as CalibrationFilterPreset;
  const queryStartDate = requestedDateFrom || getCalibrationFilterStartDate(activePeriod);
  const queryEndDate = requestedDateTo || new Date().toISOString().slice(0, 10);

  let calibrationQuery = supabaseAdmin
    .schema("calibracao")
    .from("calibracoes")
    .select(calibrationSelectColumns)
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
    return NextResponse.json({ error: "Instrumento nao encontrado." }, { status: 404 });
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
  const instrument = mapInstrumentRow(instrumentResponse.data as InstrumentDbRow, categoriesById);
  const resultsByCalibrationId = mapResultsByCalibrationId(
    (calibrationResultsResponse.data ?? []) as CalibrationResultDbRow[]
  );
  const items = calibrationRows.map((row) =>
    mapCalibrationHistoryRow(row, resultsByCalibrationId.get(row.id) ?? [])
  );

  return NextResponse.json({
    instrument,
    items
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const instrumentId = Number(getFormValue(formData, "instrumentId"));
  const certificate = getFormValue(formData, "certificate");
  const laboratory = getFormValue(formData, "laboratory");
  const responsible = getFormValue(formData, "responsible");
  const status = getFormValue(formData, "status");
  const calibrationDate = getFormValue(formData, "calibrationDate");
  const certificateDate = getFormValue(formData, "certificateDate");
  const validityDate = getFormValue(formData, "validityDate");
  const observations = getFormValue(formData, "observations");
  const resultsJson = getFormValue(formData, "resultsJson");
  const certificateFile = getFormFile(formData, "certificateFile");

  if (!Number.isFinite(instrumentId) || instrumentId <= 0) {
    return buildCreateCalibrationError("Instrumento invalido.");
  }

  if (!certificate) {
    return buildCreateCalibrationError("Numero do certificado obrigatorio.");
  }

  if (!laboratory) {
    return buildCreateCalibrationError("Laboratorio obrigatorio.");
  }

  if (!responsible) {
    return buildCreateCalibrationError("Responsavel obrigatorio.");
  }

  if (!status || !isCalibrationStatusValue(status)) {
    return buildCreateCalibrationError("Status geral invalido.");
  }

  if (!calibrationDate || !isValidIsoDate(calibrationDate)) {
    return buildCreateCalibrationError("Data da calibracao obrigatoria.");
  }

  if (!certificateDate || !isValidIsoDate(certificateDate)) {
    return buildCreateCalibrationError("Data de emissao do certificado obrigatoria.");
  }

  if (!validityDate || !isValidIsoDate(validityDate)) {
    return buildCreateCalibrationError("Data da proxima calibracao obrigatoria.");
  }

  if (validityDate < calibrationDate) {
    return buildCreateCalibrationError(
      "A data da proxima calibracao nao pode ser menor que a data da calibracao."
    );
  }

  if (!certificateFile) {
    return buildCreateCalibrationError("Envie o certificado em PDF.");
  }

  if (!isPdfCertificateFile(certificateFile.name, certificateFile.type)) {
    return buildCreateCalibrationError("O certificado deve estar no formato PDF.");
  }

  if (certificateFile.size <= 0) {
    return buildCreateCalibrationError("O arquivo do certificado esta vazio.");
  }

  if (certificateFile.size > MAX_CALIBRATION_CERTIFICATE_FILE_SIZE) {
    return buildCreateCalibrationError("O certificado deve ter no maximo 10 MB.");
  }

  const instrumentDetailResponse = await loadInstrumentDetailForCalibration(instrumentId);

  if (instrumentDetailResponse.error) {
    if (isPermissionDenied(instrumentDetailResponse.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildCreateCalibrationGenericError();
  }

  if (!instrumentDetailResponse.item) {
    return buildCreateCalibrationError("Instrumento nao encontrado.", 404);
  }

  const validFieldIds = new Set(
    instrumentDetailResponse.item.fields
      .map((field) => field.dbId)
      .filter((fieldId): fieldId is number => typeof fieldId === "number")
  );
  const fieldMetaById = new Map(
    instrumentDetailResponse.item.fields
      .filter((field): field is typeof field & { dbId: number } => typeof field.dbId === "number")
      .map((field) => [
        field.dbId,
        {
          slug: field.slug,
          name: field.name,
          measurementName: field.measurementName || field.measurementRawName || ""
        }
      ] as const)
  );
  const parsedResults = parseSubmittedResults(resultsJson, validFieldIds);

  if ("error" in parsedResults) {
    return buildCreateCalibrationError(
      parsedResults.error ?? "Resultados da calibracao invalidos."
    );
  }

  const serializedObservations = serializeCalibrationRecord({
    notes: observations,
    fields: parsedResults.items.map((item) => {
      const fieldMeta = fieldMetaById.get(item.fieldId);

      return {
        fieldId: item.fieldId,
        fieldSlug: item.fieldSlug || fieldMeta?.slug || "",
        fieldName: item.fieldName || fieldMeta?.name || "",
        measurementName: item.measurementName || fieldMeta?.measurementName || "",
        value: item.value,
        unit: item.unit,
        confidence: item.confidence,
        evidence: item.evidence,
        status: item.status
      };
    })
  });

  const insertCalibrationResponse = await supabaseAdmin
    .schema("calibracao")
    .from("calibracoes")
    .insert({
      instrumento_id: instrumentId,
      data_calibracao: calibrationDate,
      data_emissao_certificado: certificateDate,
      data_validade: validityDate,
      certificado: certificate,
      laboratorio: laboratory,
      responsavel: responsible,
      status_geral: status,
      observacoes: serializedObservations || null,
      arquivo_certificado_url: null
    })
    .select(calibrationSelectColumns)
    .single();

  if (insertCalibrationResponse.error) {
    if (isPermissionDenied(insertCalibrationResponse.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildCreateCalibrationError("Nao foi possivel registrar a calibracao.", 500);
  }

  const insertedCalibration = insertCalibrationResponse.data as CalibrationDbRow;
  const storagePath = buildCalibrationCertificatePath({
    instrumentId,
    instrumentTag:
      normalizeText(instrumentDetailResponse.item.tag) || `instrumento-${instrumentId}`,
    calibrationId: insertedCalibration.id,
    fileName: certificateFile.name
  });
  const uploadResponse = await supabaseAdmin.storage
    .from(CALIBRATION_CERTIFICATE_BUCKET)
    .upload(storagePath, Buffer.from(await certificateFile.arrayBuffer()), {
      contentType: certificateFile.type || "application/pdf",
      upsert: false
    });

  if (uploadResponse.error) {
    await deleteCalibrationRecord(insertedCalibration.id);
    return buildUploadError();
  }

  const certificateUrlResponse = supabaseAdmin.storage
    .from(CALIBRATION_CERTIFICATE_BUCKET)
    .getPublicUrl(storagePath);
  const certificateUrl = normalizeText(certificateUrlResponse.data.publicUrl);

  if (!certificateUrl) {
    await removeUploadedCertificate(storagePath);
    await deleteCalibrationRecord(insertedCalibration.id);
    return buildUploadError();
  }

  const updateCalibrationResponse = await supabaseAdmin
    .schema("calibracao")
    .from("calibracoes")
    .update({
      arquivo_certificado_url: certificateUrl
    })
    .eq("id", insertedCalibration.id)
    .select(calibrationSelectColumns)
    .single();

  if (updateCalibrationResponse.error) {
    await removeUploadedCertificate(storagePath);
    await deleteCalibrationRecord(insertedCalibration.id);

    if (isPermissionDenied(updateCalibrationResponse.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildCreateCalibrationError("Nao foi possivel concluir o registro da calibracao.", 500);
  }

  const reviewResultsToInsert = parsedResults.items.filter((item) => item.conforme !== null);

  if (reviewResultsToInsert.length > 0) {
    const insertResultsResponse = await supabaseAdmin
      .schema("calibracao")
      .from("calibracao_resultados")
      .insert(
        reviewResultsToInsert.map((item) => ({
          calibracao_id: insertedCalibration.id,
          instrumento_campo_medicao_id: item.fieldId,
          conforme: item.conforme
        }))
      );

    if (insertResultsResponse.error) {
      await removeUploadedCertificate(storagePath);
      await deleteCalibrationRecord(insertedCalibration.id);

      if (isPermissionDenied(insertResultsResponse.error.message)) {
        return buildSchemaPermissionError();
      }

      return buildCreateCalibrationError(
        "Nao foi possivel salvar os resultados revisados da calibracao.",
        500
      );
    }
  }

  const updateInstrumentResponse = await supabaseAdmin
    .schema("calibracao")
    .from("instrumentos")
    .update({
      data_ultima_calibracao: calibrationDate,
      proxima_calibracao: validityDate
    })
    .eq("id", instrumentId);

  if (updateInstrumentResponse.error) {
    await removeUploadedCertificate(storagePath);
    await deleteCalibrationRecord(insertedCalibration.id);

    if (isPermissionDenied(updateInstrumentResponse.error.message)) {
      return buildSchemaPermissionError();
    }

    return buildCreateCalibrationError(
      "Nao foi possivel atualizar o prazo do instrumento.",
      500
    );
  }

  return NextResponse.json(
    {
      item: mapCalibrationHistoryRow(updateCalibrationResponse.data as CalibrationDbRow, [])
    },
    { status: 201 }
  );
}
