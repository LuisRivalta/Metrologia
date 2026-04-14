import { describe, expect, it } from "vitest";

import {
  buildCalibrationExtractionPrompt,
  buildCalibrationExtractionSchema,
  normalizeCalibrationExtractionResult,
  prepareCalibrationExtractionDocumentText
} from "@/lib/calibration-extraction";

const fields = [
  {
    dbId: 11,
    name: "Diametro interno",
    slug: "diametro-interno",
    measurementId: "1",
    measurementName: "mm",
    measurementRawName: "mm",
    valueType: "numero",
    order: 0
  },
  {
    dbId: 12,
    name: "Profundidade",
    slug: "profundidade",
    measurementId: "1",
    measurementName: "mm",
    measurementRawName: "mm",
    valueType: "numero",
    order: 1
  }
];

describe("calibration-extraction", () => {
  it("builds a schema constrained to the expected field slugs", () => {
    const schema = buildCalibrationExtractionSchema(fields);

    expect(schema.properties.fields.items.properties.field_slug.enum).toEqual([
      "diametro-interno",
      "profundidade"
    ]);
  });

  it("normalizes the extraction result and fills missing fields with nulls", () => {
    const normalized = normalizeCalibrationExtractionResult(
      {
        header: {
          calibrationDate: "2026-04-10",
          certificateDate: "10/04/2026"
        },
        fields: [
          {
            field_slug: "diametro-interno",
            value: "150,02",
            unit: "mm",
            conforme: true,
            confidence: 1.4,
            evidence: "Pagina 2"
          }
        ],
        warnings: ["  Tabela parcialmente legivel  "]
      },
      fields
    );

    expect(normalized.header).toMatchObject({
      calibrationDate: "2026-04-10",
      certificateDate: null
    });
    expect(normalized.fields).toEqual([
      {
        fieldId: 11,
        fieldSlug: "diametro-interno",
        fieldName: "Diametro interno",
        measurementName: "mm",
        value: "150,02",
        unit: "mm",
        conforme: true,
        confidence: 1,
        evidence: "Pagina 2"
      },
      {
        fieldId: 12,
        fieldSlug: "profundidade",
        fieldName: "Profundidade",
        measurementName: "mm",
        value: null,
        unit: null,
        conforme: null,
        confidence: null,
        evidence: null
      }
    ]);
    expect(normalized.warnings).toEqual(["Tabela parcialmente legivel"]);
  });

  it("builds a prompt with the expected fields", () => {
    const prompt = buildCalibrationExtractionPrompt({
      instrumentTag: "DI-048",
      category: "Paquimetro",
      fields
    });

    expect(prompt).toContain("Instrumento: DI-048");
    expect(prompt).toContain("slug: diametro-interno");
    expect(prompt).toContain("slug: profundidade");
  });

  it("includes extracted document text in the prompt when available", () => {
    const prompt = buildCalibrationExtractionPrompt({
      instrumentTag: "DI-048",
      category: "Paquimetro",
      fields,
      documentText: "Certificado\nResponsavel: Ana"
    });

    expect(prompt).toContain("Use apenas o texto extraido abaixo.");
    expect(prompt).toContain("Texto extraido do certificado:");
    expect(prompt).toContain("Responsavel: Ana");
  });

  it("normalizes and truncates extracted document text", () => {
    const normalized = prepareCalibrationExtractionDocumentText(
      `  Linha 1   \r\n\r\nLinha   2  \n${"A".repeat(18_500)}`
    );

    expect(normalized).toContain("Linha 1");
    expect(normalized).toContain("Linha 2");
    expect(normalized).toContain("[texto extraido truncado]");
    expect(normalized?.length).toBeLessThanOrEqual(18_000 + 40);
  });

  it("ignores extracted document text when it is too short", () => {
    expect(prepareCalibrationExtractionDocumentText("  abc  ")).toBeNull();
  });
});
