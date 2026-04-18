import { describe, expect, it } from "vitest";

import {
  buildInstrumentDisplayTag,
  formatInstrumentAlertNote,
  formatInstrumentCalibration,
  getRelativeCalibration,
  mergeInstrumentFieldsWithLatestCalibration,
  mapInstrumentRow
} from "@/lib/instruments";
import { serializeMeasurementFieldSlug } from "@/lib/measurement-fields";

const referenceDate = new Date(2026, 3, 1);

describe("instruments", () => {
  it("builds a human friendly tag from the category slug", () => {
    expect(buildInstrumentDisplayTag(7, "medidor-pressao", "Medidor de Pressao")).toBe("MP-007");
  });

  it("classifies near due calibrations as warning", () => {
    expect(getRelativeCalibration("2026-04-20", referenceDate)).toEqual({
      tone: "warning",
      diffInDays: 19,
      description: "Vence em 19 dias"
    });
  });

  it("flags invalid calibration dates before they reach the UI", () => {
    expect(formatInstrumentCalibration("2026-02-31", referenceDate)).toEqual({
      calibration: "Data invalida (2026-02-31)",
      tone: "danger",
      diffInDays: Number.MIN_SAFE_INTEGER
    });
  });

  it("regenerates instrument tags when the stored tag is just a UUID", () => {
    const categoriesById = new Map([
      [
        3,
        {
          id: 3,
          nome: "Medidor de Pressao",
          slug: "medidor-pressao"
        }
      ]
    ]);

    expect(
      mapInstrumentRow(
        {
          id: 12,
          tag: "550e8400-e29b-41d4-a716-446655440000",
          categoria_id: 3,
          fabricante: "Mitutoyo",
          data_ultima_calibracao: null,
          proxima_calibracao: "2026-04-20"
        },
        categoriesById,
        referenceDate
      )
    ).toMatchObject({
      id: 12,
      tag: "MP-012",
      category: "Medidor de Pressao",
      manufacturer: "Mitutoyo",
      tone: "warning",
      diffInDays: 19,
      calibrationDateValue: "2026-04-20"
    });
  });

  it("merges the latest calibration values into instrument fields", () => {
    const rows = mergeInstrumentFieldsWithLatestCalibration(
      [
        {
          dbId: 11,
          name: "Maior erro externo",
          slug: serializeMeasurementFieldSlug("Maior erro externo"),
          measurementId: "1",
          measurementName: "mm",
          measurementRawName: "mm",
          valueType: "numero",
          order: 0
        },
        {
          dbId: 12,
          name: "Incerteza de medicao externo",
          slug: serializeMeasurementFieldSlug("Incerteza de medicao externo"),
          measurementId: "1",
          measurementName: "mm",
          measurementRawName: "mm",
          valueType: "numero",
          order: 1
        }
      ],
      [
        {
          fieldId: 11,
          fieldSlug: serializeMeasurementFieldSlug("Maior erro externo"),
          fieldName: "Maior erro externo",
          measurementName: "mm",
          value: "0,03",
          unit: "mm",
          status: "unknown",
          confidence: null,
          evidence: ""
        }
      ]
    );

    expect(rows).toEqual([
      expect.objectContaining({
        name: "Maior erro externo",
        latestValue: "0,03",
        latestUnit: "mm",
        hasLatestValue: true
      }),
      expect.objectContaining({
        name: "Incerteza de medicao externo",
        latestValue: "",
        latestUnit: "mm",
        hasLatestValue: false
      })
    ]);
  });

  it("descreve calibracao futura distante em meses", () => {
    expect(getRelativeCalibration("2026-08-01", referenceDate)).toEqual({
      tone: "neutral",
      diffInDays: 122,
      description: "Vence em 5 meses"
    });
  });

  it("trata data nula em formatInstrumentCalibration como sem prazo", () => {
    expect(formatInstrumentCalibration(null, referenceDate)).toEqual({
      calibration: "Sem prazo definido",
      tone: "neutral",
      diffInDays: 0
    });
  });

  it("formata nota de alerta para instrumento sem data de calibracao", () => {
    expect(formatInstrumentAlertNote(null, 0)).toBe("Sem prazo de calibração definido");
  });

  it("formata nota de alerta para instrumento vencido", () => {
    expect(formatInstrumentAlertNote("2026-03-15", -17)).toBe(
      "Vencido há 17 dias - calibração 15/03/2026"
    );
  });

  it("formata nota de alerta no singular para instrumento vencido ha 1 dia", () => {
    expect(formatInstrumentAlertNote("2026-03-31", -1)).toBe(
      "Vencido há 1 dia - calibração 31/03/2026"
    );
  });

  it("formata nota de alerta para instrumento perto de vencer", () => {
    expect(formatInstrumentAlertNote("2026-04-15", 14)).toBe(
      "Vence em 14 dias - calibração 15/04/2026"
    );
  });

  it("formata nota de alerta com data invalida", () => {
    expect(formatInstrumentAlertNote("2026-02-31", -1)).toContain("invalido");
  });
});
