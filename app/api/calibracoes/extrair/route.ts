import { NextResponse } from "next/server";
import {
  ApiError,
  FileState,
  GoogleGenAI,
  createPartFromUri,
  createUserContent
} from "@google/genai";
import {
  buildCalibrationExtractionPrompt,
  buildCalibrationExtractionSchema,
  defaultCalibrationExtractionModel,
  normalizeCalibrationExtractionResult
} from "@/lib/calibration-extraction";
import {
  MAX_CALIBRATION_CERTIFICATE_FILE_SIZE,
  isPdfCertificateFile
} from "@/lib/calibration-certificates";
import {
  serializeMeasurementFieldSlug,
  type MeasurementFieldItem
} from "@/lib/measurement-fields";
import { loadInstrumentDetailForCalibration } from "@/lib/server/instrument-details";

export const dynamic = "force-dynamic";

type FetchError = Error & {
  cause?: {
    code?: string;
    message?: string;
  };
};

const geminiFileProcessingPollMs = 1_000;
const geminiFileProcessingTimeoutMs = 60_000;

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? normalizeText(value) : "";
}

function getFormFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value && typeof value !== "string" ? value : null;
}

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseManualExtractionFields(rawValue: string) {
  if (!rawValue) {
    return { error: "Defina os campos do instrumento antes de usar a extracao por IA." };
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Array<{
      name?: unknown;
      measurementName?: unknown;
      measurementRawName?: unknown;
    }>;

    if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
      return { error: "Defina os campos do instrumento antes de usar a extracao por IA." };
    }

    const seenSlugs = new Set<string>();
    const fields: MeasurementFieldItem[] = [];

    for (const [index, item] of parsedValue.entries()) {
      const name = normalizeText(typeof item.name === "string" ? item.name : "");
      const slug = serializeMeasurementFieldSlug(name);
      const measurementName = normalizeText(
        typeof item.measurementName === "string" ? item.measurementName : ""
      );
      const measurementRawName = normalizeText(
        typeof item.measurementRawName === "string" ? item.measurementRawName : ""
      );

      if (!name || !slug || seenSlugs.has(slug)) {
        return {
          error: "Revise os campos do instrumento antes de usar a extracao por IA."
        };
      }

      seenSlugs.add(slug);
      fields.push({
        dbId: index + 1,
        name,
        slug,
        measurementId: "",
        measurementName,
        measurementRawName,
        valueType: "numero",
        order: index
      });
    }

    return { fields };
  } catch {
    return { error: "Nao foi possivel ler os campos informados para a extracao por IA." };
  }
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || "";
}

function getGeminiErrorMessage(error: unknown) {
  const apiError = error as ApiError | null;
  const fetchError = error as FetchError | null;
  const causeCode = fetchError?.cause?.code ?? "";
  const rawMessage = normalizeText(fetchError?.message);

  if (causeCode === "SELF_SIGNED_CERT_IN_CHAIN") {
    return "A conexao com a Gemini foi bloqueada pelo certificado HTTPS da rede local. Configure a cadeia de certificados da maquina ou use um trust store valido para liberar a chamada.";
  }

  if (typeof apiError?.status === "number") {
    if (apiError.status === 400) {
      return rawMessage || "A Gemini nao conseguiu interpretar esse certificado.";
    }

    if (apiError.status === 401 || apiError.status === 403) {
      return "A chave da Gemini foi recusada. Revise GEMINI_API_KEY e as permissoes no Google AI Studio.";
    }

    if (apiError.status === 429 || /quota|resource exhausted|billing/i.test(rawMessage)) {
      return "A cota da Gemini foi atingida. Revise o plano e os limites da chave usada para a extracao.";
    }
  }

  return rawMessage || "Nao foi possivel se comunicar com a Gemini.";
}

