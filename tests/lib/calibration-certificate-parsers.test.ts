import { describe, expect, it } from "vitest";

import { buildPaquimetroFieldOverridesFromTablePages } from "@/lib/calibration-certificate-parsers";
import { serializeMeasurementFieldSlug } from "@/lib/measurement-fields";

const documentText = `
  CERTIFICADO DE CALIBRACAO
  METRUS
  FOR-0004-PAQ - REV 13 - DATA: 14/05/2024
`;

const tablePages = [
  {
    num: 1,
    tables: [
      [
        ["V.V.", "Media das Medicoes", "Erro", "K", "Veff", "U"],
        ["0,00", "0,00", "0,00", "2,00", "Infinito", "0,03"],
        ["30,00", "30,00", "0,00", "2,00", "Infinito", "0,03"]
      ],
      [
        ["Maximo Encontrado", "K", "Veff", "U"],
        ["0,01", "2,00", "Infinito", "0,04"]
      ],
      [
        ["V.V.", "Media das Medicoes", "Erro", "K", "Veff", "U"],
        ["48,00", "48,00", "0,02", "2,00", "Infinito", "0,03"]
      ],
      [
        ["Maximo Encontrado", "K", "Veff", "U"],
        ["0,00", "2,00", "Infinito", "0,05"]
      ]
    ]
  },
  {
    num: 2,
    tables: [
      [
        ["V.V.", "Media das Medicoes", "Erro", "K", "Veff", "U"],
        ["100,00", "100,00", "0,03", "2,00", "Infinito", "0,06"]
      ],
      [
        ["V.V.", "Media das Medicoes", "Erro", "K", "Veff", "U"],
        ["100,00", "100,00", "0,04", "2,00", "Infinito", "0,07"]
      ]
    ]
  }
];

const fields = [
  "Maior erro externo",
  "Incerteza de medicao externo",
  "Incerteza + maior Erro externo",
  "Maior erro interno",
  "Incerteza de medicao interno",
  "Incerteza + maior Erro interno",
  "Maior erro ressalto",
  "Incerteza de medicao ressalto",
  "Incerteza + maior Erro ressalto",
  "Maior erro profundidade",
  "Incerteza de medicao profundidade",
  "Incerteza + maior Erro profundidade"
].map((name, index) => ({
  dbId: index + 1,
  name,
  slug: serializeMeasurementFieldSlug(name),
  measurementId: "1",
  measurementName: "mm",
  measurementRawName: "mm",
  valueType: "numero",
  order: index
}));

describe("calibration-certificate-parsers", () => {
  it("builds deterministic paquimetro overrides from the extracted tables", () => {
    const overrides = buildPaquimetroFieldOverridesFromTablePages({
      categoryIdentifier: "Paquimetro",
      documentText,
      tablePages,
      fields
    });

    expect(overrides).toEqual([
      expect.objectContaining({
        fieldSlug: serializeMeasurementFieldSlug("Maior erro externo"),
        value: "0,01",
        unit: "mm",
        confidence: 1
      }),
      expect.objectContaining({
        fieldSlug: serializeMeasurementFieldSlug("Incerteza de medicao externo"),
        value: "0,04"
      }),
      expect.objectContaining({
        fieldSlug: serializeMeasurementFieldSlug("Maior erro interno"),
        value: "0,02"
      }),
      expect.objectContaining({
        fieldSlug: serializeMeasurementFieldSlug("Incerteza de medicao interno"),
        value: "0,05"
      }),
      expect.objectContaining({
        fieldSlug: serializeMeasurementFieldSlug("Maior erro ressalto"),
        value: "0,03"
      }),
      expect.objectContaining({
        fieldSlug: serializeMeasurementFieldSlug("Incerteza de medicao ressalto"),
        value: "0,06"
      }),
      expect.objectContaining({
        fieldSlug: serializeMeasurementFieldSlug("Maior erro profundidade"),
        value: "0,04"
      }),
      expect.objectContaining({
        fieldSlug: serializeMeasurementFieldSlug("Incerteza de medicao profundidade"),
        value: "0,07"
      })
    ]);
  });

  it("ignores unsupported certificates and categories", () => {
    expect(
      buildPaquimetroFieldOverridesFromTablePages({
        categoryIdentifier: "Micrometro",
        documentText: "outro certificado",
        tablePages,
        fields
      })
    ).toEqual([]);
  });
});
