import { isValidIsoDate, parseValidIsoDate } from "@/lib/date-utils";
import {
  parseCalibrationRecord,
  type CalibrationStoredFieldEntry
} from "@/lib/calibration-records";
import { getRelativeCalibration, type InstrumentTone } from "@/lib/instruments";

export type CalibrationDbRow = {
  id: number;
  instrumento_id: number;
  data_calibracao: string;
  data_emissao_certificado: string | null;
  data_validade: string | null;
  certificado: string | null;
  laboratorio: string | null;
  responsavel: string | null;
  status_geral: string | null;
  observacoes: string | null;
  arquivo_certificado_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CalibrationResultDbRow = {
  id: number;
  calibracao_id: number;
  instrumento_campo_medicao_id: number;
  conforme: boolean | null;
  created_at: string;
};

export type CalibrationHistoryItem = {
  id: number;
  calibrationDate: string;
  calibrationDateValue: string;
  certificateDate: string;
  validityDate: string;
  validityDateValue?: string;
  certificate: string;
  laboratory: string;
  responsible: string;
  statusLabel: string;
  statusTone: InstrumentTone;
  observations: string;
  fieldEntries: CalibrationStoredFieldEntry[];
  certificateUrl: string | null;
  totalResults: number;
  conformingResults: number;
  nonConformingResults: number;
  createdAt: string;
};

export type CalibrationFilterPreset = "3m" | "6m" | "1y" | "3y" | "5y";

export const calibrationFilterOptions: Array<{
  value: CalibrationFilterPreset;
  label: string;
}> = [
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 ano" },
  { value: "3y", label: "3 anos" },
  { value: "5y", label: "5 anos" }
];

export const calibrationStatusOptions = [
  { value: "Aprovado", label: "Aprovado" },
  { value: "Em revisao", label: "Em revisao" },
  { value: "Perto de vencer", label: "Perto de vencer" },
  { value: "Reprovado", label: "Reprovado" }
] as const;

export type CalibrationStatusValue = (typeof calibrationStatusOptions)[number]["value"];

const shortMonthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function extractCertificateLabelFromUrl(value: string | null | undefined) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "";
  }

  const lastSegment = (() => {
    try {
      const parsedUrl = new URL(normalizedValue);
      return parsedUrl.pathname.split("/").pop() ?? "";
    } catch {
      return normalizedValue.split("/").pop() ?? "";
    }
  })();
  const decodedSegment = decodeURIComponent(lastSegment).split("?")[0].split("#")[0];

  return normalizeText(decodedSegment.replace(/^calibracao-\d+-\d{14}-/i, ""));
}

export function isCalibrationFilterPreset(value: string): value is CalibrationFilterPreset {
  return calibrationFilterOptions.some((option) => option.value === value);
}

export function isCalibrationStatusValue(value: string): value is CalibrationStatusValue {
  return calibrationStatusOptions.some((option) => option.value === value);
}

