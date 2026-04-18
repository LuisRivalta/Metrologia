import { describe, expect, it } from "vitest";

import {
  buildCalibrationCertificatePath,
  getCalibrationCertificateStoragePathFromUrl,
  isPdfCertificateFile,
  sanitizeStoragePathSegment
} from "@/lib/calibration-certificates";

describe("calibration-certificates", () => {
  it("sanitizes tags into storage friendly segments", () => {
    expect(sanitizeStoragePathSegment(" DI-048 / Paquimetro Digital ")).toBe(
      "di-048-paquimetro-digital"
    );
  });

  it("accepts pdf files by mime type or extension", () => {
    expect(isPdfCertificateFile("certificado.pdf", "application/pdf")).toBe(true);
    expect(isPdfCertificateFile("certificado.PDF", "")).toBe(true);
    expect(isPdfCertificateFile("certificado.png", "image/png")).toBe(false);
  });

  it("builds a stable path inside the calibration folder", () => {
    const nextPath = buildCalibrationCertificatePath({
      instrumentId: 12,
      instrumentTag: "DI-048",
      calibrationId: 55,
      fileName: "Certificado Final.pdf"
    });

    expect(nextPath).toMatch(/^metrologia\/calibracoes\/di-048\/calibracao-55-\d{14}-certificado-final\.pdf$/);
  });
});

describe("getCalibrationCertificateStoragePathFromUrl", () => {
  const bucket = "shiftapp-files";

  it("extrai o storage path de uma URL valida", () => {
    const url = `https://cdn.example.com/storage/v1/object/public/${bucket}/metrologia/calibracoes/paq/calibracao-1-20260418120000-cert.pdf`;

    expect(getCalibrationCertificateStoragePathFromUrl(url)).toBe(
      "metrologia/calibracoes/paq/calibracao-1-20260418120000-cert.pdf"
    );
  });

  it("retorna null para URL de outro bucket", () => {
    const url = "https://cdn.example.com/storage/v1/object/public/outro-bucket/arquivo.pdf";

    expect(getCalibrationCertificateStoragePathFromUrl(url)).toBeNull();
  });

  it("retorna null para string vazia", () => {
    expect(getCalibrationCertificateStoragePathFromUrl("")).toBeNull();
  });

  it("retorna null para URL malformada", () => {
    expect(getCalibrationCertificateStoragePathFromUrl("nao-e-uma-url")).toBeNull();
  });
});

describe("isPdfCertificateFile (enhanced)", () => {
  it("aceita arquivo com mime type correto", () => {
    expect(isPdfCertificateFile("qualquer.txt", "application/pdf")).toBe(true);
  });

  it("aceita arquivo com extensao .pdf sem mime type", () => {
    expect(isPdfCertificateFile("certificado.pdf")).toBe(true);
  });

  it("rejeita arquivo sem extensao pdf e sem mime type correto", () => {
    expect(isPdfCertificateFile("imagem.png", "image/png")).toBe(false);
  });
});