function getGeminiErrorStatus(error: unknown) {
  const apiError = error as ApiError | null;

  if (typeof apiError?.status === "number") {
    if (apiError.status === 429) {
      return 429;
    }

    return 502;
  }

  return 502;
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function waitForGeminiFileReady(ai: GoogleGenAI, fileName: string) {
  const startedAt = Date.now();
  let uploadedFile = await ai.files.get({ name: fileName });

  while (
    uploadedFile.state === FileState.PROCESSING &&
    Date.now() - startedAt < geminiFileProcessingTimeoutMs
  ) {
    await sleep(geminiFileProcessingPollMs);
    uploadedFile = await ai.files.get({ name: fileName });
  }

  if (uploadedFile.state === FileState.FAILED) {
    throw new Error(
      normalizeText(uploadedFile.error?.message) ||
        "A Gemini nao conseguiu processar o PDF enviado."
    );
  }

  if (uploadedFile.state === FileState.PROCESSING) {
    throw new Error("A Gemini demorou mais do que o esperado para processar o PDF.");
  }

  return uploadedFile;
}

async function deleteGeminiFile(ai: GoogleGenAI, fileName: string) {
  try {
    await ai.files.delete({ name: fileName });
  } catch {
    // Ignore cleanup failures.
  }
}

export async function POST(request: Request) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return buildError("Defina GEMINI_API_KEY para habilitar a extracao por IA.", 503);
  }

  const formData = await request.formData();
  const instrumentId = Number(getFormValue(formData, "instrumentId"));
  const instrumentTag = getFormValue(formData, "instrumentTag");
  const category = getFormValue(formData, "category");
  const manualFieldsJson = getFormValue(formData, "fieldsJson");
  const certificateFile = getFormFile(formData, "certificateFile");

  if (!certificateFile) {
    return buildError("Envie o certificado em PDF.");
  }

  if (!isPdfCertificateFile(certificateFile.name, certificateFile.type)) {
    return buildError("O certificado deve estar no formato PDF.");
  }

  if (certificateFile.size <= 0) {
    return buildError("O arquivo do certificado esta vazio.");
  }

  if (certificateFile.size > MAX_CALIBRATION_CERTIFICATE_FILE_SIZE) {
    return buildError("O certificado deve ter no maximo 10 MB.");
  }

  let extractionFields: MeasurementFieldItem[] = [];
  let extractionTarget = {
    id: Number.isFinite(instrumentId) && instrumentId > 0 ? instrumentId : null,
    tag: instrumentTag || "Novo instrumento",
    category: category || "Sem categoria"
  };

  if (Number.isFinite(instrumentId) && instrumentId > 0) {
    const instrumentDetailResponse = await loadInstrumentDetailForCalibration(instrumentId);

    if (instrumentDetailResponse.error) {
      return buildError("Nao foi possivel carregar os campos do instrumento.", 500);
    }

    if (!instrumentDetailResponse.item) {
      return buildError("Instrumento nao encontrado.", 404);
    }

    extractionFields = instrumentDetailResponse.item.fields.filter(
      (field): field is typeof field & { dbId: number } => typeof field.dbId === "number"
    );
    extractionTarget = {
      id: instrumentId,
      tag: instrumentDetailResponse.item.tag,
      category: instrumentDetailResponse.item.category
    };
  } else {
    const parsedManualFields = parseManualExtractionFields(manualFieldsJson);

    if ("error" in parsedManualFields) {
      return buildError(parsedManualFields.error ?? "Campos invalidos para extracao.");
    }

    extractionFields = parsedManualFields.fields;
  }

  if (extractionFields.length === 0) {
    return buildError(
      "Esse instrumento nao possui campos configurados para receber a extracao por IA."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  let uploadedFileName = "";

  try {
    const extractionSchema = buildCalibrationExtractionSchema(extractionFields);
    const extractionPrompt = buildCalibrationExtractionPrompt({
      instrumentTag: extractionTarget.tag,
      category: extractionTarget.category,
      fields: extractionFields
    });

    const uploadedFile = await ai.files.upload({
      file: certificateFile,
      config: {
        mimeType: "application/pdf",
        displayName: certificateFile.name
      }
    });
    uploadedFileName = uploadedFile.name ?? "";

    if (!uploadedFileName) {
      return buildError("A Gemini nao retornou um identificador valido para o PDF enviado.", 502);
    }

    const readyFile = await waitForGeminiFileReady(ai, uploadedFileName);

    if (!readyFile.uri) {
      return buildError("A Gemini nao retornou um arquivo utilizavel para leitura.", 502);
    }

    const response = await ai.models.generateContent({
      model: defaultCalibrationExtractionModel,
      contents: createUserContent([
        extractionPrompt,
        createPartFromUri(readyFile.uri, readyFile.mimeType || "application/pdf")
      ]),
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: extractionSchema
      }
    });

    if (!response.text?.trim()) {
      return buildError("A Gemini nao retornou dados estruturados para este certificado.", 502);
    }

    const parsedPayload = JSON.parse(response.text) as Parameters<
      typeof normalizeCalibrationExtractionResult
    >[0];
    const extraction = normalizeCalibrationExtractionResult(parsedPayload, extractionFields);

    return NextResponse.json({
      instrument: {
        id: extractionTarget.id,
        tag: extractionTarget.tag,
        category: extractionTarget.category
      },
      extraction
    });
  } catch (error) {
    return buildError(getGeminiErrorMessage(error), getGeminiErrorStatus(error));
  } finally {
    if (uploadedFileName) {
      await deleteGeminiFile(ai, uploadedFileName);
    }
  }
}
