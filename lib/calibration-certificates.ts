const defaultCertificateBucket = "shiftapp-files";
const defaultCertificateFolder = "metrologia/calibracoes";

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function removeExtension(value: string) {
  return value.replace(/\.[a-z0-9]+$/i, "");
}

export const CALIBRATION_CERTIFICATE_BUCKET =
  process.env.SUPABASE_CALIBRATION_CERTIFICATE_BUCKET?.trim() || defaultCertificateBucket;

export const MAX_CALIBRATION_CERTIFICATE_FILE_SIZE = 10 * 1024 * 1024;

export function sanitizeStoragePathSegment(value: string) {
  const normalizedValue = normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedValue || "arquivo";
}

export function isPdfCertificateFile(fileName: string, mimeType?: string | null) {
  const normalizedMimeType = (mimeType ?? "").trim().toLowerCase();
  const normalizedFileName = fileName.trim().toLowerCase();

  return normalizedMimeType === "application/pdf" || normalizedFileName.endsWith(".pdf");
}

export function buildCalibrationCertificatePath(args: {
  instrumentId: number;
  instrumentTag: string;
  calibrationId: number;
  fileName: string;
}) {
  const folderPrefix =
    process.env.SUPABASE_CALIBRATION_CERTIFICATE_FOLDER?.trim().replace(/^\/+|\/+$/g, "") ||
    defaultCertificateFolder;
  const tagSegment =
    sanitizeStoragePathSegment(args.instrumentTag) || `instrumento-${args.instrumentId}`;
  const fileSegment = sanitizeStoragePathSegment(removeExtension(args.fileName));
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);

  return `${folderPrefix}/${tagSegment}/calibracao-${args.calibrationId}-${timestamp}-${fileSegment}.pdf`;
}

export function getCalibrationCertificateStoragePathFromUrl(url: string) {
  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    const publicPathPrefix = `/storage/v1/object/public/${CALIBRATION_CERTIFICATE_BUCKET}/`;

    if (!parsedUrl.pathname.startsWith(publicPathPrefix)) {
      return null;
    }

    const storagePath = parsedUrl.pathname.slice(publicPathPrefix.length);
    return storagePath ? decodeURIComponent(storagePath) : null;
  } catch {
    return null;
  }
}
