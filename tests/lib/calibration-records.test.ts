import { describe, expect, it } from "vitest";

import {
  parseCalibrationRecord,
  serializeCalibrationRecord
} from "@/lib/calibration-records";

describe("calibration-records", () => {
  it("serializes notes only when no field data is present", () => {
    expect(
      serializeCalibrationRecord({
        notes: "  observacao simples  ",
        fields: []
      })
    ).toBe("observacao simples");
  });

  it("serializes structured field values and recovers them from observations", () => {
    const serialized = serializeCalibrationRecord({
      notes: "Primeira calibracao do instrumento",
      fields: [
        {
          fieldId: 11,
          fieldSlug: "incerteza",
          fieldName: "Incerteza",
          measurementName: "V",
          value: "0,005",
          unit: "V",
          status: "conforming",
          confidence: 0.92,
          evidence: "Pagina 2, linha 4"
        },
        {
          fieldId: 12,
          fieldSlug: "erro-medicao",
          fieldName: "Erro de medicao",
          measurementName: "V",
          value: "0,010",
          unit: "V",
          status: "unknown",
          confidence: null,
          evidence: ""
        }
      ]
    });

    const parsed = parseCalibrationRecord(serialized);

    expect(parsed.notes).toBe("Primeira calibracao do instrumento");
    expect(parsed.fields).toEqual([
      {
        fieldId: 11,
        fieldSlug: "incerteza",
        fieldName: "Incerteza",
        measurementName: "V",
        value: "0,005",
        unit: "V",
        status: "conforming",
        confidence: 0.92,
        evidence: "Pagina 2, linha 4"
      },
      {
        fieldId: 12,
        fieldSlug: "erro-medicao",
        fieldName: "Erro de medicao",
        measurementName: "V",
        value: "0,010",
        unit: "V",
        status: "unknown",
        confidence: null,
        evidence: ""
      }
    ]);
  });

  it("returns plain notes when the payload markers are not present", () => {
    expect(parseCalibrationRecord("   observacao livre   ")).toEqual({
      notes: "observacao livre",
      fields: []
    });
  });
});
