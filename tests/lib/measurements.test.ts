import { describe, expect, it } from "vitest";

import { deduplicateMeasurementRows, formatMeasurementType, mapMeasurementRow, serializeMeasurementType } from "@/lib/measurements";
import type { MeasurementRow } from "@/lib/measurements";

describe("measurements", () => {
  it("formats known measurement types for display", () => {
    expect(formatMeasurementType("celsius")).toBe("°C");
    expect(formatMeasurementType("numero")).toBe("Numero");
    expect(formatMeasurementType("ohm")).toBe("Ω");
    expect(formatMeasurementType("um")).toBe("µm");
    expect(formatMeasurementType("shore_a")).toBe("Shore A");
    expect(formatMeasurementType("ra")).toBe("Ra");
  });

  it("serializes typed units into canonical raw values", () => {
    expect(serializeMeasurementType(" °C ")).toBe("celsius");
    expect(serializeMeasurementType("Numero")).toBe("numero");
    expect(serializeMeasurementType("Ω")).toBe("ohm");
    expect(serializeMeasurementType("µm")).toBe("um");
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

  it("formata variante HR nao presente no lookup exato", () => {
    // "hra", "hrb", "hrc", "hrd" estao no lookup; "hre" nao esta
    expect(formatMeasurementType("hre")).toBe("HRE");
  });

  it("formata compostos onde db, ph, hz aparecem junto de outra unidade", () => {
    // "db" isolado esta no lookup, mas "nivel_db" nao esta
    expect(formatMeasurementType("nivel_db")).toBe("nivel dB");
    expect(formatMeasurementType("valor_ph")).toBe("valor pH");
    expect(formatMeasurementType("frequencia_hz")).toBe("frequencia Hz");
  });

  it("formata ra e rz em contexto composto", () => {
    // "ra" isolado esta no lookup como "Ra", mas "rugosidade_ra" nao esta
    expect(formatMeasurementType("rugosidade_ra")).toBe("rugosidade Ra");
    expect(formatMeasurementType("rugosidade_rz")).toBe("rugosidade Rz");
  });

  it("serializa unidades com simbolos Unicode e potencias", () => {
    expect(serializeMeasurementType("Shore A")).toBe("shore_a");
    expect(serializeMeasurementType("m²")).toBe("m2");
    expect(serializeMeasurementType("m³")).toBe("m3");
  });

  it("retorna string vazia ao formatar tipo vazio", () => {
    expect(formatMeasurementType("")).toBe("");
  });

  it("retorna string vazia ao serializar tipo vazio", () => {
    expect(serializeMeasurementType("")).toBe("");
  });

  it("formata grau e graus em contexto composto", () => {
    expect(formatMeasurementType("n_graus")).toBe("n °");
    // _min e tratado como /min antes do _ virar espaco
    expect(formatMeasurementType("grau_min")).toBe("°/min");
  });

  it("deduplica linhas com mesmo tipo case-insensitive mantendo a primeira ocorrencia", () => {
    const rows: MeasurementRow[] = [
      { id: 1, tipo: "mm", tipo_desc: null },
      { id: 2, tipo: "MM", tipo_desc: null },
      { id: 3, tipo: " mm ", tipo_desc: null },
      { id: 4, tipo: "cm", tipo_desc: null }
    ];

    const result = deduplicateMeasurementRows(rows);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(4);
  });

  it("preserva lista sem duplicatas inalterada", () => {
    const rows: MeasurementRow[] = [
      { id: 1, tipo: "mm", tipo_desc: null },
      { id: 2, tipo: "cm", tipo_desc: null }
    ];

    expect(deduplicateMeasurementRows(rows)).toHaveLength(2);
  });
});
