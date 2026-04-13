import { describe, expect, it } from "vitest";

import {
  buildCalibrationCertificatePath,
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
