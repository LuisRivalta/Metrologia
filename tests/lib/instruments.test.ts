import { describe, expect, it } from "vitest";

import {
  buildInstrumentDisplayTag,
  formatInstrumentCalibration,
  getRelativeCalibration,
  mapInstrumentRow
} from "@/lib/instruments";

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
});
