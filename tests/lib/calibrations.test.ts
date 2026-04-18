import { describe, expect, it } from "vitest";

import {
  getCalibrationFilterStartDate,
  isCalibrationFilterPreset,
  isCalibrationStatusValue,
  mapCalibrationHistoryRow,
  type CalibrationDbRow,
  type CalibrationResultDbRow
} from "@/lib/calibrations";
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

  it("calcula data de inicio do filtro para cada preset", () => {
    const ref = new Date(2026, 3, 18); // 2026-04-18

    expect(getCalibrationFilterStartDate("3m", ref)).toBe("2026-01-18");
    expect(getCalibrationFilterStartDate("6m", ref)).toBe("2025-10-18");
    expect(getCalibrationFilterStartDate("1y", ref)).toBe("2025-04-18");
    expect(getCalibrationFilterStartDate("3y", ref)).toBe("2023-04-18");
    expect(getCalibrationFilterStartDate("5y", ref)).toBe("2021-04-18");
  });

  it("valida preset de filtro corretamente", () => {
    expect(isCalibrationFilterPreset("3m")).toBe(true);
    expect(isCalibrationFilterPreset("2y")).toBe(false);
    expect(isCalibrationFilterPreset("")).toBe(false);
  });

  it("valida status de calibracao corretamente", () => {
    expect(isCalibrationStatusValue("Aprovado")).toBe(true);
    expect(isCalibrationStatusValue("Reprovado")).toBe(true);
    expect(isCalibrationStatusValue("invalido")).toBe(false);
  });

  it("deriva status danger quando data de validade esta vencida", () => {
    const item = mapCalibrationHistoryRow(
      createCalibrationRow({ data_validade: "2025-01-01" }),
      []
    );

    expect(item.statusTone).toBe("danger");
    expect(item.statusLabel).toBe("Vencido");
  });

  it("deriva status warning quando data de validade esta proxima", () => {
    const item = mapCalibrationHistoryRow(
      createCalibrationRow({ data_validade: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10) }),
      []
    );

    expect(item.statusTone).toBe("warning");
  });

  it("usa status explicitamente gravado no banco quando presente", () => {
    const item = mapCalibrationHistoryRow(
      createCalibrationRow({ status_geral: "Aprovado" }),
      []
    );

    expect(item.statusLabel).toBe("Aprovado");
    expect(item.statusTone).toBe("neutral");
  });

  it("usa resultados do banco quando observacoes nao tem payload estruturado", () => {
    const results: CalibrationResultDbRow[] = [
      { id: 1, calibracao_id: 17, instrumento_campo_medicao_id: 5, conforme: true, created_at: "" },
      { id: 2, calibracao_id: 17, instrumento_campo_medicao_id: 6, conforme: false, created_at: "" }
    ];

    const item = mapCalibrationHistoryRow(createCalibrationRow({ observacoes: "Texto livre" }), results);

    expect(item.totalResults).toBe(2);
    expect(item.conformingResults).toBe(1);
    expect(item.nonConformingResults).toBe(1);
    expect(item.statusTone).toBe("danger");
  });
});
