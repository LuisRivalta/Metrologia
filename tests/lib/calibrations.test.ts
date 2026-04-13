import { describe, expect, it } from "vitest";

import { mapCalibrationHistoryRow, type CalibrationDbRow } from "@/lib/calibrations";
import { serializeCalibrationRecord } from "@/lib/calibration-records";

function createCalibrationRow(overrides: Partial<CalibrationDbRow> = {}): CalibrationDbRow {
  return {
    id: 17,
    instrumento_id: 9,
    data_calibracao: "2026-04-10",
    data_emissao_certificado: null,
    data_validade: null,
    certificado: null,
    laboratorio: null,
    responsavel: null,
    status_geral: null,
    observacoes: null,
    arquivo_certificado_url: null,
    created_at: "2026-04-10T15:30:00.000Z",
    updated_at: "2026-04-10T15:30:00.000Z",
    ...overrides
  };
}

describe("calibrations", () => {
  it("uses readable fallback labels when optional metadata is missing", () => {
    const item = mapCalibrationHistoryRow(createCalibrationRow(), []);

    expect(item.certificate).toBe("Registro #17");
    expect(item.certificateDate).toBe("Não informado");
    expect(item.validityDate).toBe("Não informado");
    expect(item.laboratory).toBe("Não informado");
    expect(item.responsible).toBe("Não informado");
    expect(item.statusLabel).toBe("Em revisão");
  });

  it("derives the certificate label from the uploaded file name when needed", () => {
    const item = mapCalibrationHistoryRow(
      createCalibrationRow({
        arquivo_certificado_url:
          "https://cdn.exemplo.com/storage/v1/object/public/shiftapp-files/metrologia/calibracoes/paquimetro/calibracao-17-20260410153000-pi-361-temp.pdf?download=1"
      }),
      []
    );

    expect(item.certificate).toBe("pi-361-temp.pdf");
  });

  it("derives a failing status from serialized field results when database results are absent", () => {
    const item = mapCalibrationHistoryRow(
      createCalibrationRow({
        observacoes: serializeCalibrationRecord({
          notes: "Calibracao importada",
          fields: [
            {
              fieldId: 1,
              fieldSlug: "maior-erro",
              fieldName: "Maior erro",
              measurementName: "mm",
              value: "0,02",
              unit: "mm",
              status: "non_conforming",
              confidence: null,
              evidence: ""
            }
          ]
        })
      }),
      []
    );

    expect(item.statusLabel).toBe("Reprovado");
    expect(item.statusTone).toBe("danger");
  });
});
