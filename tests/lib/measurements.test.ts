import { describe, expect, it } from "vitest";

import { formatMeasurementType, mapMeasurementRow, serializeMeasurementType } from "@/lib/measurements";

describe("measurements", () => {
  it("formats known measurement types for display", () => {
    expect(formatMeasurementType("celsius")).toBe("\u00B0C");
    expect(formatMeasurementType("numero")).toBe("Numero");
    expect(formatMeasurementType("ohm")).toBe("\u03A9");
    expect(formatMeasurementType("um")).toBe("\u00B5m");
    expect(formatMeasurementType("shore_a")).toBe("Shore A");
    expect(formatMeasurementType("ra")).toBe("Ra");
  });

  it("serializes typed units into canonical raw values", () => {
    expect(serializeMeasurementType(" \u00B0C ")).toBe("celsius");
    expect(serializeMeasurementType("Numero")).toBe("numero");
    expect(serializeMeasurementType("\u03A9")).toBe("ohm");
    expect(serializeMeasurementType("\u00B5m")).toBe("um");
    expect(serializeMeasurementType("lbf in")).toBe("lbf_in");
    expect(serializeMeasurementType("mm2 / s")).toBe("mm2_s");
  });

  it("maps measurement rows into UI friendly items", () => {
    expect(
      mapMeasurementRow({
        id: 7,
        tipo: " ph ",
        tipo_desc: "  Controle de acidez  "
      })
    ).toEqual({
      id: "7",
      rawName: "ph",
      name: "pH",
      description: "Controle de acidez"
    });
  });
});
