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

  it("ignora campos com fieldId invalido ao parsear registro estruturado", () => {
    const raw =
      "[[METROLOGIA_CALIBRATION_DATA]]\n" +
      '{"version":1,"fields":[{"fieldId":0,"fieldSlug":"x","fieldName":"X","value":"1","unit":"","status":"unknown","confidence":null,"evidence":""}]}\n' +
      "[[/METROLOGIA_CALIBRATION_DATA]]";
    expect(parseCalibrationRecord(raw).fields).toHaveLength(0);
  });

  it("retorna texto puro quando end marker aparece imediatamente apos start marker", () => {
    const raw = "[[METROLOGIA_CALIBRATION_DATA]][[/METROLOGIA_CALIBRATION_DATA]]";
    const parsed = parseCalibrationRecord(raw);
    expect(parsed.fields).toHaveLength(0);
    expect(parsed.notes).toBe("[[METROLOGIA_CALIBRATION_DATA]][[/METROLOGIA_CALIBRATION_DATA]]");
  });

  it("clampeia confidence para 0 quando valor e negativo ou zero", () => {
    const serialized = serializeCalibrationRecord({
      fields: [{ fieldId: 1, fieldSlug: "x", fieldName: "X", value: "1", unit: "", status: "unknown", confidence: -0.5, evidence: "" }]
    });
    const parsed = parseCalibrationRecord(serialized);
    expect(parsed.fields[0].confidence).toBe(0);
  });

  it("clampeia confidence para 1 quando valor e maior que 1", () => {
    const serialized = serializeCalibrationRecord({
      fields: [{ fieldId: 1, fieldSlug: "x", fieldName: "X", value: "1", unit: "", status: "unknown", confidence: 1.5, evidence: "" }]
    });
    const parsed = parseCalibrationRecord(serialized);
    expect(parsed.fields[0].confidence).toBe(1);
  });

  it("omite nota de rodape na serializacao quando notes e vazia", () => {
    const serialized = serializeCalibrationRecord({
      notes: "",
      fields: [{ fieldId: 1, fieldSlug: "slug", fieldName: "Nome", value: "1", unit: "", status: "unknown", confidence: null, evidence: "" }]
    });
    const parsed = parseCalibrationRecord(serialized);
    expect(parsed.notes).toBe("");
    expect(parsed.fields).toHaveLength(1);
  });

  it("retorna campos vazios quando payload tem fields nao-array", () => {
    const raw =
      "[[METROLOGIA_CALIBRATION_DATA]]\n" +
      '{"version":1,"fields":null}\n' +
      "[[/METROLOGIA_CALIBRATION_DATA]]";
    expect(parseCalibrationRecord(raw).fields).toHaveLength(0);
  });

  it("descarta campo totalmente vazio na serializacao", () => {
    const serialized = serializeCalibrationRecord({
      notes: "obs",
      fields: [
        { fieldId: 1, fieldSlug: "a", fieldName: "A", value: "", unit: "", status: "unknown", confidence: null, evidence: "" },
        { fieldId: 2, fieldSlug: "b", fieldName: "B", value: "1", unit: "", status: "unknown", confidence: null, evidence: "" }
      ]
    });
    const parsed = parseCalibrationRecord(serialized);
    expect(parsed.fields).toHaveLength(1);
    expect(parsed.fields[0].fieldSlug).toBe("b");
  });

  it("retorna texto puro e campos vazios quando JSON dentro dos marcadores e invalido", () => {
    const raw =
      "[[METROLOGIA_CALIBRATION_DATA]]\njson invalido aqui\n[[/METROLOGIA_CALIBRATION_DATA]]";
    const parsed = parseCalibrationRecord(raw);
    expect(parsed.fields).toHaveLength(0);
    expect(parsed.notes).toContain("METROLOGIA_CALIBRATION_DATA");
  });
});
