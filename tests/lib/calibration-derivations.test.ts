import { describe, expect, it } from "vitest";

import {
  applyCalibrationDerivedValues,
  isAutoCalculatedCalibrationField
} from "@/lib/calibration-derivations";
import { serializeMeasurementFieldSlug } from "@/lib/measurement-fields";

describe("calibration-derivations", () => {
  it("auto calculates the paquimetro sum fields", () => {
    const rows = applyCalibrationDerivedValues("Paquimetro", [
      {
        fieldSlug: serializeMeasurementFieldSlug("Maior erro externo"),
        value: "0,010",
        unit: "",
        confidence: null,
        evidence: ""
      },
      {
        fieldSlug: serializeMeasurementFieldSlug("Incerteza de medicao externo"),
        value: "0,005",
        unit: "",
        confidence: null,
        evidence: ""
      },
      {
        fieldSlug: serializeMeasurementFieldSlug("Incerteza + maior Erro externo"),
        value: "",
        unit: "mm",
        confidence: 0.9,
        evidence: "ia"
      }
    ]);

    expect(rows[2]).toMatchObject({
      value: "0,015",
      unit: "",
      confidence: null,
      evidence: ""
    });
  });

  it("clears derived fields when one source value is missing", () => {
    const rows = applyCalibrationDerivedValues("Paquimetro", [
      {
        fieldSlug: serializeMeasurementFieldSlug("Maior erro profundidade"),
        value: "0,02"
      },
      {
        fieldSlug: serializeMeasurementFieldSlug("Incerteza de medicao profundidade"),
        value: ""
      },
      {
        fieldSlug: serializeMeasurementFieldSlug("Incerteza + maior Erro profundidade"),
        value: "0,03"
      }
    ]);

    expect(rows[2].value).toBe("");
  });

  it("auto calculates the paquimetro sum field for ressalto", () => {
    const rows = applyCalibrationDerivedValues("Paquimetro", [
      {
        fieldSlug: serializeMeasurementFieldSlug("Maior erro ressalto"),
        value: "0,020",
        unit: "",
        confidence: null,
        evidence: ""
      },
      {
        fieldSlug: serializeMeasurementFieldSlug("Incerteza de medicao ressalto"),
        value: "0,005",
        unit: "",
        confidence: null,
        evidence: ""
      },
      {
        fieldSlug: serializeMeasurementFieldSlug("Incerteza + maior Erro ressalto"),
        value: "",
        unit: "",
        confidence: null,
        evidence: ""
      }
    ]);

    expect(rows[2].value).toBe("0,025");
  });

  it("identifies derived paquimetro fields", () => {
    expect(
      isAutoCalculatedCalibrationField(
        "Paquimetro",
        serializeMeasurementFieldSlug("Incerteza + maior Erro interno")
      )
    ).toBe(true);
    expect(
      isAutoCalculatedCalibrationField(
        "Paquimetro",
        serializeMeasurementFieldSlug("Incerteza + maior Erro ressalto")
      )
    ).toBe(true);
    expect(
      isAutoCalculatedCalibrationField("Paquimetro", serializeMeasurementFieldSlug("Maior erro interno"))
    ).toBe(false);
  });
});