export function getCalibrationFilterStartDate(
  preset: CalibrationFilterPreset,
  referenceDate = new Date()
) {
  const nextDate = new Date(referenceDate);

  if (preset === "3m") {
    nextDate.setMonth(nextDate.getMonth() - 3);
  } else if (preset === "6m") {
    nextDate.setMonth(nextDate.getMonth() - 6);
  } else if (preset === "1y") {
    nextDate.setFullYear(nextDate.getFullYear() - 1);
  } else if (preset === "3y") {
    nextDate.setFullYear(nextDate.getFullYear() - 3);
  } else {
    nextDate.setFullYear(nextDate.getFullYear() - 5);
  }

  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(
    nextDate.getDate()
  ).padStart(2, "0")}`;
}

function formatDateShort(value: string | null | undefined) {
  const normalizedValue = normalizeText(value);
  const parsedDate = parseValidIsoDate(normalizedValue);

  if (!parsedDate) {
    return "Não informado";
  }

  return `${String(parsedDate.getDate()).padStart(2, "0")} ${shortMonthNames[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`;
}

function formatDateTimeLabel(value: string | null | undefined) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "Não informado";
  }

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getStatusToneFromLabel(value: string) {
  const normalizedValue = stripDiacritics(normalizeText(value).toLowerCase());

  if (!normalizedValue) {
    return null;
  }

  if (
    normalizedValue.includes("reprov") ||
    normalizedValue.includes("nao conforme") ||
    normalizedValue.includes("nao-conforme") ||
    normalizedValue.includes("venc")
  ) {
    return "danger" as const;
  }

  if (
    normalizedValue.includes("pend") ||
    normalizedValue.includes("revis") ||
    normalizedValue.includes("aguard") ||
    normalizedValue.includes("atenc")
  ) {
    return "warning" as const;
  }

  if (
    normalizedValue.includes("aprov") ||
    normalizedValue.includes("conforme") ||
    normalizedValue.includes("ok")
  ) {
    return "neutral" as const;
  }

  return null;
}

function deriveStatus(
  row: CalibrationDbRow,
  results: CalibrationResultDbRow[],
  parsedResults?: {
    totalResults: number;
    conformingResults: number;
    nonConformingResults: number;
  }
) {
  const explicitStatus = normalizeText(row.status_geral);
  const explicitTone = getStatusToneFromLabel(explicitStatus);

  if (explicitStatus && explicitTone) {
    return {
      statusLabel: explicitStatus,
      statusTone: explicitTone
    };
  }

  const hasParsedResults = Boolean(parsedResults && parsedResults.totalResults > 0);
  const totalResults = hasParsedResults ? parsedResults?.totalResults ?? 0 : results.length;
  const nonConformingResults = hasParsedResults
    ? parsedResults?.nonConformingResults ?? 0
    : results.filter((item) => item.conforme === false).length;
  const conformingResults = hasParsedResults
    ? parsedResults?.conformingResults ?? 0
    : results.filter((item) => item.conforme === true).length;

  if (totalResults > 0) {
    if (nonConformingResults > 0) {
      return {
        statusLabel: explicitStatus || "Reprovado",
        statusTone: "danger" as const
      };
    }

    if (conformingResults === totalResults) {
      return {
        statusLabel: explicitStatus || "Aprovado",
        statusTone: "neutral" as const
      };
    }
  }

  if (row.data_validade) {
    const relativeStatus = getRelativeCalibration(row.data_validade);

    if (relativeStatus.tone === "danger") {
      return {
        statusLabel: explicitStatus || "Vencido",
        statusTone: "danger" as const
      };
    }

    if (relativeStatus.tone === "warning") {
      return {
        statusLabel: explicitStatus || "Perto de vencer",
        statusTone: "warning" as const
      };
    }
  }

  return {
    statusLabel: explicitStatus || "Em revisão",
    statusTone: explicitTone ?? ("warning" as const)
  };
}

export function mapCalibrationHistoryRow(
  row: CalibrationDbRow,
  results: CalibrationResultDbRow[]
): CalibrationHistoryItem {
  const parsedRecord = parseCalibrationRecord(row.observacoes);
  const parsedConformingResults = parsedRecord.fields.filter(
    (item) => item.status === "conforming"
  ).length;
  const parsedNonConformingResults = parsedRecord.fields.filter(
    (item) => item.status === "non_conforming"
  ).length;
  const parsedTotalResults = parsedConformingResults + parsedNonConformingResults;
  const totalResults = parsedTotalResults || results.length;
  const conformingResults =
    parsedTotalResults > 0
      ? parsedConformingResults
      : results.filter((item) => item.conforme === true).length;
  const nonConformingResults =
    parsedTotalResults > 0
      ? parsedNonConformingResults
      : results.filter((item) => item.conforme === false).length;
  const status = deriveStatus(row, results, {
    totalResults,
    conformingResults,
    nonConformingResults
  });

  return {
    id: row.id,
    calibrationDate: formatDateShort(row.data_calibracao),
    calibrationDateValue: row.data_calibracao,
    certificateDate: formatDateShort(row.data_emissao_certificado),
    validityDate: formatDateShort(row.data_validade),
    validityDateValue: row.data_validade ?? undefined,
    certificate:
      normalizeText(row.certificado) ||
      extractCertificateLabelFromUrl(row.arquivo_certificado_url) ||
      `Registro #${row.id}`,
    laboratory: normalizeText(row.laboratorio) || "Não informado",
    responsible: normalizeText(row.responsavel) || "Não informado",
    statusLabel: status.statusLabel,
    statusTone: status.statusTone,
    observations: parsedRecord.notes,
    fieldEntries: parsedRecord.fields,
    certificateUrl: normalizeText(row.arquivo_certificado_url) || null,
    totalResults,
    conformingResults,
    nonConformingResults,
    createdAt: formatDateTimeLabel(row.created_at)
  };
}
